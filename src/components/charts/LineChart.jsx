import React from 'react'
import { Line } from 'react-chartjs-2'

import '../../helpers/charts'

/**
 * Line chart component rendering time series trends and continuous metrics using Chart.js.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.data - Chart.js data configuration containing labels and datasets.
 * @param {Object} [props.options] - Chart.js options configuration.
 * @returns {JSX.Element|null} The rendered Line chart, or null if data is empty.
 */
const LineChart = ({ data, options, ...props }) => {
  if (!data?.labels?.length && !data?.datasets?.length) return null

  return <Line data={data} options={options} {...props} />
}

export default LineChart
