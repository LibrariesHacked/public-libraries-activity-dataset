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
  const [{ useEstimates }, dispatchApplication] = useApplicationState()

  const isEstimated = useEstimates !== false

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

  return (
    <Stack
      direction='row'
      sx={{ justifyContent: 'center', alignItems: 'center', mt: 1.5, mb: 0.5 }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={isEstimated}
            onChange={handleToggle}
            size='small'
            inputProps={{
              'aria-label': isEstimated
                ? 'Data corrections applied'
                : 'Data corrections not applied'
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
              {isEstimated ? 'Data corrections applied' : 'Data corrections not applied'}
            </Typography>
            <Tooltip
              title='Fixes known anomalies (such as minutes reported instead of hours, or extra digits) in official survey returns to prevent chart distortion. Turn off to view unadjusted raw figures.'
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
    </Stack>
  )
}

export default DataChoiceSelection
