import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import { formatPeriod } from '../helpers/periods'

import {
  getActiveServices,
  getServicesJuniorPopulation
} from '../models/service'

import { getUsersPeriodChange } from '../models/users'

import NumberCard from './NumberCard'

const UsersJuniorCard = () => {
  const [{ filteredServices, services, users, selectedPeriods, snapshotPeriod }] =
    useApplicationState()

  const [usersCount, setUsersCount] = useState(0)
  const [percentageUsers, setPercentageUsers] = useState(0)
  const [usersChange, setUsersChange] = useState(null)
  const [noData, setNoData] = useState(false)

  const earliestPeriod = selectedPeriods?.[0]

  useEffect(() => {
    if (!users || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    // Active users are a yearly snapshot so they are not summed across years.
    const snapshotUsers = snapshotPeriod
      ? users.filter(u => u.period === snapshotPeriod)
      : users

    const juniorUserServices = activeServices?.filter(
      service =>
        snapshotUsers.filter(
          u => u.ageGroup === '12-17' && u.serviceCode === service.code
        ).length > 0
    )

    if (!juniorUserServices || juniorUserServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalJuniorUsers = snapshotUsers
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

    setUsersChange(
      getUsersPeriodChange(
        users,
        '12-17',
        earliestPeriod,
        snapshotPeriod,
        juniorUserServices?.map(service => service.code)
      )
    )
  }, [
    services,
    filteredServices,
    users,
    snapshotPeriod,
    earliestPeriod
  ])

  return (
    <NumberCard
      title='Active users aged 12-17'
      number={formatCompactNumber(usersCount)}
      description={`${Math.round(percentageUsers)}% of residents aged 12-17`}
      change={usersChange}
      changeDescription={`since ${
        earliestPeriod ? formatPeriod(earliestPeriod) : ''
      }`}
      colour='chartOrange'
      noData={noData}
    />
  )
}

export default UsersJuniorCard
