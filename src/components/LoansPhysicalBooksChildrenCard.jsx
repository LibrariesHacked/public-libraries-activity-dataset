import React, { useCallback } from 'react'

import { getServicesChildPopulation } from '../models/service'

import LoansCategoryCard from './LoansCategoryCard'

/**
 * Summary KPI card component displaying physical book loans for children and young people (under 18)
 * across active library services, along with average loans per child resident per year.
 *
 * @returns {JSX.Element} LoansCategoryCard configured for children's physical book loans.
 */
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
      perCapitaLabel='child residents'
    />
  )
}

export default LoansPhysicalBooksChildrenCard
