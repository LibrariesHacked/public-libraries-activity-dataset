import axios from 'axios'

export class Membership {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.serviceCode = json[0]
    this.period = json[1]
    this.ageGroup = json[2]
    this.countMembers = parseInt(json[3])

    return this
  }
}

export async function getMembership () {
  const response = await axios.get('./members.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(m => new Membership().fromJson(m))
  } else {
    return []
  }
}
