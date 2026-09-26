import { ActivityRecord, createActivityModel } from './activityFactory'

export class Visits extends ActivityRecord {}

const { fetchRecords: getVisits } = createActivityModel({
  fields: ['location', 'month'],
  countProp: 'countVisits',
  endpoint: './visits.json',
  RecordClass: Visits
})

export { getVisits }
