import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByPeriods } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'

import NumberCard from './NumberCard'

const LoansCategoryCard = ({
  title,
  colour,
  filterLoan,
  populationFn,
  perCapitaLabel
}) => {
  const [{ filteredServices, services, loans, selectedPeriods, useEstimates }] =
    useApplicationState()

  const [count, setCount] = useState(0)
  const [perCapita, setPerCapita] = useState(0)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  useEffect(() => {
    if (!loans || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const categoryLoans = filterByPeriods(loans, selectedPeriods).filter(
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

    const rate =
      totalPopulation > 0
        ? Math.round(
            totalLoans / totalPopulation / (selectedPeriods?.length || 1)
          )
        : 0

    setCount(totalLoans)
    setPerCapita(rate)
    setWarning(getRecordsQualityWarning(matchedLoans))
  }, [
    services,
    filteredServices,
    loans,
    selectedPeriods,
    useEstimates,
    filterLoan,
    populationFn
  ])

  return (
    <NumberCard
      title={title}
      number={formatCompactNumber(count)}
      description={`${Math.round(perCapita)} per ${perCapitaLabel} per year`}
      colour={colour}
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default LoansCategoryCard
