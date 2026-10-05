import React, { useEffect, useMemo, useState } from 'react'

import Markdown from 'react-markdown'

import eventsMd from './content/events.md?raw'
import eventsAttendanceMd from './content/events-attendance.md?raw'
import eventsAttendanceByServiceMd from './content/events-attendance-by-service.md?raw'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { useApplicationState } from './hooks/useApplicationState'

import CardGrid from './components/CardGrid'
import DatasetDataGrid from './components/DatasetDataGrid'
import { AppChart } from './components/charts'

import {
  createTimelineChartOptions,
  createServiceBarChartOptions,
  formatServiceLabelsWithNoData,
  sortServicesByMetric
} from './helpers/charts'

import {
  filterByMonthRange,
  getMonthsInRange
} from './helpers/periods'

import { getActiveServices, getRegionAggregates } from './models/service'
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
      comparisonMode,
      selectedRegions
    },
    dispatchApplication
  ] = useApplicationState()

  const isRegionMode = comparisonMode === 'regions'

  const serviceChartOptions = useMemo(
    () =>
      createServiceBarChartOptions(
        isRegionMode
          ? 'Event counts and attendance by region'
          : 'Event counts and attendance by service',
        'Events and attendance'
      ),
    [isRegionMode]
  )

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

    const serviceEvents = filterByMonthRange(events, monthRange)
    const serviceAttendance = filterByMonthRange(attendance, monthRange)

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

    if (isRegionMode) {
      const regionAggregates = getRegionAggregates(services, selectedRegions)

      const getRegionTotalEventsAttendance = region => {
        let total = 0
        for (const sCode of region.serviceCodes) {
          total +=
            (serviceAttendanceMap.get(sCode) || 0) +
            (serviceEventsMap.get(sCode) || 0)
        }
        return total
      }

      const sortedRegions = sortServicesByMetric(
        regionAggregates,
        getRegionTotalEventsAttendance,
        r => r?.events || r?.attendance
      )

      const rawRegionLabels = sortedRegions.map(r => r.niceName)
      const regionByNiceName = new Map(sortedRegions.map(r => [r.niceName, r]))

      const datasets = [
        {
          label: 'Events',
          data: rawRegionLabels.map(regionLabel => {
            const region = regionByNiceName.get(regionLabel)
            if (!region) return 0
            let total = 0
            for (const sCode of region.serviceCodes) {
              total += serviceEventsMap.get(sCode) || 0
            }
            return total
          })
        },
        {
          label: 'Attendance',
          data: rawRegionLabels.map(regionLabel => {
            const region = regionByNiceName.get(regionLabel)
            if (!region) return 0
            let total = 0
            for (const sCode of region.serviceCodes) {
              total += serviceAttendanceMap.get(sCode) || 0
            }
            return total
          })
        }
      ]

      const regionLabels = formatServiceLabelsWithNoData(
        rawRegionLabels,
        regionByNiceName,
        r => r?.events || r?.attendance
      )

      setServiceChart({
        labels: regionLabels,
        datasets
      })
    } else {
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
      const serviceByNiceName = new Map(
        sortedServices.map(s => [s.niceName, s])
      )

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
    }
  }, [
    filteredServices,
    services,
    events,
    attendance,
    monthRange,
    isRegionMode,
    selectedRegions
  ])

  return (
    <Box>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 800, mb: 1.5 }}>
        Events and attendance
      </Typography>
      <CardGrid />
      <Box sx={{ my: 2 }}>
        <Markdown>{eventsMd}</Markdown>
      </Box>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Event count and attendance by type
        </Typography>
        <Markdown>{eventsAttendanceMd}</Markdown>
      </Box>
      {eventsAttendanceChartData.map((chart, index) => (
        <AppChart
          key={index}
          type='bar'
          title={chart.eventType}
          data={chart.data}
          options={chart.options}
        />
      ))}

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          {isRegionMode ? 'Events and attendance by region' : 'Events and attendance by service'}
        </Typography>
        <Markdown>
          {isRegionMode
            ? 'Total event counts and attendance across regions.'
            : eventsAttendanceByServiceMd}
        </Markdown>
      </Box>
      <AppChart
        type='service'
        data={serviceChart}
        options={serviceChartOptions}
      />

      <Box sx={{ mt: 5, mb: 4 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Events data
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Monthly scheduled library events count by format and audience category.
        </Typography>
        <DatasetDataGrid datasetId='events' />
      </Box>

      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Event attendance data
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Monthly attendee and participant counts across event delivery formats.
        </Typography>
        <DatasetDataGrid datasetId='attendance' />
      </Box>
    </Box>
  )
}

export default Events
