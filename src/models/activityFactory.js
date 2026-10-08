import axios from 'axios'

import { resolveEffectiveValue } from '../helpers/dataQuality'

/**
 * Base record class representing an individual library activity record.
 *
 * Provides methods for resolving and dynamically updating counts when toggling
 * between original data and corrected data.
 */
export class ActivityRecord {
  /**
   * Constructs an activity record instance and copies all supplied properties.
   *
   * @param {object} [obj] - Initial properties to assign to the record.
   */
  constructor (obj) {
    if (obj) Object.assign(this, obj)
  }

  /**
   * Resolves the effective numeric count for this record based on its data quality status
  * and the user's corrections toggle.
   *
   * @param {boolean} [useEstimates=true] - Whether to use corrected data when available.
   * @returns {number|null} The resolved count, or null if excluded or missing.
   */
  resolveCount (useEstimates = true) {
    return resolveEffectiveValue(
      this.originalCount,
      this.estimatedCount,
      this.status,
      useEstimates
    )
  }

  /**
   * Updates the record's primary count property and generic `count` alias in place.
   *
   * Called whenever the user toggles the application-wide corrected data switch.
   *
   * @param {boolean} [useEstimates=true] - Whether to apply corrected data.
   * @returns {ActivityRecord} The updated record instance for method chaining.
   */
  updateCount (useEstimates = true) {
    const val = this.resolveCount(useEstimates)
    if (this._countProp) {
      this[this._countProp] = val
    }
    this.count = val
    return this
  }
}

/**
 * Factory function that creates a standardized domain model for an activity dataset.
 *
 * Configures JSON deserialization, schema mapping, and asynchronous data fetching
 * for library activity types (e.g. loans, visits, attendance, computers, events, wifi).
 *
 * @param {object} config - Configuration object for the activity model.
 * @param {string[]} config.fields - Names of positional fields in the data row following serviceCode.
 * @param {string} config.countProp - Primary count property name on the instance (e.g. 'countLoans').
 * @param {string} config.endpoint - URL path to the static JSON dataset file (e.g. './loans.json').
 * @param {typeof ActivityRecord} [config.RecordClass] - Custom subclass extending ActivityRecord.
 * @returns {{ RecordClass: typeof ActivityRecord, fetchRecords: function(): Promise<ActivityRecord[]>, fromJson: function(Array): ActivityRecord }} Model interface.
 */
export function createActivityModel ({
  fields,
  countProp,
  endpoint,
  RecordClass = class extends ActivityRecord {}
}) {
  RecordClass.prototype._fields = fields
  RecordClass.prototype._countProp = countProp

  /**
   * Deserializes a compact array row from the JSON dataset into an ActivityRecord instance.
   *
   * @param {Array} json - Compact positional array row from the JSON dataset.
   * @returns {ActivityRecord} Deserialized and initialized record instance.
   */
  RecordClass.prototype.fromJson = function (json) {
    this.serviceCode = json[0]
    fields.forEach((field, index) => {
      this[field] = json[index + 1]
    })
    const len = json.length
    this.estimatedCount = json[len - 4] != null ? parseInt(json[len - 4]) : null
    this.originalCount = json[len - 3] != null ? parseInt(json[len - 3]) : null
    this.status = json[len - 2] || null
    this.notes = json[len - 1] || null
    this._countProp = countProp
    this.updateCount(true)
    return this
  }

  /**
   * Fetches the activity dataset from the endpoint and returns deserialized record instances.
   *
   * @returns {Promise<ActivityRecord[]>} Promise resolving to an array of ActivityRecord instances.
   */
  const fetchRecords = async () => {
    const response = await axios.get(endpoint)
    if (response && response.data && response.data.length > 0) {
      return response.data.map(row => new RecordClass().fromJson(row))
    }
    return []
  }

  return {
    RecordClass,
    fetchRecords,
    fromJson: json => new RecordClass().fromJson(json)
  }
}
