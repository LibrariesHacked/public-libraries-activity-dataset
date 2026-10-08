import React, { useEffect, useMemo, useState } from 'react'

import Markdown from 'react-markdown'

import usersMd from './content/users.md?raw'
import usersMapMd from './content/users-map.md?raw'
import usersByAgeGroupMd from './content/users-by-age-group.md?raw'
import usersByServiceMd from './content/users-by-service.md?raw'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

import { useApplicationState } from './hooks/useApplicationState'

import { formatPeriod } from './helpers/periods'

import { getActiveServices, getRegionAggregates } from './models/service'
import * as usersModel from './models/users'

import CardGrid from './components/CardGrid'
import DatasetDataGrid from './components/DatasetDataGrid'
import UsersMap from './components/UsersMap'
import { AppChart } from './components/charts'

import {
  createServiceBarChartOptions,
  formatServiceLabelsWithNoData,
  sortServicesByMetric
} from './helpers/charts'

/**
 * Chart configuration for active-user penetration by age group and year.
 */
const ageGroupChartOptions = {
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        boxWidth: 8
      }
    },
    title: {
      display: true,
      text: 'Active users as a share of reporting population',
      font: {
        size: 14,
        weight: 'bold'
      },
      padding: {
        bottom: 12
      }
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || ''
          if (label) label += ': '
          if (context.parsed.x !== null && context.parsed.x !== undefined) {
            label += `${Number(context.parsed.x).toFixed(1)}%`
          }
          return label
        }
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  scales: {
    x: {
      stacked: false,
      beginAtZero: true,
      title: { display: true, text: 'Active users as a share of reporting population' },
      grid: {
        color: context =>
          context.tick && context.tick.value === 0 ? '#707070' : '#e5e7eb',
        lineWidth: context =>
          context.tick && context.tick.value === 0 ? 1.5 : 1
      },
      ticks: {
        callback: value => `${Number(value)}%`
      }
    },
    y: {
      stacked: false,
      grid: {
        display: false
      }
    }
  }
}

/**
 * Active library users dashboard page view displaying summary KPI cards,
 * demographic age group proportions, an interactive geographic coverage/change map,
 * and service population penetration bar charts.
 *
 * @returns {JSX.Element} The rendered Users page view.
 */
