import React from 'react'

import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { useApplicationState } from '../hooks/useApplicationState'

/**
 * Option toggle allowing users to enable or disable automated data corrections
 * for known reporting anomalies.
 *
 * @returns {JSX.Element} The switch option with informational tooltip.
 */
const DataChoiceSelection = () => {
  const [
    { useEstimates, nationalGrossing, filteredServices },
    dispatchApplication
  ] = useApplicationState()

  const isEstimated = useEstimates !== false
  const isNationalGrossed = Boolean(nationalGrossing)
  const isNationalView = !filteredServices || filteredServices.length === 0

  /**
   * Handles toggle change for data correction.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The switch change event.
   */
  const handleToggle = event => {
    dispatchApplication({
      type: 'SetUseEstimates',
      useEstimates: event.target.checked
    })
  }

  /**
   * Handles toggle change for national population grossing (DCMS methodology).
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The switch change event.
   */
  const handleGrossingToggle = event => {
    dispatchApplication({
      type: 'SetNationalGrossing',
      nationalGrossing: event.target.checked
    })
  }

  return (
    <Stack
      direction='row'
      spacing={{ xs: 1.5, sm: 3 }}
      useFlexGap
      sx={{ justifyContent: 'center', alignItems: 'center', mt: 1.5, mb: 0.5, flexWrap: 'wrap' }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={isEstimated}
            onChange={handleToggle}
            size='small'
            inputProps={{
              'aria-label': 'Data corrections'
            }}
            sx={{
              '& .MuiSwitch-switchBase': {
                color: '#b58a8a',
                '&:hover': {
                  backgroundColor: 'rgba(181, 138, 138, 0.08)'
                },
                '&.Mui-checked': {
                  color: 'success.main',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.08)'
                  },
                  '& + .MuiSwitch-track': {
                    backgroundColor: 'success.main',
                    opacity: 0.5
                  }
                }
              },
              '& .MuiSwitch-track': {
                backgroundColor: '#dec4c4',
                opacity: 0.7
              }
            }}
          />
        }
        label={
          <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              Data corrections
            </Typography>
            <Tooltip
              title='Adjusts known reporting errors to prevent chart distortion.'
              arrow
            >
              <InfoOutlinedIcon
                color='action'
                sx={{ fontSize: 16, cursor: 'help' }}
              />
            </Tooltip>
          </Stack>
        }
        sx={{ mr: 0 }}
      />
      {isNationalView && (
        <FormControlLabel
          control={
            <Switch
              checked={isNationalGrossed}
              onChange={handleGrossingToggle}
              size='small'
              inputProps={{
                'aria-label': 'Estimate England totals'
              }}
              sx={{
                '& .MuiSwitch-switchBase': {
                  color: '#8a9bb5',
                  '&:hover': {
                    backgroundColor: 'rgba(138, 155, 181, 0.08)'
                  },
                  '&.Mui-checked': {
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)'
                    },
                    '& + .MuiSwitch-track': {
                      backgroundColor: 'primary.main',
                      opacity: 0.5
                    }
                  }
                },
                '& .MuiSwitch-track': {
                  backgroundColor: '#c4d4de',
                  opacity: 0.7
                }
              }}
            />
          }
          label={
            <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                Estimate England totals
              </Typography>
              <Tooltip
                title='Scales totals to England based on reporting population.'
                arrow
              >
                <InfoOutlinedIcon
                  color='action'
                  sx={{ fontSize: 16, cursor: 'help' }}
                />
              </Tooltip>
            </Stack>
          }
          sx={{ mr: 0 }}
        />
      )}
    </Stack>
  )
}

export default DataChoiceSelection
