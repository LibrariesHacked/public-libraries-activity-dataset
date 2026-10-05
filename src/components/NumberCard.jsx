import React from 'react'

import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { DataQualityStatus } from '../helpers/dataQuality'

const getChangeIcon = change => {
  if (change <= -0.05) return <TrendingDownRoundedIcon />
  if (change >= 0.05) return <TrendingUpRoundedIcon />
  return <TrendingFlatRoundedIcon />
}

const getSummaryTooltip = (warning, isShowingEstimated) => {
  if (warning.summary) return warning.summary

  const isExcluded = warning.status === DataQualityStatus.EXCLUDED
  const isReplaced = warning.status === DataQualityStatus.REPLACED
  const serviceCount = warning.serviceCount || 0
  const serviceName = warning.serviceName

  if (isExcluded) {
    if (serviceName) {
      return `Data excluded for ${serviceName} due to reporting issues.`
    }
    if (serviceCount > 1) {
      return `Data excluded for ${serviceCount} services due to reporting issues.`
    }
    return 'Data excluded due to reporting issues.'
  }

  if (isReplaced) {
    const showingEst =
      isShowingEstimated !== false && warning.isShowingEstimated !== false
    if (showingEst) {
      if (serviceName) {
        return `Estimates applied for ${serviceName}.`
      }
      if (serviceCount > 1) {
        return `Estimates applied for ${serviceCount} services.`
      }
      return 'Estimates applied due to reporting anomalies.'
    } else {
      if (serviceName) {
        return `Showing unadjusted figures for ${serviceName}.`
      }
      if (serviceCount > 1) {
        return `Showing unadjusted figures for ${serviceCount} services.`
      }
      return 'Showing unadjusted figures.'
    }
  }

  if (serviceName) {
    return `Data note applies for ${serviceName}.`
  }
  if (serviceCount > 1) {
    return `Data notes apply to ${serviceCount} services.`
  }
  return 'Data note applies to this figure.'
}

const getWarningDetails = (warning, isShowingEstimated) => {
  if (!warning) return null

  if (typeof warning === 'string') {
    return {
      label: 'Data warning',
      color: 'warning.main',
      tooltip: warning
    }
  }

  const isExcluded = warning.status === DataQualityStatus.EXCLUDED
  const color = isExcluded ? 'error.main' : 'warning.main'
  const label = isExcluded ? 'Data excluded warning' : 'Data quality warning'
  const tooltip = getSummaryTooltip(warning, isShowingEstimated)

  return { label, color, tooltip }
}

const NumberCard = props => {
  const {
    title,
    number,
    description,
    descriptionIcon,
    icon,
    change,
    changeDescription,
    changeUnit = '%',
    colour,
    noData,
    warning,
    isShowingEstimated = true
  } = props

  const warningDetails = getWarningDetails(warning, isShowingEstimated)

  const renderDescriptionIcon = () => {
    const IconToRender = descriptionIcon || icon
    if (!IconToRender) return null

    const iconSx = {
      fontSize: '1rem',
      color: theme =>
        theme.palette[colour]?.main ||
        theme.palette[colour] ||
        colour ||
        'primary.main'
    }

    if (React.isValidElement(IconToRender)) {
      return React.cloneElement(IconToRender, {
        sx: { ...iconSx, ...IconToRender.props?.sx }
      })
    }

    const Component = IconToRender
    return <Component sx={iconSx} />
  }

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
          <IconButton
            size='small'
            aria-label={warningDetails.label}
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              color: warningDetails.color
            }}
          >
            <WarningAmberRoundedIcon fontSize='small' />
          </IconButton>
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
                    sx={{
                      fontWeight: 700,
                      color: theme =>
                        theme.palette[colour]?.main ||
                        theme.palette[colour] ||
                        colour ||
                        'text.primary'
                    }}
                  >
                    {number}
                  </Typography>
                  {(description || Number.isFinite(change))
                    ? (
                      <Stack
                        direction='row'
                        spacing={0.75}
                        useFlexGap
                        sx={{
                          mt: 0.5,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexWrap: 'wrap'
                        }}
                      >
                        {description
                          ? (
                            <Stack
                              direction='row'
                              spacing={0.5}
                              sx={{
                                alignItems: 'center'
                              }}
                            >
                              {renderDescriptionIcon()}
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontWeight: 500, lineHeight: 1.3 }}
                              >
                                {description}
                              </Typography>
                            </Stack>
                            )
                          : null}
                        {Number.isFinite(change)
                          ? (() => {
                              const roundedChange =
                                Math.abs(change) < 0.05 ? 0 : change
                              const color =
                                roundedChange > 0
                                  ? 'success.main'
                                  : roundedChange < 0
                                    ? 'error.main'
                                    : 'text.secondary'
                              const sign = roundedChange > 0 ? '+' : ''
                              const unitStr =
                                changeUnit === '%' ? '%' : ` ${changeUnit}`
                              const tooltipTitle = changeDescription
                                ? `Change ${changeDescription}`
                                : null
                              const trendContent = (
                                <Stack
                                  direction='row'
                                  spacing={0.25}
                                  sx={{
                                    alignItems: 'center',
                                    color
                                  }}
                                  aria-label={
                                    tooltipTitle ||
                                    `Change: ${sign}${roundedChange.toFixed(1)}${unitStr}`
                                  }
                                >
                                  {React.cloneElement(
                                    getChangeIcon(roundedChange),
                                    {
                                      sx: { fontSize: '1rem' }
                                    }
                                  )}
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      fontWeight: 600,
                                      color: 'inherit',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {`${sign}${roundedChange.toFixed(
                                      1
                                    )}${unitStr}`}
                                  </Typography>
                                </Stack>
                              )
                              return tooltipTitle ? (
                                <Tooltip
                                  title={tooltipTitle}
                                  arrow
                                  placement='top'
                                >
                                  {trendContent}
                                </Tooltip>
                              ) : (
                                trendContent
                              )
                            })()
                          : null}
                      </Stack>
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
