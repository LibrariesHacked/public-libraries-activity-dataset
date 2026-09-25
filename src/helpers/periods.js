// Financial years run from April to March. In the data a period is formatted as
// 'YYYY/YYYY' (e.g. '2023/2024') and a month is formatted as 'YYYY-MM'.

export const getPeriodForMonth = month => {
  const [year, monthNumber] = month.split('-').map(Number)
  const startYear = monthNumber >= 4 ? year : year - 1
  return `${startYear}/${startYear + 1}`
}

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

export const getMonthsForPeriods = periods =>
  [...new Set((periods || []).flatMap(getPeriodMonths))].sort()

export const getMonthRangeForPeriods = periods => {
  const months = getMonthsForPeriods(periods)
  if (months.length === 0) return null
  return [months[0], months[months.length - 1]]
}

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

export const isMonthInRange = (month, monthRange) =>
  !monthRange || (month >= monthRange[0] && month <= monthRange[1])

export const filterByMonthRange = (records, monthRange) =>
  monthRange ? records.filter(r => isMonthInRange(r.month, monthRange)) : records

export const filterByPeriods = (records, periods) =>
  periods?.length > 0
    ? records.filter(r => periods.includes(getPeriodForMonth(r.month)))
    : records

export const getPeriodsInMonthRange = (periods, monthRange) =>
  (periods || []).filter(period =>
    getPeriodMonths(period).some(month => isMonthInRange(month, monthRange))
  )

// '2023/2024' displays as '2023/24'
export const formatPeriod = period => {
  const [start, end] = period.split('/')
  return `${start}/${end.slice(2)}`
}

// '2023-04' displays as 'Apr 23'
export const formatMonth = month =>
  new Date(`${month}-01`).toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit'
  })
