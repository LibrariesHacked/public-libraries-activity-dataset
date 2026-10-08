import axios from 'axios'

/**
 * Domain model representing a data quality anomaly or correction entry.
 */
export class ErrorRecord {
  /**
   * Constructs an ErrorRecord instance.
   *
   * @param {object} [data] - Error record attributes from errors.json.
   */
  constructor (data) {
    if (data) {
      Object.assign(this, data)
      this.serviceCode = data['Authority code'] || data.serviceCode
      this.serviceName = data['Authority name'] || data.serviceName
      this.period = data.Period || data.period
      this.dataset = data.Dataset || data.dataset
      this.scope = data.Scope || data.scope
      this.match = data.Match || data.match
      this.status = data.Status || data.status
      this.estimatedCount = data['Estimated count'] || data.estimatedCount
      this.notes = data.Notes || data.notes
    }
  }
}

/**
 * Fetches the master data quality anomaly and correction register.
 *
 * @returns {Promise<ErrorRecord[]>} Promise resolving to an array of ErrorRecord instances.
 */
export async function getErrors () {
  const response = await axios.get('./errors.json')
  if (response && response.data && response.data.length > 0) {
    return response.data.map(item => new ErrorRecord(item))
  }
  return []
}
