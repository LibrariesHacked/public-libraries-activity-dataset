import React, { useCallback } from 'react'

import { getServicesAdultPopulation } from '../models/service'

import LoansCategoryCard from './LoansCategoryCard'

const LoansPhysicalBooksAdultsCard = () => {
  const filterLoan = useCallback(
    l => l.format === 'Physical book' && l.contentAgeGroup === 'Adult',
    []
  )

  return (
    <LoansCategoryCard
      title='Adult physical book loans'
      colour='chartBlue'
      filterLoan={filterLoan}
      populationFn={getServicesAdultPopulation}
      perCapitaLabel='adult resident'
    />
  )
}

export default LoansPhysicalBooksAdultsCard
