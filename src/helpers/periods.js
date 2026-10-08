/**
 * Determines which financial year a given calendar month belongs to.
 *
 * In the UK public library system, financial years run from 1 April through 31 March.
 * For example, April 2023 ('2023-04') belongs to '2023/2024', whereas March 2024 ('2024-03')
 * also belongs to '2023/2024'.
 *
 * @param {string} month - Calendar month string formatted as 'YYYY-MM'.
 * @returns {string} Financial year period formatted as 'YYYY/YYYY' (e.g. '2023/2024').
 */
export const getPeriodForMonth = month => {
  const [year, monthNumber] = month.split('-').map(Number)
  const startYear = monthNumber >= 4 ? year : year - 1
  return `${startYear}/${startYear + 1}`
}

/**
 * Returns an ordered array of all 12 calendar month strings ('YYYY-MM') in a financial year.
 *
 * The months run sequentially from April of the start year through March of the following year.
 *
 * @param {string} period - Financial year period string formatted as 'YYYY/YYYY' (e.g. '2023/2024').
 * @returns {string[]} Array of 12 month strings in chronological order from April to March.
 */
export const getPeriodMonths = period => {
  const startYear = parseInt(period.split('/')[0], 10)
  const months = []
  for (let offset = 0; offset < 12; offset++) {
    const monthNumber = ((3 + offset) % 12) + 1
    const year = startYear + (monthNumber >= 4 ? 0 : 1)
    months.push(`${year}-${String(monthNumber).padStart(2, '0')}`)
  }
  return months
}

/**
 * Returns a deduplicated, chronologically sorted array of all months across multiple financial years.
 *
 * @param {string[]} periods - Array of financial year period strings (e.g. ['2023/2024', '2024/2025']).
 * @returns {string[]} Chronological array of unique 'YYYY-MM' strings spanning the given periods.
 */
export const getMonthsForPeriods = periods =>
  [...new Set((periods || []).flatMap(getPeriodMonths))].sort()

/**
 * Finds the earliest and latest months spanning a set of financial years.
 *
 * @param {string[]} periods - Array of financial year period strings.
 * @returns {[string, string]|null} A two-element array [earliestMonth, latestMonth], or null if no periods provided.
 */
export const getMonthRangeForPeriods = periods => {
  const months = getMonthsForPeriods(periods)
  if (months.length === 0) return null
  return [months[0], months[months.length - 1]]
}

/**
 * Returns all consecutive months between a start and end month that intersect the applicable financial years.
 *
 * @param {[string, string]|null} monthRange - A two-element array [startMonth, endMonth] in 'YYYY-MM' format.
 * @returns {string[]} Array of month strings falling within the specified range.
 */
export const getMonthsInRange = monthRange => {
  if (!monthRange) return []
  const [start, end] = monthRange
  const startPeriod = getPeriodForMonth(start)
  const endPeriod = getPeriodForMonth(end)
  const startYear = parseInt(startPeriod.split('/')[0], 10)
  const endYear = parseInt(endPeriod.split('/')[0], 10)
  const periods = []
  for (let year = startYear; year <= endYear; year++) {
    periods.push(`${year}/${year + 1}`)
  }
  return getMonthsForPeriods(periods).filter(
    month => month >= start && month <= end
  )
}

/**
 * Checks whether a given calendar month falls within a specified [startMonth, endMonth] range.
 *
 * @param {string} month - Calendar month string in 'YYYY-MM' format.
 * @param {[string, string]|null} monthRange - Two-element array [startMonth, endMonth], or null for unbounded.
 * @returns {boolean} True if the month is within the range or if no range is defined; otherwise false.
 */
export const isMonthInRange = (month, monthRange) =>
  !monthRange || (month >= monthRange[0] && month <= monthRange[1])

export const isRecordInMonthRange = (record, monthRange) => {
  if (!monthRange) return true
  if (record.month) return isMonthInRange(record.month, monthRange)
  return Boolean(record.period && getPeriodsInMonthRange([record.period], monthRange).length)
}

/**
 * Filters an array of activity records to only those whose month falls within a given range.
 *
 * @param {Array<{ month: string }>} records - Array of records containing a `month` property.
 * @param {[string, string]|null} monthRange - Two-element array [startMonth, endMonth].
 * @returns {Array<{ month: string }>} Filtered array of records.
 */
