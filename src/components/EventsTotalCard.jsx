import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

const EventsTotalCard = () => {
  const formatDescription = useCallback(
    ({ total, yearCount }) =>
      `${formatCompactNumber(total / (365 * yearCount))} events per day`,
    []
  )

  return (
    <MetricTotalCard
      metric='events'
      title='Events'
      colour='chartOrange'
      formatDescription={formatDescription}
    />
  )
}

export default EventsTotalCard
