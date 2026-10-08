import React, { useEffect, useMemo, useState } from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import loansMd from './content/loans.md?raw'
import loansByTypeMd from './content/loans-by-type.md?raw'
import loansByServiceMd from './content/loans-by-service.md?raw'

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
import * as loansModel from './models/loans'

/**
 * Loans dashboard page view displaying summary KPI cards, monthly loan trends
 * by media format and audience age group, and a per-capita service comparison bar chart.
 *
 * @returns {JSX.Element} The rendered Loans page view.
 */
const Loans = () => {
  const [
    {
      filteredServices,
      services,
      loans,
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
          ? 'Loans per 1,000 reporting residents by region and format'
          : 'Loans per 1,000 reporting residents by service and format',
        'Annual loans per 1,000 reporting residents',
        { stacked: true }
      ),
    [isRegionMode]
  )

  const [formatCharts, setFormatCharts] = useState([])
  const [serviceChart, setServiceChart] = useState([])

  useEffect(() => {
    const getLoans = async () => {
      const loans = await loansModel.getLoans()
      dispatchApplication({ type: 'SetLoans', loans })
    }

    // Trigger download of loans data (if not already done)
    if (!loans) getLoans()
  }, [services, loans, dispatchApplication])

  useEffect(() => {
    if (!loans || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeServiceCodes = new Set(activeServices.map(s => s.code))

    const formatCharts = []

    const chartLoans = filterByMonthRange(loans, monthRange).filter(loan =>
      activeServiceCodes.has(loan.serviceCode)
    )
    const formatLabels = getMonthsInRange(monthRange)
    const monthlyCoverage = getReportingCoverageByGroup(
      chartLoans,
      activeServices,
      'countLoans',
      loan => `${loan.format}|||${loan.contentAgeGroup}|||${loan.month}`
    )

    const itemFormats = [...new Set(loans.map(m => m.format))].sort((a, b) => {
      const order = ['Physical book', 'Ebook', 'Physical audiobook', 'Eaudio']
      const aIndex = order.indexOf(a)
      const bIndex = order.indexOf(b)
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      return a.localeCompare(b)
    })

    // Pre-aggregate monthly loans: (format, contentAgeGroup, month) -> sum
    const formatGroupMonthMap = new Map()
    const contentAgeGroupsByFormat = new Map()

    for (let i = 0; i < chartLoans.length; i++) {
      const loan = chartLoans[i]
      if (Number.isFinite(loan.countLoans)) {
        const key = `${loan.format}|||${loan.contentAgeGroup}|||${loan.month}`
        formatGroupMonthMap.set(
          key,
          (formatGroupMonthMap.get(key) || 0) + loan.countLoans
        )

        let groups = contentAgeGroupsByFormat.get(loan.format)
        if (!groups) {
          groups = new Set()
          contentAgeGroupsByFormat.set(loan.format, groups)
        }
        groups.add(loan.contentAgeGroup)
      }
    }

    itemFormats.forEach(format => {
      const formatChartOptions = createTimelineChartOptions(
        `Loans per month of ${format.toLowerCase()}s by content age group`,
        'Loans per 1,000 reporting residents per month'
      )

      const groups = contentAgeGroupsByFormat.get(format)
      const contentAgeGroups = groups ? [...groups].sort() : []

      const datasets = contentAgeGroups.map(contentAgeGroup => {
        const data = formatLabels.map(label => {
          const key = `${format}|||${contentAgeGroup}|||${label}`
          const total = formatGroupMonthMap.get(key)
          return total == null
            ? null
            : perThousandReportingResidents(total, monthlyCoverage.get(key))
        })
        return {
          label: contentAgeGroup,
          data,
          borderWidth: 2
        }
      })

      formatCharts.push({
        format,
        labels: formatLabels,
        datasets,
        options: formatChartOptions
      })
    })

    setFormatCharts(formatCharts)

    const serviceLoans = chartLoans
    const serviceFormatCoverage = getReportingCoverageByGroup(
      serviceLoans,
      activeServices,
      'countLoans',
      loan => `${loan.serviceCode}|||${loan.format}`
    )
    const serviceByCode = new Map(activeServices.map(service => [service.code, service]))
    const regionFormatCoverage = getReportingCoverageByGroup(
      serviceLoans,
      activeServices,
      'countLoans',
      loan => `${serviceByCode.get(loan.serviceCode)?.region}|||${loan.format}`
    )

    // Pre-aggregate service loans: (serviceCode, format) -> sum
    const serviceFormatMap = new Map()
    for (let i = 0; i < serviceLoans.length; i++) {
      const loan = serviceLoans[i]
      if (Number.isFinite(loan.countLoans)) {
        const key = `${loan.serviceCode}|||${loan.format}`
        serviceFormatMap.set(
          key,
          (serviceFormatMap.get(key) || 0) + loan.countLoans
        )
      }
    }

    if (isRegionMode) {
      const regionAggregates = getRegionAggregates(services, selectedRegions)

      const getRegionTotalLoansPerCapita = region => {
        return itemFormats.reduce((rate, format) => {
          let totalLoans = 0
          for (const serviceCode of region.serviceCodes) {
            totalLoans += serviceFormatMap.get(`${serviceCode}|||${format}`) || 0
          }
          const coverage = regionFormatCoverage.get(`${region.region}|||${format}`)
          return rate + (perThousandReportingPersonYears(totalLoans, coverage) || 0)
        }, 0)
      }

      const sortedRegions = sortServicesByMetric(
        regionAggregates,
        getRegionTotalLoansPerCapita,
        r => r?.loans
      )

      const rawRegionLabels = sortedRegions.map(r => r.niceName)
      const regionByNiceName = new Map(sortedRegions.map(r => [r.niceName, r]))

      const datasets = itemFormats.map(format => {
        const data = rawRegionLabels.map(regionLabel => {
          const region = regionByNiceName.get(regionLabel)
          if (!region?.totalPopulation) return 0

          let totalLoans = 0
          for (const sCode of region.serviceCodes) {
            totalLoans += serviceFormatMap.get(`${sCode}|||${format}`) || 0
          }
          const coverage = regionFormatCoverage.get(`${region.niceName}|||${format}`)
          const rate = perThousandReportingPersonYears(totalLoans, coverage)
          return rate == null ? null : parseFloat(rate.toFixed(2))
        })
        return {
          label: format,
          data
        }
      })

      const regionLabels = formatServiceLabelsWithNoData(
        rawRegionLabels,
        regionByNiceName,
        r => r?.loans
      )

      setServiceChart({
        labels: regionLabels,
        datasets
      })
    } else {
      // ONS: Order categories in bar charts by value descending (services with no data at bottom)
      const getServiceLoansPerCapita = service => {
        if (!service?.code) return 0
        return itemFormats.reduce((rate, format) => {
          const total = serviceFormatMap.get(`${service.code}|||${format}`) || 0
          const coverage = serviceFormatCoverage.get(`${service.code}|||${format}`)
          return rate + (perThousandReportingPersonYears(total, coverage) || 0)
        }, 0)
      }

      const sortedServices = sortServicesByMetric(
        activeServices,
        getServiceLoansPerCapita,
        s => s?.loans
      )

      const rawServiceLabels = sortedServices.map(s => s.niceName)
      const serviceByNiceName = new Map(
        sortedServices.map(s => [s.niceName, s])
      )

      const datasets = itemFormats.map(format => {
        const data = rawServiceLabels.map(serviceLabel => {
          const service = serviceByNiceName.get(serviceLabel)
          const serviceCode = service?.code
          if (!serviceCode) return 0

          const totalLoans =
            serviceFormatMap.get(`${serviceCode}|||${format}`) || 0
          const coverage = serviceFormatCoverage.get(`${serviceCode}|||${format}`)
          const rate = perThousandReportingPersonYears(totalLoans, coverage)
          return rate == null ? null : parseFloat(rate.toFixed(2))
        })
        return {
          label: format,
          data
        }
      })

      const serviceLabels = formatServiceLabelsWithNoData(
        rawServiceLabels,
        serviceByNiceName,
        s => s?.loans
      )

      setServiceChart({
        labels: serviceLabels,
        datasets
      })
    }
  }, [
    filteredServices,
    loans,
    services,
    monthRange,
    isRegionMode,
    selectedRegions
  ])

  return (
    <Box>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 800, mb: 1.5 }}>
        Loans
      </Typography>
      <CardGrid />
      <Box sx={{ my: 2 }}>
        <Markdown>{loansMd}</Markdown>
      </Box>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Loans by format and age group
        </Typography>
        <Markdown>{loansByTypeMd}</Markdown>
      </Box>
      {formatCharts.map((chart, index) => (
        <AppChart
          key={index}
          type='line'
          title={chart.format}
          options={chart.options}
          data={{ labels: chart.labels, datasets: chart.datasets }}
        />
      ))}

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          {isRegionMode ? 'Loans by region and format' : 'Loans by service and format'}
        </Typography>
        <Markdown>
          {isRegionMode
            ? 'Annual loans per 1,000 residents in services reporting each format, by format.'
            : loansByServiceMd}
        </Markdown>
      </Box>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />

      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Loans data
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Full dataset of monthly library loans, reporting anomalies, and corrected figures.
        </Typography>
        <DatasetDataGrid datasetId='loans' />
      </Box>
    </Box>
  )
}

export default Loans
