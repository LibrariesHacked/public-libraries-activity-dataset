import React, { useEffect, useState } from 'react'

import Markdown from 'react-markdown'

import eventsMd from './content/events.md?raw'
import eventsAttendanceMd from './content/events-attendance.md?raw'
import eventsAttendanceByServiceMd from './content/events-attendance-by-service.md?raw'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { useApplicationState } from './hooks/useApplicationState'

import CardGrid from './components/CardGrid'
import { AppChart } from './components/charts'

import {
  createTimelineChartOptions,
  createServiceBarChartOptions,
  formatServiceLabelsWithNoData,
  sortServicesByMetric
} from './helpers/charts'

import {
  filterByMonthRange,
  filterByPeriods,
  getMonthsInRange
} from './helpers/periods'

import { getActiveServices } from './models/service'
import * as eventsModel from './models/events'
import * as attendanceModel from './models/attendance'

/**
 * Configuration mapping event delivery medium keys to human-readable chart labels.
 */
const eventTypes = {
  Physical: {
    label: 'Physical'
  },
  Digital: {
    label: 'Virtual'
  }
}

/**
 * Chart configuration options for the service comparison bar chart displaying event counts and attendee totals.
 */
const serviceChartOptions = createServiceBarChartOptions(
  'Event counts and attendance by service',
  'Events and attendance'
)

/**
 * Events and attendance dashboard page view displaying summary KPI cards,
 * monthly dual-axis timeline charts (events count vs attendance), and authority comparisons.
 *
 * @returns {JSX.Element} The rendered Events page view.
 */
