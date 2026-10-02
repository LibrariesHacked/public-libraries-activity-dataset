import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as eventsModel from '../models/events'
import * as attendanceModel from '../models/attendance'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying average attendees per event session
 * across active library services.
 *
 * @returns {JSX.Element} NumberCard configured for event turnout.
 */
const EventsAverageTurnoutCard = () => {
  const [
    { filteredServices, services, events, attendance, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [turnout, setTurnout] = useState(0)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  useEffect(() => {
    if (!events) {
      eventsModel.getEvents().then(data => {
        dispatchApplication({ type: 'SetEvents', events: data })
      })
    }
    if (!attendance) {
      attendanceModel.getAttendance().then(data => {
        dispatchApplication({ type: 'SetAttendance', attendance: data })
      })
    }
  }, [events, attendance, dispatchApplication])

  useEffect(() => {
    if (!events || !attendance || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeCodes = new Set((activeServices || []).map(s => s.code))

    const rangeEvents = filterByMonthRange(events, monthRange)
    const matchedEvents = rangeEvents.filter(
      e =>
        (!filteredServices.length || filteredServices.includes(e.serviceCode)) &&
        activeCodes.has(e.serviceCode)
    )

    const rangeAttendance = filterByMonthRange(attendance, monthRange)
    const matchedAttendance = rangeAttendance.filter(
      a =>
        (!filteredServices.length || filteredServices.includes(a.serviceCode)) &&
        activeCodes.has(a.serviceCode)
    )

    if (!matchedEvents.length || !matchedAttendance.length) {
      setNoData(true)
      setTurnout(0)
      return
    }

    const totalEvents = matchedEvents.reduce(
      (acc, e) => acc + (e.countEvents || 0),
      0
    )
    const totalAttendance = matchedAttendance.reduce(
      (acc, a) => acc + (a.countAttendance || 0),
      0
    )

    if (totalEvents === 0) {
      setNoData(true)
      setTurnout(0)
      return
    }

    setNoData(false)
    const avgTurnout = totalAttendance / totalEvents
    setTurnout(Math.round(avgTurnout))
    setWarning(getRecordsQualityWarning([...matchedEvents, ...matchedAttendance]))
  }, [events, attendance, services, filteredServices, monthRange, useEstimates])

  return (
    <NumberCard
      title='Turnout per event'
      number={formatCompactNumber(turnout)}
      description='attendees per event'
      colour='chartBlue'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default EventsAverageTurnoutCard
