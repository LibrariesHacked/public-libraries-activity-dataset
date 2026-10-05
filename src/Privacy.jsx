import React from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'

import privacyMd from './content/privacy.md?raw'

/**
 * Plain Privacy policy page view rendering markdown documentation from content/privacy.md.
 *
 * @returns {JSX.Element} The rendered Privacy policy page.
 */
const Privacy = () => {
  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', my: 3 }}>
      <Paper variant='outlined' sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Markdown>{privacyMd}</Markdown>
      </Paper>
    </Box>
  )
}

export default Privacy
