import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { getActiveServices } from '../models/service'

import { formatCompactNumber } from '../helpers/numbers'

import NumberCard from './NumberCard'

const AttendanceTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [attendanceCount, setAttendanceCount] = useState(0)
  const [attendancePerEvent, setAttendancePerEvent] = useState(0)

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)

    // The attendance count is the sum of the attendance from each service object
    const totalAttendance =
      activeServices?.reduce(
        (acc, service) => acc + (service.attendance || 0),
        0
      ) || 0

    const totalEvents =
      activeServices?.reduce(
        (acc, service) => acc + (service.events || 0),
        0
      ) || 0

    const attendancePerEvent = totalAttendance / (totalEvents || 1)

    setAttendanceCount(totalAttendance)
    setAttendancePerEvent(attendancePerEvent)
  }, [services, filteredServices])

  return (
    <NumberCard
      title='Event attendees'
      number={formatCompactNumber(attendanceCount)}
      description={`${formatCompactNumber(attendancePerEvent)} per event`}
    />
  )
}

export default AttendanceTotalCard
