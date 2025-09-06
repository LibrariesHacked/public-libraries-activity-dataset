import axios from 'axios'

export class WiFi {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.serviceCode = json[0]
    this.month = json[1]
    this.countSessions = parseInt(json[2]) || null

    return this
  }
}

export async function getWiFi () {
  const response = await axios.get('./wifi.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(a => new WiFi().fromJson(a))
  } else {
    return []
  }
}
