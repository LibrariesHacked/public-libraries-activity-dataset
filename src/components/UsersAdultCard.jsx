import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import {
  getActiveServices,
  getServicesAdultPopulation
} from '../models/service'

import NumberCard from './NumberCard'

const UsersAdultCard = () => {
  const [{ filteredServices, services, users }] = useApplicationState()

  const [usersCount, setUsersCount] = useState(0)
  const [percentageUsers, setPercentageUsers] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    if (!users || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const adultUserServices = activeServices?.filter(
      service =>
        users.filter(
          u => u.ageGroup === 'Adult' && u.serviceCode === service.code
        ).length > 0
    )

    if (!adultUserServices || adultUserServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalAdultUsers = users
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
  }, [services, filteredServices, users])

  return (
    <NumberCard
      title='Active adult users'
      number={formatCompactNumber(usersCount)}
      description={`${Math.round(percentageUsers)}% of adult residents`}
      colour='chartBlue'
      noData={noData}
    />
  )
}

export default UsersAdultCard
