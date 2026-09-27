import React from 'react'
import { Doughnut } from 'react-chartjs-2'

import '../../helpers/charts'

/**
 * Doughnut chart component displaying proportions of a whole using Chart.js.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.data - Chart.js data configuration containing labels and datasets.
 * @param {Object} [props.options] - Chart.js options configuration.
 * @returns {JSX.Element|null} The rendered Doughnut chart, or null if data is empty.
 */
const DoughnutChart = ({ data, options, ...props }) => {
  if (!data?.labels?.length && !data?.datasets?.length) return null

  return <Doughnut data={data} options={options} {...props} />
}

export default DoughnutChart
