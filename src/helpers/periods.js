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
  const startYear = parseInt(period.split('/')[0])
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
  const startYear = parseInt(startPeriod.split('/')[0])
  const endYear = parseInt(endPeriod.split('/')[0])
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
  const [start, end] = period.split('/')
  return `${start}/${end.slice(2)}`
}

/**
 * Formats a calendar month string ('YYYY-MM') into short human-readable UK display format (e.g. 'Apr 23').
 *
 * @param {string} month - Calendar month string in 'YYYY-MM' format.
 * @returns {string} Localised formatted month string (e.g. 'Apr 23').
 */
export const formatMonth = month =>
  new Date(`${month}-01`).toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit'
  })
