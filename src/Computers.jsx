import React, { useEffect, useState } from 'react'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

import Markdown from 'react-markdown'

import computersMd from './content/computers.md'

import Box from '@mui/material/Box'

import { useApplicationState } from './hooks/useApplicationState'

import * as computersModel from './models/computers'
import * as wifiModel from './models/wifi'

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: 'Chart.js Line Chart'
    }
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'Computer Usage Hours'
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'WiFi Usage Sessions'
      },
      grid: {
        drawOnChartArea: false
      }
    }
  }
}

const Computers = () => {
  const [{ filteredServices, services, computers, wifi }, dispatchApplication] =
    useApplicationState()

  const [computerChart, setComputerChart] = useState(null)

  const [computersMarkdown, setComputersMarkdown] = useState('')

  useEffect(() => {
    fetch(computersMd)
      .then(res => res.text())
      .then(text => setComputersMarkdown(text))
  }, [])

  useEffect(() => {
    const getComputers = async () => {
      const computers = await computersModel.getComputers()
      dispatchApplication({ type: 'SetComputers', computers: computers })
    }

    const getWiFi = async () => {
      const wifi = await wifiModel.getWiFi()
      dispatchApplication({ type: 'SetWiFi', wifi: wifi })
    }

    // Trigger download of computers and wifi data if not already present
    if (!computers || !wifi) {
      getComputers()
      getWiFi()
    }
  }, [services, computers, wifi, dispatchApplication])

  useEffect(() => {
    if (!computers || !wifi) return

    let computerChart = {}

    const filteredWifi = wifi.filter(m =>
      filteredServices.length === 0
        ? true
        : filteredServices.includes(m.serviceCode)
    )

    const filteredComputers = computers.filter(m =>
      filteredServices.length === 0
        ? true
        : filteredServices.includes(m.serviceCode)
    )

    // Create a new set of labels from both datasets
    const labels = Array.from(
      new Set([
        ...filteredComputers.map(c => c.month),
        ...filteredWifi.map(w => w.month)
      ])
    ).sort()

    const datasets = [
      {
        label: 'Computer hours',
        data: labels.map(label => {
          return (
            filteredComputers
              .filter(c => c.month === label)
              .reduce((sum, v) => sum + (v.countHours || 0), 0) || 0
          )
        })
      },
      {
        label: 'WiFi sessions',
        data: labels.map(label => {
          return (
            filteredWifi
              .filter(w => w.month === label)
              .reduce((sum, v) => sum + (v.countSessions || 0), 0) || 0
          )
        })
      }
    ]

    computerChart = {
      format: 'Computer Usage Hours vs WiFi Sessions',
      options: chartOptions,
      labels: labels,
      datasets: datasets.map((d, index) => ({
        ...d,
        borderColor: index === 0 ? 'rgb(53, 162, 235)' : 'rgb(255, 99, 132)',
        backgroundColor:
          index === 0 ? 'rgba(53, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)',
        yAxisID: index === 0 ? 'y' : 'y1'
      }))
    }

    setComputerChart(computerChart)
  }, [filteredServices, computers, wifi])
  return (
    <Box>
      <h3>Public computers and WiFi usage</h3>
      <Markdown>{computersMarkdown}</Markdown>
      {computerChart && <Line options={chartOptions} data={computerChart} />}
    </Box>
  )
}

export default Computers
