import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing monthly public library computer and device usage hours.
 */
export class Computers extends ActivityRecord {}

const { fetchRecords: getComputers } = createActivityModel({
  fields: ['month'],
  countProp: 'countHours',
  endpoint: './computers.json',
  RecordClass: Computers
})

/**
 * Fetches and deserializes all monthly computer usage hour records from the static dataset.
 *
 * @returns {Promise<Computers[]>} Promise resolving to an array of Computers record instances.
 */
export { getComputers }
