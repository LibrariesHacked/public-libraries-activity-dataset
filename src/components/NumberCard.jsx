import React from 'react'

import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
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

const getChangeIcon = change => {
  if (change <= -0.05) return <TrendingDownRoundedIcon />
  if (change >= 0.05) return <TrendingUpRoundedIcon />
  return <TrendingFlatRoundedIcon />
}

const getWarningLabel = (warning, isShowingEstimated) => {
  if (typeof warning === 'string') return 'Data note'
  if (warning.status === 'excluded') return 'Data excluded'
  if (warning.status === 'replaced') {
    const showingEst = isShowingEstimated !== false && warning.isShowingEstimated !== false
    return showingEst ? 'Estimated data' : 'Original reported'
  }
  if (warning.status === 'suspicious') return 'Data warning'
  return 'Data note'
}

const getWarningColor = (warning, isShowingEstimated) => {
  if (typeof warning === 'string') return 'warning'
  if (warning.status === 'excluded') return 'error'
  if (warning.status === 'replaced') {
    const showingEst = isShowingEstimated !== false && warning.isShowingEstimated !== false
    return showingEst ? 'info' : 'warning'
  }
  return 'warning'
}

const getWarningTooltip = (warning, isShowingEstimated) => {
  if (typeof warning === 'string') return warning
  let tip = warning.notes || 'Data quality note'
  if (warning.status === 'replaced') {
    const showingEst = isShowingEstimated !== false && warning.isShowingEstimated !== false
    if (showingEst) {
      if (warning.original != null) {
        tip += ` (Original reported: ${Number(warning.original).toLocaleString()})`
      }
    } else {
      if (warning.estimated != null) {
        tip += ` (Estimated correction: ${Number(warning.estimated).toLocaleString()})`
      }
    }
  } else if (warning.original != null) {
    tip += ` (Reported: ${Number(warning.original).toLocaleString()})`
  }
  return tip
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

  return (
    <Card
      variant='outlined'
      sx={{ height: '100%', flexGrow: 1, textAlign: 'center' }}
    >
      <CardContent>
        <Typography
          component='h2'
          variant='subtitle2'
          color='text.secondary'
          gutterBottom
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
                <>
                  <Typography
                    variant='h4'
                    color='text.secondary'
                    sx={{ fontWeight: 700 }}
                  >
                    No data
                  </Typography>
                  {warning
                    ? (
                      <Box sx={{ mt: 1 }}>
                        <Tooltip title={getWarningTooltip(warning, isShowingEstimated)} arrow>
                          <Chip
                            size='small'
                            color={getWarningColor(warning, isShowingEstimated)}
                            variant='outlined'
                            icon={<WarningAmberRoundedIcon />}
                            label={getWarningLabel(warning, isShowingEstimated)}
                          />
                        </Tooltip>
                      </Box>
                      )
                    : null}
                </>
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
                  {warning
                    ? (
                      <Box sx={{ mt: 1 }}>
                        <Tooltip title={getWarningTooltip(warning, isShowingEstimated)} arrow>
                          <Chip
                            size='small'
                            color={getWarningColor(warning, isShowingEstimated)}
                            variant='outlined'
                            icon={<WarningAmberRoundedIcon />}
                            label={getWarningLabel(warning, isShowingEstimated)}
                          />
                        </Tooltip>
                      </Box>
                      )
                    : null}
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
