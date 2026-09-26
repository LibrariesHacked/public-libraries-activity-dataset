import React, { useCallback } from 'react'

import { getServicesPopulation } from '../models/service'

import LoansCategoryCard from './LoansCategoryCard'

const LoansPhysicalBooksCard = () => {
  const filterLoan = useCallback(l => l.format === 'Physical book', [])

  return (
    <LoansCategoryCard
      title='Physical book loans'
      colour='chartPurple'
      filterLoan={filterLoan}
      populationFn={getServicesPopulation}
      perCapitaLabel='resident'
    />
  )
}

export default LoansPhysicalBooksCard
