import { ActivityRecord, createActivityModel } from './activityFactory'

export class Attendance extends ActivityRecord {}

const { fetchRecords: getAttendance } = createActivityModel({
  fields: ['type', 'ageGroup', 'month'],
  countProp: 'countAttendance',
  endpoint: './attendance.json',
  RecordClass: Attendance
})

export { getAttendance }
