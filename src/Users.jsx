import React, { useEffect, useMemo, useState } from 'react'

import Markdown from 'react-markdown'

import usersMd from './content/users.md?raw'
import usersMapMd from './content/users-map.md?raw'
import usersByAgeGroupMd from './content/users-by-age-group.md?raw'
import usersByServiceMd from './content/users-by-service.md?raw'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { useApplicationState } from './hooks/useApplicationState'

import { formatPeriod } from './helpers/periods'

import { getActiveServices } from './models/service'
import * as usersModel from './models/users'

import CardGrid from './components/CardGrid'
import UsersMap from './components/UsersMap'
import { AppChart } from './components/charts'

import {
  createServiceBarChartOptions,
  formatServiceLabelsWithNoData
} from './helpers/charts'

const ageGroupChartOptions = {
  plugins: {
    title: {
      display: true,
      text: 'Active users by age group'
    }
  },
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  scales: {
    x: {
      stacked: true,
      title: { display: true, text: 'Count of active users' }
    },
    y: {
      stacked: true,
      title: { display: true, text: 'Financial year' }
    }
  }
}

const Users = () => {
  const [
    {
      filteredServices,
      services,
      serviceRecords,
      users,
      selectedPeriods,
      snapshotPeriod
    },
    dispatchApplication
  ] = useApplicationState()

  const serviceChartTitle = `Active users % population by service${
    snapshotPeriod ? ` (${formatPeriod(snapshotPeriod)})` : ''
  }`
  const serviceChartOptions = useMemo(
    () =>
      createServiceBarChartOptions(
        serviceChartTitle,
        'Active users as % of population'
      ),
    [serviceChartTitle]
  )

  const [ageGroupChart, setAgeGroupChart] = useState({
    labels: [],
    datasets: []
  })

  const [serviceChart, setServiceChart] = useState({ labels: [], datasets: [] })

  useEffect(() => {
    const getUsers = async () => {
      const users = await usersModel.getUsers()
      dispatchApplication({ type: 'SetUsers', users })
    }

    // Trigger download of users data (if not already done)
    if (!users) getUsers()
  }, [services, users, dispatchApplication])

  useEffect(() => {
    if (!users || !serviceRecords || !services) return

    const filteredSet = filteredServices?.length
      ? new Set(filteredServices)
      : null

    const activeServices = getActiveServices(services, filteredServices)

    // Active users are a snapshot of each financial year, so they are never
    // summed across years. Each selected year is its own bar.
    const periods = selectedPeriods?.length
      ? selectedPeriods
      : [...new Set(users.map(m => m.period))].sort()

    const yearLabels = periods.map(formatPeriod)
    // We have a dataset for each age group
    const ageGroups = [...new Set(users.map(m => m.ageGroup))].sort()

    // Pre-aggregate user counts: (period, ageGroup) -> sum
    const periodAgeGroupMap = new Map()
    for (let i = 0; i < users.length; i++) {
      const u = users[i]
      if (!filteredSet || filteredSet.has(u.serviceCode)) {
        const key = `${u.period}|||${u.ageGroup}`
        periodAgeGroupMap.set(
          key,
          (periodAgeGroupMap.get(key) || 0) + u.countUsers
        )
      }
    }

    // Pre-aggregate total population: period -> sum
    const periodPopulationMap = new Map()
    for (let i = 0; i < serviceRecords.length; i++) {
      const s = serviceRecords[i]
      if (!filteredSet || filteredSet.has(s.code)) {
        periodPopulationMap.set(
          s.period,
          (periodPopulationMap.get(s.period) || 0) + (s.totalPopulation || 0)
        )
      }
    }

    const allGroups = [...ageGroups, 'Non-users']
    const ageGroupChartDatasets = allGroups.map(ageGroup => {
      const data = periods.map(period => {
        if (ageGroup === 'Non-users') {
          return periodPopulationMap.get(period) || 0
        }
        return periodAgeGroupMap.get(`${period}|||${ageGroup}`) || 0
      })
      return {
        label: ageGroup,
        data,
        hidden: ageGroup === 'Non-users'
      }
    })

    // Now we need to adjust the non-users to be total population minus users
    const nonUserIndex = allGroups.indexOf('Non-users')
    if (nonUserIndex !== -1) {
      ageGroupChartDatasets[nonUserIndex].data = ageGroupChartDatasets[
        nonUserIndex
      ].data.map((totalNonUsers, index) => {
        const totalUsers = ageGroupChartDatasets.reduce(
          (sum, dataset, dsIndex) => {
            if (dsIndex !== nonUserIndex) {
              return sum + dataset.data[index]
            }
            return sum
          },
          0
        )
        return Math.max(0, totalNonUsers - totalUsers)
      })
    }

    setAgeGroupChart({
      labels: yearLabels,
      datasets: ageGroupChartDatasets
    })

    const rawServiceLabels = activeServices.map(s => s.niceName).sort()
    const serviceByNiceName = new Map(activeServices.map(s => [s.niceName, s]))

    const serviceData = rawServiceLabels.map(serviceLabel => {
      const svc = serviceByNiceName.get(serviceLabel)
      if (!svc) return 0
      const totalUsers = svc.users || 0
      const totalPopulation = svc.totalPopulation || 0
      const percentageUsers =
        totalPopulation > 0 ? (totalUsers / totalPopulation) * 100 : 0
      return Math.round(percentageUsers)
    })

    const serviceLabels = formatServiceLabelsWithNoData(
      rawServiceLabels,
      serviceByNiceName,
      s => s?.users
    )

    setServiceChart({
      labels: serviceLabels,
      datasets: [
        {
          label: '% of population',
          data: serviceData
        }
      ]
    })
  }, [users, services, serviceRecords, filteredServices, selectedPeriods])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Active users
      </Typography>
      <CardGrid />
      <Markdown>{usersMd}</Markdown>
      <Typography variant='h5' gutterBottom>
        Active users by age group
      </Typography>
      <Markdown>{usersByAgeGroupMd}</Markdown>
      <AppChart
        type='bar'
        options={ageGroupChartOptions}
        data={ageGroupChart}
        height={`${ageGroupChart.labels.length * 30 + 120}px`}
      />
      <Typography variant='h5' gutterBottom>
        Active users map
      </Typography>
      <Markdown>{usersMapMd}</Markdown>
      <Box
        sx={{
          position: 'relative',
          width: '100%'
        }}
      >
        <UsersMap />
      </Box>
      <Typography variant='h5' gutterBottom>
        Active users by service
      </Typography>
      <Markdown>{usersByServiceMd}</Markdown>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />
    </Box>
  )
}

export default Users
