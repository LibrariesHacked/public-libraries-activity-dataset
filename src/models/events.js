import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing library events broken down by event type, age group, and month.
 */
export class Events extends ActivityRecord {}

const { fetchRecords: getEvents } = createActivityModel({
  fields: ['type', 'ageGroup', 'month'],
  countProp: 'countEvents',
  endpoint: './events.json',
  RecordClass: Events
})

/**
 * Fetches and deserializes all library event count records from the static dataset.
 *
 * @returns {Promise<Events[]>} Promise resolving to an array of Events record instances.
 */
export { getEvents }
