import React, { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

import { useApplicationState } from '../hooks/useApplicationState'

import * as loansModel from '../models/loans'

const LoansByTypeCard = () => {
  const [{ filteredServices, services, loans }, dispatchApplication] =
    useApplicationState()

  const [loansData, setLoansData] = useState(null)

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
    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    const filteredLoans = loans.filter(loan =>
      activeServices.includes(loan.serviceCode)
    )

    const itemFormats = [...new Set(filteredLoans.map(m => m.format))].sort()
    const loansData = {
      labels: itemFormats,
      datasets: [
        {
          label: 'Loans by Format',
          data: itemFormats.map(
            format =>
              filteredLoans.filter(loan => loan.format === format).length
          )
        }
      ]
    }

    setLoansData(loansData)
  }, [services, filteredServices, loans])

  return (
    <Card variant='outlined' sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component='h2' variant='h6' gutterBottom>
          Loans
        </Typography>
        <Stack
          direction='column'
          sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1 }}
        >
          <Stack sx={{ justifyContent: 'space-between' }}>
            {loansData && <Doughnut data={loansData} />}
          </Stack>
          <Box sx={{ width: '100%', height: 50 }}></Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default LoansByTypeCard
