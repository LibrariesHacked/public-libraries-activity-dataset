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

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import visitsMd from './content/visits.md'
import visitsByLocationMd from './content/visits-by-location.md'
import visitsByServiceMd from './content/visits-by-service.md'

import { getActiveServices } from './models/service'

import { useApplicationState } from './hooks/useApplicationState'

import * as visitsModel from './models/visits'

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
        text: 'Count of visits'
      },
      beginAtZero: true
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
      text: `Visits by service per capita`
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Visits per capita'
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
  const [{ filteredServices, services, visits }, dispatchApplication] =
    useApplicationState()

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
      dispatchApplication({ type: 'SetVisits', visits: visits })
    }

    // Trigger download of visit data (if not already done)
    if (!visits) getVisits()
  }, [services, visits, dispatchApplication])

  useEffect(() => {
    if (!visits) return

    let visitData = {}

    const filteredVisits = filteredServices?.length
      ? visits.filter(v => filteredServices.includes(v.serviceCode))
      : visits

    const locationTypes = [...new Set(visits.map(m => m.location))].sort()

    // The labels are the months in the data. The months are already formattted as YYYY-MM
    const labels = [...new Set(filteredVisits.map(m => m.month))].sort()

    visitData = {
      labels: labels,
      datasets: locationTypes.map((location, index) => {
        return {
          label: location,
          data: labels.map(
            month =>
              filteredVisits
                .filter(v => v.location === location && v.month === month)
                .reduce((sum, v) => sum + (v.countVisits || 0), 0) || 0
          )
        }
      })
    }

    setVisitData(visitData)

    // Now build the service comparison chart
    const activeServices = getActiveServices(services, filteredServices)
    const serviceLabels = activeServices.map(s => s.niceName).sort()

    const datasets = locationTypes.map((locationType, index) => {
      return {
        label: locationType,
        data: serviceLabels.map(serviceLabel => {
          const service = services.find(s => s.niceName === serviceLabel)
          const visitCount = filteredVisits
            .filter(v => {
              return (
                service.code === v.serviceCode && v.location === locationType
              )
            })
            .reduce((sum, v) => sum + (v.countVisits || 0), 0)

          const visitsPerCapita = service?.totalPopulation
            ? (visitCount / service.totalPopulation) * 100
            : 0
          return parseFloat(visitsPerCapita.toFixed(2))
        })
      }
    })

    setServiceChart({ labels: serviceLabels, datasets: datasets })
  }, [visits, filteredServices, services])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Visits
      </Typography>
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
