import React, { useEffect, useState } from 'react'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const options = {
  plugins: {
    title: {
      display: true,
      text: 'Membership by age group'
    }
  },
  responsive: true,
  indexAxis: 'y',
  scales: {
    x: {
      stacked: true
    },
    y: {
      stacked: true
    }
  }
}

import Box from '@mui/material/Box'

import { useApplicationState } from './hooks/useApplicationState'

import * as membershipModel from './models/membership'

const Events = () => {
  const [
    { filteredServices, services, serviceLookup, members },
    dispatchApplication
  ] = useApplicationState()

  const [data, setData] = useState({
    labels: [],
    datasets: []
  })

  useEffect(() => {
    const getMembers = async () => {
      const members = await membershipModel.getMembership()
      dispatchApplication({ type: 'SetMembers', members: members })
    }

    // Trigger download of members data (if not already done)
    if (!members) getMembers()
  }, [services, members, dispatchApplication])

  useEffect(() => {
    if (!members || !serviceLookup) return
    let labels = []
    let datasets = []
    // The labels are the periods
    labels = [...new Set(members.map(m => m.period))].sort()
    // We have a dataset for each age group
    const ageGroups = [...new Set(members.map(m => m.ageGroup))].sort()
    ageGroups.push('Non-members') // Add non-members as an age group
    datasets = ageGroups.map((ageGroup, i) => {
      // For each age group we need the data for each period
      const data = labels.map(label => {
        // For each period we need the total members in that age group
        let total = 0
        members.forEach(m => {
          if (m.period === label && m.ageGroup === ageGroup) {
            // If we are filtering by service, only include if the service is in the filtered list
            if (
              !filteredServices ||
              filteredServices.length === 0 ||
              filteredServices.includes(m.serviceCode)
            ) {
              total += m.countMembers
            }
          }
        })

        if (ageGroup === 'Non-members') {
          // We need to add in the non-members for this period.
          // Non-members are the total population for the period minus the members
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
          // The total non members are the total population minus the total members
          total = totalPopulation // We'll change this later to subtract members
        }
        return total
      })
      const color = `hsl(${(i * 360) / ageGroups.length}, 70%, 50%)`
      return {
        label: ageGroup,
        data,
        backgroundColor: color
      }
    })

    // Now we need to adjust the non-members to be total population minus members
    const nonMemberIndex = ageGroups.indexOf('Non-members')
    if (nonMemberIndex !== -1) {
      datasets[nonMemberIndex].data = datasets[nonMemberIndex].data.map((
        (totalNonMembers, index) => {
          // Total members for this period is the sum of all other datasets for this index
          const totalMembers = datasets.reduce((sum, dataset, dsIndex) => {
            if (dsIndex !== nonMemberIndex) {
              return sum + dataset.data[index]
            }
            return sum
          }, 0)
          return Math.max(0, totalNonMembers - totalMembers)
        }
      ))
    }

    setData({ labels, datasets })
  }, [members, filteredServices, serviceLookup])
  return (
    <Box>
      <Bar options={options} data={data} />
    </Box>
  )
}

export default Events
