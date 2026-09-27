import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total library events held across active library services,
 * along with average events held per day.
 *
 * @returns {JSX.Element} MetricTotalCard configured for library events.
 */
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
