import React, { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'

const LoansTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [visitsCount, setVisitsCount] = useState(0)
  const [totalPopulation, setTotalPopulation] = useState(0)
  const [visitsPerCapita, setVisitsPerCapita] = useState(0)

  useEffect(() => {
    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    // The visits count is the sum of the visits integer from each service object
    const totalVisits =
      activeServices?.reduce(
        (acc, service) => acc + (service.visits || 0),
        0
      ) || 0

    // The population is the totalPopulation on the service object
    const totalPopulation =
      activeServices?.reduce(
        (acc, service) => acc + (service.totalPopulation || 0),
        0
      ) || 0

    const visitsPerCapita =
      totalPopulation > 0 ? Math.round(totalVisits / totalPopulation) : 0

    setVisitsCount(totalVisits)
    setTotalPopulation(totalPopulation)
    setVisitsPerCapita(visitsPerCapita)
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
              {formatCompactNumber(visitsCount)}
            </Typography>
            <Typography variant='h4' sx={{ color: 'text.secondary' }}>
              ~{formatCompactNumber(visitsPerCapita)} per person
            </Typography>
          </Stack>
          <Box sx={{ width: '100%', height: 50 }}></Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default LoansTotalCard
