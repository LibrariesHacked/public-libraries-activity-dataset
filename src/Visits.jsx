import React, { useEffect, useState } from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import visitsMd from './content/visits.md?raw'
import visitsByLocationMd from './content/visits-by-location.md?raw'
import visitsByServiceMd from './content/visits-by-service.md?raw'

import { useApplicationState } from './hooks/useApplicationState'

import CardGrid from './components/CardGrid'
import { AppChart } from './components/charts'

import {
  createTimelineChartOptions,
  createServiceBarChartOptions,
  formatServiceLabelsWithNoData,
  sortServicesByMetric
} from './helpers/charts'

import {
  filterByMonthRange,
  filterByPeriods,
  getMonthsInRange
} from './helpers/periods'

import { getActiveServices } from './models/service'
import * as visitsModel from './models/visits'

/**
 * Chart configuration options for the timeline line chart displaying monthly visits by facility type.
 */
const visitsChartOptions = createTimelineChartOptions(
  'Visits by location type over time'
)

/**
 * Chart configuration options for the stacked service comparison bar chart displaying visits per resident population.
 */
const serviceChartOptions = createServiceBarChartOptions(
  'Visits per resident population by service',
  'Visits per resident population per year',
  { stacked: true }
)

/**
 * In-person library visits dashboard page view displaying summary KPI cards,
 * monthly visits trends by service location type, and per-capita comparisons across authorities.
 *
 * @returns {JSX.Element} The rendered Visits page view.
 */
const Visits = () => {
  const [
    { filteredServices, services, visits, monthRange, selectedPeriods },
    dispatchApplication
  ] = useApplicationState()

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

    const serviceVisits = filterByPeriods(filteredVisits, selectedPeriods)
    const yearCount = selectedPeriods?.length || 1

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
    const serviceByNiceName = new Map(sortedServices.map(s => [s.niceName, s]))

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
  }, [visits, filteredServices, services, monthRange, selectedPeriods])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Visits
      </Typography>
      <CardGrid />
      <Markdown>{visitsMd}</Markdown>
      <Typography variant='h5' gutterBottom>
        Visits by location
      </Typography>
      <Markdown>{visitsByLocationMd}</Markdown>
      <AppChart type='line' options={visitsChartOptions} data={visitData} />
      <Typography variant='h5' gutterBottom>
        Visit types by service
      </Typography>
      <Markdown>{visitsByServiceMd}</Markdown>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />
    </Box>
  )
}

export default Visits
