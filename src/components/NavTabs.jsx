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

/**
 * Top navigation tabs component allowing users to switch between datasets and application views.
 * Uses full-width tabs on desktop and built-in scrollable tabs with arrows on mobile.
 *
 * @returns {JSX.Element} Navigation bar containing routed tabs.
 */
const NavTabs = () => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const routeMatch = useRouteMatch([
    '/',
    '/loans',
    '/users',
    '/visits',
    '/events',
    '/computers'
  ])
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
        <Tab
          icon={<SummarizeRoundedIcon />}
          iconPosition='start'
          label='Summary'
          value='/'
          to='/'
          component={Link}
        />
        <Tab
          icon={<MenuBookRoundedIcon />}
          iconPosition='start'
          label='Loans'
          value='/loans'
          to='/loans'
          component={Link}
        />
        <Tab
          icon={<PeopleRoundedIcon />}
          iconPosition='start'
          label='Users'
          value='/users'
          to='/users'
          component={Link}
        />
        <Tab
          icon={<PlaceRoundedIcon />}
          iconPosition='start'
          label='Visits'
          value='/visits'
          to='/visits'
          component={Link}
        />
        <Tab
          icon={<EventRoundedIcon />}
          iconPosition='start'
          label='Events'
          value='/events'
          to='/events'
          component={Link}
        />
        <Tab
          icon={<DevicesRoundedIcon />}
          iconPosition='start'
          label='Computers'
          value='/computers'
          to='/computers'
          component={Link}
        />
      </Tabs>
    </Paper>
  )
}

export default NavTabs

