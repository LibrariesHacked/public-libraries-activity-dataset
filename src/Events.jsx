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

import eventsMd from './content/events.md'
import eventsAttendanceMd from './content/events-attendance.md'
import eventsAttendanceByServiceMd from './content/events-attendance-by-service.md'

import Box from '@mui/material/Box'
import ListSubheader from '@mui/material/ListSubheader'
import Typography from '@mui/material/Typography'

import { getActiveServices } from './models/service'

import { useApplicationState } from './hooks/useApplicationState'

import * as eventsModel from './models/events'
import * as attendanceModel from './models/attendance'

const eventTypes = {
  Physical: {
    label: 'Physical'
  },
  Digital: {
    label: 'Virtual'
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
      text: `Events/attendance by service`
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Count of loans'
      },
      stacked: true,
      beginAtZero: true
    },
    y: {
      stacked: true
    }
  }
}

const Events = () => {
  const [
    { services, filteredServices, events, attendance },
    dispatchApplication
  ] = useApplicationState()

  const [eventsAttendanceChartData, setEventsAttendanceChartData] = useState([])

  const [eventsMarkdown, setEventsMarkdown] = useState('')
  const [eventsAttendanceMarkdown, setEventsAttendanceMarkdown] = useState('')

  useEffect(() => {
    fetch(eventsMd)
      .then(res => res.text())
      .then(text => setEventsMarkdown(text))
    fetch(eventsAttendanceMd)
      .then(res => res.text())
      .then(text => setEventsAttendanceMarkdown(text))
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

    const activeServices = getActiveServices(services, filteredServices)

    const monthLabels = [
      ...new Set([...events.map(e => e.month), ...attendance.map(a => a.month)])
    ].sort()

    // We have a dataset for each age group from events and attendance
    const ageGroups = [
      ...new Set([
        ...events.map(e => e.ageGroup),
        ...attendance.map(a => a.ageGroup)
      ])
    ].sort()

    const eventAttendanceCharts = []

    // We want a chart for each event type
    Object.keys(eventTypes).forEach(eventType => {
      const datasets = [
        // One dataset for attendance and one for events
        {
          label: `Attendance - ${eventType}`,
          data: monthLabels.map(month => {
            // Get the count of attendance for this event type and month
            return attendance
              .filter(
                a =>
                  a.type === eventType &&
                  a.month === month &&
                  activeServices.find(s => s.code === a.serviceCode)
              )
              .reduce((sum, a) => sum + (a.countAttendance || 0), 0)
          }),
          yAxisID: 'y1',
          type: 'line'
        },
        {
          label: `Events - ${eventType}`,
          data: monthLabels.map(month => {
            // Get the count of events for this event type and month
            return events
              .filter(
                e =>
                  e.type === eventType &&
                  e.month === month &&
                  activeServices.find(s => s.code === e.serviceCode)
              )
              .reduce((sum, e) => sum + (e.countEvents || 0), 0)
          }),
          yAxisID: 'y',
          stack: 'Stack 0'
        }
      ]

      eventAttendanceCharts.push({
        data: {
          labels: monthLabels,
          datasets
        },
        eventType,
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

    setEventsAttendanceChartData(eventAttendanceCharts)
  }, [filteredServices, services, events, attendance])

  return (
    <Box>
      <Typography variant='h3' gutterBottom>
        Events and attendance
      </Typography>
      <Markdown>{eventsMarkdown}</Markdown>
      {eventsAttendanceChartData.map((chart, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          <ListSubheader component='div' disableSticky disableGutters>
            {chart.eventType}
          </ListSubheader>
          <Bar data={chart.data} options={chart.options} />
        </Box>
      ))}
    </Box>
  )
}

export default Events
