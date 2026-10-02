import React from 'react'

import { useLocation } from 'react-router-dom'

import Grid from '@mui/material/Grid'

import AttendanceTotalCard from './AttendanceTotalCard'
import ComputerTotalCard from './ComputerTotalCard'
import DigitalSessionsTotalCard from './DigitalSessionsTotalCard'
import EventsAverageTurnoutCard from './EventsAverageTurnoutCard'
import EventsChildrenAttendanceCard from './EventsChildrenAttendanceCard'
import EventsTotalCard from './EventsTotalCard'
import LoansDigitalCard from './LoansDigitalCard'
import LoansPhysicalBooksCard from './LoansPhysicalBooksCard'
import LoansPhysicalBooksChildrenCard from './LoansPhysicalBooksChildrenCard'
import LoansTotalCard from './LoansTotalCard'
import UsersAdultCard from './UsersAdultCard'
import UsersJuniorCard from './UsersJuniorCard'
import UsersTotalCard from './UsersTotalCard'
import UsersUnder12Card from './UsersUnder12Card'
import VisitsBranchCard from './VisitsBranchCard'
import VisitsMobileCard from './VisitsMobileCard'
import VisitsMonthlyPaceCard from './VisitsMonthlyPaceCard'
import VisitsTotalCard from './VisitsTotalCard'
import WiFiShareCard from './WiFiShareCard'
import WiFiTotalCard from './WiFiTotalCard'

/**
 * Responsive grid layout component that displays contextual KPI summary number cards
 * matching the active route/page (e.g. Loans, Users, Visits, Events, Computers, or all on Home).
 * Each page features a balanced set of 4 cards on desktop, and Home features 6 benchmark cards.
 *
 * @returns {JSX.Element} Grid container populated with summary cards.
 */
const CardGrid = () => {
  const { pathname } = useLocation()

  if (pathname === '/') {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LoansTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <VisitsTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <UsersTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <EventsTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AttendanceTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <DigitalSessionsTotalCard />
        </Grid>
      </Grid>
    )
  }

  if (pathname === '/loans') {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <LoansTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <LoansPhysicalBooksCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <LoansDigitalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <LoansPhysicalBooksChildrenCard />
        </Grid>
      </Grid>
    )
  }

  if (pathname === '/visits') {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <VisitsTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <VisitsBranchCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <VisitsMobileCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <VisitsMonthlyPaceCard />
        </Grid>
      </Grid>
    )
  }

  if (pathname === '/events') {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventsTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AttendanceTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventsAverageTurnoutCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventsChildrenAttendanceCard />
        </Grid>
      </Grid>
    )
  }

  if (pathname === '/computers') {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DigitalSessionsTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <ComputerTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <WiFiTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <WiFiShareCard />
        </Grid>
      </Grid>
    )
  }

  if (pathname === '/users') {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UsersTotalCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UsersAdultCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UsersJuniorCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UsersUnder12Card />
        </Grid>
      </Grid>
    )
  }

  return null
}

export default CardGrid
