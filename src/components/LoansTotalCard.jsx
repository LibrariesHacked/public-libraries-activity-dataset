import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import { getActiveServices } from '../models/service'

import NumberCard from './NumberCard'

const LoansTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [loansCount, setLoansCount] = useState(0)
  const [loansPerCapita, setLoansPerCapita] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)

    const loanServices = activeServices?.filter(service =>
      Number.isInteger(service.loans)
    )

    if (!loanServices || loanServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    // The loans count is the sum of the loans integer from each service object
    const totalLoans =
      loanServices?.reduce((acc, service) => acc + (service.loans || 0), 0) ||
      0

    // The population is the totalPopulation of the active services that are being considered
    const totalPopulation =
      loanServices?.reduce(
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
      title='All loans'
      number={formatCompactNumber(loansCount)}
      description={`${Math.round(loansPerCapita)} per resident per year`}
      colour='chartGreen'
      noData={noData}
    />
  )
}

export default LoansTotalCard
