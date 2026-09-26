export const formatCompactNumber = (value, maximumFractionDigits) => {
  if (value == null || !Number.isFinite(Number(value))) {
    return '0'
  }

  const options = { notation: 'compact' }
  if (typeof maximumFractionDigits === 'number') {
    options.maximumFractionDigits = maximumFractionDigits
  }

  return new Intl.NumberFormat('en', options).format(Number(value))
}
