import React, { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useApplicationState } from '../hooks/useApplicationState'

import { getActiveServices } from '../models/service'
import { filterByMonthRange } from '../helpers/periods'

import * as loansModel from '../models/loans'

import { AppChart } from './charts'

/**
 * Chart.js display options for the loans breakdown doughnut chart,
 * configuring bottom legend alignment and formatted number tooltips.
 */
const doughnutOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 8
      }
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || ''
          const value = context.parsed || 0
          return `${label}: ${Number(value).toLocaleString('en-GB')}`
        }
      }
    }
  }
}

/**
 * Card component rendering a breakdown of library loans by media format (e.g. Physical books, E-books, Audiobooks)
 * using an interactive DoughnutChart, with segments sorted descending by loan volume.
 *
 * @returns {JSX.Element} Card containing the loans-by-format doughnut chart.
 */
const LoansByTypeCard = () => {
  const [{ filteredServices, services, loans, monthRange }, dispatchApplication] =
    useApplicationState()

  const [loansData, setLoansData] = useState(null)

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

    const filteredLoans = filterByMonthRange(loans, monthRange).filter(loan =>
      activeServiceCodes.has(loan.serviceCode)
    )

    const itemFormats = [...new Set(filteredLoans.map(m => m.format))]

    // Pre-aggregate counts and sort segments descending by size per ONS guidance
    const formatCounts = itemFormats
      .map(format => ({
        format,
        count: filteredLoans.reduce(
          (sum, loan) =>
            loan.format === format ? sum + (loan.countLoans || 0) : sum,
          0
        )
      }))
      .sort((a, b) => b.count - a.count)

    const loansData = {
      labels: formatCounts.map(f => f.format),
      datasets: [
        {
          label: 'Loans by format',
          data: formatCounts.map(f => f.count)
        }
      ]
    }

    setLoansData(loansData)
  }, [services, filteredServices, loans, monthRange])

  return (
    <Card variant='outlined' sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component='h2' variant='h6' gutterBottom>
          Loans
        </Typography>
        <Stack
          spacing={1}
          sx={{ justifyContent: 'space-between', flexGrow: 1 }}
        >
          <AppChart
            type='doughnut'
            data={loansData}
            options={doughnutOptions}
            disablePaper
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

export default LoansByTypeCard
