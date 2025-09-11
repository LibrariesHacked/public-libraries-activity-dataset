import React, { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

import Markdown from 'react-markdown'

import homeMd from './content/home.md'

import AttendanceTotalCard from './components/AttendanceTotalCard'
import ComputerTotalCard from './components/ComputerTotalCard'
import EventsTotalCard from './components/EventsTotalCard'
import LoansTotalCard from './components/LoansTotalCard'
import UsersTotalCard from './components/UsersTotalCard'
import VisitsTotalCard from './components/VisitsTotalCard'
import WiFiTotalCard from './components/WiFiTotalCard'

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
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <LoansTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UsersTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <VisitsTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventsTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AttendanceTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <ComputerTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <WiFiTotalCard />
        </Grid>
      </Grid>
    </Box>
  )
}

export default Home
