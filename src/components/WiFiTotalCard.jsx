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
    ({ total, yearCount }) =>
      `${formatCompactNumber(total / (365 * yearCount), 2)} sessions per day`,
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
