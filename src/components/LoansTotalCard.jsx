import React, { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useApplicationState } from '../hooks/useApplicationState'

const LoansTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [loansCount, setLoansCount] = useState(0)
  const [totalPopulation, setTotalPopulation] = useState(0)
  const [loansPerCapita, setLoansPerCapita] = useState(0)

  useEffect(() => {
    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    // The loans count is the sum of the loans integer from each service object
    const totalLoans =
      activeServices?.reduce((acc, service) => acc + (service.loans || 0), 0) ||
      0

    // The population is the totalPopulation on the service object
    const totalPopulation =
      activeServices?.reduce(
        (acc, service) => acc + (service.totalPopulation || 0),
        0
      ) || 0

    const loansPerCapita =
      totalPopulation > 0 ? (totalLoans / totalPopulation) * 100 : 0

    setLoansCount(totalLoans)
    setTotalPopulation(totalPopulation)
    setLoansPerCapita(loansPerCapita)
  }, [services, filteredServices])

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
            <Typography variant='h3' sx={{ color: 'text.secondary' }}>
              {loansCount.toLocaleString('en-GB')}
            </Typography>
            <Typography variant='h4' sx={{ color: 'text.secondary' }}>
              {Math.round(loansPerCapita)} loans per capita
            </Typography>
          </Stack>
          <Box sx={{ width: '100%', height: 50 }}></Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default LoansTotalCard
