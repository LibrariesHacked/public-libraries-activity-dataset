import React from 'react'

import { useLocation } from 'react-router-dom'

import Grid from '@mui/material/Grid'

import AttendanceTotalCard from './AttendanceTotalCard'
import ComputerMonthlyPaceCard from './ComputerMonthlyPaceCard'
import ComputerTotalCard from './ComputerTotalCard'
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
import WiFiMonthlyPaceCard from './WiFiMonthlyPaceCard'
import WiFiTotalCard from './WiFiTotalCard'

const PAGE_CARDS = {
  '/': {
    sizes: { xs: 12, sm: 6, md: 4 },
    cards: [
      LoansTotalCard,
      VisitsTotalCard,
      UsersTotalCard,
      EventsTotalCard,
      ComputerTotalCard,
      WiFiTotalCard
    ]
  },
  '/loans': {
    sizes: { xs: 12, sm: 6, lg: 3 },
    cards: [
      LoansTotalCard,
      LoansPhysicalBooksCard,
      LoansDigitalCard,
      LoansPhysicalBooksChildrenCard
    ]
  },
  '/visits': {
    sizes: { xs: 12, sm: 6, lg: 3 },
    cards: [
      VisitsTotalCard,
      VisitsBranchCard,
      VisitsMobileCard,
      VisitsMonthlyPaceCard
    ]
  },
  '/events': {
    sizes: { xs: 12, sm: 6, lg: 3 },
    cards: [
      EventsTotalCard,
      AttendanceTotalCard,
      EventsAverageTurnoutCard,
      EventsChildrenAttendanceCard
    ]
  },
  '/computers': {
    sizes: { xs: 12, sm: 6, lg: 3 },
    cards: [
      ComputerTotalCard,
      ComputerMonthlyPaceCard,
      WiFiTotalCard,
      WiFiMonthlyPaceCard
    ]
  },
  '/users': {
    sizes: { xs: 12, sm: 6, lg: 3 },
    cards: [
      UsersTotalCard,
      UsersAdultCard,
      UsersJuniorCard,
      UsersUnder12Card
    ]
  }
}

/**
 * Responsive grid layout component that displays contextual KPI summary number cards
 * matching the active route/page (e.g. Loans, Users, Visits, Events, Computers, or all on Home).
 * Each page features a balanced set of 4 cards on desktop, and Home features 6 benchmark cards.
 *
 * @returns {JSX.Element|null} Grid container populated with summary cards.
 */
const CardGrid = () => {
  const { pathname } = useLocation()
  const pageConfig = PAGE_CARDS[pathname]
  if (!pageConfig) return null

  return (
    <Grid container spacing={2}>
      {pageConfig.cards.map((CardComponent, index) => (
        <Grid key={index} size={pageConfig.sizes}>
          <CardComponent />
        </Grid>
      ))}
    </Grid>
  )
}

export default CardGrid
