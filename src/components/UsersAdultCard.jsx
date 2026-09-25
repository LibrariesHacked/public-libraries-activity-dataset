import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import { formatPeriod } from '../helpers/periods'

import {
  getActiveServices,
  getServicesAdultPopulation
} from '../models/service'

import { getUsersPeriodChange } from '../models/users'

import NumberCard from './NumberCard'

const UsersAdultCard = () => {
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

    const adultUserServices = activeServices?.filter(
      service =>
        snapshotUsers.filter(
          u => u.ageGroup === 'Adult' && u.serviceCode === service.code
        ).length > 0
    )

    if (!adultUserServices || adultUserServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalAdultUsers = snapshotUsers
      .filter(
        u =>
          u.ageGroup === 'Adult' &&
          (filteredServices.length === 0 ||
            filteredServices.includes(u.serviceCode))
      )
      .reduce((sum, user) => sum + user.countUsers, 0)

    const totalAdultPopulation =
      getServicesAdultPopulation(adultUserServices) || 0

    const percentageUsers =
      totalAdultPopulation > 0
        ? (totalAdultUsers / totalAdultPopulation) * 100
        : 0

    setUsersCount(totalAdultUsers)
    setPercentageUsers(percentageUsers)

    setUsersChange(
      getUsersPeriodChange(
        users,
        'Adult',
        earliestPeriod,
        snapshotPeriod,
        adultUserServices?.map(service => service.code)
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
      title='Active adult users'
      number={formatCompactNumber(usersCount)}
      description={`${Math.round(percentageUsers)}% of adult residents`}
      change={usersChange}
      changeDescription={`since ${
        earliestPeriod ? formatPeriod(earliestPeriod) : ''
      }`}
      colour='chartBlue'
      noData={noData}
    />
  )
}

export default UsersAdultCard
