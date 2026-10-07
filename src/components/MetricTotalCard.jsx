import React, { useEffect, useState } from 'react'

import { useApplicationState } from '../hooks/useApplicationState'

import { formatCompactNumber } from '../helpers/numbers'
import { getActiveServices, getServicePeriodChange, getServicesPopulation } from '../models/service'
import { getRecordsQualityWarning, getServiceQualityWarning } from '../helpers/dataQuality'
import { filterByMonthRange, getMonthsInRange, resolvePeriodComparison } from '../helpers/periods'
import { getReportingCoverageByGroup } from '../helpers/reportingRates'

import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import WifiRoundedIcon from '@mui/icons-material/WifiRounded'

import * as loansModel from '../models/loans'
import * as visitsModel from '../models/visits'
import * as eventsModel from '../models/events'
import * as attendanceModel from '../models/attendance'
import * as computersModel from '../models/computers'
import * as wifiModel from '../models/wifi'

import NumberCard from './NumberCard'

const METRIC_ICONS = {
  loans: MenuBookRoundedIcon,
  visits: PlaceRoundedIcon,
  events: EventRoundedIcon,
  attendance: GroupsRoundedIcon,
  computerHours: ComputerRoundedIcon,
  wifiSessions: WifiRoundedIcon,
  users: PeopleRoundedIcon
}

/**
 * Metric configuration mapping metric identifiers to application state keys,
 * count property names, and asynchronous data fetchers.
 */
const METRIC_CONFIG = {
  loans: {
    stateKey: 'loans',
    countProp: 'countLoans',
    fetcher: loansModel.getLoans,
    actionType: 'SetLoans'
  },
  visits: {
    stateKey: 'visits',
    countProp: 'countVisits',
    fetcher: visitsModel.getVisits,
    actionType: 'SetVisits'
  },
  events: {
    stateKey: 'events',
    countProp: 'countEvents',
    fetcher: eventsModel.getEvents,
    actionType: 'SetEvents'
  },
  attendance: {
    stateKey: 'attendance',
    countProp: 'countAttendance',
    fetcher: attendanceModel.getAttendance,
    actionType: 'SetAttendance'
  },
  computerHours: {
    stateKey: 'computers',
    countProp: 'countHours',
    fetcher: computersModel.getComputers,
    actionType: 'SetComputers'
  },
  wifiSessions: {
    stateKey: 'wifi',
    countProp: 'countSessions',
    fetcher: wifiModel.getWiFi,
    actionType: 'SetWiFi'
  }
}

/**
 * Generic KPI card component that aggregates a specific activity metric across active library services,
 * calculates secondary descriptors and period-over-period changes, monitors data quality flags,
 * and renders a styled NumberCard.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.metric - The property name on the Service model to aggregate (e.g. 'loans', 'visits').
 * @param {string} props.title - Card title displayed in the header.
 * @param {string} props.colour - Theme palette colour key for styling the card.
 * @param {Function} [props.formatDescription] - Callback returning a human-readable subtitle string given summary context.
 * @param {Function} [props.filterServices] - Optional custom filter callback to restrict which services are included.
 * @param {Function} [props.computeChange] - Optional callback computing the percentage change between periods.
 * @param {string} [props.changeDescription] - Context label for the change value (e.g. 'since 2022/23').
 * @returns {JSX.Element} Rendered NumberCard component.
 */
