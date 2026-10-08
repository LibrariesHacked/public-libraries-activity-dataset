import React from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import dataQualityMd from './content/data-quality.md?raw'

import DatasetDataGrid from './components/DatasetDataGrid'

/**
 * Data Quality page view rendering explanatory notes from content/data-quality.md
 * and the interactive DataGrid for the errors and corrections audit register.
 *
 * @returns {JSX.Element} The rendered Data Quality page view.
 */
const DataQuality = () => {
  return (
    <Box sx={{ my: 3 }}>
      <Typography component='h2' variant='h5' sx={{ mb: 1 }}>Data quality</Typography>
      <Typography variant='body2' sx={{ mb: 2 }}>
        Figures marked Worth checking remain as reported. Corrections and exclusions are recorded separately.
      </Typography>
      <Box component='details' sx={{ mb: 3 }}>
        <Box component='summary' sx={{ cursor: 'pointer', fontWeight: 600 }}>What these figures mean</Box>
        <Markdown>{dataQualityMd}</Markdown>
      </Box>
      <DatasetDataGrid datasetId='errors' height={620} />
    </Box>
  )
}

export default DataQuality
