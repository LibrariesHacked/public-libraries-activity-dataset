import React from 'react'

import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

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
 *
 * @returns {JSX.Element} Navigation bar containing routed tabs.
 */
const NavTabs = () => {
  const routeMatch = useRouteMatch([
    '/',
    '/loans',
    '/users',
    '/visits',
    '/events',
    '/computers'
  ])
  const currentTab = routeMatch?.pattern?.path
  return (
    <nav>
      <Tabs
        value={currentTab}
        variant='scrollable'
        scrollButtons
        allowScrollButtonsMobile
      >
        <Tab label='Home' value='/' to='/' component={Link} />
        <Tab label='Loans' value='/loans' to='/loans' component={Link} />
        <Tab label='Users' value='/users' to='/users' component={Link} />
        <Tab label='Visits' value='/visits' to='/visits' component={Link} />
        <Tab label='Events' value='/events' to='/events' component={Link} />
        <Tab
          label='Computers and WiFi'
          value='/computers'
          to='/computers'
          component={Link}
        />
      </Tabs>
    </nav>
  )
}

export default NavTabs
