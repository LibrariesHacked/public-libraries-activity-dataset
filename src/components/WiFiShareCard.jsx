import React, { useEffect, useState } from 'react'

import WifiTetheringRoundedIcon from '@mui/icons-material/WifiTetheringRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { getActiveServices } from '../models/service'
import { filterByMonthRange } from '../helpers/periods'
import { getRecordsQualityWarning } from '../helpers/dataQuality'
import * as computersModel from '../models/computers'
import * as wifiModel from '../models/wifi'

import NumberCard from './NumberCard'

/**
 * Summary KPI card component displaying Wi-Fi sessions as a percentage share
 * of total digital access, along with the ratio relative to desktop computer hours.
 *
 * @returns {JSX.Element} NumberCard configured for Wi-Fi share.
 */
const WiFiShareCard = () => {
  const [
    { filteredServices, services, computers, wifi, monthRange, useEstimates },
    dispatchApplication
  ] = useApplicationState()

  const [share, setShare] = useState(0)
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
        setShare(0)
        setDescription('')
        return
      }

      const totalHours = matchedComputers.reduce(
        (acc, c) => acc + (c.countHours || 0),
        0
      )
      const totalSessions = matchedWifi.reduce(
        (acc, w) => acc + (w.countSessions || 0),
        0
      )
      const total = totalHours + totalSessions

      if (total === 0) {
        setNoData(true)
        setShare(0)
        setDescription('')
        return
      }

      setNoData(false)
      const pct = (totalSessions / total) * 100
      const ratio = totalHours > 0 ? (totalSessions / totalHours).toFixed(1) : '1.0'

      setShare(Math.round(pct))
      setDescription(`${ratio}x desktop computer hours`)
      setWarning(
        getRecordsQualityWarning([...matchedComputers, ...matchedWifi])
      )
    } else {
      const totalHours =
        activeServices?.reduce((sum, s) => sum + (s.computerHours || 0), 0) || 0
      const totalSessions =
        activeServices?.reduce((sum, s) => sum + (s.wifiSessions || 0), 0) || 0
      const total = totalHours + totalSessions

      if (!activeServices?.length || total === 0) {
        setNoData(true)
        setShare(0)
        setDescription('')
        return
      }

      setNoData(false)
      const pct = (totalSessions / total) * 100
      const ratio = totalHours > 0 ? (totalSessions / totalHours).toFixed(1) : '1.0'

      setShare(Math.round(pct))
      setDescription(`${ratio}x desktop computer hours`)
    }
  }, [computers, wifi, services, filteredServices, monthRange, useEstimates])

  return (
    <NumberCard
      title='Wi-Fi share'
      number={`${share}%`}
      description={description}
      icon={WifiTetheringRoundedIcon}
      colour='chartYellow'
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default WiFiShareCard
