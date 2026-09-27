import React, { useCallback } from 'react'

import { formatCompactNumber } from '../helpers/numbers'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total event attendees across active library services,
 * along with average attendees per event.
 *
 * @returns {JSX.Element} MetricTotalCard configured for event attendance.
 */
const AttendanceTotalCard = () => {
  const filterServices = useCallback(
    services =>
      services?.filter(
        service =>
          Number.isInteger(service.attendance) &&
          Number.isInteger(service.events)
      ),
    []
  )

  const formatDescription = useCallback(({ total, validServices }) => {
    const totalEvents =
      validServices?.reduce(
        (acc, service) => acc + (service.events || 0),
        0
      ) || 0
    const attendancePerEvent = total / (totalEvents || 1)
    return `${formatCompactNumber(attendancePerEvent)} per event`
  }, [])

  return (
    <MetricTotalCard
      metric='attendance'
      title='Event attendees'
      colour='chartRed'
      filterServices={filterServices}
      formatDescription={formatDescription}
    />
  )
}

export default AttendanceTotalCard
