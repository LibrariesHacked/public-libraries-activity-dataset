import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

const ComputerTotalCard = () => {
  const formatDescription = useCallback(
    ({ total, yearCount }) =>
      `${formatCompactNumber(total / (365 * yearCount))} computer hours per day`,
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
