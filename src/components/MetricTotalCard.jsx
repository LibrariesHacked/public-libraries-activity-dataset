import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices, getServicesPopulation } from '../models/service'
import { getServiceQualityWarning } from '../helpers/dataQuality'

import NumberCard from './NumberCard'

const MetricTotalCard = ({
  metric,
  title,
  colour,
  formatDescription,
  filterServices,
  computeChange,
  changeDescription
}) => {
  const [{ filteredServices, services, selectedPeriods, useEstimates }] =
    useApplicationState()

  const [count, setCount] = useState(0)
  const [description, setDescription] = useState('')
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const yearCount = selectedPeriods?.length || 1

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)

    const validServices = filterServices
      ? filterServices(activeServices)
      : activeServices?.filter(s => Number.isInteger(s[metric]))

    if (!validServices || validServices.length === 0) {
      setNoData(true)
    } else {
      setNoData(false)
    }

    const total =
      validServices?.reduce((acc, s) => acc + (s[metric] || 0), 0) || 0
    const totalPopulation = getServicesPopulation(validServices)

    setCount(total)

    if (formatDescription) {
      setDescription(
        formatDescription({
          total,
          validServices,
          activeServices,
          totalPopulation,
          yearCount
        })
      )
    }

    if (computeChange) {
      setChange(computeChange({ validServices, activeServices, useEstimates }))
    }

    setWarning(getServiceQualityWarning(activeServices, metric))
  }, [
    services,
    filteredServices,
    yearCount,
    useEstimates,
    metric,
    formatDescription,
    filterServices,
    computeChange
  ])

  return (
    <NumberCard
      title={title}
      number={formatCompactNumber(count)}
      description={description}
      change={change}
      changeDescription={changeDescription}
      colour={colour}
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default MetricTotalCard
