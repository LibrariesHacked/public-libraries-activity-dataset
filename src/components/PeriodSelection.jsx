import React from 'react'

import { useLocation } from 'react-router-dom'

import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import { useApplicationState } from '../hooks/useApplicationState'

import {
  formatMonth,
  formatPeriod,
  getMonthsInRange
} from '../helpers/periods'

const timelineRoutes = ['/loans', '/visits', '/events', '/computers']

const PeriodSelection = () => {
  const [
    { periods, selectedPeriods, periodMonthRange, monthRange },
    dispatchApplication
  ] = useApplicationState()

  const location = useLocation()

  const availableMonths = getMonthsInRange(periodMonthRange)

  const handleChangePeriods = (event, newPeriods) => {
    if (!newPeriods || newPeriods.length === 0) return
    dispatchApplication({
      type: 'SetSelectedPeriods',
      selectedPeriods: newPeriods
    })
  }

  const handleChangeMonthRange = (event, newRange) => {
    dispatchApplication({
      type: 'SetMonthRange',
      monthRange: [availableMonths[newRange[0]], availableMonths[newRange[1]]]
    })
  }

  if (!periods || periods.length === 0) return null

  const showTimeline =
    timelineRoutes.includes(location.pathname) && availableMonths.length > 1

  return (
    <Box sx={{ mt: 1 }}>
      <ToggleButtonGroup
        color='primary'
        value={selectedPeriods}
        onChange={handleChangePeriods}
        size='small'
        aria-label='Financial years'
      >
        {periods.map(period => (
          <ToggleButton key={period} value={period}>
            {formatPeriod(period)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {showTimeline
        ? (
          <Box sx={{ maxWidth: 600, mx: 'auto', mt: 1, px: 2 }}>
            <Typography variant='body2' color='textSecondary'>
              Chart date range
            </Typography>
            <Slider
              value={[
                Math.max(0, availableMonths.indexOf(monthRange?.[0])),
                Math.max(
                  0,
                  availableMonths.indexOf(monthRange?.[1]) === -1
                    ? availableMonths.length - 1
                    : availableMonths.indexOf(monthRange[1])
                )
              ]}
              onChange={handleChangeMonthRange}
              min={0}
              max={availableMonths.length - 1}
              step={1}
              disableSwap
              valueLabelDisplay='auto'
              valueLabelFormat={value => formatMonth(availableMonths[value])}
              marks={availableMonths.map((month, index) => ({
                value: index,
                label: month.endsWith('-04') ? formatMonth(month) : undefined
              }))}
              getAriaValueText={value => formatMonth(availableMonths[value])}
            />
          </Box>
          )
        : null}
    </Box>
  )
}

export default PeriodSelection
