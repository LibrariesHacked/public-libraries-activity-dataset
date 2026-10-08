import React, { useMemo } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'

import { useApplicationState } from '../hooks/useApplicationState'

import {
  formatMonth,
  formatPeriod,
  getMonthsInRange,
  getPeriodForMonth,
  getPeriodMonths
} from '../helpers/periods'

/**
 * Unified date slider component amalgamating financial year selection and month-level date range filtering.
 *
 * Displays financial year spans directly above a continuous dual-handle monthly slider.
 * Moving the slider handles selects or deselects financial years based on which years
 * fall within the chosen range. Clicking a year selects its full April-to-March range.
 *
 * @returns {JSX.Element|null} The date range slider component, or null if no periods are loaded.
 */
const PeriodSelection = () => {
  const [
    { periods, selectedPeriods, periodMonthRange, monthRange },
    dispatchApplication
  ] = useApplicationState()

  const availableMonths = useMemo(
    () => getMonthsInRange(periodMonthRange),
    [periodMonthRange]
  )

  const marks = useMemo(() => {
    return availableMonths.map((month, index) => {
      // April is the first month of the UK financial year
      if (month.endsWith('-04')) {
        return {
          value: index,
          label: formatMonth(month)
        }
      }
      // Label the final month at the end of the range if not too close to the previous April
      if (
        index === availableMonths.length - 1 &&
        !availableMonths.slice(Math.max(0, index - 2), index).some(m => m.endsWith('-04'))
      ) {
        return {
          value: index,
          label: formatMonth(month)
        }
      }
      // Tick mark without text label for intermediate months
      return {
        value: index
      }
    })
  }, [availableMonths])

  const periodWidths = useMemo(() => {
    if (!periods || periods.length === 0 || !availableMonths || availableMonths.length === 0) {
      return {}
    }
    const maxIndex = availableMonths.length - 1
    if (maxIndex <= 0) {
      return { [periods[0]]: 100 }
    }

    const widths = {}
    periods.forEach((period, idx) => {
      const pMonths = getPeriodMonths(period)
      const thisStartIndex = availableMonths.indexOf(pMonths[0])
      let thisEndIndex
      if (idx < periods.length - 1) {
        const nextPeriod = periods[idx + 1]
        const nextMonths = getPeriodMonths(nextPeriod)
        thisEndIndex = availableMonths.indexOf(nextMonths[0])
      } else {
        thisEndIndex = maxIndex
      }
      const start = Math.max(0, thisStartIndex)
      const end = Math.min(maxIndex, thisEndIndex)
      const span = end - start
      widths[period] = (span / maxIndex) * 100
    })
    return widths
  }, [periods, availableMonths])

  if (!periods || periods.length === 0 || availableMonths.length === 0) {
    return null
  }

  const currentRange = monthRange || [
    availableMonths[0],
    availableMonths[availableMonths.length - 1]
  ]

  const startIndex = Math.max(0, availableMonths.indexOf(currentRange[0]))
  const rawEnd = availableMonths.indexOf(currentRange[1])
  const endIndex = rawEnd === -1 ? availableMonths.length - 1 : rawEnd

  const isAllSelected =
    startIndex === 0 &&
    endIndex === availableMonths.length - 1 &&
    selectedPeriods?.length === periods?.length

  /**
   * Updates monthRange and synchronizes selected financial years when the slider moves.
   *
   * @param {Event} event - Slider change event.
   * @param {number[]} newRange - Two-element array containing start and end month indices.
   */
  const handleSliderChange = (event, newRange) => {
    const newMonthRange = [
      availableMonths[newRange[0]],
      availableMonths[newRange[1]]
    ]
    dispatchApplication({
      type: 'SetDateRange',
      monthRange: newMonthRange
    })
  }

  /**
   * Resets the selection to cover all available financial years and months in the dataset.
   */
  const handleSelectAll = () => {
    if (!availableMonths.length) return
    dispatchApplication({
      type: 'SetDateRange',
      monthRange: periodMonthRange
    })
  }


  const formattedStart = formatMonth(availableMonths[startIndex])
  const formattedEnd = formatMonth(availableMonths[endIndex])

  return (
    <Paper
      variant='outlined'
      sx={{
        width: '100%',
        maxWidth: 840,
        mx: 'auto',
        mt: 2,
        mb: 1.5,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        backgroundColor: 'background.paper',
        textAlign: 'left'
      }}
    >
      {/* Header row: Integrated Section Title, Date Range Summary & Reset */}
      <Stack
        direction='row'
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.25,
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
          <CalendarMonthRoundedIcon color='primary' fontSize='small' />
          <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'text.primary' }}>
            {formattedStart} – {formattedEnd}
          </Typography>
        </Stack>
        {!isAllSelected && (
          <Button
            size='small'
            variant='text'
            color='primary'
            startIcon={<RestartAltRoundedIcon fontSize='small' />}
            onClick={handleSelectAll}
            sx={{ py: 0, px: 1, minHeight: 24, fontSize: '0.75rem', fontWeight: 600 }}
          >
            All years
          </Button>
        )}
      </Stack>

      {/* Unified Range Slider & Year Buttons Container */}
      <Box sx={{ px: 0, pt: 0 }}>
        {/* Year Toggle Buttons */}
        <ToggleButtonGroup
          value={selectedPeriods || []}
          fullWidth
          aria-label='Years'
          sx={{ mb: 1, width: '100%' }}
        >
          {periods.map(period => (
            <ToggleButton
              key={period}
              value={period}
              onClick={() => {
                const months = getPeriodMonths(period)
                dispatchApplication({
                  type: 'SetDateRange',
                  monthRange: [months[0], months[months.length - 1]]
                })
              }}
              aria-label={formatPeriod(period)}
              title={period}
              sx={{
                flex: `0 0 ${periodWidths[period] ?? (100 / periods.length)}%`,
                width: `${periodWidths[period] ?? (100 / periods.length)}%`,
                maxWidth: `${periodWidths[period] ?? (100 / periods.length)}%`,
                px: { xs: 0.5, sm: 1.5 }
              }}
            >
              {formatPeriod(period)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Slider
          value={[startIndex, endIndex]}
          onChange={handleSliderChange}
          min={0}
          max={availableMonths.length - 1}
          step={1}
          disableSwap
          valueLabelDisplay='auto'
          valueLabelFormat={value => {
            const m = availableMonths[value]
            return m
              ? `${formatMonth(m)} (${formatPeriod(getPeriodForMonth(m))})`
              : ''
          }}
          marks={marks}
          getAriaLabel={index => (index === 0 ? 'Start month' : 'End month')}
          getAriaValueText={value => {
            const m = availableMonths[value]
            return m
              ? `${formatMonth(m)} (${formatPeriod(getPeriodForMonth(m))})`
              : ''
          }}
          sx={{
            color: 'primary.main',
            height: 4,
            py: 1,
            mb: 2.5,
            width: 'calc(100% - 16px)',
            mx: 'auto',
            display: 'block',
            '& .MuiSlider-thumb': {
              width: 16,
              height: 16,
              backgroundColor: '#fff',
              border: '2px solid currentColor',
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0 0 0 6px rgba(32, 96, 149, 0.16)'
              },
              '&.Mui-active': {
                boxShadow: '0 0 0 10px rgba(32, 96, 149, 0.24)'
              }
            },
            '& .MuiSlider-track': {
              height: 4
            },
            '& .MuiSlider-rail': {
              height: 4,
              opacity: 0.3,
              backgroundColor: '#90a4ae'
            },
            '& .MuiSlider-mark': {
              height: 4,
              width: 2,
              backgroundColor: '#90a4ae'
            },
            '& .MuiSlider-markActive': {
              backgroundColor: 'primary.main'
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.725rem',
              fontWeight: 500,
              color: 'text.secondary',
              top: 20,
              whiteSpace: 'nowrap'
            },
            '& .MuiSlider-markLabel[data-index="0"]': {
              transform: 'translateX(-8px)'
            },
            [`& .MuiSlider-markLabel[data-index="${availableMonths.length - 1}"]`]: {
              transform: 'translateX(calc(-100% + 8px))'
            }
          }}
        />
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{
            display: 'block',
            textAlign: 'center',
            fontSize: '0.725rem',
            mt: 1
          }}
        >
          Drag handles to adjust months, or click a year to select.
        </Typography>
      </Box>
    </Paper>
  )
}

export default PeriodSelection
