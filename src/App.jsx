import React, { useEffect, useState } from 'react'

import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ThemeProvider, createTheme } from '@mui/material/styles'

import { blueGrey, brown } from '@mui/material/colors'

import Box from '@mui/material/Box'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Typography from '@mui/material/Typography'

import NavTabs from './components/NavTabs'

import Home from './Home'
import Loans from './Loans'
import Users from './Users'
import Visits from './Visits'
import Events from './Events'
import Computers from './Computers'

import { useApplicationState } from './hooks/useApplicationState'

import * as serviceModel from './models/service'

const theme = createTheme({
  palette: {
    background: {
      default: brown[50],
      paper: '#fff'
    },
    // Set typography to dark grey
    text: {
      primary: blueGrey[900],
      secondary: blueGrey[600]
    },
    primary: { main: 'rgb(54, 162, 235)' },
    secondary: { main: 'rgb(255, 99, 132)' }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    }
  }
})

function App () {
  const [{ services, serviceLookup }, dispatchApplication] =
    useApplicationState() //eslint-disable-line

  const [libraryServiceFilterName, setLibraryServiceFilterName] = useState([])

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

  const handleChangeLibraryServiceFilter = event => {
    const {
      target: { value }
    } = event
    const filter = typeof value === 'string' ? value.split(',') : value
    setLibraryServiceFilterName(filter)
    dispatchApplication({
      type: 'SetFilteredServices',
      filteredServices: filter
    })
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Container maxWidth='lg'>
          <main>
            <Typography component='h1' variant='h3'>
              Library activity
            </Typography>
            <div>
              <FormControl sx={{ width: '100%', mb: 2 }}>
                <InputLabel id='library-service-filter-label'>
                  Choose libraries
                </InputLabel>
                <Select
                  labelId='library-service-filter-label'
                  id='library-service-filter'
                  multiple
                  value={libraryServiceFilterName}
                  onChange={handleChangeLibraryServiceFilter}
                  input={
                    <OutlinedInput
                      id='select-multiple-library-service'
                      label='Library service filter'
                    />
                  }
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip
                          key={value}
                          label={serviceLookup[value].libraryService}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {services?.map(s => (
                    <MenuItem key={s.code} value={s.code}>
                      {s.libraryService}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <NavTabs />
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/loans' element={<Loans />} />
              <Route path='/users' element={<Users />} />
              <Route path='/visits' element={<Visits />} />
              <Route path='/events' element={<Events />} />
              <Route path='/computers' element={<Computers />} />
            </Routes>
          </main>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
