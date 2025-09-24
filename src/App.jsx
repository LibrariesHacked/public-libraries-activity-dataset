import React from 'react'

import { HashRouter, Route, Routes } from 'react-router-dom'

import { ThemeProvider, createTheme } from '@mui/material/styles'

import { lightBlue, grey, blueGrey } from '@mui/material/colors'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import Typography from '@mui/material/Typography'

import Computers from './Computers'
import Events from './Events'
import Home from './Home'
import Loans from './Loans'
import Users from './Users'
import Visits from './Visits'

import NavTabs from './components/NavTabs'
import ServiceSelection from './components/ServiceSelection'

const theme = createTheme({
  palette: {
    background: {
      default: 'rgb(245, 245, 245)',
      paper: '#fff'
    },
    text: {
      primary: grey[600],
      secondary: blueGrey[500]
    },
    primary: { main: lightBlue[700] },
    secondary: { main: blueGrey[500] },
    // Add a custom set of colors that match the chart.js 7 defaults.
    chartRed: '#ff6384',
    chartOrange: '#ff9f40',
    chartYellow: '#ffcd56',
    chartGreen: '#4bc0c0',
    chartBlue: '#36a2eb',
    chartPurple: '#9966ff',
    chartGrey: '#c9cbcf'
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
      <GlobalStyles
        styles={{
          a: {
            color: lightBlue[700],
            fontWeight: 'bold',
            textDecoration: 'none'
          }
        }}
      />
      <HashRouter>
        <Container maxWidth='lg'>
          <main>
            <Box
              sx={{
                alignItems: 'center',
                alignContent: 'center',
                textAlign: 'center',
                marginY: 2
              }}
            >
              <Chip color='warning' label='In development' sx={{ fontWeight: 'bold' }} />
              <Typography component='h1' variant='h2'>
                Library activity
              </Typography>
              <Typography gutterBottom color='textSecondary'>
                All available data is displayed by default. Add services to
                construct your own comparison group.
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
            <Box sx={{ textAlign: 'center', marginY: 4 }}>
              <Typography variant='body1'>
                Made with ❤️ by{' '}
                <a href='https://www.librarieshacked.org'>Libraries Hacked</a>
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <a target='_blank' href='https://analytics.librarydata.uk/share/aofzROqYtqmn5JNS/activity.librarydata.uk'>
                  Analytics
                </a>
              </Typography> 
            </Box>
          </main>
        </Container>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
