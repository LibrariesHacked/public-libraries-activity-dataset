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
    this.members = json[4]
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

    return this
  }
}

export async function getServices () {
  const response = await axios.get('./services.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(s => new Service().fromJson(s))
  } else {
    return []
  }
}
