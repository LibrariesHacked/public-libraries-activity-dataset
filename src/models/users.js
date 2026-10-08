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

  const totalsFor = period => {
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

  const earliestTotals = totalsFor(earliestPeriod)
  const latestTotals = totalsFor(latestPeriod)

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

  const totalsFor = period => {
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

  const earliestTotals = totalsFor(earliestPeriod)
  const latestTotals = totalsFor(latestPeriod)

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

  // For all services we want a percentage of population for
  // Under 12, 12-17, Adult
  const ageGroups = ['Under 12', '12-17', 'Adult']
  services.forEach(service => {
    percentagesByService[service.code] = {}
    const serviceUsers = users.filter(u => u.serviceCode === service.code)
    const sumAllUsers = serviceUsers.reduce(
      (sum, user) => sum + (user.countUsers || 0),
      0
    )

    ageGroups.forEach(ageGroup => {
      const ageGroupUsers = serviceUsers.filter(u => u.ageGroup === ageGroup)
      if (ageGroupUsers.length === 0 || sumAllUsers === 0) {
        percentagesByService[service.code][ageGroup] = null
        return
      }

      const totalUsers = ageGroupUsers.reduce(
        (sum, user) => sum + (user.countUsers || 0),
        0
      )
      const populationForAgeGroup =
        ageGroup === 'Under 12'
          ? service.populationUnder12
          : ageGroup === '12-17'
            ? service.population12To17
            : ageGroup === 'Adult'
              ? service.populationAdult
              : null

      const percentage =
        populationForAgeGroup > 0
          ? (totalUsers / populationForAgeGroup) * 100
          : null

      percentagesByService[service.code][ageGroup] =
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
    percentagesByService[service.code].Total =
      overallPercentage != null
        ? parseFloat(overallPercentage.toFixed(2))
        : null
  })

  return percentagesByService
}
