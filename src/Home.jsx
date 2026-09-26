import React from 'react'

import Box from '@mui/material/Box'

import Markdown from 'react-markdown'

import homeMd from './content/home.md?raw'

import CardGrid from './components/CardGrid'

const Home = () => {
  return (
    <Box>
      <Markdown>{homeMd}</Markdown>
      <CardGrid />
    </Box>
  )
}

export default Home
