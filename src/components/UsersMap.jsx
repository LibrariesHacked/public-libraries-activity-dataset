import React, { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import { useTheme } from '@mui/material/styles'

import Map, { FullscreenControl, Layer, Source } from 'react-map-gl/maplibre'
import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

import 'maplibre-gl/dist/maplibre-gl.css'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatPeriod } from '../helpers/periods'
import { getActiveServices } from '../models/service'
import { getUsersPopulationPercentages } from '../models/users'

import * as usersModel from '../models/users'

maplibregl.setWorkerUrl(workerUrl)

/**
 * Interactive map component rendering geographic boundary polygons for English library services,
 * shaded by active user population coverage percentage or period-over-period percentage-point changes.
 *
 * @returns {JSX.Element} The rendered MapLibre GL map with interactive controls and legend.
 */
const UsersMap = () => {
  const [
    {
      filteredServices,
      services,
      serviceRecords,
      selectedPeriods,
      mapZoom,
      mapPosition,
      users,
      snapshotPeriod
    },
    dispatchApplication
  ] = useApplicationState()

  const [displayAgeGroup, setDisplayAgeGroup] = useState('total')
  const [shadeBy, setShadeBy] = useState('coverage') // 'coverage' | 'change'

  const [fillColorExpression, setFillColorExpression] = useState(null)
  const [fillOpacityExpression, setFillOpacityExpression] = useState(null)
  const [textDisplayExpression, setTextDisplayExpression] = useState([])
  const [textNoDataDisplayExpression, setTextNoDataDisplayExpression] =
    useState([])
  const [servicesWithDataFilter, setServicesWithDataFilter] = useState([])
  const [servicesNoDataFilter, setServicesNoDataFilter] = useState([])
  const [servicesWithTextFilter, setServicesWithTextFilter] = useState([])
  const [servicesNoTextFilter, setServicesNoTextFilter] = useState([])

  const theme = useTheme()

  const libraryAuthorityTiles =
    'https://api-geography.librarydata.uk/rest/libraryauthorities/{z}/{x}/{y}.mvt'

  const periods = useMemo(() => {
    if (selectedPeriods?.length) return [...selectedPeriods].sort()
    if (users?.length) return [...new Set(users.map(m => m.period))].sort()
    return []
  }, [selectedPeriods, users])

  const hasMultipleYears = periods.length > 1
  const earliestPeriod = periods[0]

  // If user switches period selection down to single year, revert shadeBy to coverage
  useEffect(() => {
    if (!hasMultipleYears && shadeBy === 'change') {
      setShadeBy('coverage')
    }
  }, [hasMultipleYears, shadeBy])

  useEffect(() => {
    const getUsers = async () => {
      const users = await usersModel.getUsers()
      dispatchApplication({ type: 'SetUsers', users })
    }
    if (!users) getUsers()
  }, [users, dispatchApplication])

  useEffect(() => {
    if (!users || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeServiceCodes = new Set(activeServices.map(s => s.code))

    const earliestPeriod = periods[0]
    const latestPeriod = snapshotPeriod || periods[periods.length - 1]

    // Service records for latest and earliest periods
    const latestRecords = serviceRecords
      ? serviceRecords.filter(
        sr => sr.period === latestPeriod && activeServiceCodes.has(sr.code)
      )
      : activeServices

    const earliestRecords =
      hasMultipleYears && serviceRecords
        ? serviceRecords.filter(
          sr => sr.period === earliestPeriod && activeServiceCodes.has(sr.code)
        )
        : []

    // Users for latest and earliest periods
    const latestUsers = users.filter(
      u => u.period === latestPeriod && activeServiceCodes.has(u.serviceCode)
    )
    const earliestUsers = hasMultipleYears
      ? users.filter(
        u =>
          u.period === earliestPeriod && activeServiceCodes.has(u.serviceCode)
      )
      : []

    const latestPercentages = getUsersPopulationPercentages(
      latestRecords.length > 0 ? latestRecords : activeServices,
      latestUsers
    )

    const earliestPercentages =
      hasMultipleYears && earliestRecords.length > 0
        ? getUsersPopulationPercentages(earliestRecords, earliestUsers)
        : {}

    // Build serviceLookup with coverage percentages and change values
    const serviceLookup = {}
    activeServices.forEach(service => {
      const code = service.code
      const latest = latestPercentages[code] || {}
      const earliest = earliestPercentages[code] || {}

      const getChange = group => {
        if (!hasMultipleYears) return null
        const lat = latest[group]
        const ear = earliest[group]
        if (
          lat !== null &&
          lat !== undefined &&
          ear !== null &&
          ear !== undefined
        ) {
          return parseFloat((lat - ear).toFixed(1))
        }
        return null
      }

      serviceLookup[code] = {
        under12Percent: latest['Under 12'] ?? null,
        under12Change: getChange('Under 12'),
        from12to17Percent: latest['12-17'] ?? null,
        from12to17Change: getChange('12-17'),
        adultPercent: latest.Adult ?? null,
        adultChange: getChange('Adult'),
        totalPercent: latest.Total ?? null,
        totalChange: getChange('Total')
      }
    })

    // Calculate scaling metrics
    const allPercents = activeServices
      .map(s => serviceLookup[s.code]?.[`${displayAgeGroup}Percent`])
      .filter(p => p !== null && p !== undefined)
    let maxPercent = Math.max(...allPercents, 0)
    if (maxPercent > 20) maxPercent = 20

    const allChanges = activeServices
      .map(s => serviceLookup[s.code]?.[`${displayAgeGroup}Change`])
      .filter(c => c !== null && c !== undefined)
    const maxAbsChange = Math.max(...allChanges.map(c => Math.abs(c)), 1)

    // Build fill-color and fill-opacity expressions
    const fillColor = ['case']
    const fillOpacity = ['case']

    activeServices.forEach(service => {
      const code = service.code
      const data = serviceLookup[code]
      if (!data) return

      if (shadeBy === 'change') {
        const change = data[`${displayAgeGroup}Change`]
        if (change !== null && change !== undefined) {
          const color =
            change > 0
              ? theme.palette.success.main
              : change < 0
                ? theme.palette.error.main
                : '#9e9e9e'
          const norm = Math.min(1, Math.abs(change) / maxAbsChange)
          const opacity = parseFloat((0.25 + norm * 0.55).toFixed(2))

          fillColor.push(['==', ['get', 'code'], code], color)
          fillOpacity.push(['==', ['get', 'code'], code], opacity)
        }
      } else {
        const percent = data[`${displayAgeGroup}Percent`]
        if (percent !== null && percent !== undefined && percent > 0) {
          const norm = maxPercent > 0 ? Math.min(1, percent / maxPercent) : 0
          const opacity = parseFloat(Math.max(0.15, norm * 0.7).toFixed(2))

          fillColor.push(
            ['==', ['get', 'code'], code],
            theme.palette.success.main
          )
          fillOpacity.push(['==', ['get', 'code'], code], opacity)
        }
      }
    })

    fillColor.push(theme.palette.secondary.light)
    fillOpacity.push(0.15)

    setFillColorExpression(
      fillColor.length > 2 ? fillColor : theme.palette.secondary.light
    )
    setFillOpacityExpression(fillOpacity.length > 2 ? fillOpacity : 0.15)

    // Text expressions (shows + or - indicator when multiple years of data are present)
    const textDisplay = ['case']
    const textNoData = ['case']

    activeServices.forEach(service => {
      const code = service.code
      const data = serviceLookup[code]
      const percent = data?.[`${displayAgeGroup}Percent`]
      const change = data?.[`${displayAgeGroup}Change`]

      if (percent !== null && percent !== undefined) {
        let labelText
        if (hasMultipleYears && change !== null && change !== undefined) {
          const sign = change > 0 ? '+' : ''
          labelText = `${service.niceName}\n${percent.toFixed(1)}% (${sign}${change.toFixed(1)} pp)`
        } else {
          labelText = `${service.niceName}\n${percent.toFixed(1)}%`
        }
        textDisplay.push(['==', ['get', 'code'], code], labelText)
      } else {
        textNoData.push(
          ['==', ['get', 'code'], code],
          `${service.niceName}\n(no data)`
        )
      }
    })

    textDisplay.push('')
    textNoData.push('')

    setTextDisplayExpression(textDisplay.length > 2 ? textDisplay : '')
    setTextNoDataDisplayExpression(textNoData.length > 2 ? textNoData : '')

    // Shading data filters
    const hasDataCodes = activeServices
      .filter(s => {
        const data = serviceLookup[s.code]
        if (!data) return false
        if (shadeBy === 'change') {
          return (
            data[`${displayAgeGroup}Change`] !== null &&
            data[`${displayAgeGroup}Change`] !== undefined
          )
        }
        return (
          data[`${displayAgeGroup}Percent`] !== null &&
          data[`${displayAgeGroup}Percent`] !== undefined &&
          data[`${displayAgeGroup}Percent`] > 0
        )
      })
      .map(s => s.code)

    const noDataCodes = activeServices
      .filter(s => !hasDataCodes.includes(s.code))
      .map(s => s.code)

    setServicesWithDataFilter([
      'in',
      ['get', 'code'],
      ['literal', hasDataCodes]
    ])
    setServicesNoDataFilter([
      'in',
      ['get', 'code'],
      ['literal', noDataCodes]
    ])

    // Text data filters (show percentage text whenever coverage data exists)
    const hasTextCodes = activeServices
      .filter(
        s =>
          serviceLookup[s.code]?.[`${displayAgeGroup}Percent`] !== null &&
          serviceLookup[s.code]?.[`${displayAgeGroup}Percent`] !== undefined
      )
      .map(s => s.code)

    const noTextCodes = activeServices
      .filter(s => !hasTextCodes.includes(s.code))
      .map(s => s.code)

    setServicesWithTextFilter([
      'in',
      ['get', 'code'],
      ['literal', hasTextCodes]
    ])
    setServicesNoTextFilter([
      'in',
      ['get', 'code'],
      ['literal', noTextCodes]
    ])
  }, [
    services,
    filteredServices,
    serviceRecords,
    selectedPeriods,
    users,
    displayAgeGroup,
    shadeBy,
    snapshotPeriod,
    periods,
    hasMultipleYears,
    theme
  ])

  /**
   * Synchronizes map viewport pan and zoom state with the global application state.
   *
   * @param {Object} viewState - ViewState object from MapLibre GL.
   * @param {number} viewState.zoom - New map zoom level.
   * @param {number} viewState.longitude - New center longitude.
   * @param {number} viewState.latitude - New center latitude.
   */
  const setViewState = viewState => {
    dispatchApplication({
      type: 'SetMapPosition',
      mapZoom: viewState.zoom,
      mapPosition: [viewState.longitude, viewState.latitude]
    })
  }

  /**
   * Handles toggle changes between age demographic views ('under12', 'from12to17', 'adult', 'total').
   *
   * @param {React.MouseEvent} event - Click event.
   * @param {string|null} newAgeGroup - Newly selected age demographic identifier.
   */
  const handleChangeDisplayAgeGroup = (event, newAgeGroup) => {
    if (newAgeGroup !== null) {
      setDisplayAgeGroup(newAgeGroup)
    }
  }

  /**
   * Handles toggle changes between shading modes ('coverage' vs 'change').
   *
   * @param {React.MouseEvent} event - Click event.
   * @param {'coverage'|'change'|null} newShadeBy - Newly selected shading mode.
   */
  const handleChangeShadeBy = (event, newShadeBy) => {
    if (newShadeBy !== null) {
      setShadeBy(newShadeBy)
    }
  }


  return (
    <Box sx={{ mb: 2, position: 'relative' }}>
      <Map
        mapLib={maplibregl}
        style={{
          width: '100%',
          height: '400px',
          position: 'relative'
        }}
        mapStyle='https://api.maptiler.com/maps/dataviz/style.json?key=1OK05AJqNta7xYzrG2kA'
        initialViewState={{
          longitude: mapPosition[0],
          latitude: mapPosition[1],
          zoom: mapZoom
        }}
        minZoom={6}
        maxZoom={16}
        onMoveEnd={evt => setViewState(evt.viewState)}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <ToggleButtonGroup
            color='primary'
            value={displayAgeGroup}
            exclusive
            onChange={handleChangeDisplayAgeGroup}
            sx={{ backgroundColor: 'white' }}
            size='small'
          >
            <ToggleButton value='under12'>Under 12</ToggleButton>
            <ToggleButton value='from12to17'>12-17</ToggleButton>
            <ToggleButton value='adult'>Adult</ToggleButton>
            <ToggleButton value='total'>Total</ToggleButton>
          </ToggleButtonGroup>

          {hasMultipleYears && (
            <ToggleButtonGroup
              color='primary'
              value={shadeBy}
              exclusive
              onChange={handleChangeShadeBy}
              sx={{ backgroundColor: 'white' }}
              size='small'
            >
              <ToggleButton value='coverage'>Coverage</ToggleButton>
              <ToggleButton value='change'>Change</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        {hasMultipleYears && shadeBy === 'change' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 24,
              left: 8,
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(4px)',
              borderRadius: 1,
              px: 1.5,
              py: 0.75,
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: 1
            }}
          >
            {earliestPeriod && (
              <Box component='span' sx={{ color: 'text.secondary', mr: 0.5 }}>
                Change (pp) since {formatPeriod(earliestPeriod)}:
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.error.main
                }}
              />
              <span>Decrease</span>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.success.main
                }}
              />
              <span>Increase</span>
            </Box>
          </Box>
        )}

        <FullscreenControl />
        <Source
          type='vector'
          tiles={[libraryAuthorityTiles]}
          promoteId={{ library_authority_boundaries: 'code' }}
          id='library_authority_boundaries'
        >
          <Layer
            type='line'
            source-layer='library_authority_boundaries'
            minzoom={6}
            layout={{
              'line-join': 'round',
              'line-cap': 'square'
            }}
            paint={{
              'line-color': theme.palette.secondary.main,
              'line-opacity': 0.5,
              'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 18, 4]
            }}
            filter={servicesWithDataFilter}
          />
          <Layer
            type='fill'
            source-layer='library_authority_boundaries'
            minzoom={6}
            paint={{
              'fill-color': fillColorExpression || theme.palette.success.main,
              'fill-opacity': fillOpacityExpression || 0.4
            }}
            filter={servicesWithDataFilter}
          />
          <Layer
            type='fill'
            source-layer='library_authority_boundaries'
            minzoom={6}
            paint={{
              'fill-color': theme.palette.secondary.light,
              'fill-opacity': 0.15
            }}
            filter={servicesNoDataFilter}
          />
          <Layer
            type='symbol'
            source-layer='library_authority_boundaries'
            minzoom={6}
            layout={{
              'text-field': textDisplayExpression,
              'text-size': 12,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-offset': [0, 0],
              'text-anchor': 'center'
            }}
            paint={{
              'text-color': theme.palette.text.primary,
              'text-halo-color': theme.palette.background.paper,
              'text-halo-width': 1
            }}
            filter={servicesWithTextFilter}
          />
          <Layer
            type='symbol'
            source-layer='library_authority_boundaries'
            minzoom={6}
            layout={{
              'text-field': textNoDataDisplayExpression,
              'text-size': 12,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-offset': [0, 0],
              'text-anchor': 'center'
            }}
            paint={{
              'text-color': theme.palette.text.primary,
              'text-halo-color': theme.palette.background.paper,
              'text-halo-width': 1
            }}
            filter={servicesNoTextFilter}
          />
        </Source>
      </Map>
    </Box>
  )
}

export default UsersMap
