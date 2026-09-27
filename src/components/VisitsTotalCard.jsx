import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total in-person library visits across active library services,
 * along with average visits per resident per year.
 *
 * @returns {JSX.Element} MetricTotalCard configured for library visits.
 */
const VisitsTotalCard = () => {
  const formatDescription = useCallback(
    ({ total, totalPopulation, yearCount }) => {
      const perCapita =
        totalPopulation > 0
          ? Math.round(total / totalPopulation / yearCount)
          : 0
      return `${formatCompactNumber(perCapita)} per resident per year`
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
