import axios from 'axios'

import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing library loans categorized by format (e.g. book, audiobook, ebook), target age group, and month.
 */
export class Loans extends ActivityRecord {}

const LOANS_ENDPOINT = './loans.json'

const loansModel = createActivityModel({
  fields: ['format', 'contentAgeGroup', 'month'],
  countProp: 'countLoans',
  endpoint: LOANS_ENDPOINT,
  RecordClass: Loans
})

const getLoans = async () => {
  const response = await axios.get(LOANS_ENDPOINT)
  const payload = response?.data
  if (!payload) return []

  const records = Array.isArray(payload) ? payload : payload.records
  const issues = Array.isArray(payload)
    ? null
    : new Map((payload.issues || []).map(issue => [issue.id, issue]))

  return records.map(record => {
    const issueId = !Array.isArray(payload) && Number.isInteger(record[7])
      ? record[7]
      : null
    const issue = issueId == null ? null : issues?.get(issueId)
    const recordWithLegacyNotes = Array.isArray(payload)
      ? record
      : [...record.slice(0, 7), issue?.note || null]
    const loan = loansModel.fromJson(recordWithLegacyNotes)
    loan.reviewIssueId = issueId
    loan.issueDetails = issue?.note || null
    loan.reviewIssue = issue
    return loan
  })
}

/**
 * Fetches and deserializes all detailed library loan records from the static dataset.
 *
 * @returns {Promise<Loans[]>} Promise resolving to an array of Loans record instances.
 */
export { getLoans }
