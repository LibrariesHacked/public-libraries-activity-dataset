import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

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
