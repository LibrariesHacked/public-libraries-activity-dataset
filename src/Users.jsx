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

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

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
  indexAxis: 'y',
  scales: {
    x: {
      stacked: true,
      title: { display: true, text: 'Number of users' }
    },
    y: {
      stacked: true,
      title: { display: true, text: 'Age group' }
    }
  }
}

const Users = () => {
  const [
    { filteredServices, services, serviceLookup, users },
    dispatchApplication
  ] = useApplicationState()

  const [data, setData] = useState({
    labels: [],
    datasets: []
  })

  const [usersMarkdown, setUsersMarkdown] = useState('')

  useEffect(() => {
    fetch(usersMd)
      .then(res => res.text())
      .then(text => setUsersMarkdown(text))
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
    let labels = []
    let datasets = []
    // The labels are the periods
    labels = [...new Set(users.map(m => m.period))].sort()
    // We have a dataset for each age group
    const ageGroups = [...new Set(users.map(m => m.ageGroup))].sort()
    ageGroups.push('Non-users') // Add non-users as an age group
    datasets = ageGroups.map((ageGroup, i) => {
      // For each age group we need the data for each period
      const data = labels.map(label => {
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
        data
      }
    })

    // Now we need to adjust the non-users to be total population minus users
    const nonUserIndex = ageGroups.indexOf('Non-users')
    if (nonUserIndex !== -1) {
      datasets[nonUserIndex].data = datasets[nonUserIndex].data.map(
        (totalNonUsers, index) => {
          // Total users for this period is the sum of all other datasets for this index
          const totalUsers = datasets.reduce((sum, dataset, dsIndex) => {
            if (dsIndex !== nonUserIndex) {
              return sum + dataset.data[index]
            }
            return sum
          }, 0)
          return Math.max(0, totalNonUsers - totalUsers)
        }
      )
    }

    setData({ labels, datasets })
  }, [users, filteredServices, serviceLookup])
  return (
    <Box>
      <Markdown>{usersMarkdown}</Markdown>
      <Typography variant='h6' gutterBottom>
        Active users by age group
      </Typography>
      <Bar options={ageGroupChartOptions} data={data} />
    </Box>
  )
}

export default Users
