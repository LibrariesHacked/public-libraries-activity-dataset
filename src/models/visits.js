import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing library visits and outreach interactions by location and month.
 */
export class Visits extends ActivityRecord {}

const { fetchRecords: getVisits } = createActivityModel({
  fields: ['location', 'month'],
  countProp: 'countVisits',
  endpoint: './visits.json',
  RecordClass: Visits
})

/**
 * Fetches and deserializes all detailed library visit records from the static dataset.
 *
 * @returns {Promise<Visits[]>} Promise resolving to an array of Visits record instances.
 */
export { getVisits }

