import React from 'react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

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
 * managing card layout container, clear section separation, optional header titles, and empty states.
 *
 * @param {'bar' | 'line' | 'doughnut' | 'service'} [type='bar'] - The chart type to render
 * @param {Object} data - Chart.js data object
 * @param {Object} options - Chart.js options configuration
 * @param {string} [title] - Optional subheader title displayed above the chart
 * @param {string|number} [height] - Explicit height override
 * @param {boolean} [disablePaper=false] - Whether to disable enclosing Paper card container
 * @param {Object} [sx] - Extra sx styles for the container Box or Paper
 */
const AppChart = ({
  type = 'bar',
  data,
  options,
  title,
  height,
  disablePaper = false,
  sx,
  ...props
}) => {
  if (!data?.labels?.length && !data?.datasets?.length) return null

  const Component = CHART_COMPONENTS[type] || BarChart
  const chartElement = <Component data={data} options={options} {...props} />

  const content = (
    <>
      {title && (
        <Typography
          variant='subtitle1'
          component='h3'
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 1.5,
            fontSize: '0.95rem'
          }}
        >
          {title}
        </Typography>
      )}
      {height ? (
        <Box sx={{ position: 'relative', width: '100%', height }}>
          {chartElement}
        </Box>
      ) : (
        <Box sx={{ position: 'relative', width: '100%' }}>
          {chartElement}
        </Box>
      )}
    </>
  )

  if (disablePaper) {
    return (
      <Box sx={{ width: '100%', mb: 2, ...sx }}>
        {content}
      </Box>
    )
  }

  return (
    <Paper
      variant='outlined'
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: 2,
        backgroundColor: 'background.paper',
        mb: 3,
        overflow: 'hidden',
        ...sx
      }}
    >
      {content}
    </Paper>
  )
}

export default AppChart
