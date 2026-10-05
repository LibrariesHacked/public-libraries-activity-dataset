import React, { useCallback, useEffect } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'
import { getUsersPenetrationPeriodChange } from '../models/users'
import * as usersModel from '../models/users'
import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total active library users across active library services,
 * percentage of total resident population, and percentage point change since the earliest selected financial year.
 *
 * @returns {JSX.Element} MetricTotalCard configured for total active users.
 */
const UsersTotalCard = () => {
  const [{ users, services }, dispatchApplication] = useApplicationState()

  useEffect(() => {
    if (!users) {
      usersModel.getUsers().then(data => {
        dispatchApplication({ type: 'SetUsers', users: data })
      })
    }
  }, [users, dispatchApplication])

  const formatDescription = useCallback(({ total, validServices }) => {
    const totalPopulation =
      validServices?.reduce(
        (acc, service) =>
          acc +
          (service.populationUnder12 || 0) +
          (service.population12To17 || 0) +
          (service.populationAdult || 0),
        0
      ) || 0

    const percentageUsers =
      totalPopulation > 0 ? (total / totalPopulation) * 100 : 0

    return `${Math.round(percentageUsers)}% of residents`
  }, [])

  const computeChange = useCallback(
    ({ activeServices, comparison }) => {
      if (!comparison || !users || !services) return null
      return getUsersPenetrationPeriodChange(
        users,
        services,
        null,
        comparison.baselinePeriod,
        comparison.targetPeriod,
        activeServices?.map(s => s.code)
      )
    },
    [users, services]
  )

  return (
    <MetricTotalCard
      metric='users'
      title='Active users'
      colour='chartPurple'
      formatDescription={formatDescription}
      computeChange={computeChange}
      changeUnit='percentage points'
    />
  )
}

export default UsersTotalCard
