import React, { useEffect, useMemo, useState } from 'react'

import LaptopChromebookRoundedIcon from '@mui/icons-material/LaptopChromebookRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, getActivityRecordsSharePeriodChange, resolvePeriodComparison } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import { getReportedTotal } from '../helpers/reportingRates'
import * as loansModel from '../models/loans'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying digital loans (e-books and e-audiobooks)
 * across active library services, along with their percentage share of total loans
 * and period-over-period trend analysis.
 *
 * @returns {JSX.Element} NumberCard configured for digital loans.
 */
const LoansDigitalCard = () => {
  const [
    { filteredServices, services, loans, periods, selectedPeriods, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [count, setCount] = useState(0)
  const [description, setDescription] = useState('')
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const comparison = useMemo(
    () => resolvePeriodComparison(selectedPeriods, periods),
    [selectedPeriods, periods]
  )

  useEffect(() => {
    if (!loans) {
      loansModel.getLoans().then(data => {
        dispatchApplication({ type: 'SetLoans', loans: data })
      })
    }
  }, [loans, dispatchApplication])

  useEffect(() => {
    if (!loans || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeCodes = new Set((activeServices || []).map(s => s.code))

    const rangeLoans = filterByMonthRange(loans, monthRange)
    const matched = rangeLoans.filter(
      l =>
        (!filteredServices.length || filteredServices.includes(l.serviceCode)) &&
        activeCodes.has(l.serviceCode)
    )

    const digitalFilter = l => l.format === 'Ebook' || l.format === 'Eaudio'
    const digitalRecords = matched.filter(digitalFilter)
    const totalDigital = getReportedTotal(digitalRecords, 'countLoans')
    setWarning(getRecordsQualityWarning(digitalRecords))
    if (totalDigital == null) {
      setNoData(true)
      setCount(0)
      setDescription('')
      setChange(null)
      return
    }

    setNoData(false)
    const totalAllLoans = matched.reduce((acc, l) => acc + (l.countLoans || 0), 0)

    setCount(totalDigital)

    const pct = totalAllLoans > 0 ? (totalDigital / totalAllLoans) * 100 : 0
    setDescription(`${pct.toFixed(1)}% of recorded loans`)

    if (comparison && loans) {
      const chg = getActivityRecordsSharePeriodChange({
        records: loans,
        countProp: 'countLoans',
        filterFn: digitalFilter,
        baselinePeriod: comparison.baselinePeriod,
        targetPeriod: comparison.targetPeriod,
        serviceCodes: activeCodes,
        useEstimates
      })
      setChange(chg)
    } else {
      setChange(null)
    }
  }, [loans, services, filteredServices, monthRange, comparison, useEstimates])

  return (
    <NumberCard
      title='Digital loans'
      number={formatCompactNumber(count)}
      description={description}
      icon={LaptopChromebookRoundedIcon}
      change={change}
      changeDescription={`share ${comparison?.changeDescription || ''}`}
      changeUnit='percentage points'
      colour='chartOrange'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default LoansDigitalCard
