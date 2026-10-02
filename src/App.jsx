import { lazy, Suspense } from 'react'

import { HashRouter, Route, Routes } from 'react-router-dom'

import { ThemeProvider, createTheme } from '@mui/material/styles'

import { lightBlue, grey, blueGrey } from '@mui/material/colors'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
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
  shadows: Array(25).fill('none'),
  shape: {
    borderRadius: 8
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 0
      }
    },
    MuiCard: {
      defaultProps: {
        elevation: 0
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          display: 'none'
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          minHeight: 48,
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease-in-out',
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.background.paper,
          fontWeight: 500,
          borderRight: `1px solid ${theme.palette.divider}`,
          '&:last-of-type': {
            borderRight: 'none'
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(32, 96, 149, 0.08)',
            color: theme.palette.primary.main,
            fontWeight: 700,
            '&:hover': {
              backgroundColor: 'rgba(32, 96, 149, 0.14)'
            }
          }
        })
      }
    },
    MuiToggleButtonGroup: {
      defaultProps: {
        color: 'primary'
      },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          '&.MuiToggleButtonGroup-fullWidth': {
            width: '100%'
          }
        }),
        grouped: ({ theme }) => ({
          border: 'none',
          borderRadius: 0,
          '&.Mui-selected': {
            backgroundColor: 'rgba(32, 96, 149, 0.08)',
            color: theme.palette.primary.main,
            fontWeight: 700,
            '&:hover': {
              backgroundColor: 'rgba(32, 96, 149, 0.14)'
            }
          }
        }),
        groupedHorizontal: ({ theme }) => ({
          borderTop: 'none !important',
          borderBottom: 'none !important',
          borderLeft: 'none !important',
          borderRight: `1px solid ${theme.palette.divider} !important`,
          marginLeft: '0 !important',
          borderRadius: '0 !important',
          '&:last-of-type': {
            borderRight: 'none !important'
          }
        }),
        groupedVertical: ({ theme }) => ({
          borderTop: 'none !important',
          borderLeft: 'none !important',
          borderRight: 'none !important',
          borderBottom: `1px solid ${theme.palette.divider} !important`,
          marginTop: '0 !important',
          borderRadius: '0 !important',
          '&:last-of-type': {
            borderBottom: 'none !important'
          }
        })
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          minHeight: 44,
          padding: '8px 20px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.background.paper,
          fontWeight: 500,
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(32, 96, 149, 0.08)',
            color: theme.palette.primary.main,
            fontWeight: 700,
            '&:hover': {
              backgroundColor: 'rgba(32, 96, 149, 0.14)'
            }
          }
        }),
        sizeMedium: {
          minHeight: 44,
          fontSize: '0.875rem'
        },
        sizeSmall: {
          minHeight: 32,
          fontSize: '0.8125rem',
          padding: '4px 10px'
        }
      }
    },
    MuiMenu: {
      defaultProps: {
        elevation: 0
      }
    },
    MuiPopover: {
      defaultProps: {
        elevation: 0
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
                Library activity
              </Typography>
              <Typography variant='body2' color='textSecondary' sx={{ mb: 2 }}>
                Compare library activity by service or region
              </Typography>
              <ServiceSelection />
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
              <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
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
