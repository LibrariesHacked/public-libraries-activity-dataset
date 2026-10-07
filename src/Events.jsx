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
  getReportingCoverageByGroup,
  perThousandReportingPersonYears,
  perThousandReportingResidents
} from './helpers/reportingRates'

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
          ? 'Events and attendees per 1,000 reporting residents by region'
          : 'Events and attendees per 1,000 reporting residents by service',
        'Events and attendees per 1,000 reporting residents per year'
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
    const reportingEvents = chartEvents.filter(e => activeServiceCodes.has(e.serviceCode))
    const reportingAttendance = chartAttendance.filter(a => activeServiceCodes.has(a.serviceCode))
    const monthlyEventCoverage = getReportingCoverageByGroup(
      reportingEvents,
      activeServices,
      'countEvents',
      event => `${event.type}|||${event.month}`
    )
    const monthlyAttendanceCoverage = getReportingCoverageByGroup(
      reportingAttendance,
      activeServices,
      'countAttendance',
      record => `${record.type}|||${record.month}`
    )

    // Pre-aggregate monthly attendance: (type, month) -> sum
    const attendanceTypeMonthMap = new Map()
    for (let i = 0; i < chartAttendance.length; i++) {
      const a = chartAttendance[i]
      if (Number.isFinite(a.countAttendance)) {
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
      if (Number.isFinite(e.countEvents)) {
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
        {
          label: `Attendance - ${eventType}`,
          data: monthLabels.map(month => {
            const key = `${eventType}|||${month}`
            const total = attendanceTypeMonthMap.get(key)
            return total == null
              ? null
              : perThousandReportingResidents(total, monthlyAttendanceCoverage.get(key))
          }),
          yAxisID: 'y1',
          type: 'line'
        },
        {
          label: `Events - ${eventType}`,
          data: monthLabels.map(month => {
            const key = `${eventType}|||${month}`
            const total = eventsTypeMonthMap.get(key)
            return total == null
              ? null
              : perThousandReportingResidents(total, monthlyEventCoverage.get(key))
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
        options: createTimelineChartOptions(
          `Events and attendance - ${eventTypes[eventType].label}`,
          'Events per 1,000 reporting residents (bars)',
          'Attendees per 1,000 reporting residents (lines)',
          {
            stacked: true,
            interaction: { mode: 'index', intersect: false }
          }
        )
      })
    })

    setEventsAttendanceChartData(eventAttendanceCharts)

    const serviceEvents = reportingEvents
    const serviceAttendance = reportingAttendance
    const serviceEventCoverage = getReportingCoverageByGroup(
      serviceEvents,
      activeServices,
      'countEvents',
      event => `${event.serviceCode}|||${event.type}`
    )
    const serviceAttendanceCoverage = getReportingCoverageByGroup(
      serviceAttendance,
      activeServices,
      'countAttendance',
      record => `${record.serviceCode}|||${record.type}`
    )
    const serviceByCode = new Map(activeServices.map(service => [service.code, service]))
    const regionEventCoverage = getReportingCoverageByGroup(
      serviceEvents,
      activeServices,
      'countEvents',
      event => `${serviceByCode.get(event.serviceCode)?.region}|||${event.type}`
    )
    const regionAttendanceCoverage = getReportingCoverageByGroup(
      serviceAttendance,
      activeServices,
      'countAttendance',
      record => `${serviceByCode.get(record.serviceCode)?.region}|||${record.type}`
    )

    // Pre-aggregate service events and attendance
    const serviceEventsMap = new Map()
    for (let i = 0; i < serviceEvents.length; i++) {
      const e = serviceEvents[i]
      if (Number.isFinite(e.countEvents)) {
        serviceEventsMap.set(
          `${e.serviceCode}|||${e.type}`,
          (serviceEventsMap.get(`${e.serviceCode}|||${e.type}`) || 0) + e.countEvents
        )
      }
    }

    const serviceAttendanceMap = new Map()
    for (let i = 0; i < serviceAttendance.length; i++) {
      const a = serviceAttendance[i]
      if (Number.isFinite(a.countAttendance)) {
        serviceAttendanceMap.set(
          `${a.serviceCode}|||${a.type}`,
          (serviceAttendanceMap.get(`${a.serviceCode}|||${a.type}`) || 0) + a.countAttendance
        )
      }
    }

    if (isRegionMode) {
      const regionAggregates = getRegionAggregates(services, selectedRegions)

      const getRegionTotalEventsAttendance = region => {
        return ['Physical', 'Digital'].reduce((sum, eventType) => {
          const eventTotal = [...region.serviceCodes].reduce(
            (total, code) => total + (serviceEventsMap.get(`${code}|||${eventType}`) || 0),
            0
          )
          const attendanceTotal = [...region.serviceCodes].reduce(
            (total, code) => total + (serviceAttendanceMap.get(`${code}|||${eventType}`) || 0),
            0
          )
          return sum +
            (perThousandReportingPersonYears(eventTotal, regionEventCoverage.get(`${region.region}|||${eventType}`)) || 0) +
            (perThousandReportingPersonYears(attendanceTotal, regionAttendanceCoverage.get(`${region.region}|||${eventType}`)) || 0)
        }, 0)
      }

      const sortedRegions = sortServicesByMetric(
        regionAggregates,
        getRegionTotalEventsAttendance,
        r => r?.events || r?.attendance
      )

      const rawRegionLabels = sortedRegions.map(r => r.niceName)
      const regionByNiceName = new Map(sortedRegions.map(r => [r.niceName, r]))

      const datasets = ['Physical', 'Digital'].flatMap(eventType => [
        {
          label: `${eventTypes[eventType].label} events`,
          data: rawRegionLabels.map(regionLabel => {
            const region = regionByNiceName.get(regionLabel)
            if (!region) return null
            const total = [...region.serviceCodes].reduce(
              (sum, code) => sum + (serviceEventsMap.get(`${code}|||${eventType}`) || 0),
              0
            )
            const rate = perThousandReportingPersonYears(
              total,
              regionEventCoverage.get(`${region.region}|||${eventType}`)
            )
            return rate == null ? null : parseFloat(rate.toFixed(2))
          })
        },
        {
          label: `${eventTypes[eventType].label} attendees`,
          data: rawRegionLabels.map(regionLabel => {
            const region = regionByNiceName.get(regionLabel)
            if (!region) return null
            const total = [...region.serviceCodes].reduce(
              (sum, code) => sum + (serviceAttendanceMap.get(`${code}|||${eventType}`) || 0),
              0
            )
            const rate = perThousandReportingPersonYears(
              total,
              regionAttendanceCoverage.get(`${region.region}|||${eventType}`)
            )
            return rate == null ? null : parseFloat(rate.toFixed(2))
          })
        }
      ])

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
        return ['Physical', 'Digital'].reduce((sum, eventType) => {
          const eventTotal = serviceEventsMap.get(`${service.code}|||${eventType}`) || 0
          const attendanceTotal = serviceAttendanceMap.get(`${service.code}|||${eventType}`) || 0
          return sum +
            (perThousandReportingPersonYears(eventTotal, serviceEventCoverage.get(`${service.code}|||${eventType}`)) || 0) +
            (perThousandReportingPersonYears(attendanceTotal, serviceAttendanceCoverage.get(`${service.code}|||${eventType}`)) || 0)
        }, 0)
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

      const datasets = ['Physical', 'Digital'].flatMap(eventType => [
        {
          label: `${eventTypes[eventType].label} events`,
          data: rawServiceLabels.map(serviceLabel => {
            const service = serviceByNiceName.get(serviceLabel)
            if (!service) return null
            const total = serviceEventsMap.get(`${service.code}|||${eventType}`) || 0
            const rate = perThousandReportingPersonYears(
              total,
              serviceEventCoverage.get(`${service.code}|||${eventType}`)
            )
            return rate == null ? null : parseFloat(rate.toFixed(2))
          })
        },
        {
          label: `${eventTypes[eventType].label} attendees`,
          data: rawServiceLabels.map(serviceLabel => {
            const service = serviceByNiceName.get(serviceLabel)
            if (!service) return null
            const total = serviceAttendanceMap.get(`${service.code}|||${eventType}`) || 0
            const rate = perThousandReportingPersonYears(
              total,
              serviceAttendanceCoverage.get(`${service.code}|||${eventType}`)
            )
            return rate == null ? null : parseFloat(rate.toFixed(2))
          })
        }
      ])

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
            ? 'Annual events and attendees per 1,000 residents in services reporting each measure.'
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
