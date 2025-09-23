import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { getActiveServices } from '../models/service'

import { formatCompactNumber } from '../helpers/numbers'

import NumberCard from './NumberCard'

const ComputerTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [computerHoursCount, setComputerHoursCount] = useState(0)
  const [computerHoursPerDay, setComputerHoursPerDay] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)

    const computerServices = activeServices?.filter(service =>
      Number.isInteger(service.computerHours)
    )

    if (!computerServices || computerServices.length === 0) {
      setNoData(true)
    }

    const totalComputerHours =
      computerServices?.reduce(
        (acc, service) => acc + (service.computerHours || 0),
        0
      ) || 0

    setComputerHoursCount(totalComputerHours)
    setComputerHoursPerDay(totalComputerHours / 365)
  }, [services, filteredServices])

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
