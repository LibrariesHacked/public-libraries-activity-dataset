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

const DataChoiceSelection = () => {
  const [{ useEstimates }, dispatchApplication] = useApplicationState()

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
        <ToggleButton value='estimated' aria-label='Show estimated corrections'>
          <AutoFixHighRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
          Estimated corrections
        </ToggleButton>
        <ToggleButton value='original' aria-label='Show original reported data'>
          <HistoryRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
          Original reported
        </ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
        <Typography variant='caption' color='textSecondary'>
          {isEstimated
            ? 'Estimated corrections shown by default (typos & unit errors corrected; corrupted data excluded)'
            : 'Original reported data shown (severely corrupted data remains excluded from aggregations)'}
        </Typography>
        <Tooltip
          title='Official survey submissions contain known data entry anomalies (e.g. extra digits, minutes instead of hours). By default, estimated corrections are shown to prevent charts and totals from distorting. Choose "Original reported" to inspect the figures as originally submitted. Severely corrupted entries (e.g. 2.2 billion hardware timer counts) remain excluded in both modes.'
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
