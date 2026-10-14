import React, { useEffect, useMemo, useState } from 'react'

import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, getPeriodMonths, resolvePeriodComparison } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import { getEventTurnout } from '../helpers/reportingRates'
import * as eventsModel from '../models/events'
import * as attendanceModel from '../models/attendance'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying average attendees per event session
 * across active library services, along with period-over-period trend analysis.
 *
 * @returns {JSX.Element} NumberCard configured for event turnout.
 */
const EventsAverageTurnoutCard = () => {
  const [
    { filteredServices, services, events, attendance, periods, selectedPeriods, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [turnout, setTurnout] = useState(0)
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const comparison = useMemo(
    () => resolvePeriodComparison(selectedPeriods, periods),
    [selectedPeriods, periods]
  )

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

    const avgTurnout = getEventTurnout(matchedEvents, matchedAttendance)
    setWarning(getRecordsQualityWarning([...matchedEvents, ...matchedAttendance]))
    if (avgTurnout == null) {
      setNoData(true)
      setTurnout(0)
      setChange(null)
      return
    }

    setNoData(false)
    setTurnout(Math.round(avgTurnout))

    if (comparison) {
      const getTurnoutForPeriod = period => {
        const months = new Set(getPeriodMonths(period))
        const matches = record => activeCodes.has(record.serviceCode) && months.has(record.month)
        return getEventTurnout(events.filter(matches), attendance.filter(matches))
      }

      const baseline = getTurnoutForPeriod(comparison.baselinePeriod)
      const target = getTurnoutForPeriod(comparison.targetPeriod)
      if (baseline != null && target != null && baseline > 0) {
        setChange(((target - baseline) / baseline) * 100)
      } else {
        setChange(null)
      }
    } else {
      setChange(null)
    }
  }, [events, attendance, services, filteredServices, monthRange, comparison, useEstimates])

  return (
    <NumberCard
      title='Turnout per event'
      number={formatCompactNumber(turnout)}
      description='attendances per event; matching records only'
      icon={GroupsRoundedIcon}
      change={change}
      changeDescription={comparison?.changeDescription || ''}
      colour='chartBlue'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default EventsAverageTurnoutCard
