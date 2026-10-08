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

export const getQualitySummary = ({ status, notes = '' }) => {
  if (status === 'excluded') return 'Some figures were left out because of reporting problems.'
  if (status === 'replaced') return 'An estimated correction is available for some figures.'
  if (status === 'standardised') return 'Figures were spread evenly across months.'

  const text = notes.toLowerCase()
  if (text.includes('ignores numeric text')) return 'The annual total missed some monthly figures. The reported total is unchanged.'
  if (text.includes('identical')) return 'Different parts of the return contain identical figures. They remain unchanged.'
  if (text.includes('category sum') || text.includes('age-band sum')) return 'Category figures do not match the reported total. They remain unchanged.'
  if (text.includes('supplied month sum')) return 'The annual total does not match the monthly figures. Both are kept as reported.'
  if (text.includes('median nonzero month')) return 'Some months look unusually high or low. The figures remain unchanged.'
  if (text.includes('active') && text.includes('registered')) return 'Check whether this counts active borrowers or all registered members. The figures remain unchanged.'
  return 'This return has unusual figures to check. They remain unchanged.'
}

export const groupQualityIssues = rows => {
  const groups = new Map()
  const priority = ['excluded', 'replaced', 'suspicious', 'standardised']
  for (const row of rows) {
    const key = JSON.stringify([row.serviceCode, row.period, row.dataset])
    if (!groups.has(key)) groups.set(key, { ...row, id: key, records: [] })
    groups.get(key).records.push(row)
  }
  return [...groups.values()].map(group => {
    const statuses = [...new Set(group.records.map(row => row.status).filter(Boolean))]
    const status = priority.find(value => statuses.includes(value)) || null
    const notes = [...new Set(group.records.map(row => row.notes).filter(Boolean))].join('\n\n')
    return {
      ...group,
      status,
      statuses,
      notes,
      summary: getQualitySummary({ status, notes }),
      scope: [...new Set(group.records.map(row => row.scope))].join(' '),
      match: [...new Set(group.records.map(row => row.match))].join(' ')
    }
  })
}

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
 * @returns {{ status: string, serviceCount?: number, serviceName?: string, original?: number, estimated?: number, notes?: string }|null} Warning details or null.
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
        serviceCount: 1,
        serviceName: s.niceName || s.name || null,
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
  const status = hasExcluded
    ? DataQualityStatus.EXCLUDED
    : (hasReplaced ? DataQualityStatus.REPLACED : DataQualityStatus.SUSPICIOUS)

  return {
    status,
    serviceCount: flagged.length,
    serviceName: flagged.length === 1 ? (flagged[0].niceName || flagged[0].name) : null,
    original: flagged.reduce((s, r) => s + (r[origProp] || 0), 0),
    estimated: flagged.reduce(
      (s, r) => s + (r[estProp] != null ? r[estProp] : (r[origProp] || 0)),
      0
    ),
    notes: flagged.length === 1 ? flagged[0][notesProp] : null
  }
}

/**
 * Generates an aggregated data quality warning object from an array of detailed activity records.
 *
 * Sums the original and estimated figures across all flagged records and identifies distinct services affected.
 *
 * @param {Array<{ status?: string, serviceCode?: string, service?: string, serviceName?: string, originalCount?: number, estimatedCount?: number, notes?: string }>} records - Activity records.
 * @returns {{ status: string, serviceCount: number, recordCount: number, original: number, estimated: number, notes?: string }|null} Warning summary or null if no records are flagged.
 */
export const getRecordsQualityWarning = records => {
  if (!records || records.length === 0) return null

  const flagged = records.filter(r => r.status)
  if (flagged.length === 0) return null

  const hasExcluded = flagged.some(r => r.status === DataQualityStatus.EXCLUDED)
  const hasReplaced = flagged.some(r => r.status === DataQualityStatus.REPLACED)
  const status = hasExcluded
    ? DataQualityStatus.EXCLUDED
    : (hasReplaced ? DataQualityStatus.REPLACED : DataQualityStatus.SUSPICIOUS)

  const serviceCodes = new Set(
    flagged.map(r => r.serviceCode || r.service || r.serviceName).filter(Boolean)
  )
  const serviceCount = serviceCodes.size || (flagged.length > 0 ? 1 : 0)

  return {
    status,
    serviceCount,
    recordCount: flagged.length,
    original: flagged.reduce((s, r) => s + (r.originalCount || 0), 0),
    estimated: flagged.reduce(
      (s, r) => s + (r.estimatedCount != null ? r.estimatedCount : (r.originalCount || 0)),
      0
    ),
    notes: flagged.length === 1 ? flagged[0].notes : null
  }
}
