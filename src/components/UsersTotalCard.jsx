import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import { formatPeriod } from '../helpers/periods'

import { getActiveServices, getServicePeriodChange } from '../models/service'

import NumberCard from './NumberCard'

const UsersTotalCard = () => {
  const [{ filteredServices, services, serviceRecords, selectedPeriods }] =
    useApplicationState()

  const [usersCount, setUsersCount] = useState(0)
  const [percentageUsers, setPercentageUsers] = useState(0)
  const [usersChange, setUsersChange] = useState(null)
  const [noData, setNoData] = useState(false)

  const earliestPeriod = selectedPeriods?.[0]

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

    setUsersChange(
      getServicePeriodChange(
        serviceRecords,
        'users',
        earliestPeriod,
        selectedPeriods?.[selectedPeriods.length - 1],
        userServices?.map(service => service.code)
      )
    )
  }, [services, serviceRecords, filteredServices, selectedPeriods, earliestPeriod])

  return (
    <NumberCard
      title='Active users'
      number={formatCompactNumber(usersCount)}
      description={`${Math.round(percentageUsers)}% of residents`}
      change={usersChange}
      changeDescription={`since ${
        earliestPeriod ? formatPeriod(earliestPeriod) : ''
      }`}
      colour='chartPurple'
      noData={noData}
    />
  )
}

export default UsersTotalCard
