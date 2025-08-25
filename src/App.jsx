import React, { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import InboxIcon from '@mui/icons-material/MoveToInbox'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MailIcon from '@mui/icons-material/Mail'
import MenuIcon from '@mui/icons-material/Menu'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

import Home from './Home.jsx'

import { useApplicationState } from './hooks/useApplicationState'

import * as serviceModel from './models/service'

function App () {
  const [{}, dispatchApplication] = useApplicationState() //eslint-disable-line

  useEffect(() => {
    // Initial data setup
    async function getServices () {
      const services = await serviceModel.getServices()
      const serviceLookup = {}
      services.forEach(service => {
        serviceLookup[service.code] = service
      })
      dispatchApplication({
        type: 'AddServices',
        services,
        serviceLookup
      })
    }
    getServices()
  }, []) // eslint-disable-line

  return (
    <>
      <CssBaseline />
      <BrowserRouter>
        <Container
          maxWidth='lg'
          sx={{
            bgcolor: 'background.default',
            p: 2
          }}
        >
          <main>
            <Typography component='h1' variant='h2' gutterBottom>
              English public libraries activity
            </Typography>
            <Routes>
              <Route path='/' element={<Home />} />
            </Routes>
          </main>
        </Container>
      </BrowserRouter>
    </>
  )
}

export default App
