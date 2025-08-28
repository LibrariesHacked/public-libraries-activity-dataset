import axios from 'axios'

export class Visits {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.serviceCode = json[0]
    this.location = json[1]
    this.month = json[2]
    this.countVisits = parseInt(json[3]) || null

    return this
  }
}

export async function getVisits () {
  const response = await axios.get('./visits.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(v => new Visits().fromJson(v))
  } else {
    return []
  }
}
