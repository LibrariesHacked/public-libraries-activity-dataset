import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices, getServicesPopulation } from '../models/service'
import { getServiceQualityWarning } from '../helpers/dataQuality'

import NumberCard from './NumberCard'

/**
 * Generic KPI card component that aggregates a specific activity metric across active library services,
 * calculates secondary descriptors and period-over-period changes, monitors data quality flags,
 * and renders a styled NumberCard.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.metric - The property name on the Service model to aggregate (e.g. 'loans', 'visits').
 * @param {string} props.title - Card title displayed in the header.
 * @param {string} props.colour - Theme palette colour key for styling the card.
 * @param {Function} [props.formatDescription] - Callback returning a human-readable subtitle string given summary context.
 * @param {Function} [props.filterServices] - Optional custom filter callback to restrict which services are included.
 * @param {Function} [props.computeChange] - Optional callback computing the percentage change between periods.
 * @param {string} [props.changeDescription] - Context label for the change value (e.g. 'since 2022/23').
 * @returns {JSX.Element} Rendered NumberCard component.
 */
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
