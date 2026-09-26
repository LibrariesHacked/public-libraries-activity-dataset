import React, { useCallback } from 'react'

import { getServicesChildPopulation } from '../models/service'

import LoansCategoryCard from './LoansCategoryCard'

const LoansPhysicalBooksChildrenCard = () => {
  const filterLoan = useCallback(
    l =>
      l.format === 'Physical book' &&
      (l.contentAgeGroup === '12-17' || l.contentAgeGroup === 'Under 12'),
    []
  )

  return (
    <LoansCategoryCard
      title="Children's physical book loans"
      colour='chartOrange'
      filterLoan={filterLoan}
      populationFn={getServicesChildPopulation}
      perCapitaLabel='child resident'
    />
  )
}

export default LoansPhysicalBooksChildrenCard
