import React, { useEffect, useState } from 'react'

import {
  Chart as ChartJS,
  CategoryScale,
  Colors,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  Colors,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

import Markdown from 'react-markdown'

import usersMd from './content/users.md'
import usersByAgeGroupMd from './content/users-by-age-group.md'
import usersByServiceMd from './content/users-by-service.md'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { getActiveServices } from './models/service'

import { useApplicationState } from './hooks/useApplicationState'

import * as usersModel from './models/users'

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
      title: { display: true, text: 'Number of users' }
    },
    y: {
      stacked: true,
      title: { display: true, text: 'Year' }
    }
  }
}

const serviceChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: `Active users % population by service`
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Active users as % of population'
      },
      beginAtZero: true
    }
  }
}

const Users = () => {
  const [
    { filteredServices, services, serviceLookup, users },
    dispatchApplication
  ] = useApplicationState()

  const [ageGroupChart, setAgeGroupChart] = useState({
    labels: [],
    datasets: []
  })

  const [serviceChart, setServiceChart] = useState({ labels: [], datasets: [] })

  const [usersMarkdown, setUsersMarkdown] = useState('')
  const [usersByAgeGroupMarkdown, setUsersByAgeGroupMarkdown] = useState('')
  const [usersByServiceMarkdown, setUsersByServiceMarkdown] = useState('')

  useEffect(() => {
    fetch(usersMd)
      .then(res => res.text())
      .then(text => setUsersMarkdown(text))
    fetch(usersByAgeGroupMd)
      .then(res => res.text())
      .then(text => setUsersByAgeGroupMarkdown(text))
    fetch(usersByServiceMd)
      .then(res => res.text())
      .then(text => setUsersByServiceMarkdown(text))
  }, [])

  useEffect(() => {
    const getUsers = async () => {
      const users = await usersModel.getUsers()
      dispatchApplication({ type: 'SetUsers', users: users })
    }

    // Trigger download of users data (if not already done)
    if (!users) getUsers()
  }, [services, users, dispatchApplication])

  useEffect(() => {
    if (!users || !serviceLookup) return

    const activeServices = getActiveServices(services, filteredServices)

    const yearLabels = [...new Set(users.map(m => m.period))].sort()
    // We have a dataset for each age group
    const ageGroups = [...new Set(users.map(m => m.ageGroup))].sort()
    ageGroups.push('Non-users') // Add non-users as an age group
    const ageGroupChartDatasets = ageGroups.map((ageGroup, i) => {
      // For each age group we need the data for each period
      const data = yearLabels.map(label => {
        // For each period we need the total users in that age group
        let total = 0
        users.forEach(m => {
          if (m.period === label && m.ageGroup === ageGroup) {
            // If we are filtering by service, only include if the service is in the filtered list
            if (
              !filteredServices ||
              filteredServices.length === 0 ||
              filteredServices.includes(m.serviceCode)
            ) {
              total += m.countUsers
            }
          }
        })

        if (ageGroup === 'Non-users') {
          // We need to add in the non-users for this period.
          // Non-users are the total population for the period minus the users
          let totalPopulation = 0
          Object.values(serviceLookup).forEach(service => {
            if (service.period === label) {
              // If we are filtering by service, only include if the service is in the filtered list
              if (
                !filteredServices ||
                filteredServices.length === 0 ||
                filteredServices.includes(service.code)
              ) {
                totalPopulation += service.totalPopulation || 0
              }
            }
          })
          // The total non-users are the total population minus the total users
          total = totalPopulation // We'll change this later to subtract users
        }
        return total
      })
      return {
        label: ageGroup,
        data,
        barThickness: 20,
        hidden: ageGroup === 'Non-users'
      }
    })

    // Now we need to adjust the non-users to be total population minus users
    const nonUserIndex = ageGroups.indexOf('Non-users')
    if (nonUserIndex !== -1) {
      ageGroupChartDatasets[nonUserIndex].data = ageGroupChartDatasets[
        nonUserIndex
      ].data.map((totalNonUsers, index) => {
        // Total users for this period is the sum of all other datasets for this index
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

    const serviceLabels = activeServices.map(s => s.niceName).sort()

    const serviceData = serviceLabels.map(serviceLabel => {
      const svc = services.find(s => s.niceName === serviceLabel)
      if (!svc) return 0
      const totalUsers = svc.users || 0
      const totalPopulation = svc.totalPopulation || 0
      const percentageUsers =
        totalPopulation > 0 ? (totalUsers / totalPopulation) * 100 : 0
      return Math.round(percentageUsers)
    })

    setServiceChart({
      labels: serviceLabels,
      datasets: [
        {
          label: '% of population',
          data: serviceData,
          barThickness: 8
        }
      ]
    })
  }, [users, services, filteredServices, serviceLookup])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Active users
      </Typography>
      <Markdown>{usersMarkdown}</Markdown>
      <Typography variant='h5' gutterBottom>
        Active users by age group
      </Typography>
      <Markdown>{usersByAgeGroupMarkdown}</Markdown>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: `${ageGroupChart.labels.length * 30 + 120}px`
        }}
      >
        <Bar options={ageGroupChartOptions} data={ageGroupChart} />
      </Box>
      <Typography variant='h5' gutterBottom>
        Active users by service
      </Typography>
      <Markdown>{usersByServiceMarkdown}</Markdown>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: `${serviceChart.labels.length * 18 + 120}px`
        }}
      >
        <Bar options={serviceChartOptions} data={serviceChart} />
      </Box>
    </Box>
  )
}

export default Users
