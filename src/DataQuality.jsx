import React from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'

import dataQualityMd from './content/data-quality.md?raw'

import DatasetDataGrid from './components/DatasetDataGrid'

/**
 * Data Quality page view rendering explanatory notes from content/data-quality.md
 * and the interactive master DataGrid for the errors and corrections audit register.
 *
 * @returns {JSX.Element} The rendered Data Quality page view.
 */
const DataQuality = () => {
  return (
    <Box sx={{ my: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Markdown>{dataQualityMd}</Markdown>
      </Box>
      <DatasetDataGrid datasetId='errors' height={620} />
    </Box>
  )
}

export default DataQuality
