import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import {
  getActiveServices,
  getServicesJuniorPopulation
} from '../models/service'

import NumberCard from './NumberCard'

const UsersJuniorCard = () => {
  const [{ filteredServices, services, users }] = useApplicationState()

  const [usersCount, setUsersCount] = useState(0)
  const [percentageUsers, setPercentageUsers] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    if (!users || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const juniorUserServices = activeServices?.filter(
      service =>
        users.filter(
          u => u.ageGroup === '12-17' && u.serviceCode === service.code
        ).length > 0
    )

    if (!juniorUserServices || juniorUserServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalJuniorUsers = users
      .filter(
        u =>
          u.ageGroup === '12-17' &&
          (filteredServices.length === 0 ||
            filteredServices.includes(u.serviceCode))
      )
      .reduce((sum, user) => sum + user.countUsers, 0)

    const totalJuniorPopulation =
      getServicesJuniorPopulation(juniorUserServices) || 0

    const percentageUsers =
      totalJuniorPopulation > 0
        ? (totalJuniorUsers / totalJuniorPopulation) * 100
        : 0

    setUsersCount(totalJuniorUsers)
    setPercentageUsers(percentageUsers)
  }, [services, filteredServices, users])

  return (
    <NumberCard
      title='Active users aged 12-17'
      number={formatCompactNumber(usersCount)}
      description={`${Math.round(percentageUsers)}% of residents aged 12-17`}
      colour='chartOrange'
      noData={noData}
    />
  )
}

export default UsersJuniorCard
