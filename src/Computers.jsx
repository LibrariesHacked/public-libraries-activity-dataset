import React, { useEffect, useState } from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import computersMd from './content/computers.md?raw'
import computersWifiMd from './content/computers-wifi.md?raw'
import computersWiFiByServiceMd from './content/computers-wifi-by-service.md?raw'

import { useApplicationState } from './hooks/useApplicationState'

import CardGrid from './components/CardGrid'
import { AppChart } from './components/charts'

import {
  createTimelineChartOptions,
  createServiceBarChartOptions,
  formatServiceLabelsWithNoData
} from './helpers/charts'

import {
  filterByMonthRange,
  filterByPeriods,
  getMonthsInRange
} from './helpers/periods'

import { getActiveServices } from './models/service'
import * as computersModel from './models/computers'
import * as wifiModel from './models/wifi'

const computersWiFiChartOptions = createTimelineChartOptions(
  'Computer usage hours vs WiFi sessions',
  'Computer hours',
  'WiFi sessions'
)

const serviceChartOptions = createServiceBarChartOptions(
  'Computer hours and WiFi sessions by service and format',
  'Count of computer hours and WiFi sessions'
)

const Computers = () => {
  const [
    { filteredServices, services, computers, wifi, monthRange, selectedPeriods },
    dispatchApplication
  ] = useApplicationState()

  const [computersWiFiChart, setComputersWiFiChart] = useState({
    datasets: [],
    labels: []
  })

  const [serviceChart, setServiceChart] = useState({ datasets: [], labels: [] })

  useEffect(() => {
    const getComputers = async () => {
      const computers = await computersModel.getComputers()
      dispatchApplication({ type: 'SetComputers', computers })
    }
    const getWiFi = async () => {
      const wifi = await wifiModel.getWiFi()
      dispatchApplication({ type: 'SetWiFi', wifi })
    }
    if (!computers) getComputers()
    if (!wifi) getWiFi()
  }, [services, computers, wifi, dispatchApplication])

  useEffect(() => {
    if (!computers || !wifi || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeServiceCodes = new Set(activeServices.map(s => s.code))

    const filteredWifi = wifi.filter(m => activeServiceCodes.has(m.serviceCode))
    const filteredComputers = computers.filter(m =>
      activeServiceCodes.has(m.serviceCode)
    )

    const chartComputers = filterByMonthRange(filteredComputers, monthRange)
    const chartWifi = filterByMonthRange(filteredWifi, monthRange)

    const monthLabels = getMonthsInRange(monthRange)

    // Pre-aggregate monthly hours and sessions: month -> sum
    const computerMonthMap = new Map()
    for (let i = 0; i < chartComputers.length; i++) {
      const c = chartComputers[i]
      if (c.countHours) {
        computerMonthMap.set(
          c.month,
          (computerMonthMap.get(c.month) || 0) + c.countHours
        )
      }
    }

    const wifiMonthMap = new Map()
    for (let i = 0; i < chartWifi.length; i++) {
      const w = chartWifi[i]
      if (w.countSessions) {
        wifiMonthMap.set(
          w.month,
          (wifiMonthMap.get(w.month) || 0) + w.countSessions
        )
      }
    }

    const computersWiFiDatasets = [
      {
        label: 'Computer hours',
        data: monthLabels.map(label => computerMonthMap.get(label) || 0)
      },
      {
        label: 'WiFi sessions',
        data: monthLabels.map(label => wifiMonthMap.get(label) || 0)
      }
    ]

    setComputersWiFiChart({
      format: 'Computer Usage Hours vs WiFi Sessions',
      labels: monthLabels,
      datasets: computersWiFiDatasets.map((d, index) => ({
        ...d,
        yAxisID: index === 0 ? 'y' : 'y1'
      }))
    })

    // The service chart is a total computer hours and wifi sessions by service per resident population
    const serviceComputers = filterByPeriods(filteredComputers, selectedPeriods)
    const serviceWifi = filterByPeriods(filteredWifi, selectedPeriods)

    const rawServiceLabels = activeServices.map(s => s.niceName).sort()
    const serviceByNiceName = new Map(activeServices.map(s => [s.niceName, s]))

    // Pre-aggregate service computers and wifi
    const serviceComputersMap = new Map()
    for (let i = 0; i < serviceComputers.length; i++) {
      const c = serviceComputers[i]
      if (c.countHours) {
        serviceComputersMap.set(
          c.serviceCode,
          (serviceComputersMap.get(c.serviceCode) || 0) + c.countHours
        )
      }
    }

    const serviceWifiMap = new Map()
    for (let i = 0; i < serviceWifi.length; i++) {
      const w = serviceWifi[i]
      if (w.countSessions) {
        serviceWifiMap.set(
          w.serviceCode,
          (serviceWifiMap.get(w.serviceCode) || 0) + w.countSessions
        )
      }
    }

    const serviceDatasets = [
      {
        label: 'Computer hours',
        data: rawServiceLabels.map(serviceLabel => {
          const service = serviceByNiceName.get(serviceLabel)
          return service ? serviceComputersMap.get(service.code) || 0 : 0
        })
      },
      {
        label: 'WiFi sessions',
        data: rawServiceLabels.map(serviceLabel => {
          const service = serviceByNiceName.get(serviceLabel)
          return service ? serviceWifiMap.get(service.code) || 0 : 0
        })
      }
    ]

    const serviceLabels = formatServiceLabelsWithNoData(
      rawServiceLabels,
      serviceByNiceName,
      s => s?.computerHours || s?.wifiSessions
    )

    setServiceChart({
      labels: serviceLabels,
      datasets: serviceDatasets
    })
  }, [
    filteredServices,
    services,
    computers,
    wifi,
    monthRange,
    selectedPeriods
  ])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Computers and WiFi
      </Typography>
      <CardGrid />
      <Markdown>{computersMd}</Markdown>
      <Typography variant='h5' gutterBottom>
        Computer hours and WiFi sessions over time
      </Typography>
      <Markdown>{computersWifiMd}</Markdown>
      <AppChart
        type='line'
        options={computersWiFiChartOptions}
        data={computersWiFiChart}
      />
      <Typography variant='h5' gutterBottom>
        Computer hours and WiFi sessions by service
      </Typography>
      <Markdown>{computersWiFiByServiceMd}</Markdown>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />
    </Box>
  )
}

export default Computers
