import React, { useEffect, useMemo, useState } from 'react'

import DirectionsBusRoundedIcon from '@mui/icons-material/DirectionsBusRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, getActivityRecordsSharePeriodChange, resolvePeriodComparison } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import { getReportedTotal } from '../helpers/reportingRates'
import { getReportingCoverageByGroup, perThousandReportingPersonYears } from '../helpers/reportingRates'
import * as visitsModel from '../models/visits'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying visits to mobile library vehicles,
 * along with their share of total library footfall and period-over-period trend analysis.
 *
 * @returns {JSX.Element} NumberCard configured for mobile library visits.
 */
const VisitsMobileCard = () => {
  const [
    { filteredServices, services, visits, periods, selectedPeriods, monthRange, useEstimates },
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
    if (!visits) {
      visitsModel.getVisits().then(data => {
        dispatchApplication({ type: 'SetVisits', visits: data })
      })
    }
  }, [visits, dispatchApplication])

  useEffect(() => {
    if (!visits || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeCodes = new Set((activeServices || []).map(s => s.code))

    const rangeVisits = filterByMonthRange(visits, monthRange)
    const matched = rangeVisits.filter(
      v =>
        (!filteredServices.length || filteredServices.includes(v.serviceCode)) &&
        activeCodes.has(v.serviceCode)
    )

    const mobileFilter = v => v.location === 'Mobile library'
    const mobileRecords = matched.filter(mobileFilter)
    const totalMobile = getReportedTotal(mobileRecords, 'countVisits')
    setWarning(getRecordsQualityWarning(mobileRecords))
    if (totalMobile == null) {
      setNoData(true)
      setCount(0)
      setDescription('')
      setChange(null)
      return
    }

    setNoData(false)
    const totalAllVisits = matched.reduce((acc, v) => acc + (v.countVisits || 0), 0)

    const coverage = getReportingCoverageByGroup(
      mobileRecords,
      activeServices,
      'countVisits',
      () => 'mobile'
    ).get('mobile')
    const annualRate = perThousandReportingPersonYears(totalMobile, coverage) || 0
    setCount(annualRate)

    const pct = totalAllVisits > 0 ? (totalMobile / totalAllVisits) * 100 : 0
    const formattedPct =
      pct > 0 && pct < 1 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`
    setDescription(`${formattedPct} of visits; per 1,000 reporting residents / yr`)

    if (comparison && visits) {
      const chg = getActivityRecordsSharePeriodChange({
        records: visits,
        countProp: 'countVisits',
        filterFn: mobileFilter,
        baselinePeriod: comparison.baselinePeriod,
        targetPeriod: comparison.targetPeriod,
        serviceCodes: activeCodes,
        useEstimates
      })
      setChange(chg)
    } else {
      setChange(null)
    }
  }, [visits, services, filteredServices, monthRange, comparison, useEstimates])

  return (
    <NumberCard
      title='Mobile library visits'
      number={formatCompactNumber(count)}
      description={description}
      icon={DirectionsBusRoundedIcon}
      change={change}
      changeDescription={comparison?.changeDescription || ''}
      changeUnit='percentage points'
      colour='chartPurple'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default VisitsMobileCard
