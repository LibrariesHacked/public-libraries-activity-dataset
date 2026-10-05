import { createTheme } from '@mui/material/styles'
import { lightBlue, grey, blueGrey } from '@mui/material/colors'

/**
 * Custom Material-UI theme configuration featuring UK Government Analysis Function
 * and ONS accessible color palettes, neutral backgrounds, rounded card styling,
 * component default props, and global element style overrides.
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
    MuiCssBaseline: {
      styleOverrides: theme => ({
        a: {
          color: theme.palette.primary.main,
          fontWeight: 'bold',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline'
          }
        },
        'h1, h2, h3, h4, h5, h6': {
          color: theme.palette.text.primary,
          fontWeight: 700
        },
        h1: {
          fontSize: '1.85rem',
          fontWeight: 800,
          marginTop: 0,
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        },
        h2: {
          fontSize: '1.35rem',
          marginTop: '1.75rem',
          marginBottom: '0.75rem'
        },
        h3: {
          fontSize: '1.15rem',
          marginTop: '1.5rem',
          marginBottom: '0.5rem'
        },
        p: {
          lineHeight: 1.7,
          marginTop: 0,
          marginBottom: '1rem'
        },
        'ul, ol': {
          paddingLeft: '1.5rem',
          marginTop: 0,
          marginBottom: '1rem'
        },
        li: {
          marginBottom: '0.35rem',
          lineHeight: 1.6
        },
        'table, .MuiTable-root, .MuiTableContainer-root, .MuiDataGrid-root': {
          boxShadow: 'none !important'
        }
      })
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          boxShadow: 'none'
        }
      }
    },
    MuiTableContainer: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          boxShadow: 'none !important',
          backgroundImage: 'none'
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          boxShadow: 'none !important'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          boxShadow: 'none !important'
        }
      }
    },
    MuiDataGrid: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          boxShadow: 'none !important',
          '& .MuiDataGrid-main': {
            boxShadow: 'none !important'
          },
          '& .MuiDataGrid-columnHeaders': {
            boxShadow: 'none !important'
          },
          '& .MuiDataGrid-virtualScroller': {
            boxShadow: 'none !important'
          },
          '& .MuiDataGrid-footerContainer': {
            boxShadow: 'none !important'
          }
        }
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

export { theme }
export default theme
