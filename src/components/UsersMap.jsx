import React, { useEffect, useState } from 'react'

import { useTheme } from '@mui/material/styles'

import Map, { Layer, Source } from 'react-map-gl/maplibre'

import { useApplicationState } from '../hooks/useApplicationState'

const UsersMap = () => {
  const [
    { filteredServices, services, mapZoom, mapPosition },
    dispatchApplication
  ] = useApplicationState()

  const [map, setMap] = useState(null)

  const [noData, setNoData] = useState(false)

  const [percentPopulationLookup, setPercentPopulationLookup] = useState([])

  const theme = useTheme()

  const libraryAuthorityTiles =
    'https://api-geography.librarydata.uk/rest/libraryauthorities/{z}/{x}/{y}.mvt'

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
      userServices.forEach(service => {
        lookup[service.code] = service.users / service.population
      })

      // We need to rewrite this lookup into a mapbox style expression to set the opacity
      const expression = ['interpolate', ['linear'], ['get', 'code']]
      Object.keys(lookup).forEach(code => {
        expression.push(code)
        expression.push(Math.min(1, Math.max(0, lookup[code] * 10))) // Scale to 0-1 range for opacity
      })
      expression.push(0) // Default to 0 opacity if no match
      setPercentPopulationLookup(expression)
    }
  }, [services, filteredServices])

  const setViewState = viewState => {
    dispatchApplication({
      type: 'SetMapPosition',
      mapZoom: viewState.zoom,
      mapPosition: [viewState.longitude, viewState.latitude]
    })
  }

  const clickMap = (map, evt) => {
    if (!map) return
  }

  return (
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
      maxZoom={18}
      onMove={evt => setViewState(evt.viewState)}
      onClick={evt => clickMap(map, evt)}
    >
      <Source type='vector' tiles={[libraryAuthorityTiles]}>
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
            'fill-opacity': percentPopulationLookup
          }}
        />
      </Source>
    </Map>
  )
}

export default UsersMap
