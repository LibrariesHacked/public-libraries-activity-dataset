import { ActivityRecord, createActivityModel } from './activityFactory'

export class WiFi extends ActivityRecord {}

const { fetchRecords: getWiFi } = createActivityModel({
  fields: ['month'],
  countProp: 'countSessions',
  endpoint: './wifi.json',
  RecordClass: WiFi
})

export { getWiFi }
