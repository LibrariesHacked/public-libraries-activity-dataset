import axios from 'axios'

import { resolveEffectiveValue } from '../helpers/dataQuality'

export { resolveEffectiveValue }

export class Service {
  constructor (obj) {
    Object.assign(this, obj)
  }

  resolveMetric (prop, useEstimates = true) {
    const orig = this[`${prop}Original`]
    const est = this[`${prop}Estimated`]
    const status = this[`${prop}Status`]
    return resolveEffectiveValue(orig, est, status, useEstimates)
  }

  fromJson (json) {
    this.code = json[0]
    this.niceName = json[1]
    this.libraryService = json[2]
    this.period = json[3]

    if (json.length >= 40) {
      this.usersOriginal = json[4]
      this.usersEstimated = json[5]
      this.usersStatus = json[6]
      this.usersNotes = json[7]
      this.users = resolveEffectiveValue(json[4], json[5], json[6], true)

      this.eventsOriginal = json[8]
      this.eventsEstimated = json[9]
      this.eventsStatus = json[10]
      this.eventsNotes = json[11]
      this.events = resolveEffectiveValue(json[8], json[9], json[10], true)

      this.attendanceOriginal = json[12]
      this.attendanceEstimated = json[13]
      this.attendanceStatus = json[14]
      this.attendanceNotes = json[15]
      this.attendance = resolveEffectiveValue(json[12], json[13], json[14], true)

      this.loansOriginal = json[16]
      this.loansEstimated = json[17]
      this.loansStatus = json[18]
      this.loansNotes = json[19]
      this.loans = resolveEffectiveValue(json[16], json[17], json[18], true)

      this.visitsOriginal = json[20]
      this.visitsEstimated = json[21]
      this.visitsStatus = json[22]
      this.visitsNotes = json[23]
      this.visits = resolveEffectiveValue(json[20], json[21], json[22], true)

      this.computerHoursOriginal = json[24]
      this.computerHoursEstimated = json[25]
      this.computerHoursStatus = json[26]
      this.computerHoursNotes = json[27]
      this.computerHours = resolveEffectiveValue(json[24], json[25], json[26], true)

      this.wifiSessionsOriginal = json[28]
      this.wifiSessionsEstimated = json[29]
      this.wifiSessionsStatus = json[30]
      this.wifiSessionsNotes = json[31]
      this.wifiSessions = resolveEffectiveValue(json[28], json[29], json[30], true)

      this.populationUnder12 = json[32]
      this.population12To17 = json[33]
      this.populationAdult = json[34]
      this.totalPopulation = (json[32] || 0) + (json[33] || 0) + (json[34] || 0)
      this.nearestNeighbours = json.slice(35, 40).filter(n => n)
    } else {
      this.users = json[4]
      this.events = json[5]
      this.attendance = json[6]
      this.loans = json[7]
      this.visits = json[8]
      this.computerHours = json[9]
      this.wifiSessions = json[10]
      this.populationUnder12 = json[11]
      this.population12To17 = json[12]
      this.populationAdult = json[13]
      this.totalPopulation = (json[11] || 0) + (json[12] || 0) + (json[13] || 0)
      this.nearestNeighbours = json.slice(14, 20).filter(n => n)
    }

    return this
  }
}

// Returns a record per service per financial year period.
export async function getServices () {
  const response = await axios.get('./services.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(service => new Service().fromJson(service))
  } else {
    return []
  }
}

const sumOrNull = (records, property) => {
  const values = records
    .map(record => record[property])
    .filter(value => Number.isFinite(value))
  if (values.length === 0) return null
  return values.reduce((acc, value) => acc + value, 0)
}

const aggregateMetricMetadata = (records, prop) => {
  const statusProp = `${prop}Status`
  const notesProp = `${prop}Notes`
  const origProp = `${prop}Original`
  const estProp = `${prop}Estimated`

  const flagged = records.filter(r => r[statusProp])
  if (flagged.length === 0) {
    return {
      [statusProp]: null,
      [notesProp]: null,
      [origProp]: sumOrNull(records, origProp),
      [estProp]: sumOrNull(records, estProp)
    }
  }

  const statuses = new Set(flagged.map(r => r[statusProp]))
  const status = statuses.has('excluded')
    ? 'excluded'
    : (statuses.has('replaced') ? 'replaced' : 'suspicious')
  const notes = flagged
    .map(r => (records.length > 1 ? `${r.period}: ${r[notesProp]}` : r[notesProp]))
    .join('; ')

  return {
    [statusProp]: status,
    [notesProp]: notes,
    [origProp]: sumOrNull(records, origProp),
    [estProp]: sumOrNull(records, estProp)
  }
}

