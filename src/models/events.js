import { ActivityRecord, createActivityModel } from './activityFactory'

export class Events extends ActivityRecord {}

const { fetchRecords: getEvents } = createActivityModel({
  fields: ['type', 'ageGroup', 'month'],
  countProp: 'countEvents',
  endpoint: './events.json',
  RecordClass: Events
})

export { getEvents }
