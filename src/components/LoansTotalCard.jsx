import React, { useCallback } from 'react'

import MetricTotalCard from './MetricTotalCard'

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
