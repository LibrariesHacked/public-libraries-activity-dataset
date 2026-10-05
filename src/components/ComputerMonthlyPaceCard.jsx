import React, { useEffect, useState } from 'react'

import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, getActivityRecordsPeriodChange, getMonthsInRange, resolvePeriodComparison } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as computersModel from '../models/computers'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying average monthly public computer access hours,
 * along with average computer hours logged per day and period-over-period trend analysis.
 *
 * @returns {JSX.Element} NumberCard configured for monthly computer usage pace.
 */
const ComputerMonthlyPaceCard = () => {
  const [
    { filteredServices, services, computers, periods, selectedPeriods, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [monthlyAverage, setMonthlyAverage] = useState(0)
  const [description, setDescription] = useState('')
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const comparison = resolvePeriodComparison(selectedPeriods, periods)

  useEffect(() => {
    if (!computers) {
      computersModel.getComputers().then(data => {
        dispatchApplication({ type: 'SetComputers', computers: data })
      })
    }
  }, [computers, dispatchApplication])

  useEffect(() => {
    if (!computers || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeCodes = new Set((activeServices || []).map(s => s.code))

    const months = getMonthsInRange(monthRange)
    const monthCount = months.length || 12
    const yearCount = monthCount / 12

    const rangeComputers = filterByMonthRange(computers, monthRange)
    const matched = rangeComputers.filter(
      c =>
        (!filteredServices.length || filteredServices.includes(c.serviceCode)) &&
        activeCodes.has(c.serviceCode)
    )

    if (!matched.length) {
      setNoData(true)
      setMonthlyAverage(0)
      setDescription('')
      return
    }

    setNoData(false)
    const totalHours = matched.reduce((acc, c) => acc + (c.countHours || 0), 0)
    const avgMonthly = Math.round(totalHours / monthCount)
    const avgDaily = Math.round(totalHours / (365 * yearCount))

    setMonthlyAverage(avgMonthly)
    setDescription(`${formatCompactNumber(avgDaily)} hours per day`)
    setWarning(getRecordsQualityWarning(matched))

    if (comparison && computers) {
      const chg = getActivityRecordsPeriodChange({
        records: computers,
        countProp: 'countHours',
        baselinePeriod: comparison.baselinePeriod,
        targetPeriod: comparison.targetPeriod,
        serviceCodes: activeCodes,
        useEstimates
      })
      setChange(chg)
    } else {
      setChange(null)
    }
  }, [computers, services, filteredServices, monthRange, comparison, useEstimates])

  return (
    <NumberCard
      title='Monthly computer hours'
      number={formatCompactNumber(monthlyAverage)}
      description={description}
      icon={CalendarMonthRoundedIcon}
      change={change}
      changeDescription={comparison?.changeDescription || ''}
      colour='chartBlue'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default ComputerMonthlyPaceCard
