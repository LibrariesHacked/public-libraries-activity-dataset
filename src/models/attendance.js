import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing library event attendance by event type, age group, and month.
 */
export class Attendance extends ActivityRecord {}

const { fetchRecords: getAttendance } = createActivityModel({
  fields: ['type', 'ageGroup', 'month'],
  countProp: 'countAttendance',
  endpoint: './attendance.json',
  RecordClass: Attendance
})

/**
 * Fetches and deserializes all library event attendance records from the static dataset.
 *
 * @returns {Promise<Attendance[]>} Promise resolving to an array of Attendance record instances.
 */
export { getAttendance }
