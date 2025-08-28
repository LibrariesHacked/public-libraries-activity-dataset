import axios from 'axios'

export class Loans {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.serviceCode = json[0]
    this.format = json[1]
    this.contentAgeGroup = json[2]
    this.month = json[3]
    this.countLoans = parseInt(json[4]) || null

    return this
  }
}

export async function getLoans () {
  const response = await axios.get('./loans.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(l => new Loans().fromJson(l))
  } else {
    return []
  }
}
