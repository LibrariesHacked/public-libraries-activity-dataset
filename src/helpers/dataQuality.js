export const resolveEffectiveValue = (
  original,
  estimated,
  status,
  useEstimates = true
) => {
  if (status === 'excluded') return null
  if (useEstimates && status === 'replaced' && estimated != null) return estimated
  return original != null ? original : null
}

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

  const hasExcluded = flagged.some(s => s[statusProp] === 'excluded')
  const hasReplaced = flagged.some(s => s[statusProp] === 'replaced')
  return {
    status: hasExcluded ? 'excluded' : (hasReplaced ? 'replaced' : 'suspicious'),
    notes: `${flagged.length} service${flagged.length > 1 ? 's have' : ' has'} data quality notes: ${flagged.map(s => `${s.niceName} (${s[statusProp]})`).join(', ')}`
  }
}

export const getRecordsQualityWarning = records => {
  if (!records || records.length === 0) return null

  const flagged = records.filter(r => r.status)
  if (flagged.length === 0) return null

  const hasExcluded = flagged.some(r => r.status === 'excluded')
  const hasReplaced = flagged.some(r => r.status === 'replaced')
  const notes = flagged.map(r => r.notes).filter(Boolean)

  return {
    status: hasExcluded ? 'excluded' : (hasReplaced ? 'replaced' : 'suspicious'),
    original: flagged.reduce((s, r) => s + (r.originalCount || 0), 0),
    estimated: flagged.reduce(
      (s, r) => s + (r.estimatedCount != null ? r.estimatedCount : (r.originalCount || 0)),
      0
    ),
    notes: [...new Set(notes)].join('; ')
  }
}
