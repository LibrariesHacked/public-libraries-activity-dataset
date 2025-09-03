import axios from 'axios'

export class ComputerUsage {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.serviceCode = json[0]
    this.period = json[1]
    this.hours = parseInt(json[2]) || null

    return this
  }
}

export async function getComputerUsage () {
  const response = await axios.get('./computer_usage.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(a => new ComputerUsage().fromJson(a))
  } else {
    return []
  }
}
