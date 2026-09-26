import React from 'react'
import { Line } from 'react-chartjs-2'

import '../../helpers/charts'

/**
 * Line chart primitive component wrapping react-chartjs-2 Line.
 */
const LineChart = ({ data, options, ...props }) => {
  if (!data?.labels?.length && !data?.datasets?.length) return null

  return <Line data={data} options={options} {...props} />
}

export default LineChart
