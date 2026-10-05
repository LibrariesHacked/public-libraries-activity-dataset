import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total public computer access hours across active library services,
 * along with average computer hours logged per day.
 *
 * @returns {JSX.Element} MetricTotalCard configured for public computer hours.
 */
const ComputerTotalCard = () => {
  const formatDescription = useCallback(
    ({ total, totalPopulation, yearCount }) => {
      const perCapita =
        totalPopulation > 0
          ? Math.round((total / totalPopulation / yearCount) * 1000)
          : 0
      return `${formatCompactNumber(perCapita)} hrs per 1,000 residents / yr`
    },
    []
  )

  return (
    <MetricTotalCard
      metric='computerHours'
      title='Computer hours'
      colour='chartBlue'
      formatDescription={formatDescription}
    />
  )
}

export default ComputerTotalCard
