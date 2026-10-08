import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing active library users categorized by age group and financial year period.
 */
export class Users extends ActivityRecord {}

const { fetchRecords: getUsers } = createActivityModel({
  fields: ['period', 'ageGroup'],
  countProp: 'countUsers',
  endpoint: './users.json',
  RecordClass: Users
})

/**
 * Fetches and deserializes all detailed active user records from the static dataset.
 *
 * @returns {Promise<Users[]>} Promise resolving to an array of Users record instances.
 */
export { getUsers }

/**
 * Calculates per-service user totals for a given financial year period.
 *
 * @param {Users[]} users - List of user records.
 * @param {string} period - Target financial year period.
 * @param {string} [ageGroup] - Optional age group filter.
 * @param {string[]} [serviceCodes] - Optional list of service codes to include.
 * @returns {Map<string, number>} Map of service codes to total user counts.
 */
const getUserTotalsForPeriod = (users, period, ageGroup, serviceCodes) => {
  const totals = new Map()
  users.forEach(user => {
    if (user.period !== period) return
    if (ageGroup && user.ageGroup !== ageGroup) return
    if (serviceCodes && !serviceCodes.includes(user.serviceCode)) return
    if (user.countUsers == null || user.countUsers === 0) return
    totals.set(
      user.serviceCode,
      (totals.get(user.serviceCode) || 0) + user.countUsers
    )
  })
  return totals
}

/**
 * Calculates the percentage change in active users between two financial year periods.
 * Only library services that reported data in both periods are included, preventing distortions
 * caused by services joining or dropping out of reporting.
 *
 * @param {Users[]} users - Array of user activity records.
 * @param {string} [ageGroup] - Optional age group filter (e.g. 'Under 12', '12-17', 'Adult'). If omitted, all age groups are included.
 * @param {string} earliestPeriod - Baseline financial year period (e.g. '2022/23').
 * @param {string} latestPeriod - Target comparison financial year period (e.g. '2023/24').
 * @param {string[]} [serviceCodes] - Optional list of service codes to filter by.
 * @returns {number|null} The percentage change between the periods (e.g. 5.2 for +5.2%), or null if insufficient data.
 */
export function getUsersPeriodChange (
  users,
  ageGroup,
  earliestPeriod,
  latestPeriod,
  serviceCodes
) {
  if (!users || !earliestPeriod || !latestPeriod) return null
  if (earliestPeriod === latestPeriod) return null

  const earliestTotals = getUserTotalsForPeriod(
    users,
    earliestPeriod,
    ageGroup,
    serviceCodes
  )
  const latestTotals = getUserTotalsForPeriod(
    users,
    latestPeriod,
    ageGroup,
    serviceCodes
  )

  let earliestTotal = 0
  let latestTotal = 0
  earliestTotals.forEach((total, serviceCode) => {
    if (!latestTotals.has(serviceCode)) return
    earliestTotal += total
    latestTotal += latestTotals.get(serviceCode)
  })

  if (earliestTotal === 0) return null
  return ((latestTotal - earliestTotal) / earliestTotal) * 100
}

/**
 * Calculates the percentage point change in active library user penetration
 * relative to the resident population between two financial year periods.
 * Only services reporting in both periods are compared (like-for-like).
 *
 * @param {Users[]} users - List of all user records.
 * @param {import('./service').Service[]} services - List of library services with demographic population figures.
 * @param {string|null} [ageGroup] - Age group to filter ('Under 12', '12-17', 'Adult', or null for total).
 * @param {string} earliestPeriod - Baseline comparison financial year period.
 * @param {string} latestPeriod - Target comparison financial year period.
 * @param {string[]} [serviceCodes] - Optional list of service codes to filter by.
 * @returns {number|null} The percentage point change between the periods (e.g. 1.2 for +1.2 pp), or null if insufficient data.
 */
