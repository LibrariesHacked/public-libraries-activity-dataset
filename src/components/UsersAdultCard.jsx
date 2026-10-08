import React from 'react'

import { getServicesAdultPopulation } from '../models/service'

import UsersAgeGroupCard from './UsersAgeGroupCard'

/**
 * Summary KPI card component displaying active adult library users (aged 18+) across active library services,
 * including percentage of adult residents and period-over-period change.
 *
 * @returns {JSX.Element} UsersAgeGroupCard configured for adult library users.
 */
const UsersAdultCard = () => (
  <UsersAgeGroupCard
    title='Active adult users'
    colour='chartBlue'
    ageGroup='Adult'
    populationFn={getServicesAdultPopulation}
    descLabel='adult residents'
  />
)

export default UsersAdultCard
