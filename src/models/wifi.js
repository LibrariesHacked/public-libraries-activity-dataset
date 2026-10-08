import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing library Wi-Fi usage sessions by month.
 */
export class WiFi extends ActivityRecord {}

const { fetchRecords: getWiFi } = createActivityModel({
  fields: ['month'],
  countProp: 'countSessions',
  endpoint: './wifi.json',
  RecordClass: WiFi
})

/**
 * Fetches and deserializes all Wi-Fi session records from the static dataset.
 *
 * @returns {Promise<WiFi[]>} Promise resolving to an array of WiFi record instances.
 */
export { getWiFi, getWiFi as getWifi }

