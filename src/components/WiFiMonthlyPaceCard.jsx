import React, { useEffect, useState } from 'react'

import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, getActivityRecordsPeriodChange, getMonthsInRange, resolvePeriodComparison } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as wifiModel from '../models/wifi'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying average monthly public Wi-Fi sessions,
 * along with average Wi-Fi sessions logged per day and period-over-period trend analysis.
 *
 * @returns {JSX.Element} NumberCard configured for monthly Wi-Fi usage pace.
 */
const WiFiMonthlyPaceCard = () => {
  const [
    { filteredServices, services, wifi, periods, selectedPeriods, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [monthlyAverage, setMonthlyAverage] = useState(0)
  const [description, setDescription] = useState('')
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const comparison = resolvePeriodComparison(selectedPeriods, periods)

  useEffect(() => {
    if (!wifi) {
      wifiModel.getWiFi().then(data => {
        dispatchApplication({ type: 'SetWiFi', wifi: data })
      })
    }
  }, [wifi, dispatchApplication])

  useEffect(() => {
    if (!wifi || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeCodes = new Set((activeServices || []).map(s => s.code))

    const months = getMonthsInRange(monthRange)
    const monthCount = months.length || 12
    const yearCount = monthCount / 12

    const rangeWifi = filterByMonthRange(wifi, monthRange)
    const matched = rangeWifi.filter(
      w =>
        (!filteredServices.length || filteredServices.includes(w.serviceCode)) &&
        activeCodes.has(w.serviceCode)
    )

    if (!matched.length) {
      setNoData(true)
      setMonthlyAverage(0)
      setDescription('')
      return
    }

    setNoData(false)
    const totalSessions = matched.reduce((acc, w) => acc + (w.countSessions || 0), 0)
    const avgMonthly = Math.round(totalSessions / monthCount)
    const avgDaily = Math.round(totalSessions / (365 * yearCount))

    setMonthlyAverage(avgMonthly)
    setDescription(`${formatCompactNumber(avgDaily, 2)} sessions per day`)
    setWarning(getRecordsQualityWarning(matched))

    if (comparison && wifi) {
      const chg = getActivityRecordsPeriodChange({
        records: wifi,
        countProp: 'countSessions',
        baselinePeriod: comparison.baselinePeriod,
        targetPeriod: comparison.targetPeriod,
        serviceCodes: activeCodes,
        useEstimates
      })
      setChange(chg)
    } else {
      setChange(null)
    }
  }, [wifi, services, filteredServices, monthRange, comparison, useEstimates])

  return (
    <NumberCard
      title='Monthly WiFi sessions'
      number={formatCompactNumber(monthlyAverage)}
      description={description}
      icon={CalendarMonthRoundedIcon}
      change={change}
      changeDescription={comparison?.changeDescription || ''}
      colour='chartYellow'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default WiFiMonthlyPaceCard
