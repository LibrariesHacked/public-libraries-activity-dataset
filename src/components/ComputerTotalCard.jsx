import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { getActiveServices } from '../models/service'

import { formatCompactNumber } from '../helpers/numbers'

import NumberCard from './NumberCard'

const ComputerTotalCard = () => {
  const [{ filteredServices, services, selectedPeriods }] =
    useApplicationState()

  const [computerHoursCount, setComputerHoursCount] = useState(0)
  const [computerHoursPerDay, setComputerHoursPerDay] = useState(0)
  const [noData, setNoData] = useState(false)

  // Computer hours accumulate across the selected years, so rates are per year.
  const yearCount = selectedPeriods?.length || 1

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)

    const computerServices = activeServices?.filter(service =>
      Number.isFinite(service.computerHours)
    )

    if (!computerServices || computerServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalComputerHours =
      computerServices?.reduce(
        (acc, service) => acc + (service.computerHours || 0),
        0
      ) || 0

    setComputerHoursCount(totalComputerHours)
    setComputerHoursPerDay(totalComputerHours / (365 * yearCount))
  }, [services, filteredServices, yearCount])

  return (
    <NumberCard
      title='Computer hours'
      number={formatCompactNumber(computerHoursCount)}
      description={`${formatCompactNumber(
        computerHoursPerDay
      )} computer hours per day`}
      colour='chartBlue'
      noData={noData}
    />
  )
}

export default ComputerTotalCard
