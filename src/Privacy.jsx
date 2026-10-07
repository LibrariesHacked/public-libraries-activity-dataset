import React from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'

import privacyMd from './content/privacy.md?raw'

/**
 * Plain Privacy policy page view rendering markdown documentation from content/privacy.md.
 *
 * @returns {JSX.Element} The rendered Privacy policy page.
 */
const Privacy = () => {
  return (
    <Box sx={{ my: 3 }}>
      <Markdown>{privacyMd}</Markdown>
    </Box>
  )
}

export default Privacy
