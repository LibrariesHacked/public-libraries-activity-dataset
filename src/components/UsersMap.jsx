import React, { useEffect, useState } from 'react'

import { useTheme } from '@mui/material/styles'

import Map, { Layer, Source, useMap } from 'react-map-gl/maplibre'

import { useApplicationState } from '../hooks/useApplicationState'

import { getUsersPopulationPercentages } from '../models/users'

import * as usersModel from '../models/users'

const UsersMap = () => {
  const [
    { filteredServices, services, mapZoom, mapPosition, users },
    dispatchApplication
  ] = useApplicationState()

  const { current: map } = useMap()

  const [noData, setNoData] = useState(false)

  const [opacityExpression, setOpacityExpression] = useState([])

  const theme = useTheme()

  const libraryAuthorityTiles =
    'https://api-geography.librarydata.uk/rest/libraryauthorities/{z}/{x}/{y}.mvt'

  useEffect(() => {
    const getUsers = async () => {
      const users = await usersModel.getUsers()
      dispatchApplication({ type: 'SetUsers', users })
    }

    // Trigger download of users data (if not already done)
    if (!users) getUsers()
  }, [users, dispatchApplication])

  useEffect(() => {
    // The active services are either the ones where the service code is in the filteredServices array
    // or the filteredServices array is empty.
    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    const userServices = activeServices?.filter(service =>
      Number.isInteger(service.users)
    )

    if (!userServices || userServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
      const lookup = {}

      const populationPercentages = getUsersPopulationPercentages(
        userServices,
        users
      )
      userServices.forEach(service => {
        lookup[service.code] = populationPercentages[service.code] || null
      })

      if (map) {
        userServices.forEach(service => {
          map.setFeatureState(
            {
              source: 'library-authority-boundaries',
              id: service.code
            },
            {
              under12Percent: lookup[service.code]?.under12 || 0,
              from12to17Percent: lookup[service.code]?.from12to17 || 0,
              adultPercent: lookup[service.code]?.adult || 0,
              totalPercent: lookup[service.code]?.total || 0
            }
          )
        })
      }

      // We need to rewrite this lookup into a maplibre expression using feature-state
      const expression = ['feature-state', 'percentPopulationOpacity']

      setOpacityExpression(expression)
    }
  }, [services, filteredServices])

  const setViewState = viewState => {
    dispatchApplication({
      type: 'SetMapPosition',
      mapZoom: viewState.zoom,
      mapPosition: [viewState.longitude, viewState.latitude]
    })
  }

  return (
    <Map
      style={{
        width: '100%',
        height: '400px',
        position: 'relative'
      }}
      mapStyle='https://api.maptiler.com/maps/dataviz/style.json?key=1OK05AJqNta7xYzrG2kA'
      longitude={mapPosition[0]}
      latitude={mapPosition[1]}
      zoom={mapZoom}
      maxZoom={18}
      onMove={evt => setViewState(evt.viewState)}
    >
      <Source
        type='vector'
        tiles={[libraryAuthorityTiles]}
        promoteId={{ library_authority_boundaries: 'code' }}
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
            'line-opacity': 1,
            'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 18, 4]
          }}
        />
        <Layer
          type='fill'
          source-layer='library_authority_boundaries'
          minzoom={6}
          paint={{
            'fill-color': theme.palette.secondary.main,
            'fill-opacity': opacityExpression
          }}
        />
      </Source>
    </Map>
  )
}

export default UsersMap
