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
          ? 'Loans per resident population by region and format'
          : 'Loans per resident population by service and format',
        'Loans per resident population per year',
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

    const chartLoans = filterByMonthRange(loans, monthRange)
    const formatLabels = getMonthsInRange(monthRange)

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
      if (
        loan.countLoans &&
        (!filteredServices.length || activeServiceCodes.has(loan.serviceCode))
      ) {
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
        'Count of loans'
      )

      const groups = contentAgeGroupsByFormat.get(format)
      const contentAgeGroups = groups ? [...groups].sort() : []

      const datasets = contentAgeGroups.map(contentAgeGroup => {
        const data = formatLabels.map(label => {
          const key = `${format}|||${contentAgeGroup}|||${label}`
          return formatGroupMonthMap.get(key) || 0
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

    const serviceLoans = filterByMonthRange(loans, monthRange)
    const yearCount = (getMonthsInRange(monthRange).length || 12) / 12

    // Pre-aggregate service loans: (serviceCode, format) -> sum
    const serviceFormatMap = new Map()
    for (let i = 0; i < serviceLoans.length; i++) {
      const loan = serviceLoans[i]
      if (loan.countLoans) {
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
        if (!region?.totalPopulation) return 0
        let totalLoans = 0
        for (const fmt of itemFormats) {
          for (const sCode of region.serviceCodes) {
            totalLoans += serviceFormatMap.get(`${sCode}|||${fmt}`) || 0
          }
        }
        return totalLoans / region.totalPopulation / yearCount
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
          const loansPerCapita =
            totalLoans / region.totalPopulation / yearCount

          return parseFloat(loansPerCapita.toFixed(2))
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
      const getServiceTotalLoansPerCapita = service => {
        if (!service?.totalPopulation) return 0
        let totalLoans = 0
        for (const fmt of itemFormats) {
          totalLoans += serviceFormatMap.get(`${service.code}|||${fmt}`) || 0
        }
        return totalLoans / service.totalPopulation / yearCount
      }

      const sortedServices = sortServicesByMetric(
        activeServices,
        getServiceTotalLoansPerCapita,
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
          const loansPerCapita = service?.totalPopulation
            ? totalLoans / service.totalPopulation / yearCount
            : 0

          return parseFloat(loansPerCapita.toFixed(2))
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
            ? 'Average annual loans per resident across regions, broken down by format.'
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
