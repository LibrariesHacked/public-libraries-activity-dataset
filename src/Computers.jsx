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

import Box from '@mui/material/Box'

import { useApplicationState } from './hooks/useApplicationState'

import * as computersModel from './models/computers'
import * as wifiModel from './models/wifi'

// We neeed a chart js chart of bar with a line for wifi
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

  useEffect(() => {
    const getComputers = async () => {
      const computers = await computersModel.getComputers()
      dispatchApplication({ type: 'SetComputers', computers: computers })
    }

    const getWiFi = async () => {
      const wifi = await wifiModel.getWiFi()
      dispatchApplication({ type: 'SetWiFi', wifi: wifi })
    }

    // Trigger download of members data (if not already done)
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

    const labels = [
      ...new Set(filteredWifi.map(wifi => wifi.month)),
      ...new Set(filteredComputers.map(computer => computer.year))
    ].sort()

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
      {computerChart && <Line options={chartOptions} data={computerChart} />}
    </Box>
  )
}

export default Computers
