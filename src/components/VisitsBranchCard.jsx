import React, { useEffect, useState } from 'react'

import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, getActivityRecordsSharePeriodChange, resolvePeriodComparison } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as visitsModel from '../models/visits'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying visits to physical library branches
 * (libraries and shared buildings), along with their share of total library footfall
 * and period-over-period trend analysis.
 *
 * @returns {JSX.Element} NumberCard configured for branch visits.
 */
const VisitsBranchCard = () => {
  const [
    { filteredServices, services, visits, periods, selectedPeriods, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [count, setCount] = useState(0)
  const [description, setDescription] = useState('')
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const comparison = resolvePeriodComparison(selectedPeriods, periods)

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

    if (!matched.length) {
      setNoData(true)
      setCount(0)
      setDescription('')
      return
    }

    setNoData(false)
    const totalAllVisits = matched.reduce((acc, v) => acc + (v.countVisits || 0), 0)

    const branchFilter = v => v.location === 'Library' || v.location === 'Shared building'
    const branchRecords = matched.filter(branchFilter)
    const totalBranch = branchRecords.reduce(
      (acc, v) => acc + (v.countVisits || 0),
      0
    )

    setCount(totalBranch)

    const pct = totalAllVisits > 0 ? (totalBranch / totalAllVisits) * 100 : 0
    setDescription(`${Math.round(pct)}% of total visits`)
    setWarning(getRecordsQualityWarning(branchRecords))

    if (comparison && visits) {
      const chg = getActivityRecordsSharePeriodChange({
        records: visits,
        countProp: 'countVisits',
        filterFn: branchFilter,
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
      title='Branch visits'
      number={formatCompactNumber(count)}
      description={description}
      icon={StorefrontRoundedIcon}
      change={change}
      changeDescription={comparison?.changeDescription || ''}
      changeUnit='percentage points'
      colour='chartBlue'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default VisitsBranchCard
