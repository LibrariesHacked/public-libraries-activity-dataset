import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total event attendees across active library services,
 * along with attendees per 1,000 residents per year.
 *
 * @returns {JSX.Element} MetricTotalCard configured for event attendance.
 */
const AttendanceTotalCard = () => {
  const formatDescription = useCallback(
    ({ total, totalPopulation, yearCount }) => {
      const perCapita =
        totalPopulation > 0
          ? Math.round((total / totalPopulation / yearCount) * 1000)
          : 0
      return `${formatCompactNumber(perCapita)} per 1,000 residents / yr`
    },
    []
  )

  return (
    <MetricTotalCard
      metric='attendance'
      title='Event attendees'
      colour='chartRed'
      formatDescription={formatDescription}
    />
  )
}

export default AttendanceTotalCard
