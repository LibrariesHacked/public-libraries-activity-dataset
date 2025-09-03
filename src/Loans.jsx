import React, { useEffect, useState } from 'react'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

import Box from '@mui/material/Box'

import { useApplicationState } from './hooks/useApplicationState'

import * as loansModel from './models/loans'

const Loans = () => {
  const [{ filteredServices, services, loans }, dispatchApplication] =
    useApplicationState()

  const [charts, setCharts] = useState([])

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

    let charts = []

    // We want a chart for each format
    const itemFormats = [...new Set(loans.map(m => m.format))].sort()

    itemFormats.forEach(format => {
      const options = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Chart.js Line Chart'
          }
        }
      }
      const formatLoans = loans.filter(m => m.format === format)

      let labels = []
      let datasets = []
      // The labels are the months in the data. The months are already formattted as YYYY-MM
      labels = [...new Set(formatLoans.map(loan => loan.month))].sort()

      // We want a dataset for each content age group
      const contentAgeGroups = [
        ...new Set(formatLoans.map(m => m.contentAgeGroup))
      ].sort()
      contentAgeGroups.forEach(contentAgeGroup => {
        // We want a dataset for each age group
        const data = []
        labels.forEach(label => {
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
        const color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`
        datasets.push({
          label: contentAgeGroup,
          data,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1
        })
      })
      charts.push({ format, labels, datasets, options })
    })

    setCharts(charts)
  }, [filteredServices, loans])
  return (
    <Box>
      {charts.map((chart, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          <h3>{chart.format}</h3>
          <Line
            options={chart.options}
            data={{ labels: chart.labels, datasets: chart.datasets }}
          />
        </Box>
      ))}
    </Box>
  )
}

export default Loans
