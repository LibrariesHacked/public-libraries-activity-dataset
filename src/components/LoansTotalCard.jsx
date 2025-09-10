import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import NumberCard from './NumberCard'

const LoansTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [loansCount, setLoansCount] = useState(0)
  const [loansPerCapita, setLoansPerCapita] = useState(0)

  useEffect(() => {
    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    // The loans count is the sum of the loans integer from each service object
    const totalLoans =
      activeServices?.reduce((acc, service) => acc + (service.loans || 0), 0) ||
      0

    // The population is the totalPopulation on the service object
    const totalPopulation =
      activeServices?.reduce(
        (acc, service) => acc + (service.totalPopulation || 0),
        0
      ) || 0

    const loansPerCapita =
      totalPopulation > 0 ? Math.round(totalLoans / totalPopulation) : 0

    setLoansCount(totalLoans)
    setLoansPerCapita(loansPerCapita)
  }, [services, filteredServices])

  return (
    <NumberCard
      title='Loans'
      number={formatCompactNumber(loansCount)}
      description={`${Math.round(loansPerCapita)} per resident`}
    />
  )
}

export default LoansTotalCard
