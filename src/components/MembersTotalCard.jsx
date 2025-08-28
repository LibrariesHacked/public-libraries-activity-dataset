import React, { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useApplicationState } from '../hooks/useApplicationState'

const MembersTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [membersCount, setMembersCount] = useState(0)
  const [totalPopulation, setTotalPopulation] = useState(0)
  const [percentageMembers, setPercentageMembers] = useState(0)

  useEffect(() => {
    // The active services are either the ones where the service code is in the filteredServices array
    // or the filteredServices array is empty.
    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    // The membership count is the sum of the members integer from each service object
    const totalMembers =
      activeServices?.reduce(
        (acc, service) => acc + (service.members || 0),
        0
      ) || 0

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

    const percentageMembers =
      totalPopulation > 0 ? (totalMembers / totalPopulation) * 100 : 0

    setMembersCount(totalMembers)
    setTotalPopulation(totalPopulation)
    setPercentageMembers(percentageMembers)
  }, [services, filteredServices])

  return (
    <Card variant='outlined' sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component='h2' variant='h6' gutterBottom>
          Members
        </Typography>
        <Stack
          direction='column'
          sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1 }}
        >
          <Stack sx={{ justifyContent: 'space-between' }}>
            <Typography variant='h3' sx={{ color: 'text.secondary' }}>
              {membersCount.toLocaleString('en-GB')}
            </Typography>
            <Typography variant='h4' sx={{ color: 'text.secondary' }}>
              {Math.round(percentageMembers)}%
            </Typography>
          </Stack>
          <Box sx={{ width: '100%', height: 50 }}></Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default MembersTotalCard
