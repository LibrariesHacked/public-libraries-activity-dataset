import React from 'react'

import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { Link, useLocation, matchPath } from 'react-router-dom'

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

const NavTabs = () => {
  const routeMatch = useRouteMatch([
    '/',
    '/loans',
    '/members',
    '/visits',
    '/events',
    '/computers'
  ])
  const currentTab = routeMatch?.pattern?.path
  return (
    <nav>
      <Tabs value={currentTab}>
        <Tab label='Home' value='/' to='/' component={Link} />
        <Tab label='Loans' value='/loans' to='/loans' component={Link} />
        <Tab label='Members' value='/members' to='/members' component={Link} />
        <Tab label='Events' value='/events' to='/events' component={Link} />
        <Tab label='Visits' value='/visits' to='/visits' component={Link} />
        <Tab
          label='Computers'
          value='/computers'
          to='/computers'
          component={Link}
        />
      </Tabs>
    </nav>
  )
}

export default NavTabs
