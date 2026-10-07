import React, { useEffect, useMemo, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'
import { resolvePeriodComparison } from '../helpers/periods'
import { getActiveServices } from '../models/service'
import { getUsersPenetrationPeriodChange } from '../models/users'
import { getRecordsQualityWarning } from '../helpers/dataQuality'

import NumberCard from './NumberCard'

/**
 * Generic KPI card component for age-demographic active users ('Under 12', '12-17', 'Adult'),
 * displaying annual snapshot user counts, population penetration percentage, period changes,
 * and data quality warning status.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.title - Card title displayed in header.
 * @param {string} props.colour - Palette colour key for card styling.
 * @param {string} props.ageGroup - Age category identifier ('Under 12', '12-17', or 'Adult').
 * @param {Function} props.populationFn - Function returning the resident population for this demographic across services.
 * @param {string} props.descLabel - Context label for the subtitle percentage (e.g. 'residents aged 12-17').
 * @param {React.ElementType} [props.icon] - Optional icon displayed next to the description.
 * @returns {JSX.Element} Rendered NumberCard component.
 */
const UsersAgeGroupCard = ({
  title,
  colour,
  ageGroup,
  populationFn,
  descLabel,
  icon
}) => {
  const [
    { filteredServices, services, users, periods, selectedPeriods, snapshotPeriod, useEstimates }
  ] = useApplicationState()

  const [usersCount, setUsersCount] = useState(0)
  const [percentageUsers, setPercentageUsers] = useState(0)
  const [usersChange, setUsersChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const comparison = useMemo(
    () => resolvePeriodComparison(selectedPeriods, periods),
    [selectedPeriods, periods]
  )

  useEffect(() => {
    if (!users || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    // Active users are a yearly snapshot so they are not summed across years.
    const snapshotUsers = snapshotPeriod
      ? users.filter(u => u.period === snapshotPeriod)
      : users

    const groupUserServices = activeServices?.filter(service =>
      snapshotUsers.some(
        u => u.ageGroup === ageGroup && u.serviceCode === service.code
      )
    )

    if (!groupUserServices || groupUserServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const matchedUsers = snapshotUsers.filter(
      u =>
        u.ageGroup === ageGroup &&
        (filteredServices.length === 0 ||
          filteredServices.includes(u.serviceCode))
    )

    const totalGroupUsers = matchedUsers.reduce(
      (sum, user) => sum + (user.countUsers || 0),
      0
    )

    const totalGroupPopulation = populationFn(groupUserServices) || 0

    const percentage =
      totalGroupPopulation > 0
        ? (totalGroupUsers / totalGroupPopulation) * 100
        : 0

    setUsersCount(totalGroupUsers)
    setPercentageUsers(percentage)

    if (comparison && users && services) {
      setUsersChange(
        getUsersPenetrationPeriodChange(
          users,
          services,
          ageGroup,
          comparison.baselinePeriod,
          comparison.targetPeriod,
          groupUserServices?.map(service => service.code)
        )
      )
    } else {
      setUsersChange(null)
    }

    setWarning(getRecordsQualityWarning(matchedUsers))
  }, [
    services,
    filteredServices,
    users,
    snapshotPeriod,
    comparison,
    useEstimates,
    ageGroup,
    populationFn
  ])

  return (
    <NumberCard
      title={title}
      number={formatCompactNumber(usersCount)}
      description={`${Math.round(percentageUsers)}% of ${descLabel}`}
      icon={icon}
      change={usersChange}
      changeDescription={comparison?.changeDescription || ''}
      changeUnit='percentage points'
      colour={colour}
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default UsersAgeGroupCard
