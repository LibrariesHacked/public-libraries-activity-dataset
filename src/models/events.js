import axios from 'axios'

export class Events {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.serviceCode = json[0]
    this.type = json[1]
    this.ageGroup = json[2]
    this.month = json[3]
    this.countEvents = parseInt(json[4]) || null

    return this
  }
}

export async function getEvents () {
  const response = await axios.get('./events.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(e => new Events().fromJson(e))
  } else {
    return []
  }
}
