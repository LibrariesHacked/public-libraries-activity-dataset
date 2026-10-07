import React, { useCallback } from 'react'

import { getServicesPopulation } from '../models/service'

import LoansCategoryCard from './LoansCategoryCard'

/**
 * Summary KPI card component displaying total physical book loans across active library services,
 * along with average annual physical book loans per 1,000 reporting residents.
 *
 * @returns {JSX.Element} LoansCategoryCard configured for physical book loans.
 */
const LoansPhysicalBooksCard = () => {
  const filterLoan = useCallback(l => l.format === 'Physical book', [])

  return (
    <LoansCategoryCard
      title='Physical book loans'
      colour='chartPurple'
      filterLoan={filterLoan}
      populationFn={getServicesPopulation}
      perCapitaLabel='residents'
    />
  )
}

export default LoansPhysicalBooksCard