export const filterByMonthRange = (records, monthRange) =>
  monthRange ? records.filter(r => isMonthInRange(r.month, monthRange)) : records

/**
 * Filters an array of records to only those whose month belongs to one of the selected financial years.
 *
 * @param {Array<{ month: string }>} records - Array of records containing a `month` property.
 * @param {string[]} periods - Array of financial year period strings (e.g. ['2023/2024']).
 * @returns {Array<{ month: string }>} Filtered array of records.
 */
export const filterByPeriods = (records, periods) =>
  periods?.length > 0
    ? records.filter(r => periods.includes(getPeriodForMonth(r.month)))
    : records

/**
 * Returns the subset of financial year periods that overlap with a specified month range.
 *
 * @param {string[]} periods - Array of financial year period strings to test.
 * @param {[string, string]|null} monthRange - Two-element array [startMonth, endMonth].
 * @returns {string[]} Periods that contain at least one month within the month range.
 */
export const getPeriodsInMonthRange = (periods, monthRange) =>
  (periods || []).filter(period =>
    getPeriodMonths(period).some(month => isMonthInRange(month, monthRange))
  )

/**
 * Formats a full financial year string (e.g. '2023/2024') into standard UK short notation (e.g. '2023/24').
 *
 * @param {string} period - Full financial year period string (e.g. '2023/2024').
 * @returns {string} Shortened financial year string (e.g. '2023/24').
 */
export const formatPeriod = period => {
  if (!period || typeof period !== 'string') return ''
  if (!period.includes('/')) return period
  const [start, end] = period.split('/')
  if (!end) return period
  if (end.length <= 2) return `${start}/${end}`
  return `${start}/${end.slice(2)}`
}

/**
 * Formats a calendar month string ('YYYY-MM') into short human-readable UK display format (e.g. 'Apr 23').
 *
 * @param {string} month - Calendar month string in 'YYYY-MM' format.
 * @returns {string} Localised formatted month string (e.g. 'Apr 23').
 */
export const formatMonth = month => {
  if (!month || typeof month !== 'string') return ''
  const date = new Date(`${month}-01`)
  if (isNaN(date.getTime())) return month
  return date.toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit'
  })
}

/**
 * Resolves the baseline and comparison financial year periods to evaluate for period-over-period trend analysis.
 *
 * If multiple financial years are selected (e.g. ['2022/2023', '2023/2024', '2024/2025']),
 * the baseline is the earliest selected period and the comparison target is the latest, labeled 'since [earliest]'.
 * If a single financial year is selected (e.g. ['2023/2024']), it compares against the immediately preceding
 * financial year available in the dataset, labeled 'vs [preceding]'.
 *
 * @param {string[]} selectedPeriods - Array of currently selected financial year strings.
 * @param {string[]} periods - Array of all available financial year strings in chronological order.
 * @returns {{ baselinePeriod: string, targetPeriod: string, changeDescription: string }|null} Comparison configuration, or null if no baseline available.
 */
export const resolvePeriodComparison = (selectedPeriods, periods) => {
  if (!selectedPeriods || selectedPeriods.length === 0) return null
  if (selectedPeriods.length > 1) {
    const earliest = selectedPeriods[0]
    const latest = selectedPeriods[selectedPeriods.length - 1]
    return {
      baselinePeriod: earliest,
      targetPeriod: latest,
      changeDescription: `since ${formatPeriod(earliest)}`
    }
  }
  const current = selectedPeriods[0]
  const idx = (periods || []).indexOf(current)
  if (idx > 0) {
    const prev = periods[idx - 1]
    return {
      baselinePeriod: prev,
      targetPeriod: current,
      changeDescription: `vs ${formatPeriod(prev)}`
    }
  }
  return null
}

/**
 * Calculates the percentage change in activity between two financial year periods for a collection of activity records.
 * Only services reporting in both periods are compared (like-for-like).
 *
 * @param {Object} options - Calculation options.
 * @param {Array<Object>} options.records - Array of activity records with month and count properties.
 * @param {string} options.countProp - Property name holding the record's numeric count (e.g. 'countLoans').
 * @param {Function} [options.filterFn] - Optional predicate to filter records (e.g. format or category).
 * @param {string} options.baselinePeriod - Baseline period (e.g. '2022/2023').
 * @param {string} options.targetPeriod - Target comparison period (e.g. '2023/2024').
 * @param {string[]|Set<string>} [options.serviceCodes] - Optional collection of active service codes to filter by.
 * @param {boolean} [options.useEstimates=true] - Whether to apply corrections.
 * @returns {number|null} Percentage change, or null if insufficient data.
 */
