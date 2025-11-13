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

import Markdown from 'react-markdown'

import eventsMd from './content/events.md'
import eventsAttendanceMd from './content/events-attendance.md'
import eventsAttendanceByServiceMd from './content/events-attendance-by-service.md'

import Box from '@mui/material/Box'
import ListSubheader from '@mui/material/ListSubheader'
import Typography from '@mui/material/Typography'

import { useApplicationState } from './hooks/useApplicationState'

import CardGrid from './components/CardGrid'

import { getActiveServices } from './models/service'
import * as eventsModel from './models/events'
import * as attendanceModel from './models/attendance'

ChartJS.register(
  CategoryScale,
  Colors,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

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
      text: 'Event counts and attendance by service'
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Count of events and attendees'
      },
      beginAtZero: true
    }
  }
}

const Events = () => {
  const [
    { services, filteredServices, events, attendance },
    dispatchApplication
  ] = useApplicationState()

  const [eventsAttendanceChartData, setEventsAttendanceChartData] = useState([])
  const [serviceChart, setServiceChart] = useState({ labels: [], datasets: [] })

  const [eventsMarkdown, setEventsMarkdown] = useState('')
  const [eventsAttendanceMarkdown, setEventsAttendanceMarkdown] = useState('')
  const [
    eventsAttendanceByServiceMarkdown,
    setEventsAttendanceByServiceMarkdown
  ] = useState('')

  useEffect(() => {
    fetch(eventsMd)
      .then(res => res.text())
      .then(text => setEventsMarkdown(text))
    fetch(eventsAttendanceMd)
      .then(res => res.text())
      .then(text => setEventsAttendanceMarkdown(text))
    fetch(eventsAttendanceByServiceMd)
      .then(res => res.text())
      .then(text => setEventsAttendanceByServiceMarkdown(text))
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
              stacked: true,
              title: {
                display: true,
                text: 'Month'
              },
              ticks: {
                callback: function (value) {
                  const label = this.getLabelForValue(value)
                  const date = new Date(label + '-01')
                  return date.toLocaleDateString('en-GB', {
                    month: 'short',
                    year: '2-digit'
                  })
                }
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Count of events (bars)'
              },
              stacked: true
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Count of attendees (lines)'
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

    const serviceLabels = activeServices.map(s => s.niceName).sort()

    const datasets = ['Events', 'Attendance'].map((label, i) => {
      const data = serviceLabels.map(serviceLabel => {
        const serviceCode = services.find(
          s => s.niceName === serviceLabel
        )?.code
        if (!serviceCode) return 0

        if (label === 'Events') {
          return events
            .filter(
              e =>
                activeServices.find(s => s.code === e.serviceCode) &&
                e.serviceCode === serviceCode
            )
            .reduce((sum, e) => sum + (e.countEvents || 0), 0)
        } else {
          return attendance
            .filter(
              a =>
                activeServices.find(s => s.code === a.serviceCode) &&
                a.serviceCode === serviceCode
            )
            .reduce((sum, a) => sum + (a.countAttendance || 0), 0)
        }
      })
      return {
        label,
        data
      }
    })

    // If events and attendees are null for a service change the label to include (no data)
    serviceLabels.forEach((label, index) => {
      const service = services.find(s => s.niceName === label)
      if (!service.events && !service.attendance) {
        serviceLabels[index] = `${label} (no data)`
      }
    })

    setServiceChart({
      labels: serviceLabels,
      datasets
    })
  }, [filteredServices, services, events, attendance])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Events and attendance
      </Typography>
      <CardGrid />
      <Markdown>{eventsMarkdown}</Markdown>
      <Typography variant='h5' gutterBottom>
        Event count and attendance by type
      </Typography>
      <Markdown>{eventsAttendanceMarkdown}</Markdown>
      {eventsAttendanceChartData.map((chart, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <ListSubheader component='div' disableSticky disableGutters>
            {chart.eventType}
          </ListSubheader>
          <Bar data={chart.data} options={chart.options} />
        </Box>
      ))}
      <Typography variant='h5' gutterBottom>
        Events and attendance by service
      </Typography>
      <Markdown>{eventsAttendanceByServiceMarkdown}</Markdown>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: `${(serviceChart?.labels?.length || 1) * 30 + 120}px`
        }}
      >
        <Bar options={serviceChartOptions} data={serviceChart} />
      </Box>
    </Box>
  )
}

export default Events
