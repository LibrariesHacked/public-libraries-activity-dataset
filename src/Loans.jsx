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

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import ListSubheader from '@mui/material/ListSubheader'
import Typography from '@mui/material/Typography'

import loansMd from './content/loans.md'
import loansByTypeMd from './content/loans-by-type.md'
import loansByServiceMd from './content/loans-by-service.md'

import { getActiveServices } from './models/service'

import { useApplicationState } from './hooks/useApplicationState'

import * as loansModel from './models/loans'

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
      text: `Loans by service and format`
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Count of loans'
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
  const [{ filteredServices, services, loans }, dispatchApplication] =
    useApplicationState()

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
      dispatchApplication({ type: 'SetLoans', loans: loans })
    }

    // Trigger download of loans data (if not already done)
    if (!loans) getLoans()
  }, [services, loans, dispatchApplication])

  useEffect(() => {
    if (!loans) return

    const activeServices = getActiveServices(services, filteredServices)

    let formatCharts = []

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
      const formatLoans = loans.filter(m => m.format === format)

      let formatLabels = []
      let datasets = []
      // The labels are the months in the data. The months are already formattted as YYYY-MM
      formatLabels = [...new Set(formatLoans.map(loan => loan.month))].sort()

      // We want a dataset for each content age group
      const contentAgeGroups = [
        ...new Set(formatLoans.map(m => m.contentAgeGroup))
      ].sort()
      contentAgeGroups.forEach(contentAgeGroup => {
        // We want a dataset for each age group
        const data = []
        formatLabels.forEach(label => {
          // For each label (month) we need to count the number of loans for this age group
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

    const serviceLabels = activeServices.map(s => s.niceName).sort()

    let datasets = itemFormats.map((format, i) => {
      const data = []
      serviceLabels.forEach(serviceLabel => {
        const serviceCode = services.find(
          s => s.niceName === serviceLabel
        )?.code
        if (!serviceCode) return null

        const serviceFormatLoans = loans.filter(
          m => m.serviceCode === serviceCode && m.format === format
        )
        data.push(
          serviceFormatLoans.reduce(
            (acc, loan) => acc + (loan.countLoans || 0),
            0
          )
        )
      })
      return {
        label: format,
        data,
        barThickness: 8
      }
    })

    setServiceChart({
      labels: serviceLabels,
      datasets,
      options: serviceChartOptions
    })
  }, [filteredServices, loans, services])
  return (
    <Box>
      <Typography variant='h3' gutterBottom>
        Loans
      </Typography>
      <Markdown>{loansMarkdown}</Markdown>
      <Typography variant='h4' gutterBottom>
        Formats
      </Typography>
      <Markdown>{loansByTypeMarkdown}</Markdown>
      {formatCharts.map((chart, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          <ListSubheader component='div' disableSticky disableGutters>
            {chart.format}
          </ListSubheader>
          <Line
            options={chart.options}
            data={{ labels: chart.labels, datasets: chart.datasets }}
          />
        </Box>
      ))}
      <Typography variant='h4' gutterBottom>
        Service comparison
      </Typography>
      <Markdown>{loansByServiceMarkdown}</Markdown>
      {serviceChart && serviceChart.labels && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: `${serviceChart.labels.length * 18 + 80}px`
          }}
        >
          <Bar
            options={serviceChart.options}
            data={{
              labels: serviceChart.labels,
              datasets: serviceChart.datasets
            }}
          />
        </Box>
      )}
    </Box>
  )
}

export default Loans
