import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import { getActiveServices } from '../models/service'

import NumberCard from './NumberCard'

const UsersTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [usersCount, setUsersCount] = useState(0)
  const [percentageUsers, setPercentageUsers] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)

    const userServices = activeServices?.filter(service =>
      Number.isInteger(service.users)
    )

    if (!userServices || userServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    // The user count is the sum of the users integer from each service object
    const totalUsers =
      userServices?.reduce((acc, service) => acc + (service.users || 0), 0) || 0

    // The population is the sum of populationUnder12, population_12_17, population_adult
    const totalPopulation =
      userServices?.reduce(
        (acc, service) =>
          acc +
          (service.populationUnder12 || 0) +
          (service.population12To17 || 0) +
          (service.populationAdult || 0),
        0
      ) || 0

    const percentageUsers =
      totalPopulation > 0 ? (totalUsers / totalPopulation) * 100 : 0

    setUsersCount(totalUsers)
    setPercentageUsers(percentageUsers)
  }, [services, filteredServices])

  return (
    <NumberCard
      title='Active users'
      number={formatCompactNumber(usersCount)}
      description={`${Math.round(percentageUsers)}% of residents`}
      colour='chartPurple'
      noData={noData}
    />
  )
}

export default UsersTotalCard
