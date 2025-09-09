import React, { useEffect, useState } from 'react'

import { Colors } from 'chart.js'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useApplicationState } from '../hooks/useApplicationState'
import { ListSubheader } from '@mui/material'

const UsersTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [usersCount, setUsersCount] = useState(0)
  const [totalPopulation, setTotalPopulation] = useState(0)
  const [percentageUsers, setPercentageUsers] = useState(0)

  useEffect(() => {
    // The active services are either the ones where the service code is in the filteredServices array
    // or the filteredServices array is empty.
    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    // The user count is the sum of the users integer from each service object
    const totalUsers =
      activeServices?.reduce((acc, service) => acc + (service.users || 0), 0) ||
      0

    // The population is the sum of populationUnder12, population_12_17, population_adult
    const totalPopulation =
      activeServices?.reduce(
        (acc, service) =>
          acc +
          (service.populationUnder12 || 0) +
          (service.population12To17 || 0) +
          (service.populationAdult || 0),
        0
      ) || 0

    const percentageUsers =
      totalPopulation > 0 ? (totalUsers / totalPopulation) * 100 : 0

    setUsersCount(totalUsers)
    setTotalPopulation(totalPopulation)
    setPercentageUsers(percentageUsers)
  }, [services, filteredServices])

  return (
    <Card variant='outlined' sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component='h4' variant='subtitle1'>
          Users
        </Typography>
        <Stack
          direction='column'
          sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1 }}
        >
          <Stack sx={{ justifyContent: 'space-between' }}>
            <Typography variant='h3' sx={{ color: 'text.secondary' }}>
              {usersCount.toLocaleString('en-GB')}
            </Typography>
            <Typography variant='h4' sx={{ color: 'text.secondary' }}>
              {Math.round(percentageUsers)}%
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default UsersTotalCard
