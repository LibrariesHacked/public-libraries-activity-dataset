import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total public Wi-Fi sessions across active library services,
 * along with average sessions logged per day.
 *
 * @returns {JSX.Element} MetricTotalCard configured for Wi-Fi sessions.
 */
const WiFiTotalCard = () => {
  const formatDescription = useCallback(
    ({ total, totalPopulation, yearCount }) => {
      const perCapita =
        totalPopulation > 0
          ? Math.round((total / totalPopulation / yearCount) * 1000)
          : 0
      return `${formatCompactNumber(perCapita)} per 1,000 residents / yr`
    },
    []
  )

  return (
    <MetricTotalCard
      metric='wifiSessions'
      title='WiFi sessions'
      colour='chartYellow'
      formatDescription={formatDescription}
    />
  )
}

export default WiFiTotalCard
