import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { getActiveServices } from '../models/service'

import { formatCompactNumber } from '../helpers/numbers'

import NumberCard from './NumberCard'

const WifiSessionsTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [wifiSessionsCount, setWifiSessionsCount] = useState(0)
  const [wifiSessionsPerCapita, setWifiSessionsPerCapita] = useState(0)

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)

    // The wifi sessions count is the sum of the wifiSessions integer from each service object
    const totalWifiSessions =
      activeServices?.reduce(
        (acc, service) => acc + (service.wifiSessions || 0),
        0
      ) || 0

    // The population is the totalPopulation on the service object
    const totalPopulation =
      activeServices?.reduce(
        (acc, service) => acc + (service.totalPopulation || 0),
        0
      ) || 0

    const wifiSessionsPerCapita =
      totalPopulation > 0 ? Math.round(totalWifiSessions / totalPopulation) : 0

    setWifiSessionsCount(totalWifiSessions)
    setWifiSessionsPerCapita(wifiSessionsPerCapita)
  }, [services, filteredServices])

  return (
    <NumberCard
      title='WiFi sessions'
      number={formatCompactNumber(wifiSessionsCount)}
      description={`${Math.round(wifiSessionsPerCapita)} per resident per year`}
    />
  )
}

export default WifiSessionsTotalCard
