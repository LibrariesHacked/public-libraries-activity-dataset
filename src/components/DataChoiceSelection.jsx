import React from 'react'

import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useApplicationState } from '../hooks/useApplicationState'

/**
 * Toggle component allowing users to switch between displaying corrected figures
 * and the raw original figures as reported by local authorities.
 *
 * @returns {JSX.Element} The toggle button group and explanatory tooltip UI.
 */
const DataChoiceSelection = () => {
  const [{ useEstimates }, dispatchApplication] = useApplicationState()

  /**
   * Handles toggle change between 'estimated' (corrected) data and 'original' figures.
   *
   * @param {React.MouseEvent} event - Click event.
   * @param {'estimated'|'original'|null} newChoice - The newly selected choice.
   */
  const handleDataChoiceChange = (event, newChoice) => {
    if (!newChoice) return
    dispatchApplication({
      type: 'SetUseEstimates',
      useEstimates: newChoice === 'estimated'
    })
  }


  const isEstimated = useEstimates !== false

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ToggleButtonGroup
        color='primary'
        value={isEstimated ? 'estimated' : 'original'}
        exclusive
        onChange={handleDataChoiceChange}
        size='small'
        aria-label='Data quality display preference'
      >
        <ToggleButton value='estimated' aria-label='Show corrected data'>
          <AutoFixHighRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
          Corrected data
        </ToggleButton>
        <ToggleButton value='original' aria-label='Show original data'>
          <HistoryRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
          Original data
        </ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
        <Typography variant='caption' color='textSecondary'>
          {isEstimated
            ? 'Corrected data shown by default (typos & unit errors corrected; corrupted data excluded)'
            : 'Original data shown (severely corrupted data remains excluded from aggregations)'}
        </Typography>
        <Tooltip
          title='Official survey submissions contain known data entry anomalies (e.g. extra digits, minutes instead of hours). By default, corrected data is shown to prevent charts and totals from distorting. Choose "Original data" to inspect the figures as originally submitted. Severely corrupted entries (e.g. 2.2 billion hardware timer counts) remain excluded in both modes.'
          arrow
        >
          <InfoOutlinedIcon
            sx={{ fontSize: 15, color: 'text.secondary', cursor: 'pointer', verticalAlign: 'middle' }}
          />
        </Tooltip>
      </Box>
    </Box>
  )
}

export default DataChoiceSelection
