import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange, getMonthsInRange } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as visitsModel from '../models/visits'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying average monthly library visits,
 * along with average visits logged per day.
 *
 * @returns {JSX.Element} NumberCard configured for monthly library visit pace.
 */
const VisitsMonthlyPaceCard = () => {
  const [
    { filteredServices, services, visits, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [monthlyAverage, setMonthlyAverage] = useState(0)
  const [description, setDescription] = useState('')
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  useEffect(() => {
    if (!visits) {
      visitsModel.getVisits().then(data => {
        dispatchApplication({ type: 'SetVisits', visits: data })
      })
    }
  }, [visits, dispatchApplication])

  useEffect(() => {
    if (!visits || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeCodes = new Set((activeServices || []).map(s => s.code))

    const months = getMonthsInRange(monthRange)
    const monthCount = months.length || 12
    const yearCount = monthCount / 12

    const rangeVisits = filterByMonthRange(visits, monthRange)
    const matched = rangeVisits.filter(
      v =>
        (!filteredServices.length || filteredServices.includes(v.serviceCode)) &&
        activeCodes.has(v.serviceCode)
    )

    if (!matched.length) {
      setNoData(true)
      setMonthlyAverage(0)
      setDescription('')
      return
    }

    setNoData(false)
    const totalAllVisits = matched.reduce((acc, v) => acc + (v.countVisits || 0), 0)
    const avgMonthly = Math.round(totalAllVisits / monthCount)
    const avgDaily = Math.round(totalAllVisits / (365 * yearCount))

    setMonthlyAverage(avgMonthly)
    setDescription(`${formatCompactNumber(avgDaily)} visits per day`)
    setWarning(getRecordsQualityWarning(matched))
  }, [visits, services, filteredServices, monthRange, useEstimates])

  return (
    <NumberCard
      title='Monthly visits'
      number={formatCompactNumber(monthlyAverage)}
      description={description}
      colour='chartGreen'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default VisitsMonthlyPaceCard
