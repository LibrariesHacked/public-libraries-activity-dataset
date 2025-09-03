import React, { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useApplicationState } from '../hooks/useApplicationState'

const EventsAttendanceTotalCard = () => {
  const [{ filteredServices, services }] = useApplicationState()

  const [eventsCount, setEventsCount] = useState(0)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [totalPopulation, setTotalPopulation] = useState(0)
  const [percentageMembers, setPercentageMembers] = useState(0)

  useEffect(() => {
    // The active services are either the ones where the service code is in the filteredServices array
    // or the filteredServices array is empty.
    const activeServices =
      filteredServices?.length > 0
        ? services.filter(s => filteredServices.includes(s.code))
        : services

    // The events count is the sum of the events integer from each service object
    const totalEvents =
      activeServices?.reduce(
        (acc, service) => acc + (service.events || 0),
        0
      ) || 0

    // The attendance count is the sum of the attendance from each service object
    const totalAttendance =
      activeServices?.reduce(
        (acc, service) => acc + (service.attendance || 0),
        0
      ) || 0

    // The population is the sum of populationUnder12, population_12_17, population_adult
    const totalPopulation =
      activeServices?.reduce(
        (acc, service) => acc + (service.totalPopulation || 0),
        0
      ) || 0

    setEventsCount(totalEvents)
    setAttendanceCount(totalAttendance)
    setTotalPopulation(totalPopulation)
  }, [services, filteredServices])

  return (
    <Card variant='outlined' sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component='h2' variant='h6' gutterBottom>
          Events
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

export default EventsAttendanceTotalCard
