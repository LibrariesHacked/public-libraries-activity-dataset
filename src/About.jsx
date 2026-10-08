import React from 'react'

import Markdown from 'react-markdown'

import Box from '@mui/material/Box'

import aboutMd from './content/about.md?raw'

/**
 * Plain About page view rendering markdown documentation from content/about.md.
 *
 * @returns {JSX.Element} The rendered About page.
 */
const About = () => {
  return (
    <Box sx={{ my: 3 }}>
      <Markdown>{aboutMd}</Markdown>
    </Box>
  )
}

export default About
