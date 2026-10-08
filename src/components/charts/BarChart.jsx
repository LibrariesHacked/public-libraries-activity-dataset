import React from 'react'
import { Bar } from 'react-chartjs-2'

import '../../helpers/charts'

/**
 * Bar chart component rendering categorical or discrete data distributions using Chart.js.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.data - Chart.js data configuration containing labels and datasets.
 * @param {Object} [props.options] - Chart.js options configuration.
 * @returns {JSX.Element|null} The rendered Bar chart, or null if data is empty.
 */
const BarChart = ({ data, options, ...props }) => {
  if (!data?.labels?.length && !data?.datasets?.length) return null

  return <Bar data={data} options={options} {...props} />
}

export default BarChart
