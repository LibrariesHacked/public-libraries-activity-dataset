import React from 'react'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

import LoansTotalCard from './components/LoansTotalCard'
import LoansByTypeCard from './components/LoansByTypeCard'
import MembersTotalCard from './components/MembersTotalCard'
import VisitsTotalCard from './components/VisitsTotalCard'

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
        >
          <LoansByTypeCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}></Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}></Grid>
      </Grid>
    </Box>
  )
}

export default Home
