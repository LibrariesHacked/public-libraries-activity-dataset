import React from 'react'
import { Doughnut } from 'react-chartjs-2'

import '../../helpers/charts'

/**
 * Doughnut chart primitive component wrapping react-chartjs-2 Doughnut.
 */
const DoughnutChart = ({ data, options, ...props }) => {
  if (!data?.labels?.length && !data?.datasets?.length) return null

  return <Doughnut data={data} options={options} {...props} />
}

export default DoughnutChart
