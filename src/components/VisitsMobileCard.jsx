import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as visitsModel from '../models/visits'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying visits to mobile library vehicles,
 * along with their share of total library footfall.
 *
 * @returns {JSX.Element} NumberCard configured for mobile library visits.
 */
const VisitsMobileCard = () => {
  const [
    { filteredServices, services, visits, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [count, setCount] = useState(0)
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

    const rangeVisits = filterByMonthRange(visits, monthRange)
    const matched = rangeVisits.filter(
      v =>
        (!filteredServices.length || filteredServices.includes(v.serviceCode)) &&
        activeCodes.has(v.serviceCode)
    )

    if (!matched.length) {
      setNoData(true)
      setCount(0)
      setDescription('')
      return
    }

    setNoData(false)
    const totalAllVisits = matched.reduce((acc, v) => acc + (v.countVisits || 0), 0)

    const mobileRecords = matched.filter(v => v.location === 'Mobile library')
    const totalMobile = mobileRecords.reduce(
      (acc, v) => acc + (v.countVisits || 0),
      0
    )

    setCount(totalMobile)

    const pct = totalAllVisits > 0 ? (totalMobile / totalAllVisits) * 100 : 0
    const formattedPct =
      pct > 0 && pct < 1 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`
    setDescription(`${formattedPct} of total visits`)
    setWarning(getRecordsQualityWarning(mobileRecords))
  }, [visits, services, filteredServices, monthRange, useEstimates])

  return (
    <NumberCard
      title='Mobile library visits'
      number={formatCompactNumber(count)}
      description={description}
      colour='chartPurple'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default VisitsMobileCard
