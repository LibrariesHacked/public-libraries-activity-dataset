import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as attendanceModel from '../models/attendance'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying event attendance for children and young people
 * (under 18), along with their share of total event attendees.
 *
 * @returns {JSX.Element} NumberCard configured for children's event attendance.
 */
const EventsChildrenAttendanceCard = () => {
  const [
    { filteredServices, services, attendance, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [count, setCount] = useState(0)
  const [description, setDescription] = useState('')
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  useEffect(() => {
    if (!attendance) {
      attendanceModel.getAttendance().then(data => {
        dispatchApplication({ type: 'SetAttendance', attendance: data })
      })
    }
  }, [attendance, dispatchApplication])

  useEffect(() => {
    if (!attendance || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeCodes = new Set((activeServices || []).map(s => s.code))

    const rangeAttendance = filterByMonthRange(attendance, monthRange)
    const matched = rangeAttendance.filter(
      a =>
        (!filteredServices.length || filteredServices.includes(a.serviceCode)) &&
        activeCodes.has(a.serviceCode)
    )

    if (!matched.length) {
      setNoData(true)
      setCount(0)
      setDescription('')
      return
    }

    setNoData(false)
    const totalAllAttendance = matched.reduce(
      (acc, a) => acc + (a.countAttendance || 0),
      0
    )

    const childRecords = matched.filter(
      a => a.ageGroup === 'Under 12' || a.ageGroup === '12-17'
    )
    const totalChildAttendance = childRecords.reduce(
      (acc, a) => acc + (a.countAttendance || 0),
      0
    )

    setCount(totalChildAttendance)

    const pct =
      totalAllAttendance > 0
        ? (totalChildAttendance / totalAllAttendance) * 100
        : 0
    setDescription(`${Math.round(pct)}% of all attendees`)
    setWarning(getRecordsQualityWarning(childRecords))
  }, [attendance, services, filteredServices, monthRange, useEstimates])

  return (
    <NumberCard
      title="Children's attendance"
      number={formatCompactNumber(count)}
      description={description}
      colour='chartPurple'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default EventsChildrenAttendanceCard
