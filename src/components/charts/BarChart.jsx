import React from 'react'
import { Bar } from 'react-chartjs-2'

import '../../helpers/charts'

/**
 * Bar chart primitive component wrapping react-chartjs-2 Bar.
 */
const BarChart = ({ data, options, ...props }) => {
  if (!data?.labels?.length && !data?.datasets?.length) return null

  return <Bar data={data} options={options} {...props} />
}

export default BarChart
