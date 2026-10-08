import { lazy, Suspense } from 'react'

import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom'

import { ThemeProvider } from '@mui/material/styles'
import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Typography from '@mui/material/Typography'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'

import Button from '@mui/material/Button'
import DataChoiceSelection from './components/DataChoiceSelection'
import NavTabs from './components/NavTabs'
import PeriodSelection from './components/PeriodSelection'
import ServiceSelection from './components/ServiceSelection'

import homeMd from './content/home.md?raw'

import theme from './theme'

const About = lazy(() => import('./About'))
const Computers = lazy(() => import('./Computers'))
const DataQuality = lazy(() => import('./DataQuality'))
const Events = lazy(() => import('./Events'))
const Home = lazy(() => import('./Home'))
const Loans = lazy(() => import('./Loans'))
const NationalEstimates = lazy(() => import('./NationalEstimates'))
const Privacy = lazy(() => import('./Privacy'))
const Users = lazy(() => import('./Users'))
const Visits = lazy(() => import('./Visits'))

const NAV_PATHS = ['/', '/loans', '/users', '/visits', '/events', '/computers']

/**
 * Content shell component that renders header controls,
 * navigation tabs, routed views, and footer links.
 *
 * @returns {JSX.Element} The rendered app content.
 */
function AppContent () {
  const location = useLocation()
  const isNavPage = NAV_PATHS.includes(location.pathname)

  return (
    <Container maxWidth='lg'>
      <main>
        {isNavPage ? (
          <>
            <Box
              sx={{
                alignItems: 'center',
                textAlign: 'center',
                mt: 1.5,
                mb: 2
              }}
            >
              <Chip
                color='info'
                size='small'
                label='Prototype'
                sx={{ fontWeight: 'bold', mb: 0.75 }}
              />
              <Typography
                component='h1'
                variant='h3'
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', sm: '2.25rem' },
                  letterSpacing: '-0.02em',
                  mb: 0.5
                }}
              >
                English library activity
              </Typography>
              {location.pathname === '/'
                ? (
                  <Markdown>
                    {homeMd}
                  </Markdown>
                  )
                : (
                  <Typography variant='body2' color='textSecondary' sx={{ mb: 2 }}>
                    Compare library activity by service or region
                  </Typography>
                  )}
              <ServiceSelection />
              <PeriodSelection />
              <DataChoiceSelection />
            </Box>
            <NavTabs />
          </>
        ) : (
          <Box className='no-print' sx={{ my: 2 }}>
            <Button
              component={Link}
              to='/'
              startIcon={<ArrowBackRoundedIcon />}
              variant='text'
              color='primary'
              size='small'
            >
              Back
            </Button>
          </Box>
        )}
        <Suspense fallback={<Typography>Loading...</Typography>}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/loans' element={<Loans />} />
            <Route path='/users' element={<Users />} />
            <Route path='/visits' element={<Visits />} />
            <Route path='/events' element={<Events />} />
            <Route path='/computers' element={<Computers />} />
            <Route path='/national-estimates' element={<NationalEstimates />} />
            <Route path='/policy-briefing' element={<NationalEstimates />} />
            <Route path='/about' element={<About />} />
            <Route path='/privacy' element={<Privacy />} />
            <Route path='/data-quality' element={<DataQuality />} />
          </Routes>
        </Suspense>
        <Box sx={{ textAlign: 'center', marginY: 4 }}>
          <Typography variant='body1'>
            Made with ❤️ by{' '}
            <a href='https://www.librarieshacked.org'>Libraries Hacked</a>
          </Typography>
          <Typography
            variant='body2'
            color='textSecondary'
            sx={{
              mt: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 0.5
            }}
          >
            <Link to='/national-estimates'>National estimates</Link>
            <Box component='span' aria-hidden='true' sx={{ mx: 0.75, opacity: 0.5 }}>
              •
            </Box>
            <Link to='/about'>About</Link>
            <Box component='span' aria-hidden='true' sx={{ mx: 0.75, opacity: 0.5 }}>
              •
            </Box>
            <Link to='/data-quality'>Data quality</Link>
            <Box component='span' aria-hidden='true' sx={{ mx: 0.75, opacity: 0.5 }}>
              •
            </Box>
            <Link to='/privacy'>Privacy policy</Link>
            <Box component='span' aria-hidden='true' sx={{ mx: 0.75, opacity: 0.5 }}>
              •
            </Box>
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
  )
}

/**
 * Root application component rendering theme providers, global CSS resets,
 * and router provider.
 *
 * @returns {JSX.Element} The rendered application shell.
 */
function App () {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
