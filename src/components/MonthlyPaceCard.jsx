import React, { useEffect, useMemo, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'
import {
  filterByMonthRange,
  getActivityRecordsPeriodChange,
  resolvePeriodComparison
} from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import {
  getReportingCoverageByGroup,
  perThousandReportingPersonYears
} from '../helpers/reportingRates'
import { getActiveServices } from '../models/service'

import NumberCard from './NumberCard'

const MonthlyPaceCard = ({
  recordsKey,
  countProp,
  actionType,
  fetcher,
  title,
  unit,
  colour,
  icon,
  fractionDigits = 1
}) => {
  const [state, dispatchApplication] = useApplicationState()
  const {
    filteredServices,
    services,
    periods,
    selectedPeriods,
    monthRange,
    useEstimates
  } = state
  const records = state[recordsKey]

  const [rate, setRate] = useState(0)
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const comparison = useMemo(
    () => resolvePeriodComparison(selectedPeriods, periods),
    [selectedPeriods, periods]
  )

  useEffect(() => {
    if (!records && fetcher) {
      fetcher().then(data => {
        dispatchApplication({ type: actionType, [recordsKey]: data })
      })
    }
  }, [records, fetcher, dispatchApplication, actionType, recordsKey])

  useEffect(() => {
    if (!records || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeServiceCodes = new Set(activeServices.map(service => service.code))
    const matched = filterByMonthRange(records, monthRange).filter(record =>
      activeServiceCodes.has(record.serviceCode) &&
      Number.isFinite(record[countProp])
    )
    const total = matched.reduce((sum, record) => sum + record[countProp], 0)
    const coverage = getReportingCoverageByGroup(
      matched,
      activeServices,
      countProp,
      () => 'selected-period'
    ).get('selected-period')

    setNoData(matched.length === 0)
    setRate((perThousandReportingPersonYears(total, coverage) || 0) / 12)
    setWarning(getRecordsQualityWarning(matched))

    if (matched.length > 0 && comparison) {
      setChange(
        getActivityRecordsPeriodChange({
          records,
          countProp,
          baselinePeriod: comparison.baselinePeriod,
          targetPeriod: comparison.targetPeriod,
          serviceCodes: [...activeServiceCodes],
          useEstimates,
          services: activeServices
        })
      )
    } else {
      setChange(null)
    }
  }, [
    records,
    services,
    filteredServices,
    monthRange,
    comparison,
    useEstimates,
    countProp
  ])

  return (
    <NumberCard
      title={title}
      number={formatCompactNumber(rate, fractionDigits)}
      description={`${unit} per 1,000 reporting residents per month`}
      icon={icon}
      change={change}
      changeDescription={comparison?.changeDescription || ''}
      colour={colour}
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default MonthlyPaceCard