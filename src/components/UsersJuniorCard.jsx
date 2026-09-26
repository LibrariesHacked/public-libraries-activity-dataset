import React from 'react'

import { getServicesJuniorPopulation } from '../models/service'

import UsersAgeGroupCard from './UsersAgeGroupCard'

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
