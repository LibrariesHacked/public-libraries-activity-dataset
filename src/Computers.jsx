import React, { useEffect, useMemo, useState } from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import computersMd from './content/computers.md?raw'
import computersWifiMd from './content/computers-wifi.md?raw'
import computersWiFiByServiceMd from './content/computers-wifi-by-service.md?raw'

import { useApplicationState } from './hooks/useApplicationState'

import CardGrid from './components/CardGrid'
import DatasetDataGrid from './components/DatasetDataGrid'
import { AppChart } from './components/charts'

import {
  createTimelineChartOptions,
  createServiceBarChartOptions,
  formatServiceLabelsWithNoData,
  sortServicesByMetric
} from './helpers/charts'

import {
  filterByMonthRange,
  getMonthsInRange
} from './helpers/periods'

import { getActiveServices, getRegionAggregates } from './models/service'
import * as computersModel from './models/computers'
import * as wifiModel from './models/wifi'

/**
 * Chart configuration options for the dual-axis timeline chart comparing computer hours and Wi-Fi sessions over time.
 */
const computersWiFiChartOptions = createTimelineChartOptions(
  'Computer hours and WiFi sessions over time',
  'Computer hours',
  'WiFi sessions'
)

/**
 * Computers and Wi-Fi dashboard page view displaying summary KPI cards,
 * monthly dual-axis usage timelines (computer hours vs Wi-Fi sessions), and authority comparison charts.
 *
 * @returns {JSX.Element} The rendered Computers page view.
 */
const Computers = () => {
  const [
    {
      filteredServices,
      services,
      computers,
      wifi,
      monthRange,
      comparisonMode,
      selectedRegions
    },
    dispatchApplication
  ] = useApplicationState()

  const isRegionMode = comparisonMode === 'regions'

  const serviceChartOptions = useMemo(
    () =>
      createServiceBarChartOptions(
        isRegionMode
          ? 'Computer hours and WiFi sessions by region'
          : 'Computer hours and WiFi sessions by service',
        'Count of hours and sessions'
      ),
    [isRegionMode]
  )

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
    const serviceComputers = filterByMonthRange(filteredComputers, monthRange)
    const serviceWifi = filterByMonthRange(filteredWifi, monthRange)

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

    if (isRegionMode) {
      const regionAggregates = getRegionAggregates(services, selectedRegions)

      const getRegionTotalHoursSessions = region => {
        let total = 0
        for (const sCode of region.serviceCodes) {
          total +=
            (serviceComputersMap.get(sCode) || 0) +
            (serviceWifiMap.get(sCode) || 0)
        }
        return total
      }

      const sortedRegions = sortServicesByMetric(
        regionAggregates,
        getRegionTotalHoursSessions,
        r => r?.computerHours || r?.wifiSessions
      )

      const rawRegionLabels = sortedRegions.map(r => r.niceName)
      const regionByNiceName = new Map(sortedRegions.map(r => [r.niceName, r]))

      const serviceDatasets = [
        {
          label: 'Computer hours',
          data: rawRegionLabels.map(regionLabel => {
            const region = regionByNiceName.get(regionLabel)
            if (!region) return 0
            let total = 0
            for (const sCode of region.serviceCodes) {
              total += serviceComputersMap.get(sCode) || 0
            }
            return total
          })
        },
        {
          label: 'WiFi sessions',
          data: rawRegionLabels.map(regionLabel => {
            const region = regionByNiceName.get(regionLabel)
            if (!region) return 0
            let total = 0
            for (const sCode of region.serviceCodes) {
              total += serviceWifiMap.get(sCode) || 0
            }
            return total
          })
        }
      ]

      const regionLabels = formatServiceLabelsWithNoData(
        rawRegionLabels,
        regionByNiceName,
        r => r?.computerHours || r?.wifiSessions
      )

      setServiceChart({
        labels: regionLabels,
        datasets: serviceDatasets
      })
    } else {
      // ONS: Order categories in bar charts by value descending (services with no data at bottom)
      const getServiceTotalHoursSessions = service => {
        if (!service?.code) return 0
        return (
          (serviceComputersMap.get(service.code) || 0) +
          (serviceWifiMap.get(service.code) || 0)
        )
      }

      const sortedServices = sortServicesByMetric(
        activeServices,
        getServiceTotalHoursSessions,
        s => s?.computerHours || s?.wifiSessions
      )

      const rawServiceLabels = sortedServices.map(s => s.niceName)
      const serviceByNiceName = new Map(
        sortedServices.map(s => [s.niceName, s])
      )

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
    }
  }, [
    filteredServices,
    services,
    computers,
    wifi,
    monthRange,
    isRegionMode,
    selectedRegions
  ])

  return (
    <Box>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 800, mb: 1.5 }}>
        Computers and WiFi
      </Typography>
      <CardGrid />
      <Box sx={{ my: 2 }}>
        <Markdown>{computersMd}</Markdown>
      </Box>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Computer hours and WiFi sessions over time
        </Typography>
        <Markdown>{computersWifiMd}</Markdown>
      </Box>
      <AppChart
        type='line'
        options={computersWiFiChartOptions}
        data={computersWiFiChart}
      />

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          {isRegionMode ? 'Computer hours and WiFi sessions by region' : 'Computer hours and WiFi sessions by service'}
        </Typography>
        <Markdown>
          {isRegionMode
            ? 'Total public computer usage hours and Wi-Fi sessions across regions.'
            : computersWiFiByServiceMd}
        </Markdown>
      </Box>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />

      <Box sx={{ mt: 5, mb: 4 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Computer usage data
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Monthly public computer terminal and connected device session usage hours across library services.
        </Typography>
        <DatasetDataGrid datasetId='computers' />
      </Box>

      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Wi-Fi sessions data
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Monthly public library wireless Wi-Fi internet login and connection sessions.
        </Typography>
        <DatasetDataGrid datasetId='wifi' />
      </Box>
    </Box>
  )
}

export default Computers
