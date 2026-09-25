import axios from 'axios'

export class Service {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.code = json[0]
    this.niceName = json[1]
    this.libraryService = json[2]
    this.period = json[3]
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
    // Total population is not in the original data, but we calculate it here for convenience
    this.totalPopulation = (json[11] || 0) + (json[12] || 0) + (json[13] || 0)
    // The nearest neighbours are an array of codes of similar services json[14] - json[19]
    this.nearestNeighbours = json.slice(14, 20).filter(n => n)

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

// Collapses the per period service records into a single record per service for
// the selected periods. Activity measures accumulate across the years, whereas
// active users are a snapshot of a single year so the latest period is used.
export const getServicesForPeriods = (serviceRecords, periods) => {
  const selectedRecords =
    periods?.length > 0
      ? serviceRecords.filter(record => periods.includes(record.period))
      : serviceRecords

  const recordsByService = new Map()
  selectedRecords.forEach(record => {
    if (!recordsByService.has(record.code)) recordsByService.set(record.code, [])
    recordsByService.get(record.code).push(record)
  })

  return [...recordsByService.values()].map(records => {
    const orderedRecords = [...records].sort((a, b) =>
      a.period.localeCompare(b.period)
    )
    const latest = orderedRecords[orderedRecords.length - 1]
    return new Service({
      ...latest,
      periods: orderedRecords.map(record => record.period),
      periodCount: orderedRecords.length,
      users: latest.users,
      events: sumOrNull(orderedRecords, 'events'),
      attendance: sumOrNull(orderedRecords, 'attendance'),
      loans: sumOrNull(orderedRecords, 'loans'),
      visits: sumOrNull(orderedRecords, 'visits'),
      computerHours: sumOrNull(orderedRecords, 'computerHours'),
      wifiSessions: sumOrNull(orderedRecords, 'wifiSessions')
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
  serviceCodes
) => {
  if (!serviceRecords || !earliestPeriod || !latestPeriod) return null
  if (earliestPeriod === latestPeriod) return null

  const valueFor = period => {
    const values = new Map()
    serviceRecords.forEach(record => {
      if (record.period !== period) return
      if (serviceCodes && !serviceCodes.includes(record.code)) return
      if (!Number.isFinite(record[property])) return
      values.set(record.code, record[property])
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
