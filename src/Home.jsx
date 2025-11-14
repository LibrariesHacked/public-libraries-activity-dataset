import React, { useEffect, useState } from 'react'

import Box from '@mui/material/Box'

import Markdown from 'react-markdown'

import homeMd from './content/home.md'

import CardGrid from './components/CardGrid'

const Home = () => {
  const [homeMarkdown, setHomeMarkdown] = useState('')
  useEffect(() => {
    fetch(homeMd)
      .then(res => res.text())
      .then(text => setHomeMarkdown(text))
  }, [])

  return (
    <Box>
      <Markdown>{homeMarkdown}</Markdown>
      <CardGrid />
    </Box>
  )
}

export default Home
