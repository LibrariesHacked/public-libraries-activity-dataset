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
 * @param {string|number|Object} [height] - Explicit height override, optionally keyed by breakpoint
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
  if (!data) return null

  const reportedDatasets = (data?.datasets || []).filter(dataset =>
    dataset.data?.some(Number.isFinite)
  )
  if (!reportedDatasets.length) {
    return (
      <Box sx={{ mb: 3 }} role='status'>
        <Typography variant='subtitle1' component='h3' sx={{ fontWeight: 700 }}>
          {title || options?.plugins?.title?.text}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          No data reported for this selection. Missing data does not mean no activity.
        </Typography>
      </Box>
    )
  }

  const Component = CHART_COMPONENTS[type] || BarChart
  const chartTitle = title || (
    options?.plugins?.title?.display ? options.plugins.title.text : null
  )
  const xAxisTitle = options?.scales?.x?.title?.display
    ? options.scales.x.title.text
    : null
  const chartOptions = {
    ...options,
    maintainAspectRatio: false,
    plugins: {
      ...options?.plugins,
      title: { ...options?.plugins?.title, display: false }
    },
    scales: options?.scales && {
      ...options.scales,
      x: {
        ...options.scales.x,
        title: { ...options.scales.x?.title, display: false }
      }
    }
  }
  const chartHeight = height ?? (type === 'service' ? undefined : { xs: 360, sm: 400, md: 440 })
  const chartElement = <Component data={{ ...data, datasets: reportedDatasets }} options={chartOptions} {...props} />

  const content = (
    <>
      {chartTitle && (
        <Typography
          variant='subtitle1'
          component='h3'
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 1.5,
            fontSize: '0.95rem',
            overflowWrap: 'anywhere'
          }}
        >
          {Array.isArray(chartTitle) ? chartTitle.join(' ') : chartTitle}
        </Typography>
      )}
      <Box sx={{
        position: 'relative',
        width: '100%',
        minWidth: 0,
        height: chartHeight,
        minHeight: type === 'service' ? undefined : 280
      }}>
        {chartElement}
      </Box>
      {xAxisTitle && (
        <Typography
          variant='caption'
          component='div'
          sx={{ mt: 1, textAlign: 'center', overflowWrap: 'anywhere' }}
        >
          {Array.isArray(xAxisTitle) ? xAxisTitle.join(' ') : xAxisTitle}
        </Typography>
      )}
    </>
  )

  if (disablePaper) {
    return (
      <Box sx={{ width: '100%', minWidth: 0, mb: 2, ...sx }}>
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
        minWidth: 0,
        overflow: 'hidden',
        ...sx
      }}
    >
      {content}
    </Paper>
  )
}

export default AppChart
