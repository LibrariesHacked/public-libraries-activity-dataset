import axios from 'axios'

export class Computers {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.serviceCode = json[0]
    this.month = json[1]
    this.countHours = parseInt(json[2]) || null

    return this
  }
}

export async function getComputers () {
  const response = await axios.get('./computers.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(a => new Computers().fromJson(a))
  } else {
    return []
  }
}
