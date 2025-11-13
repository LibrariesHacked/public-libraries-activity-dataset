import React from 'react'

import { useLocation } from 'react-router-dom'

import Grid from '@mui/material/Grid'

import AttendanceTotalCard from './AttendanceTotalCard'
import ComputerTotalCard from './ComputerTotalCard'
import EventsTotalCard from './EventsTotalCard'
import LoansTotalCard from './LoansTotalCard'
import LoansPhysicalBooksCard from './LoansPhysicalBooksCard'
import LoansPhysicalBooksAdultsCard from './LoansPhysicalBooksAdultsCard'
import LoansPhysicalBooksChildrenCard from './LoansPhysicalBooksChildrenCard'
import UsersTotalCard from './UsersTotalCard'
import VisitsTotalCard from './VisitsTotalCard'
import WiFiTotalCard from './WiFiTotalCard'

const CardGrid = () => {
  const location = useLocation()

  return (
    <Grid container spacing={2}>
      {location.pathname === '/' || location.pathname === '/loans' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <LoansTotalCard />
        </Grid>
      ) : null}
      {location.pathname === '/loans' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <LoansPhysicalBooksCard />
        </Grid>
      ) : null}
      {location.pathname === '/loans' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <LoansPhysicalBooksAdultsCard />
        </Grid>
      ) : null}
      {location.pathname === '/loans' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <LoansPhysicalBooksChildrenCard />
        </Grid>
      ) : null}
      {location.pathname === '/' || location.pathname === '/users' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UsersTotalCard />
        </Grid>
      ) : null}
      {location.pathname === '/' || location.pathname === '/visits' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <VisitsTotalCard />
        </Grid>
      ) : null}
      {location.pathname === '/' || location.pathname === '/events' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventsTotalCard />
        </Grid>
      ) : null}
      {location.pathname === '/' || location.pathname === '/events' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AttendanceTotalCard />
        </Grid>
      ) : null}
      {location.pathname === '/' || location.pathname === '/computers' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <ComputerTotalCard />
        </Grid>
      ) : null}
      {location.pathname === '/' || location.pathname === '/computers' ? (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <WiFiTotalCard />
        </Grid>
      ) : null}
    </Grid>
  )
}

export default CardGrid
