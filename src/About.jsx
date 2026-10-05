import React from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'

import aboutMd from './content/about.md?raw'

/**
 * Plain About page view rendering markdown documentation from content/about.md.
 *
 * @returns {JSX.Element} The rendered About page.
 */
const About = () => {
  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', my: 3 }}>
      <Paper variant='outlined' sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Markdown>{aboutMd}</Markdown>
      </Paper>
    </Box>
  )
}

export default About
