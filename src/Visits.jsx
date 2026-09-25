import React, { useEffect, useState } from 'react'

import {
  BarElement,
  Chart as ChartJS,
  CategoryScale,
  Colors,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import { Bar, Line } from 'react-chartjs-2'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import visitsMd from './content/visits.md'
import visitsByLocationMd from './content/visits-by-location.md'
import visitsByServiceMd from './content/visits-by-service.md'

import { useApplicationState } from './hooks/useApplicationState'

import {
  filterByMonthRange,
  filterByPeriods,
  formatMonth,
  getMonthsInRange
} from './helpers/periods'

import { getActiveServices } from './models/service'
import * as visitsModel from './models/visits'

import CardGrid from './components/CardGrid'

ChartJS.register(
  BarElement,
  CategoryScale,
  Colors,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const visitsChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: 'Visits by location type over time'
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
      text: 'Visits by service per resident population'
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Visits per resident population per year'
      },
      stacked: true,
      beginAtZero: true
    },
    y: {
      stacked: true
    }
  }
}

const Visits = () => {
  const [
    { filteredServices, services, visits, monthRange, selectedPeriods },
    dispatchApplication
  ] = useApplicationState()

  const [visitData, setVisitData] = useState(null)

  const [serviceChart, setServiceChart] = useState({ labels: [], datasets: [] })

  const [visitsMarkdown, setVisitsMarkdown] = useState('')
  const [visitsByLocationMarkdown, setVisitsByLocationMarkdown] = useState('')
  const [visitsByServiceMarkdown, setVisitsByServiceMarkdown] = useState('')

  useEffect(() => {
    fetch(visitsMd)
      .then(res => res.text())
      .then(text => setVisitsMarkdown(text))
    fetch(visitsByLocationMd)
      .then(res => res.text())
      .then(text => setVisitsByLocationMarkdown(text))
    fetch(visitsByServiceMd)
      .then(res => res.text())
      .then(text => setVisitsByServiceMarkdown(text))
  }, [])

  useEffect(() => {
    const getVisits = async () => {
      const visits = await visitsModel.getVisits()
      dispatchApplication({ type: 'SetVisits', visits })
    }

    // Trigger download of visit data (if not already done)
    if (!visits) getVisits()
  }, [services, visits, dispatchApplication])

  useEffect(() => {
    if (!visits || !services) return

    let visitData = {}

    const filteredVisits = filteredServices?.length
      ? visits.filter(v => filteredServices.includes(v.serviceCode))
      : visits

    const locationTypes = [...new Set(visits.map(m => m.location))].sort()

    const chartVisits = filterByMonthRange(filteredVisits, monthRange)
    const labels = getMonthsInRange(monthRange)

    visitData = {
      labels,
      datasets: locationTypes.map(location => {
        return {
          label: location,
          data: labels.map(
            month =>
              chartVisits
                .filter(v => v.location === location && v.month === month)
                .reduce((sum, v) => sum + (v.countVisits || 0), 0) || 0
          )
        }
      })
    }

    setVisitData(visitData)

    const serviceVisits = filterByPeriods(filteredVisits, selectedPeriods)
    const yearCount = selectedPeriods?.length || 1

    const activeServices = getActiveServices(services, filteredServices)
    const serviceLabels = activeServices.map(s => s.niceName).sort()

    const datasets = locationTypes.map(locationType => {
      return {
        label: locationType,
        data: serviceLabels.map(serviceLabel => {
          const service = services.find(s => s.niceName === serviceLabel)
          const visitCount = serviceVisits
            .filter(v => {
              return (
                service.code === v.serviceCode && v.location === locationType
              )
            })
            .reduce((sum, v) => sum + (v.countVisits || 0), 0)

          const visitsPerCapita = service?.totalPopulation
            ? visitCount / service.totalPopulation / yearCount
            : 0
          return parseFloat(visitsPerCapita.toFixed(2))
        })
      }
    })

    // If visits data is null for a service change the label to include (no data)
    serviceLabels.forEach((label, index) => {
      const service = services.find(s => s.niceName === label)
      if (!service.visits) {
        serviceLabels[index] = `${label} (no data)`
      }
    })

    setServiceChart({ labels: serviceLabels, datasets })
  }, [visits, filteredServices, services, monthRange, selectedPeriods])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Visits
      </Typography>
      <CardGrid />
      <Markdown>{visitsMarkdown}</Markdown>
      <Typography variant='h5' gutterBottom>
        Visits by location
      </Typography>
      <Markdown>{visitsByLocationMarkdown}</Markdown>
      {visitData && <Line options={visitsChartOptions} data={visitData} />}
      <Typography variant='h5' gutterBottom>
        Visits types by service
      </Typography>
      <Markdown>{visitsByServiceMarkdown}</Markdown>
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

export default Visits
