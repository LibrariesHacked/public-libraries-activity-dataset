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
