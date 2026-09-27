import React from 'react'
import Box from '@mui/material/Box'

import BarChart from './BarChart'

/**
 * Specialized horizontal bar chart for authority/service comparisons with dynamic height
 * based on the number of services being rendered.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.data - Chart.js data configuration containing labels and datasets.
 * @param {Object} [props.options] - Chart.js options configuration.
 * @param {number} [props.rowHeight=40] - Desired pixel height per service bar row.
 * @param {Object} [props.sx] - Additional Material-UI style overrides for container.
 * @returns {JSX.Element|null} The rendered Service bar chart container, or null if labels are empty.
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
