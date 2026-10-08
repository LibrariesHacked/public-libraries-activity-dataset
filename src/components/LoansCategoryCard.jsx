import React, { useEffect, useMemo, useState } from 'react'

import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, getActivityRecordsPeriodChange, resolvePeriodComparison } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import { getReportingCoverageByGroup, perThousandReportingPersonYears } from '../helpers/reportingRates'

import NumberCard from './NumberCard'

/**
 * Generic KPI card component for categorized library loans (e.g. physical books, adult books, children's books),
 * computing category totals, rates per 1,000 relevant residents, period changes, and data quality warnings.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.title - Card title displayed in header.
 * @param {string} props.colour - Palette colour key for card styling.
 * @param {Function} props.filterLoan - Predicate function determining if a loan record matches this category.
 * @param {Function} props.populationFn - Function calculating the relevant population denominator from service records.
 * @param {string} props.perCapitaLabel - Name of the population group used for the rate.
 * @param {React.ElementType} [props.icon] - Optional category title icon, defaulting to a book.
 * @returns {JSX.Element} Rendered NumberCard component.
 */
const LoansCategoryCard = ({
  title,
  colour,
  filterLoan,
  populationFn,
  perCapitaLabel,
  icon = MenuBookRoundedIcon
}) => {
  const [
    { filteredServices, services, loans, periods, selectedPeriods, monthRange, useEstimates }
  ] = useApplicationState()

  const [count, setCount] = useState(0)
  const [perCapita, setPerCapita] = useState(0)
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const comparison = useMemo(
    () => resolvePeriodComparison(selectedPeriods, periods),
    [selectedPeriods, periods]
  )

  useEffect(() => {
    if (!loans || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const categoryLoans = filterByMonthRange(loans, monthRange).filter(
      filterLoan
    )

    const matchedLoans = categoryLoans.filter(
      l =>
        filteredServices.length === 0 ||
        filteredServices.includes(l.serviceCode)
    )
    const coverage = getReportingCoverageByGroup(
      matchedLoans,
      activeServices,
      'countLoans',
      () => 'category',
      service => populationFn([service])
    ).get('category')

    setNoData(!coverage)

    const totalLoans = matchedLoans.reduce(
      (sum, loan) => sum + (loan.countLoans || 0),
      0
    )

    const rate = perThousandReportingPersonYears(totalLoans, coverage) || 0

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
      description={`${formatCompactNumber(perCapita, 1)} per 1,000 ${perCapitaLabel} per year`}
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
