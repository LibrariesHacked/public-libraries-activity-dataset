import React from 'react'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

import MembersTotalCard from './components/MembersTotalCard'

const Home = () => {
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
          <MembersTotalCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}></Grid>
        <Grid size={{ xs: 12, md: 6 }}></Grid>
      </Grid>
    </Box>
  )
}

export default Home
