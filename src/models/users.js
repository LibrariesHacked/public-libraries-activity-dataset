import axios from 'axios'

export class Users {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.serviceCode = json[0]
    this.period = json[1]
    this.ageGroup = json[2]
    this.countUsers = parseInt(json[3])

    return this
  }
}

export async function getUsers () {
  const response = await axios.get('./users.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(m => new Users().fromJson(m))
  } else {
    return []
  }
}

export function getUsersPopulationPercentages (services, users) {
  let percentagesByService = {}

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

      percentagesByService[service.code][ageGroup] = parseFloat(
        percentage.toFixed(2)
      )
    })

    const totalUsers = service.users ||  null
    const totalPopulation = service.totalPopulation ||  null
    const overallPercentage =
      totalPopulation > 0 ? (totalUsers / totalPopulation) * 100 : null
    percentagesByService[service.code]['Total'] = parseFloat(
      overallPercentage.toFixed(2)
    )
  })

  return percentagesByService
}
