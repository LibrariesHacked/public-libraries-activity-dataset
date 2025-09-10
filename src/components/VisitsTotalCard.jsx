import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

import NumberCard from './NumberCard'

const VisitsTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [visitsCount, setVisitsCount] = useState(0)
  const [visitsPerCapita, setVisitsPerCapita] = useState(0)

  useEffect(() => {
    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    // The visits count is the sum of the visits integer from each service object
    const totalVisits =
      activeServices?.reduce(
        (acc, service) => acc + (service.visits || 0),
        0
      ) || 0

    // The population is the totalPopulation on the service object
    const totalPopulation =
      activeServices?.reduce(
        (acc, service) => acc + (service.totalPopulation || 0),
        0
      ) || 0

    const visitsPerCapita =
      totalPopulation > 0 ? Math.round(totalVisits / totalPopulation) : 0

    setVisitsCount(totalVisits)
    setVisitsPerCapita(visitsPerCapita)
  }, [services, filteredServices])

  return (
    <NumberCard
      title='Visits'
      number={formatCompactNumber(visitsCount)}
      description={`${formatCompactNumber(visitsPerCapita)} per resident`}
    />
  )
}

export default VisitsTotalCard