const Users = () => {
  const [
    {
      filteredServices,
      services,
      serviceRecords,
      users,
      selectedPeriods,
      snapshotPeriod,
      comparisonMode,
      selectedRegions
    },
    dispatchApplication
  ] = useApplicationState()

  const isRegionMode = comparisonMode === 'regions'

  const serviceChartTitle = isRegionMode
    ? `Active users as % of population by region${
        snapshotPeriod ? ` (${formatPeriod(snapshotPeriod)})` : ''
      }`
    : `Active users as % of population by service${
        snapshotPeriod ? ` (${formatPeriod(snapshotPeriod)})` : ''
      }`

  const serviceChartOptions = useMemo(
    () =>
      createServiceBarChartOptions(
        serviceChartTitle,
        'Active users as % of population',
        { isPercentage: true }
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

    // Active users are annual snapshots. Compare rates against the population
    // covered by services reporting each age group, not raw headcounts.
    const periods = selectedPeriods?.length
      ? selectedPeriods
      : [...new Set(users.map(m => m.period))].sort()

    const yearLabels = periods.map(formatPeriod)
    const ageGroups = [...new Set(users.map(user => user.ageGroup))].sort()
    const populationPropertyByAgeGroup = {
      'Under 12': 'populationUnder12',
      '12-17': 'population12To17',
      Adult: 'populationAdult',
      Unknown: 'totalPopulation'
    }

    const usersByPeriodAgeGroup = new Map()
    const reportingServicesByPeriodAgeGroup = new Map()
    users.forEach(user => {
      if (filteredSet && !filteredSet.has(user.serviceCode)) return
      if (!Number.isFinite(user.countUsers)) return

      const key = `${user.period}|||${user.ageGroup}`
      usersByPeriodAgeGroup.set(
        key,
        (usersByPeriodAgeGroup.get(key) || 0) + user.countUsers
      )
      if (!reportingServicesByPeriodAgeGroup.has(key)) {
        reportingServicesByPeriodAgeGroup.set(key, new Set())
      }
      reportingServicesByPeriodAgeGroup.get(key).add(user.serviceCode)
    })

    const ageGroupChartDatasets = ageGroups.map(ageGroup => {
      const populationProperty = populationPropertyByAgeGroup[ageGroup]
      const data = periods.map(period => {
        const key = `${period}|||${ageGroup}`
        const reportingCodes = reportingServicesByPeriodAgeGroup.get(key)
        if (!populationProperty || !reportingCodes?.size) return null

        const reportingPopulation = serviceRecords
          .filter(record =>
            record.period === period && reportingCodes.has(record.code)
          )
          .reduce(
            (sum, record) => sum + (record[populationProperty] || 0),
            0
          )
        if (reportingPopulation === 0) return null

        return Number((usersByPeriodAgeGroup.get(key) / reportingPopulation * 100).toFixed(2))
      })
      return { label: ageGroup, data }
    })

    setAgeGroupChart({
      labels: yearLabels,
      datasets: ageGroupChartDatasets
    })

    const entities = isRegionMode
      ? getRegionAggregates(services, selectedRegions)
      : activeServices

    const getEntityUserPercentage = entity => {
      if (!entity || !entity.totalPopulation) return 0
      return ((entity.users || 0) / entity.totalPopulation) * 100
    }

    const sortedEntities = sortServicesByMetric(
      entities,
      getEntityUserPercentage,
      e => e?.users
    )

    const rawLabels = sortedEntities.map(e => e.niceName)
    const entityByNiceName = new Map(sortedEntities.map(e => [e.niceName, e]))

    const serviceData = rawLabels.map(label => {
      const entity = entityByNiceName.get(label)
      if (!entity) return 0
      const totalUsers = entity.users || 0
      const totalPopulation = entity.totalPopulation || 0
      return totalPopulation > 0 ? Math.round((totalUsers / totalPopulation) * 100) : 0
    })

    const labels = formatServiceLabelsWithNoData(
      rawLabels,
      entityByNiceName,
      e => e?.users
    )

    setServiceChart({
      labels,
      datasets: [
        {
          label: '% of population',
          data: serviceData
        }
      ]
    })
  }, [
    users,
    services,
    serviceRecords,
    filteredServices,
    selectedPeriods,
    isRegionMode,
    selectedRegions
  ])

  return (
    <Box>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 800, mb: 1.5 }}>
        Active users
      </Typography>
      <CardGrid />
      <Box sx={{ my: 2 }}>
        <Markdown>{usersMd}</Markdown>
      </Box>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Active users by age group
        </Typography>
        <Markdown>{usersByAgeGroupMd}</Markdown>
      </Box>
      <AppChart
        type='bar'
        options={ageGroupChartOptions}
        data={ageGroupChart}
        height={`${ageGroupChart.labels.length * 30 + 120}px`}
      />

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Active users map
        </Typography>
        <Markdown>{usersMapMd}</Markdown>
      </Box>
      <Paper
        variant='outlined'
        sx={{
          borderRadius: 2,
          mb: 3,
          overflow: 'hidden'
        }}
      >
        <UsersMap />
      </Paper>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          {isRegionMode ? 'Active users by region' : 'Active users by service'}
        </Typography>
        <Markdown>
          {isRegionMode
            ? 'Active users as a percentage of resident population by region (typically 5–20%). Commuters and students can push this percentage higher.'
            : usersByServiceMd}
        </Markdown>
      </Box>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />

      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Active users data
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Full dataset of annual active library borrowers, reporting anomalies, and demographic breakdowns.
        </Typography>
        <DatasetDataGrid datasetId='users' />
      </Box>
    </Box>
  )
}

export default Users
