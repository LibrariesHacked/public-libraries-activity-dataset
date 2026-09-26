import { ActivityRecord, createActivityModel } from './activityFactory'

export class Computers extends ActivityRecord {}

const { fetchRecords: getComputers } = createActivityModel({
  fields: ['month'],
  countProp: 'countHours',
  endpoint: './computers.json',
  RecordClass: Computers
})

export { getComputers }
