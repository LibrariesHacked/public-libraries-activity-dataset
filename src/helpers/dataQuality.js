/**
 * Enumeration of standardized data quality anomaly statuses.
 *
 * - `EXCLUDED`: The entry has severe corruption or unresolvable error and is excluded from totals.
 * - `REPLACED`: The reported value had an anomaly replaced with corrected data.
 * - `SUSPICIOUS`: The value has an irregularity flagged for transparency, but was not replaced.
 */
export const DataQualityStatus = Object.freeze({
  EXCLUDED: 'excluded',
  REPLACED: 'replaced',
  SUSPICIOUS: 'suspicious'
})

/**
 * Resolves the effective numeric value to display or aggregate based on user preferences and data quality status.
 *
 * If the status is excluded, it always returns null. If the status is replaced and the user selects corrected data,
 * it returns the corrected figure. Otherwise, it returns the original data value.
 *
 * @param {number|null} original - The raw value as originally submitted in survey returns.
 * @param {number|null} estimated - The algorithmically or manually estimated correction.
 * @param {string|null} status - Data quality status ('excluded', 'replaced', 'suspicious', or null).
 * @param {boolean} [useEstimates=true] - Whether to use corrected data when available.
 * @returns {number|null} The resolved numeric value, or null if excluded or missing.
 */
export const resolveEffectiveValue = (
  original,
  estimated,
  status,
  useEstimates = true
) => {
  if (status === DataQualityStatus.EXCLUDED) return null
  if (useEstimates && status === DataQualityStatus.REPLACED && estimated != null) return estimated
  return original != null ? original : null
}

/**
 * Determines whether any active library services have data quality warnings for a specific metric.
 *
 * For a single service, returns that service's specific status, original figure, estimate, and note.
 * For multiple services, aggregates whether any are excluded or replaced, and builds a summary note.
 *
 * @param {Array<object>} activeServices - Currently active or filtered library service objects.
 * @param {string} prop - The metric property name to inspect (e.g. 'loans', 'visits', 'users').
 * @returns {{ status: string, original?: number, estimated?: number, notes: string }|null} Warning details or null.
 */
export const getServiceQualityWarning = (activeServices, prop) => {
  if (!activeServices || activeServices.length === 0) return null

  const statusProp = `${prop}Status`
  const origProp = `${prop}Original`
  const estProp = `${prop}Estimated`
  const notesProp = `${prop}Notes`

  if (activeServices.length === 1) {
    const s = activeServices[0]
    if (s[statusProp]) {
      return {
        status: s[statusProp],
        original: s[origProp],
        estimated: s[estProp],
        notes: s[notesProp]
      }
    }
    return null
  }

  const flagged = activeServices.filter(s => s[statusProp])
  if (flagged.length === 0) return null

  const hasExcluded = flagged.some(s => s[statusProp] === DataQualityStatus.EXCLUDED)
  const hasReplaced = flagged.some(s => s[statusProp] === DataQualityStatus.REPLACED)
  return {
    status: hasExcluded
      ? DataQualityStatus.EXCLUDED
      : (hasReplaced ? DataQualityStatus.REPLACED : DataQualityStatus.SUSPICIOUS),
    notes: `${flagged.length} service${flagged.length > 1 ? 's have' : ' has'} data quality notes: ${flagged.map(s => `${s.niceName} (${s[statusProp]})`).join(', ')}`
  }
}

/**
 * Generates an aggregated data quality warning object from an array of detailed activity records.
 *
 * Sums the original and estimated figures across all flagged records and combines distinct notes.
 *
 * @param {Array<{ status?: string, originalCount?: number, estimatedCount?: number, notes?: string }>} records - Activity records.
 * @returns {{ status: string, original: number, estimated: number, notes: string }|null} Warning summary or null if no records are flagged.
 */
export const getRecordsQualityWarning = records => {
  if (!records || records.length === 0) return null

  const flagged = records.filter(r => r.status)
  if (flagged.length === 0) return null

  const hasExcluded = flagged.some(r => r.status === DataQualityStatus.EXCLUDED)
  const hasReplaced = flagged.some(r => r.status === DataQualityStatus.REPLACED)
  const notes = flagged.map(r => r.notes).filter(Boolean)

  return {
    status: hasExcluded
      ? DataQualityStatus.EXCLUDED
      : (hasReplaced ? DataQualityStatus.REPLACED : DataQualityStatus.SUSPICIOUS),
    original: flagged.reduce((s, r) => s + (r.originalCount || 0), 0),
    estimated: flagged.reduce(
      (s, r) => s + (r.estimatedCount != null ? r.estimatedCount : (r.originalCount || 0)),
      0
    ),
    notes: [...new Set(notes)].join('; ')
  }
}
