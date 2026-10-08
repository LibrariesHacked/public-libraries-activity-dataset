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
    ({ total, totalPopulation, yearCount }) => {
      const rate = totalPopulation > 0
        ? (total / totalPopulation / yearCount) * 1000
        : 0
      return `${formatCompactNumber(rate, 1)} events per 1,000 residents / yr`
    },
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