const MetricTotalCard = ({
  metric,
  title,
  colour,
  icon,
  formatDescription,
  filterServices,
  computeChange,
  changeDescription,
  changeUnit = '%'
}) => {
  const [
    {
      filteredServices,
      services,
      serviceRecords,
      periods,
      selectedPeriods,
      loans,
      visits,
      events,
      attendance,
      computers,
      wifi,
      monthRange,
      useEstimates
    },
    dispatchApplication
  ] = useApplicationState()

  const [count, setCount] = useState(0)
  const [description, setDescription] = useState('')
  const [change, setChange] = useState(null)
  const [noData, setNoData] = useState(false)
  const [warning, setWarning] = useState(null)

  const config = METRIC_CONFIG[metric]
  const records = config
    ? { loans, visits, events, attendance, computers, wifi }[config.stateKey]
    : null

  useEffect(() => {
    if (config?.fetcher && !records) {
      config.fetcher().then(data => {
        dispatchApplication({ type: config.actionType, [config.stateKey]: data })
      })
    }
  }, [config, records, dispatchApplication])

  useEffect(() => {
    const activeServices = getActiveServices(services, filteredServices)
    const activeServiceCodes = new Set((activeServices || []).map(s => s.code))
    const months = getMonthsInRange(monthRange)
    const yearCount = (months.length || 12) / 12

    if (records && config) {
      const rangeRecords = filterByMonthRange(records, monthRange)
      const matched = rangeRecords.filter(
        r =>
          (!filteredServices.length || filteredServices.includes(r.serviceCode)) &&
          activeServiceCodes.has(r.serviceCode)
      )

      if (!matched.length) {
        setNoData(true)
        setCount(0)
      } else {
        setNoData(false)
        const sampleTotal = matched.reduce(
          (acc, r) => acc + (r[config.countProp] || 0),
          0
        )
        const coverage = getReportingCoverageByGroup(
          matched,
          activeServices,
          config.countProp,
          () => 'all'
        ).get('all')
        const reportingYearCount = coverage?.reportingPopulation
          ? coverage.personYears / coverage.reportingPopulation
          : 0

        setCount(sampleTotal)

        if (formatDescription) {
          setDescription(
            formatDescription({
              total: sampleTotal,
              validServices: activeServices,
              activeServices,
              totalPopulation: coverage?.reportingPopulation || 0,
              yearCount: reportingYearCount
            })
          )
        }
        setWarning(getRecordsQualityWarning(matched))
      }
    } else {
      const validServices = filterServices
        ? filterServices(activeServices)
        : activeServices?.filter(s => Number.isInteger(s[metric]))

      if (!validServices || validServices.length === 0) {
        setNoData(true)
      } else {
        setNoData(false)
      }

      const sampleTotal =
        validServices?.reduce((acc, s) => acc + (s[metric] || 0), 0) || 0

      setCount(sampleTotal)

      if (formatDescription) {
        setDescription(
          formatDescription({
            total: sampleTotal,
            validServices,
            activeServices,
            totalPopulation: getServicesPopulation(validServices),
            yearCount
          })
        )
      }

      setWarning(getServiceQualityWarning(activeServices, metric))
    }

    const comparison = resolvePeriodComparison(selectedPeriods, periods)
    if (computeChange) {
      setChange(
        computeChange({
          validServices: activeServices,
          activeServices,
          useEstimates,
          comparison
        })
      )
    } else if (comparison && serviceRecords && metric) {
      const chg = getServicePeriodChange(
        serviceRecords,
        metric,
        comparison.baselinePeriod,
        comparison.targetPeriod,
        activeServiceCodes.size ? [...activeServiceCodes] : undefined,
        useEstimates
      )
      setChange(chg)
    } else {
      setChange(null)
    }
  }, [
    services,
    serviceRecords,
    periods,
    selectedPeriods,
    filteredServices,
    records,
    monthRange,
    useEstimates,
    metric,
    config,
    formatDescription,
    filterServices,
    computeChange
  ])

  const comparison = resolvePeriodComparison(selectedPeriods, periods)
  const effectiveChangeDescription =
    changeDescription || comparison?.changeDescription || ''

  return (
    <NumberCard
      title={title}
      number={formatCompactNumber(count)}
      description={description}
      icon={icon || METRIC_ICONS[metric]}
      change={change}
      changeDescription={effectiveChangeDescription}
      changeUnit={changeUnit}
      colour={colour}
      noData={noData}
      warning={warning}
      isShowingEstimated={useEstimates !== false}
    />
  )
}

export default MetricTotalCard
