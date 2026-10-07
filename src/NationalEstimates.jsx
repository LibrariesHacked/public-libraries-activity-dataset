import React, { useEffect, useMemo, useState } from 'react'
import Markdown from 'react-markdown'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

import { useApplicationState } from './hooks/useApplicationState'
import { getServices } from './models/service'
import { formatPeriod } from './helpers/periods'
import {
  calculateNationalEstimates,
  calculateMultiYearTrends,
  calculateRegionalEstimates,
  downloadNationalEstimatesCsv,
  DCMS_BASELINE_PERIOD,
} from './helpers/nationalEstimates'
import nationalEstimatesNotesMd from './content/national-estimates-notes.md?raw'

/**
 * Format a number with British English thousand-separator commas.
 *
 * @param {number|null} val - Numeric value to format.
 * @param {number} [decimals=0] - Decimal places to include.
 * @returns {string} Formatted number string.
 */
const formatNumber = (val, decimals = 0) => {
  if (val == null || !Number.isFinite(val)) return '—'
  return val.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Formats a percentage value with signed indicator (+ / -).
 *
 * @param {number|null} val - Numeric percentage value.
 * @param {string} [unit='%'] - Unit string.
 * @returns {string} Formatted string.
 */
const formatChange = (val, unit = '%') => {
  if (val == null || !Number.isFinite(val)) return '—'
  const sign = val > 0 ? '+' : ''
  return `${sign}${val.toFixed(1)}${unit}`
}

/**
 * Renders a compact trend chip indicating increase, decrease, or stability.
 *
 * @param {number|null} change - Change percentage value.
 * @returns {JSX.Element|string} Rendered chip or dash.
 */
const renderTrendChip = change => {
  if (change == null || !Number.isFinite(change)) return '—'
  if (Math.abs(change) < 0.2) {
    return (
      <Chip
        size='small'
        icon={<TrendingFlatRoundedIcon fontSize='small' />}
        label='Stable (0.0%)'
        variant='outlined'
      />
    )
  }
  const isPositive = change > 0
  return (
    <Chip
      size='small'
      color={isPositive ? 'success' : 'error'}
      variant='outlined'
      icon={
        isPositive ? (
          <TrendingUpRoundedIcon fontSize='small' />
        ) : (
          <TrendingDownRoundedIcon fontSize='small' />
        )
      }
      label={formatChange(change)}
    />
  )
}

/**
 * National estimates view providing population-weighted England totals,
 * multi-year comparisons against the 2023/24 baseline, regional breakdowns,
 * and CSV data export.
 *
 * @returns {JSX.Element} Rendered NationalEstimates view.
 */
const NationalEstimates = () => {
  const [
    { serviceRecords, periods },
    dispatchApplication
  ] = useApplicationState()

  const [selectedPeriod, setSelectedPeriod] = useState(DCMS_BASELINE_PERIOD)

  useEffect(() => {
    if (!serviceRecords) {
      getServices().then(data => {
        dispatchApplication({ type: 'AddServices', serviceRecords: data })
      })
    }
  }, [serviceRecords, dispatchApplication])

  const availablePeriods = useMemo(() => {
    if (periods && periods.length > 0) return periods
    if (serviceRecords) {
      return [...new Set(serviceRecords.map(r => r.period))].sort()
    }
    return [DCMS_BASELINE_PERIOD]
  }, [periods, serviceRecords])

  useEffect(() => {
    if (availablePeriods.length > 0 && !availablePeriods.includes(selectedPeriod)) {
      setSelectedPeriod(availablePeriods[0])
    }
  }, [availablePeriods, selectedPeriod])

  const nationalEstimates = useMemo(() => {
    return calculateNationalEstimates(serviceRecords, selectedPeriod)
  }, [serviceRecords, selectedPeriod])

  const multiYearTrends = useMemo(() => {
    return calculateMultiYearTrends(serviceRecords, availablePeriods)
  }, [serviceRecords, availablePeriods])

  const regionalEstimates = useMemo(() => {
    return calculateRegionalEstimates(serviceRecords, selectedPeriod)
  }, [serviceRecords, selectedPeriod])

  const handleExportCsv = () => {
    downloadNationalEstimatesCsv(
      nationalEstimates,
      multiYearTrends,
      regionalEstimates,
      selectedPeriod
    )
  }

  const usersEst = nationalEstimates.find(e => e.key === 'users')
  const visitsEst = nationalEstimates.find(e => e.key === 'visits')
  const loansEst = nationalEstimates.find(e => e.key === 'loans')
  const eventsEst = nationalEstimates.find(e => e.key === 'events')
  const attendanceEst = nationalEstimates.find(e => e.key === 'attendance')

  return (
    <Box sx={{ my: 3 }}>
      {/* Print-specific style overrides */}
      <style>
        {`
          @media print {
            body { background: #fff !important; color: #000 !important; }
            .no-print, nav, header, footer, button, .MuiButtonGroup-root { display: none !important; }
            .MuiPaper-root { box-shadow: none !important; border: 1px solid #ddd !important; }
            .page-break { page-break-before: always; }
          }
        `}
      </style>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography
            component='h1'
            variant='h1'
            sx={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              mt: 0,
              mb: 0.5
            }}
          >
            National estimates
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Estimated annual activity totals for England based on reporting library services.
          </Typography>
        </Box>

        {/* Period Selector */}
        <ButtonGroup size='small' variant='outlined'>
          {availablePeriods.map(p => (
            <Button
              key={p}
              variant={p === selectedPeriod ? 'contained' : 'outlined'}
              onClick={() => setSelectedPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Headline Cards */}
      <Typography
        component='h2'
        variant='h6'
        sx={{ fontWeight: 700, fontSize: '1.35rem', mb: 1.5 }}
      >
        National totals ({selectedPeriod})
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
          <Card elevation={0} variant='outlined' sx={{ height: '100%', minWidth: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction='row' spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <PeopleRoundedIcon color='primary' fontSize='small' />
                <Typography variant='subtitle2' color='text.secondary'>
                  Active Users
                </Typography>
              </Stack>
              <Typography
                variant='h4'
                title={usersEst ? formatNumber(usersEst.grossedTotal) : undefined}
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  fontSize: { xs: '1.75rem', sm: '1.6rem', md: '1.65rem', lg: '1.35rem', xl: '1.65rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {usersEst ? formatNumber(usersEst.grossedTotal) : '—'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                {usersEst ? `${usersEst.grossedRate.toFixed(1)}% of population` : ''}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {usersEst ? `${usersEst.reportingAuthorities}/${usersEst.totalAuthorities} authorities` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
          <Card elevation={0} variant='outlined' sx={{ height: '100%', minWidth: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction='row' spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <PlaceRoundedIcon color='primary' fontSize='small' />
                <Typography variant='subtitle2' color='text.secondary'>
                  Visits
                </Typography>
              </Stack>
              <Typography
                variant='h4'
                title={visitsEst ? formatNumber(visitsEst.grossedTotal) : undefined}
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  fontSize: { xs: '1.75rem', sm: '1.6rem', md: '1.65rem', lg: '1.35rem', xl: '1.65rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {visitsEst ? formatNumber(visitsEst.grossedTotal) : '—'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                {visitsEst ? `${visitsEst.grossedRate.toFixed(1)} per 1,000 residents` : ''}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {visitsEst ? `${visitsEst.reportingAuthorities}/${visitsEst.totalAuthorities} authorities` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
          <Card elevation={0} variant='outlined' sx={{ height: '100%', minWidth: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction='row' spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <MenuBookRoundedIcon color='primary' fontSize='small' />
                <Typography variant='subtitle2' color='text.secondary'>
                  Total Loans
                </Typography>
              </Stack>
              <Typography
                variant='h4'
                title={loansEst ? formatNumber(loansEst.grossedTotal) : undefined}
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  fontSize: { xs: '1.75rem', sm: '1.6rem', md: '1.65rem', lg: '1.35rem', xl: '1.65rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {loansEst ? formatNumber(loansEst.grossedTotal) : '—'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                {loansEst ? `${loansEst.grossedRate.toFixed(1)} per 1,000 residents` : ''}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {loansEst ? `${loansEst.reportingAuthorities}/${loansEst.totalAuthorities} authorities` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
          <Card elevation={0} variant='outlined' sx={{ height: '100%', minWidth: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction='row' spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <PeopleRoundedIcon color='primary' fontSize='small' />
                <Typography variant='subtitle2' color='text.secondary'>
                  Events
                </Typography>
              </Stack>
              <Typography
                variant='h4'
                title={eventsEst ? formatNumber(eventsEst.grossedTotal) : undefined}
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  fontSize: { xs: '1.75rem', sm: '1.6rem', md: '1.65rem', lg: '1.35rem', xl: '1.65rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {eventsEst ? formatNumber(eventsEst.grossedTotal) : '—'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                {attendanceEst ? `${formatNumber(attendanceEst.grossedTotal)} attendees` : ''}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {eventsEst ? `${eventsEst.reportingAuthorities}/${eventsEst.totalAuthorities} authorities` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section 1: National Estimates Table */}
      <Box sx={{ mb: 4 }}>
        <Typography
          component='h2'
          variant='h6'
          sx={{ fontWeight: 700, fontSize: '1.35rem', mt: 3, mb: 0.5 }}
        >
          Activity estimates
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
          Totals are estimates scaled to England's population.
        </Typography>

        <TableContainer component={Paper} elevation={0} variant='outlined' sx={{ boxShadow: 'none' }}>
          <Table size='small' aria-label='National estimates table' sx={{ boxShadow: 'none' }}>
            <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Measure</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Authorities
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Pop. coverage
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 600 }}>
                  Coverage
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Reported
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Estimated total
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Rate
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nationalEstimates.map(row => (
                <TableRow key={row.key} hover>
                  <TableCell>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                      {row.label}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {row.description}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {`${row.reportingAuthorities} / ${row.totalAuthorities}`}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {`${row.authorityCoveragePercent.toFixed(1)}%`}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {`${(row.reportingPopulation / 1e6).toFixed(1)}M`}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {`${row.populationCoveragePercent.toFixed(1)}%`}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    {row.meetsThreshold ? (
                      <Tooltip
                        title={row.reportingAuthorities >= row.minimumReportingAuthorities
                          ? `At least ${row.minimumReportingAuthorities} of ${row.totalAuthorities} authorities reported, meeting DCMS's published count benchmark.`
                          : `Reporting services cover ${row.populationCoveragePercent.toFixed(1)}% of England's population, meeting DCMS's population benchmark.`}
                        arrow
                      >
                        <Chip
                          size='small'
                          color='success'
                          variant='outlined'
                          icon={<CheckCircleRoundedIcon fontSize='small' />}
                          label='≥70% coverage'
                        />
                      </Tooltip>
                    ) : (
                      <Tooltip
                        title={`Fewer than ${row.minimumReportingAuthorities} of ${row.totalAuthorities} authorities reported this measure, and population coverage is below 70%. Treat the estimate with caution.`}
                        arrow
                      >
                        <Chip
                          size='small'
                          color='warning'
                          variant='outlined'
                          icon={<WarningAmberRoundedIcon fontSize='small' />}
                          label='Low coverage (<70%)'
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(row.sampleTotal)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      sample total
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography
                      variant='body2'
                      sx={{
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        color: row.meetsThreshold ? 'text.primary' : 'warning.dark'
                      }}
                    >
                      {formatNumber(row.grossedTotal)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {`×${row.multiplier.toFixed(2)}`}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {row.rateType === 'percent'
                        ? `${row.grossedRate.toFixed(1)}%`
                        : `${formatNumber(row.grossedRate, 1)}`}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {row.rateType === 'percent' ? 'of residents' : 'per 1,000 pop'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Section 2: Multi-Year Comparison */}
      <Box className='page-break' sx={{ mb: 4 }}>
        <Typography
          component='h2'
          variant='h6'
          sx={{ fontWeight: 700, fontSize: '1.35rem', mt: 3, mb: 0.5 }}
        >
          Multi-year comparison
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
          Estimated annual totals for England compared against the 2023/24 baseline.
        </Typography>

        <TableContainer component={Paper} elevation={0} variant='outlined' sx={{ boxShadow: 'none' }}>
          <Table size='small' aria-label='Multi-year comparison table' sx={{ boxShadow: 'none' }}>
            <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
              <TableRow>
                <TableCell rowSpan={2} sx={{ fontWeight: 600 }}>
                  Measure
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ fontWeight: 600 }}
                >
                  {`${formatPeriod(DCMS_BASELINE_PERIOD)} (baseline)`}
                </TableCell>
                {availablePeriods
                  .filter(p => p !== DCMS_BASELINE_PERIOD)
                  .map(p => (
                    <TableCell
                      key={p}
                      colSpan={3}
                      align='center'
                      sx={{
                        fontWeight: 600,
                        borderLeft: '1px solid rgba(224, 224, 224, 1)'
                      }}
                    >
                      {formatPeriod(p)}
                    </TableCell>
                  ))}
              </TableRow>
              <TableRow>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Estimate
                </TableCell>
                {availablePeriods
                  .filter(p => p !== DCMS_BASELINE_PERIOD)
                  .map(p => (
                    <React.Fragment key={`sub-${p}`}>
                      <TableCell
                        align='right'
                        sx={{
                          fontWeight: 600,
                          borderLeft: '1px solid rgba(224, 224, 224, 1)'
                        }}
                      >
                        Estimate
                      </TableCell>
                      <TableCell align='center' sx={{ fontWeight: 600 }}>
                        Estimate change
                      </TableCell>
                      <TableCell align='center' sx={{ fontWeight: 600 }}>
                        Same services
                      </TableCell>
                    </React.Fragment>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {multiYearTrends.map(row => (
                <TableRow key={row.metric.key} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {row.metric.label}
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(row.baselineGrossed)}
                    </Typography>
                  </TableCell>
                  {availablePeriods
                    .filter(p => p !== DCMS_BASELINE_PERIOD)
                    .map(p => (
                      <React.Fragment key={p}>
                        <TableCell
                          align='right'
                          sx={{ borderLeft: '1px solid rgba(224, 224, 224, 0.6)' }}
                        >
                          <Typography variant='body2' sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                            {formatNumber(row.periodData[p]?.grossedTotal)}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          {renderTrendChip(row.changeFromBaseline[p])}
                        </TableCell>
                        <TableCell align='center'>
                          {renderTrendChip(row.matchedCohortChange[p])}
                        </TableCell>
                      </React.Fragment>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Section 3: Regional Distribution Table */}
      <Box sx={{ mb: 4 }}>
        <Typography
          component='h2'
          variant='h6'
          sx={{ fontWeight: 700, fontSize: '1.35rem', mt: 3, mb: 0.5 }}
        >
          Regional estimates
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
          Estimated totals and rates by region.
        </Typography>

        <TableContainer component={Paper} elevation={0} variant='outlined' sx={{ boxShadow: 'none' }}>
          <Table size='small' aria-label='Regional estimates table' sx={{ boxShadow: 'none' }}>
            <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Region</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Authorities
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Population
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Visits
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Visits / 1k
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Loans
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Loans / 1k
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Users
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  Users (% pop)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {regionalEstimates.map(reg => {
                const v = reg.metrics.visits
                const l = reg.metrics.loans
                const u = reg.metrics.users
                return (
                  <TableRow key={reg.region} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{reg.region}</TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {reg.totalAuthorities}
                    </TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {`${(reg.totalPopulation / 1e6).toFixed(2)}M`}
                    </TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {formatNumber(v?.grossedTotal)}
                    </TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {v?.rate ? formatNumber(v.rate, 0) : '—'}
                    </TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {formatNumber(l?.grossedTotal)}
                    </TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {l?.rate ? formatNumber(l.rate, 0) : '—'}
                    </TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {formatNumber(u?.grossedTotal)}
                    </TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {u?.rate ? `${u.rate.toFixed(1)}%` : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Section 4: Notes */}
      <Box sx={{ mb: 4 }}>
        <Typography
          component='h2'
          variant='h6'
          sx={{ fontWeight: 700, fontSize: '1.35rem', mt: 3, mb: 1.5 }}
        >
          Notes
        </Typography>

        <Markdown
          components={{
            p: ({ children }) => (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ mb: 1.5, '&:last-of-type': { mb: 0 } }}
              >
                {children}
              </Typography>
            )
          }}
        >
          {nationalEstimatesNotesMd}
        </Markdown>
      </Box>

      <Stack
        direction='row'
        spacing={1}
        className='no-print'
        sx={{ justifyContent: 'flex-end', mt: 2 }}
      >
        <Button
          variant='text'
          size='small'
          startIcon={<DownloadRoundedIcon />}
          onClick={handleExportCsv}
        >
          Export CSV
        </Button>
        <Button
          variant='text'
          size='small'
          startIcon={<PrintRoundedIcon />}
          onClick={() => window.print()}
        >
          Print
        </Button>
      </Stack>
    </Box>
  )
}

export default NationalEstimates
