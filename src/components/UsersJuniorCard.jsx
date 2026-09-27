import React from 'react'

import { getServicesJuniorPopulation } from '../models/service'

import UsersAgeGroupCard from './UsersAgeGroupCard'

/**
 * Summary KPI card component displaying active young library users (aged 12-17) across active library services,
 * including percentage of youth residents and period-over-period change.
 *
 * @returns {JSX.Element} UsersAgeGroupCard configured for youth library users.
 */
const UsersJuniorCard = () => (
  <UsersAgeGroupCard
    title='Active users aged 12-17'
    colour='chartOrange'
    ageGroup='12-17'
    populationFn={getServicesJuniorPopulation}
    descLabel='residents aged 12-17'
  />
)

export default UsersJuniorCard
