import React, { useEffect, useState } from 'react'

import {
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
import { Line } from 'react-chartjs-2'

ChartJS.register(
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

import visitsMd from './content/visits.md'

import Box from '@mui/material/Box'

import { useApplicationState } from './hooks/useApplicationState'

import * as visitsModel from './models/visits'

const mapOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: 'Visits by Location Type'
    }
  }
}

const Visits = () => {
  const [{ filteredServices, services, visits }, dispatchApplication] =
    useApplicationState()

  const [visitData, setVisitData] = useState(null)

  const [visitsMarkdown, setVisitsMarkdown] = useState('')

  useEffect(() => {
    fetch(visitsMd)
      .then(res => res.text())
      .then(text => setVisitsMarkdown(text))
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

    const visitLocations = [...new Set(visits.map(m => m.location))].sort()

    // The labels are the months in the data. The months are already formattted as YYYY-MM
    const labels = [...new Set(filteredVisits.map(m => m.month))].sort()

    visitData = {
      labels: labels,
      datasets: visitLocations.map((location, index) => {
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
  }, [filteredServices, visits])
  return (
    <Box>
      <Markdown>{visitsMarkdown}</Markdown>
      {visitData && <Line options={mapOptions} data={visitData} />}
    </Box>
  )
}

export default Visits
