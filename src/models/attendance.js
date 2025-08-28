import axios from 'axios'

export class Attendance {
  constructor (obj) {
    Object.assign(this, obj)
  }

  fromJson (json) {
    this.serviceCode = json[0]
    this.type = json[1]
    this.ageGroup = json[2]
    this.countAttendance = parseInt(json[3]) || null

    return this
  }
}

export async function getAttendance () {
  const response = await axios.get('./attendance.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(a => new Attendance().fromJson(a))
  } else {
    return []
  }
}
