import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import { getActiveServices, getServicesPopulation } from '../models/service'

import NumberCard from './NumberCard'

const LoansPhysicalBooksCard = () => {
  const [{ filteredServices, services, loans }] = useApplicationState()

  const [loansPhysicalBooksCount, setLoansPhysicalBooksCount] = useState(0)
  const [loansPhysicalBooksPerCapita, setLoansPhysicalBooksPerCapita] =
    useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    if (!loans || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const loansPhysicalBooks = loans.filter(l => l.format === 'Physical book')

    const loanServices = activeServices?.filter(
      service =>
        loansPhysicalBooks.filter(l => l.serviceCode === service.code).length >
        0
    )

    if (!loanServices || loanServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalLoans = loansPhysicalBooks
      .filter(
        l =>
          filteredServices.length === 0 ||
          filteredServices.includes(l.serviceCode)
      )
      .reduce((sum, loan) => sum + loan.countLoans, 0)

    // The population is the totalPopulation of the active services that are being considered
    const totalPopulation = getServicesPopulation(loanServices)

    const loansPerCapita =
      totalPopulation > 0 ? Math.round(totalLoans / totalPopulation) : 0

    setLoansPhysicalBooksCount(totalLoans)
    setLoansPhysicalBooksPerCapita(loansPerCapita)
  }, [services, filteredServices, loans])

  return (
    <NumberCard
      title='Physical book loans'
      number={formatCompactNumber(loansPhysicalBooksCount)}
      description={`${Math.round(
        loansPhysicalBooksPerCapita
      )} per resident per year`}
      colour='chartPurple'
      noData={noData}
    />
  )
}

export default LoansPhysicalBooksCard
