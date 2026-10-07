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