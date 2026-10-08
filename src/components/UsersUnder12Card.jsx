import React from 'react'

import { getServicesUnder12Population } from '../models/service'

import UsersAgeGroupCard from './UsersAgeGroupCard'

/**
 * Summary KPI card component displaying active child library users (under age 12) across active library services,
 * including percentage of child residents and period-over-period change.
 *
 * @returns {JSX.Element} UsersAgeGroupCard configured for child library users under 12.
 */
const UsersUnder12Card = () => (
  <UsersAgeGroupCard
    title='Active users under 12'
    colour='chartRed'
    ageGroup='Under 12'
    populationFn={getServicesUnder12Population}
    descLabel='residents under 12'
  />
)

export default UsersUnder12Card
