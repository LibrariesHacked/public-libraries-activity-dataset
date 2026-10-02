import React, { useMemo } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
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
 * fall within the chosen range, and clicking any financial year block toggles that year on or off.
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
      // Label the final month at the end of the range
      if (index === availableMonths.length - 1) {
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
   * Toggles a financial year on or off, supporting multiple financial year selections.
   * If toggling off the only remaining selected financial year, resets to all financial years.
   *
   * @param {string} period - The target financial year period string (e.g. '2023/2024').
   */
  const handleTogglePeriod = period => {
    const current = selectedPeriods || []
    const isSelected = current.includes(period)
    let next
    if (isSelected) {
      if (current.length <= 1) {
        next = periods
      } else {
        next = current.filter(p => p !== period)
      }
    } else {
      next = periods.filter(p => current.includes(p) || p === period)
    }
    dispatchApplication({
      type: 'SetSelectedPeriods',
      selectedPeriods: next
    })
  }

  /**
   * Resets the selection to cover all available financial years and months in the dataset.
   */
  const handleSelectAll = () => {
    if (!availableMonths.length) return
    dispatchApplication({
      type: 'SetSelectedPeriods',
      selectedPeriods: periods
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
            Date range: {formattedStart} – {formattedEnd}
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

      {/* Financial Year Span Blocks */}
      <Paper
        variant='outlined'
        sx={{
          display: 'flex',
          width: '100%',
          mb: 0.25,
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        {periods.map((period, index) => {
          const isSelected = selectedPeriods?.includes(period)
          const pMonths = getPeriodMonths(period)
          const widthPercent = (pMonths.length / availableMonths.length) * 100
          const startM = formatMonth(pMonths[0])
          const endM = formatMonth(pMonths[pMonths.length - 1])

          return (
            <Tooltip
              key={period}
              title={
                isSelected
                  ? (selectedPeriods?.length === 1
                      ? `${period} (${startM} – ${endM}) is currently selected. Click to select all years.`
                      : `Click to turn off ${period} (${startM} – ${endM})`)
                  : `Click to turn on ${period} (${startM} – ${endM})`
              }
              arrow
            >
              <Box
                onClick={() => handleTogglePeriod(period)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleTogglePeriod(period)
                  }
                }}
                role='button'
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={
                  isSelected
                    ? (selectedPeriods?.length === 1
                        ? `Financial year ${period} is selected. Click to select all years.`
                        : `Turn off financial year ${period}`)
                    : `Turn on financial year ${period}`
                }
                sx={{
                  flex: `0 0 ${widthPercent}%`,
                  py: 0.6,
                  px: 0.75,
                  textAlign: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s ease-in-out',
                  borderRight: index < periods.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  backgroundColor: isSelected
                    ? 'rgba(32, 96, 149, 0.08)'
                    : 'background.paper',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? 'rgba(32, 96, 149, 0.14)'
                      : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    fontSize: '0.8rem',
                    lineHeight: 1.2
                  }}
                >
                  {period}
                </Typography>
              </Box>
            </Tooltip>
          )
        })}
      </Paper>

      {/* Unified Range Slider */}
      <Box sx={{ px: 1, pt: 0 }}>
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
            mb: 2,
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
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'text.secondary',
              top: 22
            }
          }}
        />
        <Typography
          variant='caption'
          color='textSecondary'
          sx={{
            display: 'block',
            textAlign: 'center',
            fontSize: '0.725rem',
            mt: 0
          }}
        >
          Drag handles to adjust months, or click a financial year to turn on/off.
        </Typography>
      </Box>
    </Paper>
  )
}

export default PeriodSelection