export const getActivityRecordsPeriodChange = ({
  records,
  countProp,
  filterFn,
  baselinePeriod,
  targetPeriod,
  serviceCodes,
  useEstimates = true,
  services
}) => {
  if (!records || !baselinePeriod || !targetPeriod) return null
  if (baselinePeriod === targetPeriod) return null

  const codeSet = serviceCodes instanceof Set
    ? serviceCodes
    : (serviceCodes ? new Set(serviceCodes) : null)

  const servicePopMap = services
    ? new Map(services.map(s => [s.code, s.totalPopulation || 0]))
    : null

  const rateForPeriod = period => {
    let totalActivity = 0
    const reportingServices = new Set()

    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      if (getPeriodForMonth(r.month) !== period) continue
      if (codeSet && !codeSet.has(r.serviceCode)) continue
      if (filterFn && !filterFn(r)) continue
      const count = r.resolveCount
        ? r.resolveCount(useEstimates)
        : (r[countProp] ?? r.count ?? 0)
      if (!Number.isFinite(count)) continue

      totalActivity += count
      reportingServices.add(r.serviceCode)
    }

    if (totalActivity === 0) return 0
    if (servicePopMap) {
      let reportingPopulation = 0
      reportingServices.forEach(code => {
        reportingPopulation += (servicePopMap.get(code) || 0)
      })
      return reportingPopulation > 0 ? (totalActivity / reportingPopulation) * 1000 : null
    }

    return totalActivity
  }

  const baselineRate = rateForPeriod(baselinePeriod)
  const targetRate = rateForPeriod(targetPeriod)

  if (baselineRate == null || targetRate == null || baselineRate === 0) return null
  return ((targetRate - baselineRate) / baselineRate) * 100
}

/**
 * Calculates the percentage point change in share for a subset of activity records
 * (e.g. branch visits share of total visits, digital loans share of total loans)
 * between two financial year periods, comparing normalized shares in each period.
 *
 * @param {Object} options - Calculation options.
 * @param {Array<Object>} options.records - Array of activity records with month and count properties.
 * @param {string} options.countProp - Property name holding the record's numeric count (e.g. 'countVisits').
 * @param {Function} options.filterFn - Predicate to filter records belonging to the category.
 * @param {Function} [options.totalFilterFn] - Optional predicate to filter records for the total denominator.
 * @param {string} options.baselinePeriod - Baseline period (e.g. '2022/2023').
 * @param {string} options.targetPeriod - Target comparison period (e.g. '2023/2024').
 * @param {string[]|Set<string>} [options.serviceCodes] - Optional collection of active service codes to filter by.
 * @param {boolean} [options.useEstimates=true] - Whether to apply corrections.
 * @returns {number|null} Percentage points difference (e.g. 1.5 for +1.5 pp), or null if insufficient data.
 */
export const getActivityRecordsSharePeriodChange = ({
  records,
  countProp,
  filterFn,
  totalFilterFn,
  baselinePeriod,
  targetPeriod,
  serviceCodes,
  useEstimates = true
}) => {
  if (!records || !baselinePeriod || !targetPeriod || !filterFn) return null
  if (baselinePeriod === targetPeriod) return null

  const codeSet = serviceCodes instanceof Set
    ? serviceCodes
    : (serviceCodes ? new Set(serviceCodes) : null)

  const sumForPeriod = period => {
    let categorySum = 0
    let totalSum = 0

    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      if (getPeriodForMonth(r.month) !== period) continue
      if (codeSet && !codeSet.has(r.serviceCode)) continue

      const count = r.resolveCount
        ? r.resolveCount(useEstimates)
        : (r[countProp] ?? r.count ?? 0)
      if (!Number.isFinite(count)) continue

      if (!totalFilterFn || totalFilterFn(r)) {
        totalSum += count
      }

      if (filterFn(r)) {
        categorySum += count
      }
    }
    return totalSum > 0 ? (categorySum / totalSum) * 100 : null
  }

  const baselineShare = sumForPeriod(baselinePeriod)
  const targetShare = sumForPeriod(targetPeriod)

  if (baselineShare == null || targetShare == null) return null
  return targetShare - baselineShare
}

