import React, { useEffect, useMemo, useState } from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import visitsMd from './content/visits.md?raw'
import visitsByLocationMd from './content/visits-by-location.md?raw'
import visitsByServiceMd from './content/visits-by-service.md?raw'
import clickAndCollectMd from './content/click-and-collect.md?raw'

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
  getReportingCoverageByGroup,
  perThousandReportingPersonYears,
  perThousandReportingResidents
} from './helpers/reportingRates'

import {
  filterByMonthRange,
  getMonthsInRange
} from './helpers/periods'

import { getActiveServices, getRegionAggregates } from './models/service'
import * as clickAndCollectModel from './models/clickAndCollect'
import * as visitsModel from './models/visits'

/**
 * Chart configuration options for the timeline line chart displaying monthly visits by facility type.
 */
const visitsChartOptions = createTimelineChartOptions(
  'Visits and outreach interactions by location type over time',
  'Interactions per 1,000 reporting residents per month'
)
const clickAndCollectChartOptions = createTimelineChartOptions(
  'Click-and-collect interactions over time',
  'Interactions per 1,000 reporting residents per month'
)

/**
 * Library visits dashboard page displaying visits and outreach interactions,
 * monthly trends by location type, and per-resident comparisons across authorities.
 *
 * @returns {JSX.Element} The rendered Visits page view.
 */
const Visits = () => {
  const [
    {
      filteredServices,
      services,
      visits,
      clickAndCollect,
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
          ? 'Visits per 1,000 reporting residents by region'
          : 'Visits per 1,000 reporting residents by service',
        'Annual visits per 1,000 reporting residents',
        { stacked: true }
      ),
    [isRegionMode]
  )

  const [visitData, setVisitData] = useState(null)
  const [clickAndCollectData, setClickAndCollectData] = useState({
    datasets: [],
    labels: []
  })
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
    const getClickAndCollect = async () => {
      const data = await clickAndCollectModel.getClickAndCollect()
      dispatchApplication({ type: 'SetClickAndCollect', clickAndCollect: data })
    }

    if (!clickAndCollect) getClickAndCollect()
  }, [clickAndCollect, dispatchApplication])

  useEffect(() => {
    if (!visits || !services) return

    const filteredServiceSet = filteredServices?.length
      ? new Set(filteredServices)
      : null
    const activeServices = getActiveServices(services, filteredServices)
    const filteredVisits = filteredServiceSet
      ? visits.filter(v => filteredServiceSet.has(v.serviceCode))
      : visits
    const chartVisits = filterByMonthRange(filteredVisits, monthRange)
    const labels = getMonthsInRange(monthRange)
    const locationTypes = [...new Set(filteredVisits.map(visit => visit.location))].sort()
    const monthlyVisitCoverage = getReportingCoverageByGroup(
      chartVisits,
      activeServices,
      'countVisits',
      visit => `${visit.location}|||${visit.month}`
    )

    const filteredClickAndCollect = (clickAndCollect || []).filter(record =>
      !filteredServiceSet || filteredServiceSet.has(record.serviceCode)
    )
    const chartInteractions = filterByMonthRange(filteredClickAndCollect, monthRange)
    const interactionMonthMap = new Map()
    chartInteractions.forEach(record => {
      if (Number.isFinite(record.countInteractions)) {
        interactionMonthMap.set(
          record.month,
          (interactionMonthMap.get(record.month) || 0) + record.countInteractions
        )
      }
    })
    const interactionCoverage = getReportingCoverageByGroup(
      chartInteractions,
      activeServices,
      'countInteractions',
      record => record.month
    )
    setClickAndCollectData({
      labels,
      datasets: [{
        label: 'Click-and-collect interactions per 1,000 residents',
        data: labels.map(month => {
          const total = interactionMonthMap.get(month)
          return total == null
            ? null
            : perThousandReportingResidents(total, interactionCoverage.get(month))
        })
      }]
    })

    const locationMonthMap = new Map()
    for (let i = 0; i < chartVisits.length; i++) {
      const visit = chartVisits[i]
      if (Number.isFinite(visit.countVisits)) {
        const key = `${visit.location}|||${visit.month}`
        locationMonthMap.set(
          key,
          (locationMonthMap.get(key) || 0) + visit.countVisits
        )
      }
    }

    const newVisitData = {
      labels,
      datasets: locationTypes.map(location => ({
        label: location,
        data: labels.map(month => {
          const key = `${location}|||${month}`
          const total = locationMonthMap.get(key)
          return total == null
            ? null
            : perThousandReportingResidents(total, monthlyVisitCoverage.get(key))
        })
      }))
    }

    setVisitData(newVisitData)

    const serviceVisits = chartVisits
    const serviceLocationCoverage = getReportingCoverageByGroup(
      serviceVisits,
      activeServices,
      'countVisits',
      visit => `${visit.serviceCode}|||${visit.location}`
    )
    const serviceByCode = new Map(activeServices.map(service => [service.code, service]))
    const regionLocationCoverage = getReportingCoverageByGroup(
      serviceVisits,
      activeServices,
      'countVisits',
      visit => `${serviceByCode.get(visit.serviceCode)?.region}|||${visit.location}`
    )

    // Pre-aggregate service visits: (serviceCode, location) -> sum
    const serviceLocationMap = new Map()
    for (let i = 0; i < serviceVisits.length; i++) {
      const v = serviceVisits[i]
      if (Number.isFinite(v.countVisits)) {
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
        return locationTypes.reduce((rate, locationType) => {
          const total = [...region.serviceCodes].reduce(
            (sum, serviceCode) => sum + (serviceLocationMap.get(`${serviceCode}|||${locationType}`) || 0),
            0
          )
          return rate + (perThousandReportingPersonYears(
            total,
            regionLocationCoverage.get(`${region.region}|||${locationType}`)
          ) || 0)
        }, 0)
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
          if (!region) return null
          const visitCount = [...region.serviceCodes].reduce(
            (sum, serviceCode) => sum + (serviceLocationMap.get(`${serviceCode}|||${locationType}`) || 0),
            0
          )
          const rate = perThousandReportingPersonYears(
            visitCount,
            regionLocationCoverage.get(`${region.region}|||${locationType}`)
          )
          return rate == null ? null : parseFloat(rate.toFixed(2))
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
        return locationTypes.reduce((rate, locationType) => {
          const total = serviceLocationMap.get(`${service.code}|||${locationType}`) || 0
          const coverage = serviceLocationCoverage.get(`${service.code}|||${locationType}`)
          return rate + (perThousandReportingPersonYears(total, coverage) || 0)
        }, 0)
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

          const coverage = serviceLocationCoverage.get(`${service.code}|||${locationType}`)
          const rate = perThousandReportingPersonYears(visitCount, coverage)
          return rate == null ? null : parseFloat(rate.toFixed(2))
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
    clickAndCollect,
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
          Click-and-collect interactions
        </Typography>
        <Markdown>{clickAndCollectMd}</Markdown>
      </Box>
      <AppChart
        type='line'
        options={clickAndCollectChartOptions}
        data={clickAndCollectData}
      />

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          {isRegionMode ? 'Visit types by region' : 'Visit types by service'}
        </Typography>
        <Markdown>
          {isRegionMode
            ? 'Annual visits and outreach interactions per 1,000 residents in services reporting each location type.'
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
          Monthly library visits and outreach interactions, including reporting notes and corrections.
        </Typography>
        <DatasetDataGrid datasetId='visits' />
      </Box>

      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Click-and-collect data
        </Typography>
        <DatasetDataGrid datasetId='clickAndCollect' />
      </Box>
    </Box>
  )
}

export default Visits
