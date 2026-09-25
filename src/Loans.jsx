import React, { useEffect, useState } from 'react'

import {
  Chart as ChartJS,
  CategoryScale,
  Colors,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import { Bar, Line } from 'react-chartjs-2'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import ListSubheader from '@mui/material/ListSubheader'
import Typography from '@mui/material/Typography'

import loansMd from './content/loans.md'
import loansByTypeMd from './content/loans-by-type.md'
import loansByServiceMd from './content/loans-by-service.md'

import { useApplicationState } from './hooks/useApplicationState'

import {
  filterByMonthRange,
  filterByPeriods,
  formatMonth,
  getMonthsInRange
} from './helpers/periods'

import { getActiveServices } from './models/service'
import * as loansModel from './models/loans'

import CardGrid from './components/CardGrid'

ChartJS.register(
  CategoryScale,
  Colors,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const serviceChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: 'Loans per population by service and format'
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Count of loans per population per year'
      },
      stacked: true,
      beginAtZero: true
    },
    y: {
      stacked: true
    }
  }
}

const Loans = () => {
  const [
    { filteredServices, services, loans, monthRange, selectedPeriods },
    dispatchApplication
  ] = useApplicationState()

  const [formatCharts, setFormatCharts] = useState([])

  const [serviceChart, setServiceChart] = useState([])

  const [loansMarkdown, setLoansMarkdown] = useState('')
  const [loansByTypeMarkdown, setLoansByTypeMarkdown] = useState('')
  const [loansByServiceMarkdown, setLoansByServiceMarkdown] = useState('')

  useEffect(() => {
    fetch(loansMd)
      .then(res => res.text())
      .then(text => setLoansMarkdown(text))
    fetch(loansByTypeMd)
      .then(res => res.text())
      .then(text => setLoansByTypeMarkdown(text))
    fetch(loansByServiceMd)
      .then(res => res.text())
      .then(text => setLoansByServiceMarkdown(text))
  }, [])

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

    itemFormats.forEach(format => {
      const formatChartOptions = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: `Loans per month of ${format}s by content age group`
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month'
            },
            ticks: {
              callback: function (value) {
                return formatMonth(this.getLabelForValue(value))
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Count of loans'
            },
            beginAtZero: true
          }
        }
      }
      const formatLoans = chartLoans.filter(m => m.format === format)

      const datasets = []

      // We want a dataset for each content age group
      const contentAgeGroups = [
        ...new Set(formatLoans.map(m => m.contentAgeGroup))
      ].sort()
      contentAgeGroups.forEach(contentAgeGroup => {
        // We want a dataset for each age group
        const data = []
        formatLabels.forEach(label => {
          // For each label (month) we need to count the count of loans for this age group
          let count = 0
          formatLoans.forEach(loan => {
            if (
              loan.countLoans &&
              loan.month === label &&
              loan.contentAgeGroup === contentAgeGroup &&
              (filteredServices.length === 0 ||
                filteredServices.includes(loan.serviceCode))
            ) {
              count += loan.countLoans
            }
          })
          data.push(count)
        })
        datasets.push({
          label: contentAgeGroup,
          data,
          borderWidth: 2
        })
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

    const serviceLabels = activeServices.map(s => s.niceName).sort()

    const datasets = itemFormats.map(format => {
      const data = []
      serviceLabels.forEach(serviceLabel => {
        const service = services.find(s => s.niceName === serviceLabel)
        const serviceCode = service?.code
        if (!serviceCode) return null

        const serviceFormatLoans = serviceLoans.filter(
          m => m.serviceCode === serviceCode && m.format === format
        )
        const totalLoans = serviceFormatLoans.reduce(
          (acc, loan) => acc + (loan.countLoans || 0),
          0
        )
        const servicePopulation = service?.totalPopulation || 1
        const loansPerCapita = Math.round(
          totalLoans / servicePopulation / yearCount
        )

        data.push(loansPerCapita)
      })
      return {
        label: format,
        data
      }
    })

    // If loans data is null for a service change the label to include (no data)
    serviceLabels.forEach((label, index) => {
      const service = services.find(s => s.niceName === label)
      if (!service.loans) {
        serviceLabels[index] = `${label} (no data)`
      }
    })

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
      <Markdown>{loansMarkdown}</Markdown>
      <Typography variant='h5' gutterBottom>
        Loans by format and age group
      </Typography>
      <Markdown>{loansByTypeMarkdown}</Markdown>
      {formatCharts.map((chart, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <ListSubheader component='div' disableSticky disableGutters>
            {chart.format}
          </ListSubheader>
          <Line
            options={chart.options}
            data={{ labels: chart.labels, datasets: chart.datasets }}
          />
        </Box>
      ))}
      <Typography variant='h5' gutterBottom>
        Loans by service and format
      </Typography>
      <Markdown>{loansByServiceMarkdown}</Markdown>
      {serviceChart && serviceChart.labels && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: `${serviceChart.labels.length * 18 + 120}px`
          }}
        >
          <Bar options={serviceChartOptions} data={serviceChart} />
        </Box>
      )}
    </Box>
  )
}

export default Loans
