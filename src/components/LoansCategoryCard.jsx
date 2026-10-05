import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, getActivityRecordsPeriodChange, getMonthsInRange, resolvePeriodComparison } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'

import NumberCard from './NumberCard'

/**
 * Generic KPI card component for categorized library loans (e.g. physical books, adult books, children's books),
 * computing category totals, per-capita rates relative to target demographics, period changes, and tracking data quality warnings.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.title - Card title displayed in header.
 * @param {string} props.colour - Palette colour key for card styling.
 * @param {Function} props.filterLoan - Predicate function determining if a loan record matches this category.
 * @param {Function} props.populationFn - Function calculating the relevant population denominator from service records.
 * @param {string} props.perCapitaLabel - Descriptive label for the per-capita rate (e.g. 'resident', 'child resident').
 * @param {React.ElementType} [props.icon] - Optional icon displayed next to the description.
 * @returns {JSX.Element} Rendered NumberCard component.
 */
const LoansCategoryCard = ({
  title,
  colour,
  filterLoan,
  populationFn,
  perCapitaLabel,
  icon
}) => {
  const [
    { filteredServices, services, loans, periods, selectedPeriods, monthRange, useEstimates }
  ] = useApplicationState()

  const [count, setCount] = useState(0)
  const [perCapita, setPerCapita] = useState(0)
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const comparison = resolvePeriodComparison(selectedPeriods, periods)

  useEffect(() => {
    if (!loans || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const categoryLoans = filterByMonthRange(loans, monthRange).filter(
      filterLoan
    )

    const loanServices = activeServices?.filter(service =>
      categoryLoans.some(l => l.serviceCode === service.code)
    )

    if (!loanServices || loanServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const matchedLoans = categoryLoans.filter(
      l =>
        filteredServices.length === 0 ||
        filteredServices.includes(l.serviceCode)
    )

    const totalLoans = matchedLoans.reduce(
      (sum, loan) => sum + (loan.countLoans || 0),
      0
    )

    const totalPopulation = populationFn(loanServices)

    const yearCount = (getMonthsInRange(monthRange).length || 12) / 12
    const rate =
      totalPopulation > 0
        ? Math.round(
            totalLoans / totalPopulation / yearCount
          )
        : 0

    setCount(totalLoans)
    setPerCapita(rate)
    setWarning(getRecordsQualityWarning(matchedLoans))

    if (comparison && loans) {
      const activeCodes = activeServices?.map(s => s.code)
      const chg = getActivityRecordsPeriodChange({
        records: loans,
        countProp: 'countLoans',
        filterFn: filterLoan,
        baselinePeriod: comparison.baselinePeriod,
        targetPeriod: comparison.targetPeriod,
        serviceCodes: activeCodes,
        useEstimates
      })
      setChange(chg)
    } else {
      setChange(null)
    }
  }, [
    services,
    filteredServices,
    loans,
    monthRange,
    comparison,
    useEstimates,
    filterLoan,
    populationFn
  ])

  return (
    <NumberCard
      title={title}
      number={formatCompactNumber(count)}
      description={`${Math.round(perCapita)} per ${perCapitaLabel} per year`}
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

export default LoansCategoryCard
