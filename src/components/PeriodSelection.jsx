import React, { useMemo } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Slider from '@mui/material/Slider'
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
 * fall within the chosen range, and clicking any financial year block snaps the range to that year.
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
   * Snaps the slider and selected period to a single financial year, or resets to all years
   * if this financial year is already the only one selected.
   *
   * @param {string} period - The target financial year period string (e.g. '2023/2024').
   */
  const handleSelectPeriod = period => {
    if (selectedPeriods?.length === 1 && selectedPeriods[0] === period) {
      handleSelectAll()
      return
    }
    const months = getPeriodMonths(period)
    dispatchApplication({
      type: 'SetDateRange',
      monthRange: [months[0], months[months.length - 1]]
    })
  }

  /**
   * Resets the slider to cover all available financial years and months in the dataset.
   */
  const handleSelectAll = () => {
    if (!availableMonths.length) return
    dispatchApplication({
      type: 'SetDateRange',
      monthRange: [
        availableMonths[0],
        availableMonths[availableMonths.length - 1]
      ]
    })
  }


  const formattedStart = formatMonth(availableMonths[startIndex])
  const formattedEnd = formatMonth(availableMonths[endIndex])

  return (
    <Box sx={{ maxWidth: 660, mx: 'auto', mt: 1, px: 2 }}>
      {/* Header row: Range summary & Quick Reset */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <CalendarMonthRoundedIcon color='primary' sx={{ fontSize: 20 }} />
          <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'text.primary' }}>
            {formattedStart} – {formattedEnd}
          </Typography>
          <Chip
            label={
              selectedPeriods?.length === 1
                ? `Financial year: ${formatPeriod(selectedPeriods[0])}`
                : `${selectedPeriods?.length || 0} financial years: ${(selectedPeriods || []).map(formatPeriod).join(', ')}`
            }
            size='small'
            color='primary'
            variant='outlined'
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        </Box>
        {!isAllSelected && (
          <Button
            size='small'
            variant='text'
            color='primary'
            startIcon={<RestartAltRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={handleSelectAll}
            sx={{
              textTransform: 'none',
              py: 0,
              px: 1,
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            All years
          </Button>
        )}
      </Box>

      {/* Financial Year Span Blocks */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          mb: 1,
          borderRadius: 1.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
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
                  ? `${period} (${startM} – ${endM}) is currently selected. Click to select only this year.`
                  : `Click to select ${period} (${startM} – ${endM})`
              }
              arrow
            >
              <Box
                onClick={() => handleSelectPeriod(period)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectPeriod(period)
                  }
                }}
                role='button'
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Select financial year ${period}`}
                sx={{
                  flex: `0 0 ${widthPercent}%`,
                  py: 1,
                  px: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  borderRight: index < periods.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  backgroundColor: isSelected
                    ? 'rgba(32, 96, 149, 0.08)'
                    : 'rgba(0, 0, 0, 0.02)',
                  borderBottom: isSelected ? '3px solid' : '3px solid transparent',
                  borderBottomColor: isSelected ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? 'rgba(32, 96, 149, 0.14)'
                      : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    fontSize: '0.85rem',
                    lineHeight: 1.3
                  }}
                >
                  {period}
                </Typography>
              </Box>
            </Tooltip>
          )
        })}
      </Box>

      {/* Unified Range Slider */}
      <Box sx={{ px: 1, pt: 0.5 }}>
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
            height: 6,
            '& .MuiSlider-thumb': {
              width: 18,
              height: 18,
              backgroundColor: '#fff',
              border: '2px solid currentColor',
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0 0 0 8px rgba(32, 96, 149, 0.16)'
              },
              '&.Mui-active': {
                boxShadow: '0 0 0 12px rgba(32, 96, 149, 0.24)'
              }
            },
            '& .MuiSlider-track': {
              height: 6
            },
            '& .MuiSlider-rail': {
              height: 6,
              opacity: 0.3,
              backgroundColor: '#90a4ae'
            },
            '& .MuiSlider-mark': {
              height: 6,
              width: 2,
              backgroundColor: '#90a4ae'
            },
            '& .MuiSlider-markActive': {
              backgroundColor: 'primary.main'
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'text.secondary',
              top: 26
            }
          }}
        />
      </Box>

      <Typography
        variant='caption'
        color='textSecondary'
        sx={{
          display: 'block',
          mt: 2.5,
          textAlign: 'center',
          fontSize: '0.75rem'
        }}
      >
        Drag handles to adjust the month range, or click any financial year block above to snap to that year
      </Typography>
    </Box>
  )
}

export default PeriodSelection
