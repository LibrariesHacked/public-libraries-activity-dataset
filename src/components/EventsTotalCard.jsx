import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { getActiveServices } from '../models/service'

import { formatCompactNumber } from '../helpers/numbers'

import NumberCard from './NumberCard'

const EventsTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [eventsCount, setEventsCount] = useState(0)
  const [eventsPerDay, setEventsPerDay] = useState(0)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)

    const eventServices = activeServices?.filter(service =>
      Number.isInteger(service.events)
    )

    if (!eventServices || eventServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const totalEvents =
      eventServices?.reduce(
        (acc, service) => acc + (service.events || 0),
        0
      ) || 0

    setEventsCount(totalEvents)
    setEventsPerDay(totalEvents / 365)
  }, [services, filteredServices])

  return (
    <NumberCard
      title='Events'
      number={formatCompactNumber(eventsCount)}
      description={`${formatCompactNumber(eventsPerDay)} events per day`}
      colour='chartOrange'
      noData={noData}
    />
  )
}

export default EventsTotalCard
