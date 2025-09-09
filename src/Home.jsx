import React, { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

import Markdown from 'react-markdown'

import homeMd from './content/home.md'

import LoansTotalCard from './components/LoansTotalCard'
import UsersTotalCard from './components/UsersTotalCard'
import VisitsTotalCard from './components/VisitsTotalCard'

const Home = () => {
  const [homeMarkdown, setHomeMarkdown] = useState('')
  useEffect(() => {
    fetch(homeMd)
      .then(res => res.text())
      .then(text => setHomeMarkdown(text))
  }, [])

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            md: 6,
            lg: 3
          }}
        >
          <UsersTotalCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <LoansTotalCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <VisitsTotalCard />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 6,
            lg: 3
          }}
        ></Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}></Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}></Grid>
      </Grid>
      <Markdown>{homeMarkdown}</Markdown>
    </Box>
  )
}

export default Home
