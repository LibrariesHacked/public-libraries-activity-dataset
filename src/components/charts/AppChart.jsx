import React from 'react'

import Box from '@mui/material/Box'
import ListSubheader from '@mui/material/ListSubheader'

import BarChart from './BarChart'
import LineChart from './LineChart'
import DoughnutChart from './DoughnutChart'
import ServiceBarChart from './ServiceBarChart'

const CHART_COMPONENTS = {
  bar: BarChart,
  line: LineChart,
  doughnut: DoughnutChart,
  service: ServiceBarChart
}

/**
 * Manager component for application charts.
 * Dispatches to individual chart type components (BarChart, LineChart, DoughnutChart, ServiceBarChart),
 * managing container layout, optional subheader titles, and empty states.
 *
 * @param {'bar' | 'line' | 'doughnut' | 'service'} [type='bar'] - The chart type to render
 * @param {Object} data - Chart.js data object
 * @param {Object} options - Chart.js options configuration
 * @param {string} [title] - Optional subheader title displayed above the chart
 * @param {string|number} [height] - Explicit height override
 * @param {Object} [sx] - Extra sx styles for the container Box
 */
const AppChart = ({
  type = 'bar',
  data,
  options,
  title,
  height,
  sx,
  ...props
}) => {
  if (!data?.labels?.length && !data?.datasets?.length) return null

  const Component = CHART_COMPONENTS[type] || BarChart
  const chartElement = <Component data={data} options={options} {...props} />

  if (title) {
    return (
      <Box sx={{ mb: 2, width: '100%' }}>
        <ListSubheader component='div' disableSticky disableGutters>
          {title}
        </ListSubheader>
        {height ? (
          <Box sx={{ position: 'relative', width: '100%', height, ...sx }}>
            {chartElement}
          </Box>
        ) : (
          chartElement
        )}
      </Box>
    )
  }

  if (height) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height, ...sx }}>
        {chartElement}
      </Box>
    )
  }

  return chartElement
}

export default AppChart
