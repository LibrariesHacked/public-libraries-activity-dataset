import React from 'react'

import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ThemeProvider, createTheme } from '@mui/material/styles'

import { blue, blueGrey } from '@mui/material/colors'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import NavTabs from './components/NavTabs'

import Home from './Home'
import Loans from './Loans'
import Users from './Users'
import Visits from './Visits'
import Events from './Events'
import Computers from './Computers'

import ServiceSelection from './components/ServiceSelection'

const theme = createTheme({
  palette: {
    background: {
      default: 'rgb(245, 245, 245)',
      paper: '#fff'
    },
    text: {
      primary: blueGrey[700],
      secondary: blueGrey[500]
    },
    primary: { main: blue[700] },
    secondary: { main: blueGrey[500] }
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Container maxWidth='lg'>
          <main>
            <Box
              sx={{
                alignItems: 'center',
                alignContent: 'center',
                textAlign: 'center'
              }}
            >
              <Typography component='h1' variant='h2'>
                Library activity
              </Typography>
              <Typography gutterBottom color='textSecondary'>
                By default all services are shown. Use the selector to construct
                your own comparison group.
              </Typography>
              <ServiceSelection />
            </Box>
            <Box sx={{ marginY: 2 }}>
              <NavTabs />
            </Box>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/loans' element={<Loans />} />
              <Route path='/users' element={<Users />} />
              <Route path='/visits' element={<Visits />} />
              <Route path='/events' element={<Events />} />
              <Route path='/computers' element={<Computers />} />
            </Routes>
            <Divider sx={{ marginY: 2 }} />
            <Box sx={{ textAlign: 'center', marginBottom: 2 }}>
              <Typography color='textSecondary'>
                Made with ❤️ by{' '}
                <a href='https://example.com'>Libraries Hacked</a>.
              </Typography>
            </Box>
          </main>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