const Events = () => {
  const [
    {
      services,
      filteredServices,
      events,
      attendance,
      monthRange,
      selectedPeriods
    },
    dispatchApplication
  ] = useApplicationState()

  const [eventsAttendanceChartData, setEventsAttendanceChartData] = useState([])
  const [serviceChart, setServiceChart] = useState({ labels: [], datasets: [] })

  useEffect(() => {
    const getEvents = async () => {
      const events = await eventsModel.getEvents()
      dispatchApplication({ type: 'SetEvents', events })
    }

    const getAttendance = async () => {
      const attendance = await attendanceModel.getAttendance()
      dispatchApplication({ type: 'SetAttendance', attendance })
    }
    if (!events) getEvents()
    if (!attendance) getAttendance()
  }, [events, attendance, dispatchApplication])

  useEffect(() => {
    if (!events || !attendance || !services) return

    const activeServices = getActiveServices(services, filteredServices)
    const activeServiceCodes = new Set(activeServices.map(s => s.code))

    const monthLabels = getMonthsInRange(monthRange)

    const chartEvents = filterByMonthRange(events, monthRange)
    const chartAttendance = filterByMonthRange(attendance, monthRange)

    // Pre-aggregate monthly attendance: (type, month) -> sum
    const attendanceTypeMonthMap = new Map()
    for (let i = 0; i < chartAttendance.length; i++) {
      const a = chartAttendance[i]
      if (a.countAttendance && activeServiceCodes.has(a.serviceCode)) {
        const key = `${a.type}|||${a.month}`
        attendanceTypeMonthMap.set(
          key,
          (attendanceTypeMonthMap.get(key) || 0) + a.countAttendance
        )
      }
    }

    // Pre-aggregate monthly events: (type, month) -> sum
    const eventsTypeMonthMap = new Map()
    for (let i = 0; i < chartEvents.length; i++) {
      const e = chartEvents[i]
      if (e.countEvents && activeServiceCodes.has(e.serviceCode)) {
        const key = `${e.type}|||${e.month}`
        eventsTypeMonthMap.set(
          key,
          (eventsTypeMonthMap.get(key) || 0) + e.countEvents
        )
      }
    }

    const eventAttendanceCharts = []

    // We want a chart for each event type
    Object.keys(eventTypes).forEach(eventType => {
      const datasets = [
        // One dataset for attendance and one for events
        {
          label: `Attendance - ${eventType}`,
          data: monthLabels.map(
            month => attendanceTypeMonthMap.get(`${eventType}|||${month}`) || 0
          ),
          yAxisID: 'y1',
          type: 'line'
        },
        {
          label: `Events - ${eventType}`,
          data: monthLabels.map(
            month => eventsTypeMonthMap.get(`${eventType}|||${month}`) || 0
          ),
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
        options: createTimelineChartOptions(
          `Events and attendance - ${eventTypes[eventType].label}`,
          'Count of events (bars)',
          'Count of attendees (lines)',
          {
            stacked: true,
            interaction: { mode: 'index', intersect: false }
          }
        )
      })
    })

    setEventsAttendanceChartData(eventAttendanceCharts)

    const serviceEvents = filterByPeriods(events, selectedPeriods)
    const serviceAttendance = filterByPeriods(attendance, selectedPeriods)

    // Pre-aggregate service events and attendance
    const serviceEventsMap = new Map()
    for (let i = 0; i < serviceEvents.length; i++) {
      const e = serviceEvents[i]
      if (e.countEvents && activeServiceCodes.has(e.serviceCode)) {
        serviceEventsMap.set(
          e.serviceCode,
          (serviceEventsMap.get(e.serviceCode) || 0) + e.countEvents
        )
      }
    }

    const serviceAttendanceMap = new Map()
    for (let i = 0; i < serviceAttendance.length; i++) {
      const a = serviceAttendance[i]
      if (a.countAttendance && activeServiceCodes.has(a.serviceCode)) {
        serviceAttendanceMap.set(
          a.serviceCode,
          (serviceAttendanceMap.get(a.serviceCode) || 0) + a.countAttendance
        )
      }
    }

    // ONS: Order categories in bar charts by value descending (services with no data at bottom)
    const getServiceTotalEventsAttendance = service => {
      if (!service?.code) return 0
      return (
        (serviceAttendanceMap.get(service.code) || 0) +
        (serviceEventsMap.get(service.code) || 0)
      )
    }

    const sortedServices = sortServicesByMetric(
      activeServices,
      getServiceTotalEventsAttendance,
      s => s?.events || s?.attendance
    )

    const rawServiceLabels = sortedServices.map(s => s.niceName)
    const serviceByNiceName = new Map(sortedServices.map(s => [s.niceName, s]))

    const datasets = [
      {
        label: 'Events',
        data: rawServiceLabels.map(serviceLabel => {
          const service = serviceByNiceName.get(serviceLabel)
          return service ? serviceEventsMap.get(service.code) || 0 : 0
        })
      },
      {
        label: 'Attendance',
        data: rawServiceLabels.map(serviceLabel => {
          const service = serviceByNiceName.get(serviceLabel)
          return service ? serviceAttendanceMap.get(service.code) || 0 : 0
        })
      }
    ]

    const serviceLabels = formatServiceLabelsWithNoData(
      rawServiceLabels,
      serviceByNiceName,
      s => s?.events || s?.attendance
    )

    setServiceChart({
      labels: serviceLabels,
      datasets
    })
  }, [
    filteredServices,
    services,
    events,
    attendance,
    monthRange,
    selectedPeriods
  ])

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Events and attendance
      </Typography>
      <CardGrid />
      <Markdown>{eventsMd}</Markdown>
      <Typography variant='h5' gutterBottom>
        Event count and attendance by type
      </Typography>
      <Markdown>{eventsAttendanceMd}</Markdown>
      {eventsAttendanceChartData.map((chart, index) => (
        <AppChart
          key={index}
          type='bar'
          title={chart.eventType}
          data={chart.data}
          options={chart.options}
        />
      ))}
      <Typography variant='h5' gutterBottom>
        Events and attendance by service
      </Typography>
      <Markdown>{eventsAttendanceByServiceMd}</Markdown>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />
    </Box>
  )
}

export default Events
