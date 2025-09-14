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

import { Bar, Line } from 'react-chartjs-2'

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
import computersWifiMd from './content/computers-wifi.md'
import computersWiFiByServiceMd from './content/computers-wifi-by-service.md'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { getActiveServices } from './models/service'

import { useApplicationState } from './hooks/useApplicationState'

import * as computersModel from './models/computers'
import * as wifiModel from './models/wifi'

const computersWiFiChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: 'Computer usage hours vs WiFi sessions'
    }
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'Computer hours'
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'WiFi sessions'
      }
    }
  }
}

const serviceChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: `Loans by service and format`
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Count of loans'
      },
      beginAtZero: true
    }
  }
}

const Computers = () => {
  const [{ filteredServices, services, computers, wifi }, dispatchApplication] =
    useApplicationState()

  const [computersWiFiChart, setComputersWiFiChart] = useState({
    datasets: [],
    labels: []
  })

  const [serviceChart, setServiceChart] = useState({ datasets: [], labels: [] })

  const [computersMarkdown, setComputersMarkdown] = useState('')
  const [computersWiFiMarkdown, setComputersWiFiMarkdown] = useState('')
  const [computersWiFiByServiceMarkdown, setComputersWiFiByServiceMarkdown] =
    useState('')

  useEffect(() => {
    fetch(computersMd)
      .then(res => res.text())
      .then(text => setComputersMarkdown(text))
    fetch(computersWifiMd)
      .then(res => res.text())
      .then(text => setComputersWiFiMarkdown(text))
    fetch(computersWiFiByServiceMd)
      .then(res => res.text())
      .then(text => setComputersWiFiByServiceMarkdown(text))
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
    if (!computers || !wifi) {
      getComputers()
      getWiFi()
    }
  }, [services, computers, wifi, dispatchApplication])

  useEffect(() => {
    if (!computers || !wifi) return

    const activeServices = getActiveServices(services, filteredServices)

    const filteredWifi = wifi.filter(m =>
      activeServices.find(s => s.code === m.serviceCode)
    )

    const filteredComputers = computers.filter(m =>
      activeServices.find(s => s.code === m.serviceCode)
    )

    // Create a new set of labels from both datasets
    const monthLabels = Array.from(
      new Set([
        ...filteredComputers.map(c => c.month),
        ...filteredWifi.map(w => w.month)
      ])
    ).sort()

    const datasets = [
      {
        label: 'Computer hours',
        data: monthLabels.map(label => {
          return (
            filteredComputers
              .filter(c => c.month === label)
              .reduce((sum, v) => sum + (v.countHours || 0), 0) || 0
          )
        })
      },
      {
        label: 'WiFi sessions',
        data: monthLabels.map(label => {
          return (
            filteredWifi
              .filter(w => w.month === label)
              .reduce((sum, v) => sum + (v.countSessions || 0), 0) || 0
          )
        })
      }
    ]

    const computersWiFiChart = {
      format: 'Computer Usage Hours vs WiFi Sessions',
      labels: monthLabels,
      datasets: datasets.map((d, index) => ({
        ...d,
        borderColor: index === 0 ? 'rgb(53, 162, 235)' : 'rgb(255, 99, 132)',
        backgroundColor:
          index === 0 ? 'rgba(53, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)',
        yAxisID: index === 0 ? 'y' : 'y1'
      }))
    }

    setComputersWiFiChart(computersWiFiChart)
  }, [filteredServices, services, computers, wifi])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Computer and WiFi usage
      </Typography>
      <Markdown>{computersMarkdown}</Markdown>
      <Typography variant='h5' gutterBottom>
        Computer and WiFi usage
      </Typography>
      <Markdown>{computersWiFiMarkdown}</Markdown>
      <Line options={computersWiFiChartOptions} data={computersWiFiChart} />
      <Typography variant='h5' gutterBottom>
        Service comparison
      </Typography>
      <Markdown>{computersWiFiByServiceMarkdown}</Markdown>
      {serviceChart && serviceChart.labels && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: `${serviceChart.labels.length * 18 + 120}px`
          }}
        >
          <Bar options={serviceChartOptions} data={serviceChart} />
        </Box>
      )}
    </Box>
  )
}

export default Computers
