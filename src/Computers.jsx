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

import Markdown from 'react-markdown'

import computersMd from './content/computers.md'
import computersWifiMd from './content/computers-wifi.md'
import computersWiFiByServiceMd from './content/computers-wifi-by-service.md'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { useApplicationState } from './hooks/useApplicationState'

import CardGrid from './components/CardGrid'

import {
  filterByMonthRange,
  filterByPeriods,
  formatMonth,
  getMonthsInRange
} from './helpers/periods'

import { getActiveServices } from './models/service'
import * as computersModel from './models/computers'
import * as wifiModel from './models/wifi'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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
    x: {
      title: {
        display: true,
        text: 'Month'
      },
      ticks: {
        callback: function (value) {
          return formatMonth(this.getLabelForValue(value))
        }
      }
    },
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
      text: 'Computer hours and WiFi sessions by service and format'
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Count of computer hours and WiFi sessions'
      },
      beginAtZero: true
    }
  }
}

const Computers = () => {
  const [
    { filteredServices, services, computers, wifi, monthRange, selectedPeriods },
    dispatchApplication
  ] = useApplicationState()

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
      dispatchApplication({ type: 'SetComputers', computers })
    }
    const getWiFi = async () => {
      const wifi = await wifiModel.getWiFi()
      dispatchApplication({ type: 'SetWiFi', wifi })
    }
    if (!computers || !wifi) {
      getComputers()
      getWiFi()
    }
  }, [services, computers, wifi, dispatchApplication])

  useEffect(() => {
    if (!computers || !wifi || !services) return

    const activeServices = getActiveServices(services, filteredServices)

    const filteredWifi = wifi.filter(m =>
      activeServices.find(s => s.code === m.serviceCode)
    )

    const filteredComputers = computers.filter(m =>
      activeServices.find(s => s.code === m.serviceCode)
    )

    const chartComputers = filterByMonthRange(filteredComputers, monthRange)
    const chartWifi = filterByMonthRange(filteredWifi, monthRange)

    const monthLabels = getMonthsInRange(monthRange)

    const computersWiFiDatasets = [
      {
        label: 'Computer hours',
        data: monthLabels.map(label => {
          return (
            chartComputers
              .filter(c => c.month === label)
              .reduce((sum, v) => sum + (v.countHours || 0), 0) || 0
          )
        })
      },
      {
        label: 'WiFi sessions',
        data: monthLabels.map(label => {
          return (
            chartWifi
              .filter(w => w.month === label)
              .reduce((sum, v) => sum + (v.countSessions || 0), 0) || 0
          )
        })
      }
    ]

    const computersWiFiChart = {
      format: 'Computer Usage Hours vs WiFi Sessions',
      labels: monthLabels,
      datasets: computersWiFiDatasets.map((d, index) => ({
        ...d,
        yAxisID: index === 0 ? 'y' : 'y1'
      }))
    }

    setComputersWiFiChart(computersWiFiChart)

    // The service chart is a total computer hours and wifi sessions by service per resident population
    const serviceComputers = filterByPeriods(filteredComputers, selectedPeriods)
    const serviceWifi = filterByPeriods(filteredWifi, selectedPeriods)

    const serviceLabels = activeServices.map(s => s.niceName).sort()

    const serviceDatasets = [
      {
        label: 'Computer hours',
        data: serviceLabels.map(serviceLabel => {
          const serviceCode = services.find(
            s => s.niceName === serviceLabel
          )?.code
          if (!serviceCode) return null

          return (
            serviceComputers
              .filter(c => c.serviceCode === serviceCode)
              .reduce((sum, v) => sum + (v.countHours || 0), 0) || 0
          )
        })
      },
      {
        label: 'WiFi sessions',
        data: serviceLabels.map(serviceLabel => {
          const serviceCode = services.find(
            s => s.niceName === serviceLabel
          )?.code
          if (!serviceCode) return null

          return (
            serviceWifi
              .filter(w => w.serviceCode === serviceCode)
              .reduce((sum, v) => sum + (v.countSessions || 0), 0) || 0
          )
        })
      }
    ]

    // If computer hours and wifi are null for a service change the label to include (no data)
    serviceLabels.forEach((label, index) => {
      const service = services.find(s => s.niceName === label)
      if (!service.computerHours && !service.wifiSessions) {
        serviceLabels[index] = `${label} (no data)`
      }
    })

    setServiceChart({
      labels: serviceLabels,
      datasets: serviceDatasets
    })
  }, [
    filteredServices,
    services,
    computers,
    wifi,
    monthRange,
    selectedPeriods
  ])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Computers and WiFi
      </Typography>
      <CardGrid />
      <Markdown>{computersMarkdown}</Markdown>
      <Typography variant='h5' gutterBottom>
        Computer hours and WiFi sessions over time
      </Typography>
      <Markdown>{computersWiFiMarkdown}</Markdown>
      <Box sx={{ mb: 2 }}>
        <Line options={computersWiFiChartOptions} data={computersWiFiChart} />
      </Box>
      <Typography variant='h5' gutterBottom>
        Computer hours and WiFi sessions by service
      </Typography>
      <Markdown>{computersWiFiByServiceMarkdown}</Markdown>
      {serviceChart && serviceChart.labels && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: `${serviceChart.labels.length * 28 + 120}px`
          }}
        >
          <Bar options={serviceChartOptions} data={serviceChart} />
        </Box>
      )}
    </Box>
  )
}

export default Computers
