import axios from 'axios'

import { resolveEffectiveValue } from '../helpers/dataQuality'

export class ActivityRecord {
  constructor (obj) {
    if (obj) Object.assign(this, obj)
  }

  resolveCount (useEstimates = true) {
    return resolveEffectiveValue(
      this.originalCount,
      this.estimatedCount,
      this.status,
      useEstimates
    )
  }

  updateCount (useEstimates = true) {
    const val = this.resolveCount(useEstimates)
    if (this._countProp) {
      this[this._countProp] = val
    }
    this.count = val
    return this
  }
}

export function createActivityModel ({
  fields,
  countProp,
  endpoint,
  RecordClass = class extends ActivityRecord {}
}) {
  RecordClass.prototype._fields = fields
  RecordClass.prototype._countProp = countProp

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
