import { lazy, Suspense } from 'react'

import { HashRouter, Route, Routes } from 'react-router-dom'

import { ThemeProvider, createTheme } from '@mui/material/styles'

import { lightBlue, grey, blueGrey } from '@mui/material/colors'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import GlobalStyles from '@mui/material/GlobalStyles'
import Typography from '@mui/material/Typography'

import DataChoiceSelection from './components/DataChoiceSelection'
import NavTabs from './components/NavTabs'
import PeriodSelection from './components/PeriodSelection'
import ServiceSelection from './components/ServiceSelection'

const Computers = lazy(() => import('./Computers'))
const Events = lazy(() => import('./Events'))
const Home = lazy(() => import('./Home'))
const Loans = lazy(() => import('./Loans'))
const Users = lazy(() => import('./Users'))
const Visits = lazy(() => import('./Visits'))

/**
 * Custom Material-UI theme configuration featuring UK Government Analysis Function
 * and ONS accessible color palettes, neutral backgrounds, and rounded card styling.
 */
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
    // ONS & UK Government Analysis Function accessible color palette
    chartRed: '#801650',
    chartOrange: '#d25418',
    chartYellow: '#a86a00',
    chartGreen: '#007877',
    chartBlue: '#206095',
    chartPurple: '#672960',
    chartGrey: '#3d3d3d'
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
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    }
  }
})

/**
 * Root application component rendering theme providers, global CSS resets,
 * header filter controls (service, year period, data quality mode), navigation tabs,
 * lazy-loaded routed content views, and footer links.
 *
 * @returns {JSX.Element} The rendered application shell.
 */
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
              <Chip
                color='info'
                label='Prototype'
                sx={{ fontWeight: 'bold' }}
              />
              <Typography component='h1' variant='h2'>
                Library activity
              </Typography>
              <Typography gutterBottom color='textSecondary'>
                By default, all library services are displayed. Select services
                to construct a custom comparison group.
              </Typography>
              <ServiceSelection />
              <Typography gutterBottom color='textSecondary' sx={{ mt: 2 }}>
                Filter by date range
              </Typography>
              <PeriodSelection />
              <DataChoiceSelection />
            </Box>
            <NavTabs />
            <Suspense fallback={<Typography>Loading...</Typography>}>
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/loans' element={<Loans />} />
                <Route path='/users' element={<Users />} />
                <Route path='/visits' element={<Visits />} />
                <Route path='/events' element={<Events />} />
                <Route path='/computers' element={<Computers />} />
              </Routes>
            </Suspense>
            <Box sx={{ textAlign: 'center', marginY: 4 }}>
              <Typography variant='body1'>
                Made with ❤️ by{' '}
                <a href='https://www.librarieshacked.org'>Libraries Hacked</a>
              </Typography>
              <Divider sx={{ marginY: 2 }} />
              <Typography variant='body1' color='textSecondary'>
                <a
                  target='_blank'
                  href='https://analytics.librarydata.uk/share/aofzROqYtqmn5JNS/activity.librarydata.uk'
                  rel='noreferrer'
                >
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
