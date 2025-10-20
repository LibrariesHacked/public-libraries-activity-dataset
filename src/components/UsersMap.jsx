import React, { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import { useTheme } from '@mui/material/styles'

import Map, { FullscreenControl, Layer, Source } from 'react-map-gl/maplibre'

import { useApplicationState } from '../hooks/useApplicationState'

import { getUsersPopulationPercentages } from '../models/users'

import * as usersModel from '../models/users'

const UsersMap = () => {
  const [map, setMap] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const [
    { filteredServices, services, mapZoom, mapPosition, users },
    dispatchApplication
  ] = useApplicationState()

  const [noData, setNoData] = useState(false)

  const [displayAgeGroup, setDisplayAgeGroup] = useState('total')

  const [opacityExpression, setOpacityExpression] = useState([])
  const [textDisplayExpression, setTextDisplayExpression] = useState([])
  const [servicesWithDataFilter, setServicesWithDataFilter] = useState([])
  const [servicesNoDataFilter, setServicesNoDataFilter] = useState([])

  const theme = useTheme()

  const libraryAuthorityTiles =
    'https://api-geography.librarydata.uk/rest/libraryauthorities/{z}/{x}/{y}.mvt'

  useEffect(() => {
    const getUsers = async () => {
      const users = await usersModel.getUsers()
      dispatchApplication({ type: 'SetUsers', users })
    }
    if (!users) getUsers()
  }, [users, dispatchApplication])

  useEffect(() => {
    if (!users || !services) return

    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    const userServices = activeServices?.filter(service =>
      Number.isInteger(service.users)
    )

    if (!userServices || userServices.length === 0) {
      setNoData(true)
      return
    }
    setNoData(false)
    const serviceLookup = {}

    const populationPercentages = getUsersPopulationPercentages(
      userServices,
      users
    )

    // Calculate the maximum percentage across all the services to create a scale
    let maxPercent = Math.max(
      ...Object.values(populationPercentages).flatMap(percentages => [
        percentages['Under 12'] || 0,
        percentages['12-17'] || 0,
        percentages['Adult'] || 0,
        percentages['Total'] || 0
      ])
    )
    if (maxPercent > 20) maxPercent = 20 // Cap max percent to 20% for scaling purposes
    const scale = maxPercent > 0 ? 0.6 / maxPercent : 0

    userServices.forEach(service => {
      const percentages = populationPercentages[service.code] || {}
      const under12 = ((percentages['Under 12'] || 0) * scale).toFixed(1)
      const from12to17 = ((percentages['12-17'] || 0) * scale).toFixed(1)
      const adult = ((percentages['Adult'] || 0) * scale).toFixed(1)
      const total = ((percentages['Total'] || 0) * scale).toFixed(1)
      serviceLookup[service.code] = {
        under12: under12 > 1 ? 1 : parseFloat(under12),
        under12Percent: percentages['Under 12'] || null,
        from12to17: from12to17 > 1 ? 1 : parseFloat(from12to17),
        from12to17Percent: percentages['12-17'] || null,
        adult: adult > 1 ? 1 : parseFloat(adult),
        adultPercent: percentages['Adult'] || null,
        total: total > 1 ? 1 : parseFloat(total),
        totalPercent: percentages['Total'] || null
      }
    })

    if (map && mapLoaded) {
      activeServices.forEach(service => {
        map.setFeatureState(
          {
            source: 'library_authority_boundaries',
            sourceLayer: 'library_authority_boundaries',
            id: service.code
          },
          {
            under12: serviceLookup[service.code]?.under12 || 0,
            from12to17: serviceLookup[service.code]?.from12to17 || 0,
            adult: serviceLookup[service.code]?.adult || 0,
            total: serviceLookup[service.code]?.total || 0
          }
        )
      })
    }

    const opacityExpression = ['feature-state', displayAgeGroup]
    setOpacityExpression(opacityExpression)

    // Set the text display expression as a case based upon the service code
    const textDisplayExpression = ['case']
    activeServices.forEach(service => {
      const percent = serviceLookup[service.code]?.[`${displayAgeGroup}Percent`]
      if (percent !== null && percent !== undefined) {
        textDisplayExpression.push(
          ['==', ['get', 'code'], service.code],
          `${service.niceName}\n${percent.toFixed(1)}%`
        )
      }
    })
    textDisplayExpression.push('') // Default to empty string if no match
    setTextDisplayExpression(textDisplayExpression)

    // Add a layer filter to only show the activeServices
    const servicesFilter = [
      'in',
      ['get', 'code'],
      ['literal', activeServices.map(s => s.code)]
    ]

    const servicesWithNoDataFilter = [
      'in',
      ['get', 'code'],
      [
        'literal',
        activeServices
          .filter(s => {
            const percentages = populationPercentages[s.code] || {}
            return (
              !percentages ||
              Object.keys(percentages).length === 0 ||
              percentages[displayAgeGroup] === 0
            )
          })
          .map(s => s.code)
      ]
    ]

    setServicesWithDataFilter(servicesFilter)
    setServicesNoDataFilter(servicesWithNoDataFilter)
  }, [services, filteredServices, map, users, displayAgeGroup, mapLoaded])

  const setViewState = viewState => {
    dispatchApplication({
      type: 'SetMapPosition',
      mapZoom: viewState.zoom,
      mapPosition: [viewState.longitude, viewState.latitude]
    })
  }

  const handleChangeDisplayAgeGroup = (event, newAgeGroup) => {
    if (newAgeGroup !== null) {
      setDisplayAgeGroup(newAgeGroup)
    }
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Map
        ref={setMap}
        style={{
          width: '100%',
          height: '400px',
          position: 'relative'
        }}
        mapStyle='https://api.maptiler.com/maps/dataviz/style.json?key=1OK05AJqNta7xYzrG2kA'
        longitude={mapPosition[0]}
        latitude={mapPosition[1]}
        zoom={mapZoom}
        minZoom={6}
        maxZoom={16}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={() => setMapLoaded(true)}
      >
        <Box>
          <ToggleButtonGroup
            color='primary'
            value={displayAgeGroup}
            exclusive
            onChange={handleChangeDisplayAgeGroup}
            sx={{ m: 1, position: 'absolute', backgroundColor: 'white' }}
            size='small'
          >
            <ToggleButton value='under12'>Under 12</ToggleButton>
            <ToggleButton value='from12to17'>12-17</ToggleButton>
            <ToggleButton value='adult'>Adult</ToggleButton>
            <ToggleButton value='total'>Total</ToggleButton>
          </ToggleButtonGroup>
        </Box>
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
              'fill-color': theme.palette.success.main,
              'fill-opacity': opacityExpression
            }}
            filter={servicesWithDataFilter}
          />
          <Layer
            type='fill'
            source-layer='library_authority_boundaries'
            minzoom={6}
            paint={{
              'fill-color': theme.palette.secondary.light,
              'fill-opacity': 0.1
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
            filter={servicesWithDataFilter}
          />
        </Source>
      </Map>
    </Box>
  )
}

export default UsersMap
