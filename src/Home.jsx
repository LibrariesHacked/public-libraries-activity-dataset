import React from 'react'

import Box from '@mui/material/Box'

import Markdown from 'react-markdown'

import homeMd from './content/home.md?raw'

import CardGrid from './components/CardGrid'

/**
 * Home landing page view presenting introductory markdown guidance
 * and an overview grid of key library performance indicator summary cards across all domains.
 *
 * @returns {JSX.Element} The rendered home page view.
 */
const Home = () => {
  return (
    <Box>
      <Markdown>{homeMd}</Markdown>
      <CardGrid />
    </Box>
  )
}

export default Home
