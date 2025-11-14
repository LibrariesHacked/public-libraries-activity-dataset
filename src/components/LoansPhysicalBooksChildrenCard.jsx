import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import {
  getActiveServices,
  getServicesChildPopulation
} from '../models/service'

import NumberCard from './NumberCard'

const LoansPhysicalBooksChildrenCard = () => {
  const [{ filteredServices, services, loans }] = useApplicationState()

  const [loansChildrenCount, setLoansChildrenCount] = useState(0)
  const [loansChildrenPerCapita, setLoansChildrenPerCapita] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    if (!loans || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const loansChildrenPhysicalBooks = loans.filter(
      l =>
        l.format === 'Physical book' &&
        (l.contentAgeGroup === '12-17' || l.contentAgeGroup === 'Under 12')
    )

    const loanServices = activeServices?.filter(
      service =>
        loansChildrenPhysicalBooks.filter(l => l.serviceCode === service.code)
          .length > 0
    )

    if (!loanServices || loanServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalLoans = loansChildrenPhysicalBooks
      .filter(
        l =>
          filteredServices.length === 0 ||
          filteredServices.includes(l.serviceCode)
      )
      .reduce((sum, loan) => sum + loan.countLoans, 0)

    // The population is the totalPopulation of the active services that are being considered
    const totalPopulation = getServicesChildPopulation(loanServices)

    const loansPerCapita =
      totalPopulation > 0 ? Math.round(totalLoans / totalPopulation) : 0

    setLoansChildrenCount(totalLoans)
    setLoansChildrenPerCapita(loansPerCapita)
  }, [services, filteredServices, loans])

  return (
    <NumberCard
      title="Children's physical book loans"
      number={formatCompactNumber(loansChildrenCount)}
      description={`${Math.round(
        loansChildrenPerCapita
      )} per child resident per year`}
      colour='chartOrange'
      noData={noData}
    />
  )
}

export default LoansPhysicalBooksChildrenCard
