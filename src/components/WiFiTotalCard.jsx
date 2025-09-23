import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { getActiveServices } from '../models/service'

import { formatCompactNumber } from '../helpers/numbers'

import NumberCard from './NumberCard'

const WiFiTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [wifiSessionsCount, setWifiSessionsCount] = useState(0)
  const [wifiSessionsPerCapita, setWifiSessionsPerCapita] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)

    const wiFiServices = activeServices?.filter(service =>
      Number.isInteger(service.wifiSessions)
    )

    if (!wiFiServices || wiFiServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    // The wifi sessions count is the sum of the wifiSessions integer from each service object
    const totalWifiSessions =
      wiFiServices?.reduce(
        (acc, service) => acc + (service.wifiSessions || 0),
        0
      ) || 0

    // The population is the totalPopulation on the service object
    const totalPopulation =
      wiFiServices?.reduce(
        (acc, service) => acc + (service.totalPopulation || 0),
        0
      ) || 0

    const wifiSessionsPerCapita =
      totalPopulation > 0 ? (totalWifiSessions / totalPopulation) : 0

    setWifiSessionsCount(totalWifiSessions)
    setWifiSessionsPerCapita(wifiSessionsPerCapita)
  }, [services, filteredServices])

  return (
    <NumberCard
      title='WiFi sessions'
      number={formatCompactNumber(wifiSessionsCount)}
      description={`${Math.round(wifiSessionsPerCapita, 2)} per resident per year`}
      colour='chartYellow'
      noData={noData}
    />
  )
}

export default WiFiTotalCard
