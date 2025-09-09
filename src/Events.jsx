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

import Markdown from 'react-markdown'

import eventsMd from './content/events.md'

import Box from '@mui/material/Box'

import { useApplicationState } from './hooks/useApplicationState'

import * as eventsModel from './models/events'
import * as attendanceModel from './models/attendance'

const eventTypes = {
  Physical: {
    label: 'Physical',
    color: 'hsl(210, 70%, 50%)'
  },
  Digital: {
    label: 'Virtual',
    color: 'hsl(120, 70%, 50%)'
  }
}

const Events = () => {
  const [{ filteredServices, events, attendance }, dispatchApplication] =
    useApplicationState()

  const [chartData, setChartData] = useState([])

  const [eventsMarkdown, setEventsMarkdown] = useState('')

  useEffect(() => {
    fetch(eventsMd)
      .then(res => res.text())
      .then(text => setEventsMarkdown(text))
  }, [])

  useEffect(() => {
    const getEvents = async () => {
      const events = await eventsModel.getEvents()
      dispatchApplication({ type: 'SetEvents', events })
    }

    const getAttendance = async () => {
      const attendance = await attendanceModel.getAttendance()
      dispatchApplication({ type: 'SetAttendance', attendance })
    }
    if (!events && !attendance) {
      getEvents()
      getAttendance()
    }
  }, [events, attendance, dispatchApplication])

  useEffect(() => {
    if (!events || !attendance) return
    let labels = []
    let datasets = []
    // The labels are the periods and we want all the periods from events and attendance
    labels = [
      ...new Set([...events.map(e => e.month), ...attendance.map(a => a.month)])
    ].sort()
    // We have a dataset for each age group from events and attendance
    const ageGroups = [
      ...new Set([
        ...events.map(e => e.ageGroup),
        ...attendance.map(a => a.ageGroup)
      ])
    ].sort()

    const charts = []

    // We want a chart for each event type
    Object.keys(eventTypes).forEach((eventType, eventTypeIndex) => {
      const datasets = []
      ageGroups.forEach((ageGroup, ageGroupIndex) => {
        const ageGroupDatasets = [
          // One dataset for attendance and one for events
          {
            label: `Attendance - ${ageGroup}`,
            data: [],
            borderColor: eventTypes[eventType].color,
            backgroundColor: `hsla(${
              (eventTypeIndex * 360) / Object.keys(eventTypes).length
            }, 70%, 50%, ${0.5 + (ageGroupIndex / ageGroups.length) * 0.5})`,
            yAxisID: 'y1',
            type: 'line'
          },
          {
            label: `Events - ${ageGroup}`,
            borderColor: eventTypes[eventType].color,
            backgroundColor: `hsla(${
              (eventTypeIndex * 360) / Object.keys(eventTypes).length
            }, 70%, 50%, ${0.5 + (ageGroupIndex / ageGroups.length) * 0.5})`,
            data: [],
            yAxisID: 'y',
            stack: 'Stack 0'
          }
        ]
        labels.forEach(label => {
          // Get the count of events for this event type, age group and month
          const eventCount = events
            .filter(
              e =>
                e.type === eventType &&
                e.ageGroup === ageGroup &&
                e.month === label
            )
            .reduce((sum, e) => sum + (e.countEvents || 0), 0)
          ageGroupDatasets[1].data.push(eventCount)
          // Get the count of attendance for this event type, age group and month
          const attendanceCount = attendance
            .filter(
              a =>
                a.type === eventType &&
                a.ageGroup === ageGroup &&
                a.month === label
            )
            .reduce((sum, a) => sum + (a.countAttendance || 0), 0)
          ageGroupDatasets[0].data.push(attendanceCount)
        })
        datasets.push(...ageGroupDatasets)
      })
      charts.push({
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false
          },
          stacked: false,
          plugins: {
            title: {
              display: true,
              text: `Events and Attendance - ${eventTypes[eventType].label}`
            }
          },
          scales: {
            x: {
              stacked: true
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Number of events (bars)'
              },
              stacked: true
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Number of attendees (lines)'
              },
              grid: {
                drawOnChartArea: false
              },
              stacked: true
            }
          }
        }
      })
    })

    setChartData(charts)
  }, [filteredServices, events, attendance])
  return (
    <Box>
      <Markdown>{eventsMarkdown}</Markdown>
      {chartData.map((chart, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          <Bar data={chart.data} options={chart.options} />
        </Box>
      ))}
    </Box>
  )
}

export default Events
