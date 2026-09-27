import React, { useCallback } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatPeriod } from '../helpers/periods'
import { getServicePeriodChange } from '../models/service'

import MetricTotalCard from './MetricTotalCard'

/**
 * Summary KPI card component displaying total active library users across active library services,
 * percentage of total resident population, and percentage change since the earliest selected financial year.
 *
 * @returns {JSX.Element} MetricTotalCard configured for total active users.
 */
const UsersTotalCard = () => {
  const [{ serviceRecords, selectedPeriods }] = useApplicationState()

  const earliestPeriod = selectedPeriods?.[0]
  const latestPeriod = selectedPeriods?.[selectedPeriods?.length - 1]

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
    ({ validServices, useEstimates }) =>
      getServicePeriodChange(
        serviceRecords,
        'users',
        earliestPeriod,
        latestPeriod,
        validServices?.map(service => service.code),
        useEstimates
      ),
    [serviceRecords, earliestPeriod, latestPeriod]
  )

  return (
    <MetricTotalCard
      metric='users'
      title='Active users'
      colour='chartPurple'
      formatDescription={formatDescription}
      computeChange={computeChange}
      changeDescription={
        earliestPeriod ? `since ${formatPeriod(earliestPeriod)}` : ''
      }
    />
  )
}

export default UsersTotalCard
