export const formatCompactNumber = value => {
  if (typeof value !== 'number') {
    throw new TypeError('Value must be a number')
  }

  return new Intl.NumberFormat('en', { notation: 'compact' }).format(value)
}
