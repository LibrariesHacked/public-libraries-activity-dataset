import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import { formatPeriod } from '../helpers/periods'

import {
  getActiveServices,
  getServicesUnder12Population
} from '../models/service'

import { getUsersPeriodChange } from '../models/users'

import NumberCard from './NumberCard'

const UsersUnder12Card = () => {
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

    const under12UserServices = activeServices?.filter(
      service =>
        snapshotUsers.filter(
          u => u.ageGroup === 'Under 12' && u.serviceCode === service.code
        ).length > 0
    )

    if (!under12UserServices || under12UserServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalUnder12Users = snapshotUsers
      .filter(
        u =>
          u.ageGroup === 'Under 12' &&
          (filteredServices.length === 0 ||
            filteredServices.includes(u.serviceCode))
      )
      .reduce((sum, user) => sum + user.countUsers, 0)

    const totalUnder12Population =
      getServicesUnder12Population(under12UserServices) || 0

    const percentageUsers =
      totalUnder12Population > 0
        ? (totalUnder12Users / totalUnder12Population) * 100
        : 0

    setUsersCount(totalUnder12Users)
    setPercentageUsers(percentageUsers)

    setUsersChange(
      getUsersPeriodChange(
        users,
        'Under 12',
        earliestPeriod,
        snapshotPeriod,
        under12UserServices?.map(service => service.code)
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
      title='Active users under 12'
      number={formatCompactNumber(usersCount)}
      description={`${Math.round(percentageUsers)}% of residents under 12`}
      change={usersChange}
      changeDescription={`since ${
        earliestPeriod ? formatPeriod(earliestPeriod) : ''
      }`}
      colour='chartRed'
      noData={noData}
    />
  )
}

export default UsersUnder12Card