// Collapses the per period service records into a single record per service for
// the selected periods. Activity measures accumulate across the years, whereas
// active users are a snapshot of a single year so the latest period is used.
export const getServicesForPeriods = (serviceRecords, periods, useEstimates = true) => {
  const selectedRecords =
    periods?.length > 0
      ? serviceRecords.filter(record => periods.includes(record.period))
      : serviceRecords

  const recordsByService = new Map()
  selectedRecords.forEach(record => {
    if (!recordsByService.has(record.code)) recordsByService.set(record.code, [])
    recordsByService.get(record.code).push(record)
  })

  const sumMetric = (records, prop) => {
    const values = records
      .map(r => (r.resolveMetric ? r.resolveMetric(prop, useEstimates) : r[prop]))
      .filter(val => Number.isFinite(val))
    if (values.length === 0) return null
    return values.reduce((acc, val) => acc + val, 0)
  }

  return [...recordsByService.values()].map(records => {
    const orderedRecords = [...records].sort((a, b) =>
      a.period.localeCompare(b.period)
    )
    const latest = orderedRecords[orderedRecords.length - 1]
    const latestUsers = latest.resolveMetric
      ? latest.resolveMetric('users', useEstimates)
      : latest.users

    return new Service({
      ...latest,
      periods: orderedRecords.map(record => record.period),
      periodCount: orderedRecords.length,
      users: latestUsers,
      events: sumMetric(orderedRecords, 'events'),
      attendance: sumMetric(orderedRecords, 'attendance'),
      loans: sumMetric(orderedRecords, 'loans'),
      visits: sumMetric(orderedRecords, 'visits'),
      computerHours: sumMetric(orderedRecords, 'computerHours'),
      wifiSessions: sumMetric(orderedRecords, 'wifiSessions'),
      ...aggregateMetricMetadata(orderedRecords, 'users'),
      ...aggregateMetricMetadata(orderedRecords, 'events'),
      ...aggregateMetricMetadata(orderedRecords, 'attendance'),
      ...aggregateMetricMetadata(orderedRecords, 'loans'),
      ...aggregateMetricMetadata(orderedRecords, 'visits'),
      ...aggregateMetricMetadata(orderedRecords, 'computerHours'),
      ...aggregateMetricMetadata(orderedRecords, 'wifiSessions')
    })
  })
}

export const getActiveServices = (services, filteredServices) => {
  return filteredServices?.length > 0
    ? services.filter(s => filteredServices.includes(s.code))
    : services
}

// Percentage change in a measure between two financial years. Only services
// that reported in both years are included, so the change is not distorted by
// services starting or stopping reporting.
export const getServicePeriodChange = (
  serviceRecords,
  property,
  earliestPeriod,
  latestPeriod,
  serviceCodes,
  useEstimates = true
) => {
  if (!serviceRecords || !earliestPeriod || !latestPeriod) return null
  if (earliestPeriod === latestPeriod) return null

  const valueFor = period => {
    const values = new Map()
    serviceRecords.forEach(record => {
      if (record.period !== period) return
      if (serviceCodes && !serviceCodes.includes(record.code)) return
      const val = record.resolveMetric
        ? record.resolveMetric(property, useEstimates)
        : record[property]
      if (!Number.isFinite(val)) return
      values.set(record.code, val)
    })
    return values
  }

  const earliestValues = valueFor(earliestPeriod)
  const latestValues = valueFor(latestPeriod)

  let earliestTotal = 0
  let latestTotal = 0
  earliestValues.forEach((value, code) => {
    if (!latestValues.has(code)) return
    earliestTotal += value
    latestTotal += latestValues.get(code)
  })

  if (earliestTotal === 0) return null
  return ((latestTotal - earliestTotal) / earliestTotal) * 100
}

export const getServicesPopulation = services => {
  const totalPopulation =
    services?.reduce(
      (acc, service) => acc + (service.totalPopulation || 0),
      0
    ) || 0
  return totalPopulation
}

export const getServicesUnder12Population = services => {
  const totalPopulation =
    services?.reduce(
      (acc, service) => acc + (service.populationUnder12 || 0),
      0
    ) || 0
  return totalPopulation
}

export const getServicesJuniorPopulation = services => {
  const totalPopulation =
    services?.reduce(
      (acc, service) => acc + (service.population12To17 || 0),
      0
    ) || 0
  return totalPopulation
}

export const getServicesChildPopulation = services => {
  const totalPopulation =
    services?.reduce(
      (acc, service) =>
        acc +
        ((service.populationUnder12 || 0) + (service.population12To17 || 0)),
      0
    ) || 0
  return totalPopulation
}

export const getServicesAdultPopulation = services => {
  const totalPopulation =
    services?.reduce(
      (acc, service) => acc + (service.populationAdult || 0),
      0
    ) || 0
  return totalPopulation
}
