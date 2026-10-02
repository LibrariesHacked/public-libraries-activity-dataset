import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices } from '../models/service'
import { filterByMonthRange } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as loansModel from '../models/loans'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying digital loans (e-books and e-audiobooks)
 * across active library services, along with their percentage share of total loans.
 *
 * @returns {JSX.Element} NumberCard configured for digital loans.
 */
const LoansDigitalCard = () => {
  const [
    { filteredServices, services, loans, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [count, setCount] = useState(0)
  const [description, setDescription] = useState('')
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  useEffect(() => {
    if (!loans) {
      loansModel.getLoans().then(data => {
        dispatchApplication({ type: 'SetLoans', loans: data })
      })
    }
  }, [loans, dispatchApplication])

  useEffect(() => {
    if (!loans || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeCodes = new Set((activeServices || []).map(s => s.code))

    const rangeLoans = filterByMonthRange(loans, monthRange)
    const matched = rangeLoans.filter(
      l =>
        (!filteredServices.length || filteredServices.includes(l.serviceCode)) &&
        activeCodes.has(l.serviceCode)
    )

    if (!matched.length) {
      setNoData(true)
      setCount(0)
      setDescription('')
      return
    }

    setNoData(false)
    const totalAllLoans = matched.reduce((acc, l) => acc + (l.countLoans || 0), 0)

    const digitalRecords = matched.filter(
      l => l.format === 'Ebook' || l.format === 'Eaudio'
    )
    const totalDigital = digitalRecords.reduce(
      (acc, l) => acc + (l.countLoans || 0),
      0
    )

    setCount(totalDigital)

    const pct = totalAllLoans > 0 ? (totalDigital / totalAllLoans) * 100 : 0
    setDescription(`${Math.round(pct)}% of all loans`)
    setWarning(getRecordsQualityWarning(digitalRecords))
  }, [loans, services, filteredServices, monthRange, useEstimates])

  return (
    <NumberCard
      title='Digital loans'
      number={formatCompactNumber(count)}
      description={description}
      colour='chartOrange'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default LoansDigitalCard
