/**
 * Formats a numeric value into a human-readable compact string representation (e.g. 1.2M, 45K).
 *
 * Uses the browser's native `Intl.NumberFormat` with English locale. If the input is null,
 * undefined, or not a finite number, it safely falls back to returning '0'.
 *
 * @param {number|string} value - The numeric value to format.
 * @param {number} [maximumFractionDigits] - Optional maximum number of decimal places to display.
 * @returns {string} The formatted compact string representation of the number.
 */
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
