import { ActivityRecord, createActivityModel } from './activityFactory'

export class Loans extends ActivityRecord {}

const { fetchRecords: getLoans } = createActivityModel({
  fields: ['format', 'contentAgeGroup', 'month'],
  countProp: 'countLoans',
  endpoint: './loans.json',
  RecordClass: Loans
})

export { getLoans }
