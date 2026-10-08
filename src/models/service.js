import axios from 'axios'

import { DataQualityStatus, resolveEffectiveValue } from '../helpers/dataQuality'

import libraryAuthorities from '../../data/library_authorities.json'

const authorityByCode = new Map(
  libraryAuthorities.map(auth => [auth.code, auth])
)

const METRICS = [
  'users',
  'events',
  'attendance',
  'loans',
  'visits',
  'computerHours',
  'wifiSessions'
]
const ACTIVITY_METRICS = METRICS.slice(1)

export { DataQualityStatus, resolveEffectiveValue }

/**
 * Domain model representing a library authority/service, including annual activity totals,
 * population demographics, quality flags, and nearest neighbour comparators.
 */
export class Service {
  /**
   * Constructs a Service instance by copying properties from an existing object or record.
   *
   * @param {Object} [obj] - Initial properties to copy onto the new Service instance.
   */
  constructor (obj) {
    Object.assign(this, obj)
  }

  /**
   * Resolves the effective numeric value for a given activity metric, respecting user preferences
  * for corrected figures and checking whether values are excluded due to data quality issues.
   *
   * @param {string} prop - The base metric name (e.g. 'loans', 'visits', 'users', 'events').
  * @param {boolean} [useEstimates=true] - Whether to apply corrections when available.
   * @returns {number|null} The resolved numeric value, or null if excluded or unavailable.
   */
  resolveMetric (prop, useEstimates = true) {
    const orig = this[`${prop}Original`]
    const est = this[`${prop}Estimated`]
    const status = this[`${prop}Status`]
    return resolveEffectiveValue(orig, est, status, useEstimates)
  }

  /**
   * Deserializes an array-based row from `services.json` into this Service instance.
   * Handles both the legacy format and the current format with detailed quality status and notes.
   *
   * @param {Array<*>} json - Array row containing service metadata and metric columns.
   * @returns {Service} The hydrated Service instance.
   */
  fromJson (json) {

    this.code = json[0]
    this.niceName = json[1]
    this.libraryService = json[2]
    this.period = json[3]
    this.region = authorityByCode.get(this.code)?.region || null

    if (json.length >= 40) {
      METRICS.forEach((prop, idx) => {
        const offset = 4 + idx * 4
        this[`${prop}Original`] = json[offset]
        this[`${prop}Estimated`] = json[offset + 1]
        this[`${prop}Status`] = json[offset + 2]
        this[`${prop}Notes`] = json[offset + 3]
        this[prop] = resolveEffectiveValue(json[offset], json[offset + 1], json[offset + 2], true)
      })

      this.populationUnder12 = json[32]
      this.population12To17 = json[33]
      this.populationAdult = json[34]
      this.totalPopulation = (json[32] || 0) + (json[33] || 0) + (json[34] || 0)
      this.nearestNeighbours = json.slice(35, 40).filter(Boolean)
    } else {
      METRICS.forEach((prop, idx) => {
        this[prop] = json[4 + idx]
      })
      this.populationUnder12 = json[11]
      this.population12To17 = json[12]
      this.populationAdult = json[13]
      this.totalPopulation = (json[11] || 0) + (json[12] || 0) + (json[13] || 0)
      this.nearestNeighbours = json.slice(14, 20).filter(Boolean)
    }

    return this
  }
}

/**
 * Fetches and deserializes all annual library service summary records from the static dataset.
 *
 * @returns {Promise<Service[]>} Promise resolving to an array of Service domain model instances.
 */
export async function getServices () {
  const response = await axios.get('./services.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(service => new Service().fromJson(service))
  } else {
    return []
  }
}

/**
 * Sums numeric values of a specified property across a collection of records.
 *
 * @param {Array<Object>} records - List of records to extract values from.
 * @param {string} property - Name of the numeric property to sum.
 * @returns {number|null} Total sum, or null if no valid finite numbers were found.
 */
const sumOrNull = (records, property) => {
  const values = records
    .map(record => record[property])
    .filter(value => Number.isFinite(value))
  if (values.length === 0) return null
  return values.reduce((acc, value) => acc + value, 0)
}

