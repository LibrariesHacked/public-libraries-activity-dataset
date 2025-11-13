import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import {
  getActiveServices,
  getServicesAdultPopulation
} from '../models/service'

import NumberCard from './NumberCard'

const LoansPhysicalBooksAdultsCard = () => {
  const [{ filteredServices, services, loans }] = useApplicationState()

  const [loansAdultsCount, setLoansAdultsCount] = useState(0)
  const [loansAdultsPerCapita, setLoansAdultsPerCapita] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    if (!loans || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const loanServices = activeServices?.filter(service =>
      Number.isInteger(service.loans)
    )

    if (!loanServices || loanServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalLoans = loans
      .filter(
        l =>
          l.format === 'Physical book' &&
          l.contentAgeGroup === 'Adult' &&
          (filteredServices.length === 0 ||
            filteredServices.includes(l.serviceCode))
      )
      .reduce((sum, loan) => sum + loan.countLoans, 0)

    // The population is the totalPopulation of the active services that are being considered
    const totalPopulation = getServicesAdultPopulation(loanServices)

    const loansPerCapita =
      totalPopulation > 0 ? Math.round(totalLoans / totalPopulation) : 0

    setLoansAdultsCount(totalLoans)
    setLoansAdultsPerCapita(loansPerCapita)
  }, [services, filteredServices, loans])

  return (
    <NumberCard
      title='Adult physical book loans'
      number={formatCompactNumber(loansAdultsCount)}
      description={`${Math.round(
        loansAdultsPerCapita
      )} per adult resident per year`}
      colour='chartBlue'
      noData={noData}
    />
  )
}

export default LoansPhysicalBooksAdultsCard
