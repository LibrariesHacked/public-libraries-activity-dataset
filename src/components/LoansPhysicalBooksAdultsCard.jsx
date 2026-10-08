import React, { useCallback } from 'react'

import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import { getServicesAdultPopulation } from '../models/service'

import LoansCategoryCard from './LoansCategoryCard'

/**
 * Summary KPI card component displaying physical book loans for adults across active library services,
 * along with average loans per adult resident per year.
 *
 * @returns {JSX.Element} LoansCategoryCard configured for adult physical book loans.
 */
const LoansPhysicalBooksAdultsCard = () => {
  const filterLoan = useCallback(
    l => l.format === 'Physical book' && l.contentAgeGroup === 'Adult',
    []
  )

  return (
    <LoansCategoryCard
      title='Adult physical book loans'
      colour='chartBlue'
      icon={PersonRoundedIcon}
      filterLoan={filterLoan}
      populationFn={getServicesAdultPopulation}
      perCapitaLabel='adult residents'
    />
  )
}

export default LoansPhysicalBooksAdultsCard
