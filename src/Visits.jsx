import React, { useEffect, useMemo, useState } from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import visitsMd from './content/visits.md?raw'
import visitsByLocationMd from './content/visits-by-location.md?raw'
import visitsByServiceMd from './content/visits-by-service.md?raw'

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
import * as visitsModel from './models/visits'

/**
 * Chart configuration options for the timeline line chart displaying monthly visits by facility type.
 */
const visitsChartOptions = createTimelineChartOptions(
  'Visits by location type over time'
)

/**
 * In-person library visits dashboard page view displaying summary KPI cards,
 * monthly visits trends by service location type, and per-capita comparisons across authorities.
 *
 * @returns {JSX.Element} The rendered Visits page view.
 */
const Visits = () => {
  const [
    {
      filteredServices,
      services,
      visits,
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
          ? 'Visits per resident population by region'
          : 'Visits per resident population by service',
        'Visits per resident population per year',
        { stacked: true }
      ),
    [isRegionMode]
  )

  const [visitData, setVisitData] = useState(null)
  const [serviceChart, setServiceChart] = useState({ labels: [], datasets: [] })

  useEffect(() => {
    const getVisits = async () => {
      const visits = await visitsModel.getVisits()
      dispatchApplication({ type: 'SetVisits', visits })
    }

    // Trigger download of visit data (if not already done)
    if (!visits) getVisits()
  }, [services, visits, dispatchApplication])

  useEffect(() => {
    if (!visits || !services) return

    const filteredServiceSet = filteredServices?.length
      ? new Set(filteredServices)
      : null

    const filteredVisits = filteredServiceSet
      ? visits.filter(v => filteredServiceSet.has(v.serviceCode))
      : visits

    const locationTypes = [...new Set(visits.map(m => m.location))].sort()

    const chartVisits = filterByMonthRange(filteredVisits, monthRange)
    const labels = getMonthsInRange(monthRange)

    // Pre-aggregate monthly visits: (location, month) -> sum
    const locationMonthMap = new Map()
    for (let i = 0; i < chartVisits.length; i++) {
      const v = chartVisits[i]
      if (v.countVisits) {
        const key = `${v.location}|||${v.month}`
        locationMonthMap.set(
          key,
          (locationMonthMap.get(key) || 0) + v.countVisits
        )
      }
    }

    const newVisitData = {
      labels,
      datasets: locationTypes.map(location => ({
        label: location,
        data: labels.map(month => locationMonthMap.get(`${location}|||${month}`) || 0)
      }))
    }

    setVisitData(newVisitData)

    const serviceVisits = filterByMonthRange(filteredVisits, monthRange)
    const yearCount = (getMonthsInRange(monthRange).length || 12) / 12

    const activeServices = getActiveServices(services, filteredServices)

    // Pre-aggregate service visits: (serviceCode, location) -> sum
    const serviceLocationMap = new Map()
    for (let i = 0; i < serviceVisits.length; i++) {
      const v = serviceVisits[i]
      if (v.countVisits) {
        const key = `${v.serviceCode}|||${v.location}`
        serviceLocationMap.set(
          key,
          (serviceLocationMap.get(key) || 0) + v.countVisits
        )
      }
    }

    if (isRegionMode) {
      const regionAggregates = getRegionAggregates(services, selectedRegions)

      const getRegionTotalVisitsPerCapita = region => {
        if (!region?.totalPopulation) return 0
        let totalVisits = 0
        for (const loc of locationTypes) {
          for (const sCode of region.serviceCodes) {
            totalVisits += serviceLocationMap.get(`${sCode}|||${loc}`) || 0
          }
        }
        return totalVisits / region.totalPopulation / yearCount
      }

      const sortedRegions = sortServicesByMetric(
        regionAggregates,
        getRegionTotalVisitsPerCapita,
        r => r?.visits
      )

      const rawRegionLabels = sortedRegions.map(r => r.niceName)
      const regionByNiceName = new Map(sortedRegions.map(r => [r.niceName, r]))

      const datasets = locationTypes.map(locationType => ({
        label: locationType,
        data: rawRegionLabels.map(regionLabel => {
          const region = regionByNiceName.get(regionLabel)
          if (!region?.totalPopulation) return 0

          let visitCount = 0
          for (const sCode of region.serviceCodes) {
            visitCount += serviceLocationMap.get(`${sCode}|||${locationType}`) || 0
          }
          const visitsPerCapita =
            visitCount / region.totalPopulation / yearCount

          return parseFloat(visitsPerCapita.toFixed(2))
        })
      }))

      const regionLabels = formatServiceLabelsWithNoData(
        rawRegionLabels,
        regionByNiceName,
        r => r?.visits
      )

      setServiceChart({ labels: regionLabels, datasets })
    } else {
      // ONS: Order categories in bar charts by value descending (services with no data at bottom)
      const getServiceTotalVisitsPerCapita = service => {
        if (!service?.totalPopulation) return 0
        let totalVisits = 0
        for (const loc of locationTypes) {
          totalVisits += serviceLocationMap.get(`${service.code}|||${loc}`) || 0
        }
        return totalVisits / service.totalPopulation / yearCount
      }

      const sortedServices = sortServicesByMetric(
        activeServices,
        getServiceTotalVisitsPerCapita,
        s => s?.visits
      )

      const rawServiceLabels = sortedServices.map(s => s.niceName)
      const serviceByNiceName = new Map(
        sortedServices.map(s => [s.niceName, s])
      )

      const datasets = locationTypes.map(locationType => ({
        label: locationType,
        data: rawServiceLabels.map(serviceLabel => {
          const service = serviceByNiceName.get(serviceLabel)
          const visitCount = service
            ? serviceLocationMap.get(`${service.code}|||${locationType}`) || 0
            : 0

          const visitsPerCapita = service?.totalPopulation
            ? visitCount / service.totalPopulation / yearCount
            : 0
          return parseFloat(visitsPerCapita.toFixed(2))
        })
      }))

      const serviceLabels = formatServiceLabelsWithNoData(
        rawServiceLabels,
        serviceByNiceName,
        s => s?.visits
      )

      setServiceChart({ labels: serviceLabels, datasets })
    }
  }, [
    visits,
    filteredServices,
    services,
    monthRange,
    isRegionMode,
    selectedRegions
  ])

  return (
    <Box>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 800, mb: 1.5 }}>
        Visits
      </Typography>
      <CardGrid />
      <Box sx={{ my: 2 }}>
        <Markdown>{visitsMd}</Markdown>
      </Box>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Visits by location
        </Typography>
        <Markdown>{visitsByLocationMd}</Markdown>
      </Box>
      <AppChart type='line' options={visitsChartOptions} data={visitData} />

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          {isRegionMode ? 'Visit types by region' : 'Visit types by service'}
        </Typography>
        <Markdown>
          {isRegionMode
            ? 'Average annual visits per resident across regions, broken down by location type.'
            : visitsByServiceMd}
        </Markdown>
      </Box>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />

      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Visits data
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Full dataset of monthly in-person library visits, reporting anomalies, and corrected figures.
        </Typography>
        <DatasetDataGrid datasetId='visits' />
      </Box>
    </Box>
  )
}

export default Visits
