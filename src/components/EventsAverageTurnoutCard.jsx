import React, { useEffect, useMemo, useState } from 'react'

import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, resolvePeriodComparison } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
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
    { filteredServices, services, serviceRecords, events, attendance, periods, selectedPeriods, monthRange, useEstimates },
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

    if (comparison && serviceRecords) {
      const getTurnoutForPeriod = period => {
        let totalAtt = 0
        let totalEv = 0
        serviceRecords.forEach(record => {
          if (record.period !== period) return
          if (activeCodes.size && !activeCodes.has(record.code)) return
          const att = record.resolveMetric ? record.resolveMetric('attendance', useEstimates) : record.attendance
          const ev = record.resolveMetric ? record.resolveMetric('events', useEstimates) : record.events
          if (Number.isFinite(att) && Number.isFinite(ev) && ev > 0) {
            totalAtt += att
            totalEv += ev
          }
        })
        return totalEv > 0 ? totalAtt / totalEv : null
      }

      const baseline = getTurnoutForPeriod(comparison.baselinePeriod)
      const target = getTurnoutForPeriod(comparison.targetPeriod)
      if (baseline && target && baseline > 0) {
        setChange(((target - baseline) / baseline) * 100)
      } else {
        setChange(null)
      }
    } else {
      setChange(null)
    }
  }, [events, attendance, services, serviceRecords, filteredServices, monthRange, comparison, useEstimates])

  return (
    <NumberCard
      title='Turnout per event'
      number={formatCompactNumber(turnout)}
      description='attendees per event'
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
