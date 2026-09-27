import React from 'react'

import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { DataQualityStatus } from '../helpers/dataQuality'

const getChangeIcon = change => {
  if (change <= -0.05) return <TrendingDownRoundedIcon />
  if (change >= 0.05) return <TrendingUpRoundedIcon />
  return <TrendingFlatRoundedIcon />
}

const WARNING_CONFIG = {
  [DataQualityStatus.EXCLUDED]: {
    label: 'Data excluded',
    color: 'error.main',
    Icon: ErrorOutlineRoundedIcon
  },
  [DataQualityStatus.REPLACED]: {
    getLabel: isShowingEstimated =>
      isShowingEstimated ? 'Corrected data' : 'Original data',
    getColor: isShowingEstimated =>
      isShowingEstimated ? 'info.main' : 'warning.main',
    Icon: InfoOutlinedIcon
  },
  [DataQualityStatus.SUSPICIOUS]: {
    label: 'Data warning',
    color: 'warning.main',
    Icon: WarningAmberRoundedIcon
  }
}

const getWarningDetails = (warning, isShowingEstimated) => {
  if (!warning) return null

  if (typeof warning === 'string') {
    return {
      label: 'Data note',
      color: 'warning.main',
      Icon: WarningAmberRoundedIcon,
      tooltip: warning
    }
  }

  const showingEst =
    isShowingEstimated !== false && warning.isShowingEstimated !== false
  const config = WARNING_CONFIG[warning.status] || {
    label: 'Data note',
    color: 'warning.main',
    Icon: WarningAmberRoundedIcon
  }

  const label = config.getLabel ? config.getLabel(showingEst) : config.label
  const color = config.getColor ? config.getColor(showingEst) : config.color
  const Icon = config.Icon

  let tooltip = warning.notes || 'Data quality note'
  if (warning.status === DataQualityStatus.REPLACED) {
    if (showingEst) {
      if (warning.original != null) {
        tooltip += ` (Original data: ${Number(warning.original).toLocaleString('en-GB')})`
      }
    } else if (warning.estimated != null) {
      tooltip += ` (Corrected data: ${Number(warning.estimated).toLocaleString('en-GB')})`
    }
  } else if (warning.original != null) {
    tooltip += ` (Reported: ${Number(warning.original).toLocaleString('en-GB')})`
  }

  return { label, color, Icon, tooltip }
}

const NumberCard = props => {
  const {
    title,
    number,
    description,
    descriptionIcon,
    change,
    changeDescription,
    colour,
    noData,
    warning,
    isShowingEstimated = true
  } = props

  const warningDetails = getWarningDetails(warning, isShowingEstimated)

  return (
    <Card
      variant='outlined'
      sx={{
        height: '100%',
        flexGrow: 1,
        textAlign: 'center',
        position: 'relative'
      }}
    >
      {warningDetails && (
        <Tooltip
          title={warningDetails.tooltip}
          arrow
          placement='top-end'
        >
          <Box
            component='span'
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 0.5,
              borderRadius: '50%',
              color: warningDetails.color,
              cursor: 'help',
              opacity: 0.8,
              transition: 'all 0.2s ease',
              '&:hover': {
                opacity: 1,
                backgroundColor: 'action.hover'
              }
            }}
            tabIndex={0}
            role='button'
            aria-label={warningDetails.label}
          >
            <warningDetails.Icon sx={{ fontSize: 18 }} />
          </Box>
        </Tooltip>
      )}
      <CardContent>
        <Typography
          component='h2'
          variant='subtitle2'
          color='text.secondary'
          gutterBottom
          sx={{ px: 2 }}
        >
          {title}
        </Typography>
        <Stack
          direction='column'
          sx={{
            justifyContent: 'space-between',
            flexGrow: '1',
            gap: 1,
            alignContent: 'center',
            alignItems: 'center'
          }}
        >
          <Stack
            sx={{ justifyContent: 'space-between', alignContent: 'center' }}
          >
            {noData
              ? (
                <Typography
                  variant='h4'
                  color='text.secondary'
                  sx={{ fontWeight: 700 }}
                >
                  No data
                </Typography>
                )
              : (
                <>
                  <Typography
                    variant='h3'
                    color={colour}
                    sx={{ fontWeight: 700 }}
                  >
                    {number}
                  </Typography>
                  <Box>
                    <Chip
                      sx={{ backgroundColor: 'rgb(245, 245, 245)' }}
                      variant='filled'
                      icon={descriptionIcon || <AutoAwesomeRoundedIcon />}
                      label={description}
                    />
                  </Box>
                  {Number.isFinite(change)
                    ? (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          size='small'
                          sx={{ backgroundColor: 'rgb(245, 245, 245)' }}
                          variant='filled'
                          icon={getChangeIcon(change)}
                          label={`${change > 0 ? '+' : ''}${change.toFixed(
                            1
                          )}% ${changeDescription}`}
                        />
                      </Box>
                      )
                    : null}
                </>
                )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default NumberCard
