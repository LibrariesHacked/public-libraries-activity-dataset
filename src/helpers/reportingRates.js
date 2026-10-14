/**
 * Calculates reporting population and reporting person-years for groups of activity records.
 * Records without a finite count do not contribute to coverage.
 *
 * @param {Array<Object>} records - Activity records, normally filtered to the selected date range.
 * @param {Array<Object>} services - Active services with population totals.
 * @param {string} countProp - Numeric count property on each activity record.
 * @param {Function} getGroupKey - Returns the comparison group key for a record.
 * @param {Function} [getPopulation] - Returns the denominator population for one service.
 * @returns {Map<*, {reportingPopulation: number, personYears: number, reportingServices: number}>}
 */
export const getReportingCoverageByGroup = (
  records,
  services,
  countProp,
  getGroupKey,
  getPopulation = service => service.totalPopulation || 0
) => {
  const populationByService = new Map(
    services.map(service => [service.code, getPopulation(service) || 0])
  )
  const reportingPeriodsByGroup = new Map()

  records.forEach(record => {
    if (!Number.isFinite(record[countProp])) return

    const groupKey = getGroupKey(record)
    const period = record.month || record.period
    if (groupKey == null || period == null) return

    if (!reportingPeriodsByGroup.has(groupKey)) {
      reportingPeriodsByGroup.set(groupKey, new Map())
    }
    const periodsByService = reportingPeriodsByGroup.get(groupKey)
    if (!periodsByService.has(record.serviceCode)) {
      periodsByService.set(record.serviceCode, new Set())
    }
    periodsByService.get(record.serviceCode).add(period)
  })

  const coverageByGroup = new Map()
  reportingPeriodsByGroup.forEach((periodsByService, groupKey) => {
    let reportingPopulation = 0
    let personYears = 0

    periodsByService.forEach((periods, serviceCode) => {
      const population = populationByService.get(serviceCode) || 0
      reportingPopulation += population
      personYears += population * periods.size / 12
    })

    coverageByGroup.set(groupKey, {
      reportingPopulation,
      personYears,
      reportingServices: periodsByService.size
    })
  })

  return coverageByGroup
}

export const getReportedTotal = (records, countProp) => {
  const values = records.map(record => record[countProp]).filter(Number.isFinite)
  return values.length ? values.reduce((total, value) => total + value, 0) : null
}

export const getComparisonChart = (data, datasetLabels) => {
  const datasets = (data?.datasets || []).filter(dataset =>
    datasetLabels.includes(dataset.label) && dataset.data.some(Number.isFinite)
  )
  const rows = (data?.labels || []).map((label, index) => ({
    label,
    index,
    values: datasets.map(dataset => dataset.data[index])
  })).filter(row => row.values.some(Number.isFinite))
  rows.sort((first, second) =>
    second.values.reduce((sum, value) => sum + (value ?? 0), 0) -
    first.values.reduce((sum, value) => sum + (value ?? 0), 0)
  )
  return {
    labels: rows.map(row => row.label),
    datasets: datasets.map(dataset => ({
      ...dataset,
      data: rows.map(row => dataset.data[row.index])
    }))
  }
}

export const getReportedTotalsByGroup = (records, countProp, getGroupKey) => {
  const totals = new Map()
  records.forEach(record => {
    if (!Number.isFinite(record[countProp])) return
    const key = getGroupKey(record)
    totals.set(key, (totals.get(key) || 0) + record[countProp])
  })
  return totals
}

export const getReportingSnapshotPercentage = (services, countProp) => {
  const reporting = services.filter(service => Number.isFinite(service[countProp]))
  if (!reporting.length || reporting.some(service => !(service.totalPopulation > 0))) return null
  const total = getReportedTotal(reporting, countProp)
  const population = reporting.reduce((sum, service) => sum + service.totalPopulation, 0)
  return total / population * 100
}

export const getEventTurnout = (events, attendance) => {
  const getKey = record => JSON.stringify([record.serviceCode, record.month, record.type, record.ageGroup])
  const eventTotals = getReportedTotalsByGroup(events, 'countEvents', getKey)
  const attendanceTotals = getReportedTotalsByGroup(attendance, 'countAttendance', getKey)
  let totalEvents = 0
  let totalAttendance = 0
  eventTotals.forEach((count, key) => {
    if (!attendanceTotals.has(key)) return
    totalEvents += count
    totalAttendance += attendanceTotals.get(key)
  })
  return totalEvents > 0 ? totalAttendance / totalEvents : null
}

/** Converts a monthly total into a rate per 1,000 residents who reported. */
export const perThousandReportingResidents = (total, coverage) => {
  if (!coverage?.reportingPopulation) return null
  return (total / coverage.reportingPopulation) * 1000
}

/** Converts a period total into an annual rate per 1,000 reporting residents. */
export const perThousandReportingPersonYears = (total, coverage) => {
  if (!coverage?.personYears) return null
  return (total / coverage.personYears) * 1000
}