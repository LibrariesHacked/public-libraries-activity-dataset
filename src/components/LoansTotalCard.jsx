import React, { useCallback } from 'react'
import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total library loans (all formats) across active library services,
 * along with average annual loans per 1,000 reporting residents.
 *
 * @returns {JSX.Element} MetricTotalCard configured for total loans.
 */
const LoansTotalCard = () => {
  const formatDescription = useCallback(
    ({ total, totalPopulation, yearCount }) => {
      const perCapita =
        totalPopulation > 0
          ? (total / totalPopulation / yearCount) * 1000
          : 0
      return `${formatCompactNumber(perCapita, 1)} loans per 1,000 residents / yr`
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
