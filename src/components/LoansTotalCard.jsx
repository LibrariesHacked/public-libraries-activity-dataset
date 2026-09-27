import React, { useCallback } from 'react'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total library loans (all formats) across active library services,
 * along with average loans per resident per year.
 *
 * @returns {JSX.Element} MetricTotalCard configured for total loans.
 */
const LoansTotalCard = () => {
  const formatDescription = useCallback(
    ({ total, totalPopulation, yearCount }) => {
      const perCapita =
        totalPopulation > 0
          ? Math.round(total / totalPopulation / yearCount)
          : 0
      return `${Math.round(perCapita)} per resident per year`
    },
    []
  )

  return (
    <MetricTotalCard
      metric='loans'
      title='All loans'
      colour='chartGreen'
      formatDescription={formatDescription}
    />
  )
}

export default LoansTotalCard
