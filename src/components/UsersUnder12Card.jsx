import React from 'react'

import { getServicesUnder12Population } from '../models/service'

import UsersAgeGroupCard from './UsersAgeGroupCard'

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
