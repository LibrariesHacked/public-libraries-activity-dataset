import React from 'react'
import Box from '@mui/material/Box'

import BarChart from './BarChart'

/**
 * Specialized horizontal bar chart for authority/service comparisons with dynamic height.
 * Uses BarChart internally.
 */
const ServiceBarChart = ({ data, options, rowHeight = 40, sx, ...props }) => {
  if (!data?.labels?.length) return null

  const height = `${data.labels.length * rowHeight}px`

  return (
    <Box sx={{ position: 'relative', width: '100%', height, ...sx }}>
      <BarChart data={data} options={options} {...props} />
    </Box>
  )
}

export default ServiceBarChart
