import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing library loans categorized by format (e.g. book, audiobook, ebook), target age group, and month.
 */
export class Loans extends ActivityRecord {}

const { fetchRecords: getLoans } = createActivityModel({
  fields: ['format', 'contentAgeGroup', 'month'],
  countProp: 'countLoans',
  endpoint: './loans.json',
  RecordClass: Loans
})

/**
 * Fetches and deserializes all detailed library loan records from the static dataset.
 *
 * @returns {Promise<Loans[]>} Promise resolving to an array of Loans record instances.
 */
export { getLoans }
