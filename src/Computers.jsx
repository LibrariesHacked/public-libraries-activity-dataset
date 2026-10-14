import React, { useEffect, useState } from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import computersMd from './content/computers.md?raw'
import computersWifiMd from './content/computers-wifi.md?raw'
import computersWiFiByServiceMd from './content/computers-wifi-by-service.md?raw'
import computerInventoryMd from './content/computer-inventory.md?raw'

import { useApplicationState } from './hooks/useApplicationState'

import CardGrid from './components/CardGrid'
import ComputerInventoryInsights from './components/ComputerInventoryInsights'
import DatasetDataGrid from './components/DatasetDataGrid'
import { AppChart } from './components/charts'

import {
  createTimelineChartOptions,
  createServiceBarChartOptions,
  formatServiceLabelsWithNoData,
  sortServicesByMetric
} from './helpers/charts'
import {
  getComparisonChart,
  getReportingCoverageByGroup,
  perThousandReportingPersonYears,
  perThousandReportingResidents
} from './helpers/reportingRates'

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
const USAGE_MEASURES = [
  { label: 'Computer hours', title: 'Computer hours', unit: 'hours' },
  { label: 'WiFi sessions', title: 'Wi-Fi sessions', unit: 'sessions' }
]

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
    const monthlyComputerCoverage = getReportingCoverageByGroup(
      chartComputers,
      activeServices,
      'countHours',
      record => record.month
    )
    const monthlyWifiCoverage = getReportingCoverageByGroup(
      chartWifi,
      activeServices,
      'countSessions',
      record => record.month
    )

    // Pre-aggregate monthly hours and sessions: month -> sum
    const computerMonthMap = new Map()
    for (let i = 0; i < chartComputers.length; i++) {
      const c = chartComputers[i]
      if (Number.isFinite(c.countHours)) {
        computerMonthMap.set(
          c.month,
          (computerMonthMap.get(c.month) || 0) + c.countHours
        )
      }
    }

    const wifiMonthMap = new Map()
    for (let i = 0; i < chartWifi.length; i++) {
      const w = chartWifi[i]
      if (Number.isFinite(w.countSessions)) {
        wifiMonthMap.set(
          w.month,
          (wifiMonthMap.get(w.month) || 0) + w.countSessions
        )
      }
    }

    const computersWiFiDatasets = [
      {
        label: 'Computer hours',
        data: monthLabels.map(label => {
          const total = computerMonthMap.get(label)
          return total == null
            ? null
            : perThousandReportingResidents(total, monthlyComputerCoverage.get(label))
        })
      },
      {
        label: 'WiFi sessions',
        data: monthLabels.map(label => {
          const total = wifiMonthMap.get(label)
          return total == null
            ? null
            : perThousandReportingResidents(total, monthlyWifiCoverage.get(label))
        })
      }
    ]

    setComputersWiFiChart({
      format: 'Computer Usage Hours vs WiFi Sessions',
      labels: monthLabels,
      datasets: computersWiFiDatasets
    })

    // Compare each measure using the population covered by its reporting services.
    const serviceComputers = filterByMonthRange(filteredComputers, monthRange)
    const serviceWifi = filterByMonthRange(filteredWifi, monthRange)
    const serviceComputerCoverage = getReportingCoverageByGroup(
      serviceComputers,
      activeServices,
      'countHours',
      record => record.serviceCode
    )
    const serviceWifiCoverage = getReportingCoverageByGroup(
      serviceWifi,
      activeServices,
      'countSessions',
      record => record.serviceCode
    )
    const serviceByCode = new Map(activeServices.map(service => [service.code, service]))
    const regionComputerCoverage = getReportingCoverageByGroup(
      serviceComputers,
      activeServices,
      'countHours',
      record => serviceByCode.get(record.serviceCode)?.region
    )
    const regionWifiCoverage = getReportingCoverageByGroup(
      serviceWifi,
      activeServices,
      'countSessions',
      record => serviceByCode.get(record.serviceCode)?.region
    )

    // Pre-aggregate service computers and wifi
    const serviceComputersMap = new Map()
    for (let i = 0; i < serviceComputers.length; i++) {
      const c = serviceComputers[i]
      if (Number.isFinite(c.countHours)) {
        serviceComputersMap.set(
          c.serviceCode,
          (serviceComputersMap.get(c.serviceCode) || 0) + c.countHours
        )
      }
    }

    const serviceWifiMap = new Map()
    for (let i = 0; i < serviceWifi.length; i++) {
      const w = serviceWifi[i]
      if (Number.isFinite(w.countSessions)) {
        serviceWifiMap.set(
          w.serviceCode,
          (serviceWifiMap.get(w.serviceCode) || 0) + w.countSessions
        )
      }
    }

    const entities = isRegionMode
      ? getRegionAggregates(services, selectedRegions)
      : activeServices

    const getCoverage = (entity, coverageMap) => {
      const key = isRegionMode ? (entity.region || entity.niceName) : entity.code
      return coverageMap.get(key)
    }

    const getTotal = (entity, countMap) => {
      const codes = isRegionMode ? entity.serviceCodes : [entity.code]
      let sum = 0
      for (const code of codes) {
        sum += countMap.get(code) || 0
      }
      return sum
    }

    const getEntityTotalHoursSessions = entity => {
      if (!entity?.code && !entity?.serviceCodes) return 0
      const compTotal = getTotal(entity, serviceComputersMap)
      const compCov = getCoverage(entity, isRegionMode ? regionComputerCoverage : serviceComputerCoverage)
      return perThousandReportingPersonYears(compTotal, compCov) || 0
    }

    const sortedEntities = sortServicesByMetric(
      entities,
      getEntityTotalHoursSessions,
      e => e?.computerHours || e?.wifiSessions
    )

    const rawLabels = sortedEntities.map(e => e.niceName)
    const entityByNiceName = new Map(sortedEntities.map(e => [e.niceName, e]))

    const serviceDatasets = [
      {
        label: 'Computer hours',
        data: rawLabels.map(label => {
          const entity = entityByNiceName.get(label)
          if (!entity) return null
          const total = getTotal(entity, serviceComputersMap)
          const cov = getCoverage(entity, isRegionMode ? regionComputerCoverage : serviceComputerCoverage)
          const rate = perThousandReportingPersonYears(total, cov)
          return rate == null ? null : parseFloat(rate.toFixed(2))
        })
      },
      {
        label: 'WiFi sessions',
        data: rawLabels.map(label => {
          const entity = entityByNiceName.get(label)
          if (!entity) return null
          const total = getTotal(entity, serviceWifiMap)
          const cov = getCoverage(entity, isRegionMode ? regionWifiCoverage : serviceWifiCoverage)
          const rate = perThousandReportingPersonYears(total, cov)
          return rate == null ? null : parseFloat(rate.toFixed(2))
        })
      }
    ]

    const labels = formatServiceLabelsWithNoData(
      rawLabels,
      entityByNiceName,
      e => e?.computerHours || e?.wifiSessions
    )

    setServiceChart({
      labels,
      datasets: serviceDatasets
    })
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
        Computers and Wi-Fi
      </Typography>
      <CardGrid />
      <ComputerInventoryInsights>
        <Box sx={{ my: 2 }}>
          <Markdown>{computersMd}</Markdown>
        </Box>

        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
            Computer use and Wi-Fi over time
          </Typography>
          <Markdown>{computersWifiMd}</Markdown>
        </Box>
        {USAGE_MEASURES.map(({ label, title, unit }) => (
          <AppChart
            key={label}
            type='line'
            options={createTimelineChartOptions(`${title} over time`, `${unit} per 1,000 reporting residents per month`)}
            data={{ ...computersWiFiChart, datasets: computersWiFiChart.datasets.filter(dataset => dataset.label === label) }}
          />
        ))}

        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
            {isRegionMode
              ? 'Computer hours and Wi-Fi sessions by region'
              : 'Computer hours and Wi-Fi sessions by service'}
          </Typography>
          <Markdown>{computersWiFiByServiceMd}</Markdown>
        </Box>
        {USAGE_MEASURES.map(({ label, title, unit }) => (
          <AppChart
            key={label}
            type='service'
            data={getComparisonChart(serviceChart, [label])}
            options={createServiceBarChartOptions(
              `${title} by ${isRegionMode ? 'region' : 'service'}`,
              `Annualised ${unit} per 1,000 reporting residents`,
              { showLegend: false }
            )}
          />
        ))}
      </ComputerInventoryInsights>

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

      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Computer and device inventory
        </Typography>
        <Markdown>{computerInventoryMd}</Markdown>
        <DatasetDataGrid datasetId='computerInventory' />
      </Box>
    </Box>
  )
}

export default Computers
