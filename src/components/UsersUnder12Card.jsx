import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import {
  getActiveServices,
  getServicesUnder12Population
} from '../models/service'

import NumberCard from './NumberCard'

const UsersUnder12Card = () => {
  const [{ filteredServices, services, users }] = useApplicationState()

  const [usersCount, setUsersCount] = useState(0)
  const [percentageUsers, setPercentageUsers] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    if (!users || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const under12UserServices = activeServices?.filter(
      service =>
        users.filter(
          u => u.ageGroup === 'Under 12' && u.serviceCode === service.code
        ).length > 0
    )

    if (!under12UserServices || under12UserServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalUnder12Users = users
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
  }, [services, filteredServices, users])

  return (
    <NumberCard
      title='Active users under 12'
      number={formatCompactNumber(usersCount)}
      description={`${Math.round(percentageUsers)}% of residents under 12`}
      colour='chartRed'
      noData={noData}
    />
  )
}

export default UsersUnder12Card
