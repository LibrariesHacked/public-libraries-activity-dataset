import React from 'react'

import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded'
import EventRoundedIcon from '@mui/icons-material/EventRounded'
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'

import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import useMediaQuery from '@mui/material/useMediaQuery'

import { Link, useLocation, matchPath } from 'react-router-dom'

/**
 * Custom React hook that tests the current browser URL path against an array of route pattern strings.
 *
 * @param {string[]} patterns - Array of URL route path strings to match against.
 * @returns {import('react-router-dom').PathMatch|null} The first matching path object, or null if no route matches.
 */
const useRouteMatch = patterns => {
  const { pathname } = useLocation()

  for (let i = 0; i < patterns.length; i += 1) {
    const pattern = patterns[i]
    const possibleMatch = matchPath(pattern, pathname)
    if (possibleMatch !== null) {
      return possibleMatch
    }
  }

  return null
}

const NAV_ITEMS = [
  { label: 'Summary', path: '/', icon: <SummarizeRoundedIcon /> },
  { label: 'Loans', path: '/loans', icon: <MenuBookRoundedIcon /> },
  { label: 'Users', path: '/users', icon: <PeopleRoundedIcon /> },
  { label: 'Visits', path: '/visits', icon: <PlaceRoundedIcon /> },
  { label: 'Events', path: '/events', icon: <EventRoundedIcon /> },
  { label: 'Computers', path: '/computers', icon: <DevicesRoundedIcon /> }
]

const ROUTE_PATTERNS = NAV_ITEMS.map(item => item.path)

/**
 * Top navigation tabs component allowing users to switch between datasets and application views.
 * Uses full-width tabs on desktop and built-in scrollable tabs with arrows on mobile.
 *
 * @returns {JSX.Element} Navigation bar containing routed tabs.
 */
const NavTabs = () => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const routeMatch = useRouteMatch(ROUTE_PATTERNS)
  const currentTab = routeMatch?.pattern?.path || false

  return (
    <Paper variant='outlined' sx={{ width: '100%', mt: 1.5, mb: 3, overflow: 'hidden' }}>
      <Tabs
        value={currentTab}
        variant={isMobile ? 'scrollable' : 'fullWidth'}
        scrollButtons='auto'
        allowScrollButtonsMobile
        textColor='primary'
        indicatorColor='primary'
        aria-label='Navigation tabs'
        sx={{
          minHeight: 44,
          '& .MuiTab-root': {
            minHeight: 44,
            py: 0.75,
            fontSize: '0.875rem'
          }
        }}
      >
        {NAV_ITEMS.map(({ label, path, icon }) => (
          <Tab
            key={path}
            icon={icon}
            iconPosition='start'
            label={label}
            value={path}
            to={path}
            component={Link}
          />
        ))}
      </Tabs>
    </Paper>
  )
}

export default NavTabs