/**
 * Combines data quality status flags, explanatory notes, and original/corrected totals
 * for a specific metric across multiple financial year records of a single service.
 *
 * @param {Array<Object>} records - List of annual service records for a single library service.
 * @param {string} prop - The metric property name (e.g. 'loans', 'visits', 'users').
 * @returns {Object} Consolidated quality metadata containing status, notes, original sum, and corrected sum.
 */
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
  const status = statuses.has(DataQualityStatus.EXCLUDED)
    ? DataQualityStatus.EXCLUDED
    : (statuses.has(DataQualityStatus.REPLACED)
        ? DataQualityStatus.REPLACED
        : DataQualityStatus.SUSPICIOUS)
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

/**
 * Collapses multi-year service records into a single consolidated record per library service.
 * Activity measures (loans, visits, events, attendance, computer hours, Wi-Fi sessions) are summed
 * across the selected periods, while snapshot metrics (active users) and metadata are taken from the latest period.
 *
 * @param {Service[]} serviceRecords - All annual service records.
 * @param {string[]} [periods] - Selected financial year periods to filter by; if empty or null, all periods are included.
 * @param {boolean} [useEstimates=true] - Whether to apply corrections when calculating totals.
 * @returns {Service[]} Array of aggregated Service records (one per unique library authority).
 */
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

    const aggregatedMetrics = {}
    METRICS.forEach(metric => {
      Object.assign(
        aggregatedMetrics,
        aggregateMetricMetadata(orderedRecords, metric)
      )
    })

    const activityTotals = {}
    ACTIVITY_METRICS.forEach(metric => {
      activityTotals[metric] = sumMetric(orderedRecords, metric)
    })

    return new Service({
      ...latest,
      periods: orderedRecords.map(record => record.period),
      periodCount: orderedRecords.length,
      users: latestUsers,
      ...activityTotals,
      ...aggregatedMetrics
    })
  })
}

/**
 * Filters a list of service records down to only those matching the specified service codes.
 * Returns the unfiltered list if no codes are specified.
 *
 * @param {Service[]} services - Array of service records to filter.
 * @param {string[]} [filteredServices] - Optional list of service codes to retain.
 * @returns {Service[]} Filtered array of service records.
 */
export const getActiveServices = (services, filteredServices) => {
  return filteredServices?.length > 0
    ? services.filter(s => filteredServices.includes(s.code))
    : services
}

/**
 * Calculates the percentage change in a specific metric between two financial year periods.
 * To ensure fairness and prevent distortion caused by services joining or dropping out,
 * only services that reported valid data in both the baseline and comparison periods are included.
 *
 * @param {Service[]} serviceRecords - Collection of annual service records.
 * @param {string} property - Metric property name to compare (e.g. 'loans', 'visits', 'events').
 * @param {string} earliestPeriod - Baseline financial year period (e.g. '2022/23').
 * @param {string} latestPeriod - Target comparison financial year period (e.g. '2023/24').
 * @param {string[]} [serviceCodes] - Optional list of service codes to restrict the comparison to.
 * @param {boolean} [useEstimates=true] - Whether to apply corrections when available.
 * @returns {number|null} Percentage change between periods (e.g. 10.5 for +10.5%), or null if insufficient data.
 */
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

/**
 * Calculates the total combined resident population across an array of library services.
 *
 * @param {Service[]} services - List of library services.
 * @returns {number} Combined total resident population.
 */
export const getServicesPopulation = services => {
  const totalPopulation =
    services?.reduce(
      (acc, service) => acc + (service.totalPopulation || 0),
      0
    ) || 0
  return totalPopulation
}

/**
 * Calculates the combined resident child population under age 12 across an array of library services.
 *
 * @param {Service[]} services - List of library services.
 * @returns {number} Combined child population under 12.
 */
export const getServicesUnder12Population = services => {
  const totalPopulation =
    services?.reduce(
      (acc, service) => acc + (service.populationUnder12 || 0),
      0
    ) || 0
  return totalPopulation
}

