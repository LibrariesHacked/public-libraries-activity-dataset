import React from 'react'

import Box from '@mui/material/Box'

import Markdown from 'react-markdown'

import homeMd from './content/home.md?raw'

import CardGrid from './components/CardGrid'

/**
 * Summary landing page view presenting introductory markdown guidance
 * and an overview grid of key library performance indicator summary cards across all domains.
 *
 * @returns {JSX.Element} The rendered summary page view.
 */
const Home = () => {
  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Markdown>{homeMd}</Markdown>
      </Box>
      <CardGrid />
    </Box>
  )
}

export default Home
