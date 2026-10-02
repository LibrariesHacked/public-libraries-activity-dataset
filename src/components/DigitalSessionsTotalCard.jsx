import React, { useEffect, useState } from 'react'

import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices, getServicesPopulation } from '../models/service'
import { filterByMonthRange, getMonthsInRange } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as computersModel from '../models/computers'
import * as wifiModel from '../models/wifi'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying combined digital access activity
 * (public computer access hours plus public Wi-Fi sessions), along with
 * annual interactions per resident.
 *
 * @returns {JSX.Element} NumberCard configured for total digital access.
 */
const DigitalSessionsTotalCard = () => {
  const [
    { filteredServices, services, computers, wifi, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [totalDigital, setTotalDigital] = useState(0)
  const [description, setDescription] = useState('')
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  useEffect(() => {
    if (!computers) {
      computersModel.getComputers().then(data => {
        dispatchApplication({ type: 'SetComputers', computers: data })
      })
    }
    if (!wifi) {
      wifiModel.getWiFi().then(data => {
        dispatchApplication({ type: 'SetWiFi', wifi: data })
      })
    }
  }, [computers, wifi, dispatchApplication])

  useEffect(() => {
    if (!services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeCodes = new Set((activeServices || []).map(s => s.code))

    const months = getMonthsInRange(monthRange)
    const yearCount = (months.length || 12) / 12
    const totalPop = getServicesPopulation(activeServices)

    if (computers && wifi) {
      const rangeComputers = filterByMonthRange(computers, monthRange)
      const matchedComputers = rangeComputers.filter(
        c =>
          (!filteredServices.length || filteredServices.includes(c.serviceCode)) &&
          activeCodes.has(c.serviceCode)
      )

      const rangeWifi = filterByMonthRange(wifi, monthRange)
      const matchedWifi = rangeWifi.filter(
        w =>
          (!filteredServices.length || filteredServices.includes(w.serviceCode)) &&
          activeCodes.has(w.serviceCode)
      )

      if (!matchedComputers.length && !matchedWifi.length) {
        setNoData(true)
        setTotalDigital(0)
        setDescription('')
        return
      }

      setNoData(false)
      const totalHours = matchedComputers.reduce(
        (acc, c) => acc + (c.countHours || 0),
        0
      )
      const totalSessions = matchedWifi.reduce(
        (acc, w) => acc + (w.countSessions || 0),
        0
      )
      const total = totalHours + totalSessions

      setTotalDigital(total)

      const perCapita =
        totalPop > 0 ? (total / totalPop / yearCount).toFixed(1) : 0

      setDescription(`${perCapita} per resident per year`)
      setWarning(
        getRecordsQualityWarning([...matchedComputers, ...matchedWifi])
      )
    } else {
      // Immediate baseline from loaded service records while detailed datasets fetch
      const totalHours =
        activeServices?.reduce((sum, s) => sum + (s.computerHours || 0), 0) || 0
      const totalSessions =
        activeServices?.reduce((sum, s) => sum + (s.wifiSessions || 0), 0) || 0
      const total = totalHours + totalSessions

      if (!activeServices?.length || total === 0) {
        setNoData(true)
        setTotalDigital(0)
        setDescription('')
        return
      }

      setNoData(false)
      setTotalDigital(total)

      const perCapita =
        totalPop > 0 ? (total / totalPop / yearCount).toFixed(1) : 0
      setDescription(`${perCapita} per resident per year`)
    }
  }, [computers, wifi, services, filteredServices, monthRange, useEstimates])

  return (
    <NumberCard
      title='Total digital access'
      number={formatCompactNumber(totalDigital)}
      description={description}
      icon={DevicesRoundedIcon}
      colour='chartPurple'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default DigitalSessionsTotalCard