/**
 * Calculates the combined resident youth population aged 12 to 17 across an array of library services.
 *
 * @param {Service[]} services - List of library services.
 * @returns {number} Combined youth population aged 12-17.
 */
export const getServicesJuniorPopulation = services => {
  const totalPopulation =
    services?.reduce(
      (acc, service) => acc + (service.population12To17 || 0),
      0
    ) || 0
  return totalPopulation
}

/**
 * Calculates the combined total child and youth population (under 18) across an array of library services.
 *
 * @param {Service[]} services - List of library services.
 * @returns {number} Combined under-18 population.
 */
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

/**
 * Calculates the combined adult resident population (aged 18+) across an array of library services.
 *
 * @param {Service[]} services - List of library services.
 * @returns {number} Combined adult population.
 */
export const getServicesAdultPopulation = services => {
  const totalPopulation =
    services?.reduce(
      (acc, service) => acc + (service.populationAdult || 0),
      0
    ) || 0
  return totalPopulation
}

/**
 * Returns a sorted unique list of all English regions represented in the library dataset.
 *
 * @param {Service[]} [services] - Optional list of services to extract regions from.
 * @returns {string[]} Sorted array of region names.
 */
export const getAvailableRegions = (services = []) => {
  const regions = new Set()
  services.forEach(s => {
    if (s.region) regions.add(s.region)
  })
  if (regions.size === 0) {
    libraryAuthorities.forEach(a => {
      if (a.nation === 'England' && a.region) regions.add(a.region)
    })
  }
  return [...regions].sort()
}

/**
 * Filters an array of library services down to those belonging to a specific region.
 *
 * @param {Service[]} services - List of library services.
 * @param {string} region - Name of the geographic region (e.g. 'London').
 * @returns {Service[]} Services located within the specified region.
 */
export const getServicesByRegion = (services, region) => {
  if (!region) return services
  return services.filter(s => s.region === region)
}

/**
 * Filters an array of library services down to those belonging to any of the specified regions.
 *
 * @param {Service[]} services - List of library services.
 * @param {string[]} regions - Array of region names.
 * @returns {Service[]} Services located within the selected regions.
 */
export const getServicesByRegions = (services, regions) => {
  if (!regions || regions.length === 0) return services
  return services.filter(s => regions.includes(s.region))
}

/**
 * Consolidates library services into regional aggregate entities with summed
 * population demographics and total activity metrics.
 *
 * @param {Service[]} [services=[]] - List of consolidated library services.
 * @param {string[]} [selectedRegions=[]] - User-selected regions, or empty for all available regions.
 * @returns {Array<Object>} Array of regional aggregate objects.
 */
export const getRegionAggregates = (services = [], selectedRegions = []) => {
  const availableRegions = getAvailableRegions(services)
  const targetRegions =
    selectedRegions && selectedRegions.length > 0
      ? availableRegions.filter(r => selectedRegions.includes(r))
      : availableRegions

  return targetRegions.map(regionName => {
    const regionServices = services.filter(s => s.region === regionName)
    const serviceCodes = new Set(regionServices.map(s => s.code))

    let totalPopulation = 0
    let populationUnder12 = 0
    let population12To17 = 0
    let populationAdult = 0

    const metricSums = {}
    const metricCounts = {}
    METRICS.forEach(prop => {
      metricSums[prop] = 0
      metricCounts[prop] = 0
    })

    regionServices.forEach(s => {
      totalPopulation += s.totalPopulation || 0
      populationUnder12 += s.populationUnder12 || 0
      population12To17 += s.population12To17 || 0
      populationAdult += s.populationAdult || 0

      METRICS.forEach(prop => {
        const val = s[prop]
        if (val != null && Number.isFinite(val)) {
          metricSums[prop] += val
          metricCounts[prop]++
        }
      })
    })

    const metricResults = {}
    METRICS.forEach(prop => {
      metricResults[prop] = metricCounts[prop] > 0 ? metricSums[prop] : null
    })

    return {
      region: regionName,
      niceName: regionName,
      services: regionServices,
      serviceCodes,
      totalPopulation,
      populationUnder12,
      population12To17,
      populationAdult,
      ...metricResults
    }
  })
}

