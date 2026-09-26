import React, { useEffect, useState } from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import loansMd from './content/loans.md?raw'
import loansByTypeMd from './content/loans-by-type.md?raw'
import loansByServiceMd from './content/loans-by-service.md?raw'

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
import * as loansModel from './models/loans'

const serviceChartOptions = createServiceBarChartOptions(
  'Loans per population by service and format',
  'Count of loans per population per year',
  { stacked: true }
)

const Loans = () => {
  const [
    { filteredServices, services, loans, monthRange, selectedPeriods },
    dispatchApplication
  ] = useApplicationState()

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
        `Loans per month of ${format}s by content age group`,
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

    const serviceLoans = filterByPeriods(loans, selectedPeriods)
    const yearCount = selectedPeriods?.length || 1

    const rawServiceLabels = activeServices.map(s => s.niceName).sort()
    const serviceByNiceName = new Map(activeServices.map(s => [s.niceName, s]))

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
  }, [filteredServices, loans, services, monthRange, selectedPeriods])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Loans
      </Typography>
      <CardGrid />
      <Markdown>{loansMd}</Markdown>
      <Typography variant='h5' gutterBottom>
        Loans by format and age group
      </Typography>
      <Markdown>{loansByTypeMd}</Markdown>
      {formatCharts.map((chart, index) => (
        <AppChart
          key={index}
          type='line'
          title={chart.format}
          options={chart.options}
          data={{ labels: chart.labels, datasets: chart.datasets }}
        />
      ))}
      <Typography variant='h5' gutterBottom>
        Loans by service and format
      </Typography>
      <Markdown>{loansByServiceMd}</Markdown>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />
    </Box>
  )
}

export default Loans