export function getUsersPenetrationPeriodChange (
  users,
  services,
  ageGroup,
  earliestPeriod,
  latestPeriod,
  serviceCodes
) {
  if (!users || !services || !earliestPeriod || !latestPeriod) return null
  if (earliestPeriod === latestPeriod) return null

  const activeServices = serviceCodes?.length
    ? services.filter(s => serviceCodes.includes(s.code))
    : services
  const serviceMap = new Map(activeServices.map(s => [s.code, s]))

  const earliestTotals = getUserTotalsForPeriod(
    users,
    earliestPeriod,
    ageGroup,
    serviceCodes
  )
  const latestTotals = getUserTotalsForPeriod(
    users,
    latestPeriod,
    ageGroup,
    serviceCodes
  )

  let earliestUserTotal = 0
  let earliestPopTotal = 0
  let latestUserTotal = 0
  let latestPopTotal = 0

  earliestTotals.forEach((userCount, code) => {
    if (!latestTotals.has(code)) return
    const svc = serviceMap.get(code)
    if (!svc) return
    const pop = ageGroup === 'Under 12'
      ? svc.populationUnder12
      : ageGroup === '12-17'
        ? svc.population12To17
        : ageGroup === 'Adult'
          ? svc.populationAdult
          : svc.totalPopulation
    if (!pop || pop <= 0) return

    earliestUserTotal += userCount
    earliestPopTotal += pop
    latestUserTotal += latestTotals.get(code)
    latestPopTotal += pop
  })

  if (earliestPopTotal === 0 || latestPopTotal === 0) return null
  const earliestPct = (earliestUserTotal / earliestPopTotal) * 100
  const latestPct = (latestUserTotal / latestPopTotal) * 100

  return latestPct - earliestPct
}

const POPULATION_AGE_GROUPS = ['Under 12', '12-17', 'Adult']

/**
 * Computes active library user penetration as a percentage of the resident population figures
 * for each service across age groups ('Under 12', '12-17', 'Adult') and the overall service population.
 *
 * @param {import('./service').Service[]} services - List of library services with population statistics.
 * @param {Users[]} users - List of user records for the selected period(s).
 * @returns {Object<string, Object<string, number|null>>} Dictionary keyed by service code containing percentage penetration per age group and total.
 */
export function getUsersPopulationPercentages (services, users) {
  const percentagesByService = {}
  if (!services?.length) return percentagesByService

  const usersByService = new Map()
  if (users?.length) {
    users.forEach(u => {
      if (u.countUsers == null || u.countUsers === 0) return
      let serviceGroup = usersByService.get(u.serviceCode)
      if (!serviceGroup) {
        serviceGroup = new Map()
        usersByService.set(u.serviceCode, serviceGroup)
      }
      serviceGroup.set(
        u.ageGroup,
        (serviceGroup.get(u.ageGroup) || 0) + u.countUsers
      )
    })
  }

  services.forEach(service => {
    const serviceResults = {}
    const serviceGroup = usersByService.get(service.code)
    const hasAnyUsers = serviceGroup && serviceGroup.size > 0

    POPULATION_AGE_GROUPS.forEach(ageGroup => {
      if (!hasAnyUsers) {
        serviceResults[ageGroup] = null
        return
      }

      const totalUsers = serviceGroup.get(ageGroup) || 0
      if (totalUsers === 0) {
        serviceResults[ageGroup] = null
        return
      }

      const populationForAgeGroup =
        ageGroup === 'Under 12'
          ? service.populationUnder12
          : ageGroup === '12-17'
            ? service.population12To17
            : service.populationAdult

      const percentage =
        populationForAgeGroup > 0
          ? (totalUsers / populationForAgeGroup) * 100
          : null

      serviceResults[ageGroup] =
        percentage != null ? parseFloat(percentage.toFixed(2)) : null
    })

    const totalUsers =
      service.users != null && Number.isFinite(service.users) && service.users > 0
        ? service.users
        : null
    const totalPopulation = service.totalPopulation || null
    const overallPercentage =
      totalUsers != null && totalPopulation > 0
        ? (totalUsers / totalPopulation) * 100
        : null

    serviceResults.Total =
      overallPercentage != null
        ? parseFloat(overallPercentage.toFixed(2))
        : null

    percentagesByService[service.code] = serviceResults
  })

  return percentagesByService
}
