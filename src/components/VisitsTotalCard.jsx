import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying library visits and outreach interactions across active services,
 * along with average annual visits per 1,000 reporting residents.
 *
 * @returns {JSX.Element} MetricTotalCard configured for library visits.
 */
const VisitsTotalCard = () => {
  const formatDescription = useCallback(
    ({ total, totalPopulation, yearCount }) => {
      const perCapita =
        totalPopulation > 0
          ? (total / totalPopulation / yearCount) * 1000
          : 0
      return `${formatCompactNumber(perCapita, 1)} visits per 1,000 residents / yr`
    },
    []
  )

  return (
    <MetricTotalCard
      metric='visits'
      title='Visits'
      colour='chartBlue'
      formatDescription={formatDescription}
    />
  )
}

export default VisitsTotalCard
