import { ActivityRecord, createActivityModel } from './activityFactory'

export class Users extends ActivityRecord {}

const { fetchRecords: getUsers } = createActivityModel({
  fields: ['period', 'ageGroup'],
  countProp: 'countUsers',
  endpoint: './users.json',
  RecordClass: Users
})

export { getUsers }

// Percentage change in active users between two financial years. Only services
// that reported in both years are included, so the change is not distorted by
// services starting or stopping reporting.
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

export function getUsersPopulationPercentages (services, users) {
  const percentagesByService = {}

  // For all services we want a percentage of population for
  // Under 12, 12-17, Adult and Unknown
  const ageGroups = ['Under 12', '12-17', 'Adult']
  services.forEach(service => {
    percentagesByService[service.code] = {}
    const serviceUsers = users.filter(u => u.serviceCode === service.code)

    ageGroups.forEach(ageGroup => {
      const ageGroupUsers = serviceUsers.filter(u => u.ageGroup === ageGroup)
      const totalUsers = ageGroupUsers.reduce(
        (sum, user) => sum + user.countUsers,
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

    const totalUsers = service.users || null
    const totalPopulation = service.totalPopulation || null
    const overallPercentage =
      totalPopulation > 0 ? (totalUsers / totalPopulation) * 100 : null
    percentagesByService[service.code].Total =
      overallPercentage != null
        ? parseFloat(overallPercentage.toFixed(2))
        : null
  })

  return percentagesByService
}
