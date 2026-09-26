import React from 'react'

import { getServicesAdultPopulation } from '../models/service'

import UsersAgeGroupCard from './UsersAgeGroupCard'

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
