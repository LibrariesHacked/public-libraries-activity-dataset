import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { DataGrid } from '@mui/x-data-grid'

import { useApplicationState } from '../hooks/useApplicationState'

import * as attendanceModel from '../models/attendance'
import * as clickAndCollectModel from '../models/clickAndCollect'
import * as computersModel from '../models/computers'
import * as computerInventoryModel from '../models/computerInventory'
import * as errorsModel from '../models/errors'
import * as eventsModel from '../models/events'
import * as loansModel from '../models/loans'
import * as usersModel from '../models/users'
import * as visitsModel from '../models/visits'
import * as wifiModel from '../models/wifi'

import { formatPeriod, formatMonth } from '../helpers/periods'

const DATASET_DISPLAY_NAMES = {
  attendance: 'Attendance',
  click_and_collect: 'Click and collect',
  computer_inventory: 'Computer inventory',
  computers: 'Computers',
  computer_usage: 'Computers',
  events: 'Events',
  loans: 'Loans',
  users: 'Users',
  visits: 'Visits',
  wifi: 'Wi-Fi',
  wifi_sessions: 'Wi-Fi'
}

/**
 * Metadata configuration for each activity dataset corresponding to the original CSVs.
 */
const DATASET_CONFIGS = {
  loans: {
    id: 'loans',
    name: 'Loans',
    filename: 'loans.csv',
    endpoint: './loans.json',
    fetcher: loansModel.getLoans,
    description: 'Detailed monthly physical book, ebook, audiobook, and electronic audio loans by format and audience category.',
    dimensions: [
      { field: 'format', headerName: 'Format', width: 150 },
      { field: 'contentAgeGroup', headerName: 'Age group', width: 130 },
      { field: 'month', headerName: 'Month', width: 110 }
    ],
    metricName: 'Loans'
  },
  visits: {
    id: 'visits',
    name: 'Visits',
    filename: 'visits.csv',
    endpoint: './visits.json',
    fetcher: visitsModel.getVisits,
    description: 'Monthly library visits and outreach interactions by location type.',
    dimensions: [
      { field: 'location', headerName: 'Location', width: 160 },
      { field: 'month', headerName: 'Month', width: 110 }
    ],
    metricName: 'Visits'
  },
  events: {
    id: 'events',
    name: 'Events',
    filename: 'events.csv',
    endpoint: './events.json',
    fetcher: eventsModel.getEvents,
    description: 'Monthly library events, activities, and workshops organized by delivery format and audience group.',
    dimensions: [
      { field: 'type', headerName: 'Event type', width: 160 },
      { field: 'ageGroup', headerName: 'Age group', width: 130 },
      { field: 'month', headerName: 'Month', width: 110 }
    ],
    metricName: 'Events'
  },
  attendance: {
    id: 'attendance',
    name: 'Event attendance',
    filename: 'attendance.csv',
    endpoint: './attendance.json',
    fetcher: attendanceModel.getAttendance,
    description: 'Monthly attendee and participant counts for library events and activities across age categories.',
    dimensions: [
      { field: 'type', headerName: 'Event type', width: 160 },
      { field: 'ageGroup', headerName: 'Age group', width: 130 },
      { field: 'month', headerName: 'Month', width: 110 }
    ],
    metricName: 'Attendees'
  },
  clickAndCollect: {
    id: 'clickAndCollect',
    name: 'Click and collect',
    filename: 'click_and_collect.csv',
    endpoint: './click_and_collect.json',
    fetcher: clickAndCollectModel.getClickAndCollect,
    description: 'Monthly click-and-collect interactions. Each collection is one interaction, regardless of how many items it includes.',
    dimensions: [
      { field: 'month', headerName: 'Month', width: 130 }
    ],
    metricName: 'Interactions'
  },
  computers: {
    id: 'computers',
    name: 'Computer usage',
    filename: 'computers.csv',
    endpoint: './computers.json',
    fetcher: computersModel.getComputers,
    description: 'Monthly public computer terminal and connected device session usage hours across library services.',
    dimensions: [
      { field: 'month', headerName: 'Month', width: 130 }
    ],
    metricName: 'Hours'
  },
  computerInventory: {
    id: 'computerInventory',
    name: 'Computer and device inventory',
    filename: 'computer_inventory.csv',
    endpoint: './computer_inventory.json',
    fetcher: computerInventoryModel.getComputerInventory,
    description: 'Annual counts of public computers, devices available to borrow, and issues of loanable devices. These are year-end snapshots.',
    dimensions: [
      { field: 'measure', headerName: 'Measure', width: 230 },
      { field: 'period', headerName: 'Financial year', width: 140 }
    ],
    metricName: 'Reported count',
    simpleCount: true
  },
  wifi: {
    id: 'wifi',
    name: 'Wi-Fi sessions',
    filename: 'wifi.csv',
    endpoint: './wifi.json',
    fetcher: wifiModel.getWiFi,
    description: 'Monthly public library wireless Wi-Fi internet login and connection sessions.',
    dimensions: [
      { field: 'month', headerName: 'Month', width: 130 }
    ],
    metricName: 'Sessions'
  },
  users: {
    id: 'users',
    name: 'Active users',
    filename: 'users.csv',
    endpoint: './users.json',
    fetcher: usersModel.getUsers,
    description: 'Annual active borrowers within the last 12 months, categorized by audience age group and financial year.',
    dimensions: [
      { field: 'period', headerName: 'Financial year', width: 140 },
      { field: 'ageGroup', headerName: 'Age group', width: 140 }
    ],
    metricName: 'Borrowers'
  },
  errors: {
    id: 'errors',
    name: 'Errors and corrections',
    filename: 'errors.csv',
    endpoint: './errors.json',
    fetcher: errorsModel.getErrors,
    description: 'Audit register of known reporting anomalies, typos, and corrected figures across library returns.',
    isErrorRegister: true,
    dimensions: [
      { field: 'period', headerName: 'Period', width: 110 },
      { field: 'dataset', headerName: 'Dataset', width: 140 }
    ],
    metricName: 'Count'
  }
}

/**
 * Downloads an array of records as a formatted CSV file.
 *
 * @param {Array<object>} rows - Array of processed row objects.
 * @param {object} config - Active dataset configuration.
 * @param {string} filename - Target filename for download.
 */
function downloadCsv (rows, config, filename) {
  if (!rows || rows.length === 0) return

  const headerKeys = config.id === 'errors'
    ? [
        { key: 'period', label: 'Period' },
        { key: 'dataset', label: 'Dataset' },
        { key: 'serviceCode', label: 'Authority code' },
        { key: 'serviceName', label: 'Authority name' },
        { key: 'scope', label: 'Scope' },
        { key: 'match', label: 'Match' },
        { key: 'status', label: 'Status' },
        { key: 'estimatedCount', label: 'Estimated count' },
        { key: 'notes', label: 'Notes' }
      ]
    : [
        { key: 'serviceCode', label: 'Service code' },
        { key: 'serviceName', label: 'Service name' },
        ...config.dimensions.map(d => ({ key: d.field, label: d.headerName })),
        ...(config.simpleCount
          ? [{ key: 'originalCount', label: config.metricName }]
          : [
              { key: 'originalCount', label: `Original ${config.metricName.toLowerCase()}` },
              { key: 'estimatedCount', label: `Corrected ${config.metricName.toLowerCase()}` },
              { key: 'status', label: 'Data quality status' },
              { key: 'notes', label: 'Data quality notes' }
            ])
      ]

  const headerLine = headerKeys.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',')
  const bodyLines = rows.map(row =>
    headerKeys.map(h => {
      const val = h.key === 'notes' ? (row.issueDetails || row[h.key]) : row[h.key]
      if (val == null) return '""'
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(',')
  )

  const csvContent = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Reusable DataGrid component displaying a full activity CSV dataset,
 * featuring interactive search, quality status filters, service dropdown,
 * side-by-side original/corrected figures, highlighting, and single CSV download.
 *
 * @param {object} props - Component properties.
 * @param {string} props.datasetId - Key identifier for the dataset (e.g. 'loans', 'computers', 'wifi', 'errors').
 * @param {number} [props.height=540] - Desired height of the data grid in pixels.
 * @returns {JSX.Element} The rendered dataset data grid view.
 */
export const DatasetDataGrid = ({ datasetId, height = 540 }) => {
  const [{ serviceLookup, [datasetId]: stateDataset }] = useApplicationState()

  const config = DATASET_CONFIGS[datasetId] || DATASET_CONFIGS.loans

  const [localRecords, setLocalRecords] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedServiceCode, setSelectedServiceCode] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')

  // Load records from context or fetch via model
  useEffect(() => {
    let isMounted = true

    if (stateDataset && stateDataset.length > 0) {
      setLocalRecords(stateDataset)
      return
    }

    async function loadData () {
      setLoading(true)
      setError(null)
      try {
        const data = await config.fetcher()
        if (isMounted) {
          setLocalRecords(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(`Failed to load dataset: ${err.message}`)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [config, stateDataset])

  // Transform raw records into DataGrid rows with resolved authority names
  const rawRows = useMemo(() => {
    const records = localRecords || []
    if (config.id === 'errors') {
      return records.map((record, index) => {
        const code = record['Authority code'] || record.serviceCode
        const sLookup = serviceLookup?.[code]
        const serviceName = record['Authority name'] || sLookup?.niceName || sLookup?.name || code

        return {
          id: `error_${record.Period || record.period}_${code}_${index}`,
          serviceCode: code,
          serviceName,
          dataset: record.Dataset || record.dataset,
          period: record.Period || record.period,
          scope: record.Scope || record.scope,
          match: record.Match || record.match || '—',
          status: record.Status || record.status,
          estimatedCount: record['Estimated count'] || record.estimatedCount || '—',
          notes: record.Notes || record.notes
        }
      })
    }

    return records.map((record, index) => {
      const sLookup = serviceLookup?.[record.serviceCode]
      const serviceName = sLookup?.niceName || sLookup?.name || record.serviceCode

      const row = {
        id: `${record.serviceCode}_${record.month || record.period || index}_${index}`,
        serviceCode: record.serviceCode,
        serviceName,
        originalCount: record.originalCount,
        estimatedCount: record.estimatedCount,
        status: record.status || null,
        notes: record.reviewIssueId == null
          ? record.notes || null
          : `Review issue #${record.reviewIssueId + 1}`,
        issueDetails: record.issueDetails || null,
        reviewIssueId: record.reviewIssueId
      }

      // Copy dimension fields
      config.dimensions.forEach(dim => {
        row[dim.field] = record[dim.field] || '—'
      })

      return row
    })
  }, [localRecords, config, serviceLookup])

  // Compute dataset statistics
  const stats = useMemo(() => {
    let excludedCount = 0
    let replacedCount = 0
    let suspiciousCount = 0
    let suspiciousRowCount = 0
    let standardisedCount = 0
    const suspiciousIssueKeys = new Set()
    const uniqueServices = new Set()
    const uniqueMonths = new Set()

    rawRows.forEach(r => {
      uniqueServices.add(r.serviceCode)
      if (r.month && r.month !== '—') uniqueMonths.add(r.month)
      if (r.period && r.period !== '—') uniqueMonths.add(r.period)

      if (r.status === 'excluded') excludedCount += 1
      else if (r.status === 'replaced') replacedCount += 1
      else if (r.status === 'suspicious') {
        suspiciousRowCount += 1
        if (config.id === 'loans') {
          suspiciousIssueKeys.add(r.reviewIssueId == null
            ? JSON.stringify([r.serviceCode, r.format, r.period, r.notes || ''])
            : r.reviewIssueId)
        } else {
          suspiciousCount += 1
        }
      }
      else if (r.status === 'standardised') standardisedCount += 1
    })

    const anomaliesCount = excludedCount + replacedCount + suspiciousRowCount + standardisedCount
    const reviewIssueCount = config.id === 'loans' ? suspiciousIssueKeys.size : suspiciousCount

    return {
      totalRows: rawRows.length,
      excludedCount,
      replacedCount,
      suspiciousCount: reviewIssueCount,
      suspiciousRowCount,
      standardisedCount,
      anomaliesCount,
      cleanCount: rawRows.length - anomaliesCount,
      servicesCount: uniqueServices.size,
      uniqueMonths: [...uniqueMonths].sort()
    }
  }, [rawRows, config])

  // Available service options for filter dropdown
  const serviceOptions = useMemo(() => {
    const list = []
    const codes = new Set(rawRows.map(r => r.serviceCode))
    codes.forEach(code => {
      const s = serviceLookup?.[code]
      list.push({
        code,
        name: s?.niceName || s?.name || code
      })
    })
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [rawRows, serviceLookup])

  // Filter rows based on search, status, service, and period/month
  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return rawRows.filter(row => {
      // 1. Status filter
      if (statusFilter === 'anomalies' && !row.status) return false
      if (statusFilter === 'excluded' && row.status !== 'excluded') return false
      if (statusFilter === 'replaced' && row.status !== 'replaced') return false
      if (statusFilter === 'suspicious' && row.status !== 'suspicious') return false
      if (statusFilter === 'standardised' && row.status !== 'standardised') return false
      if (statusFilter === 'clean' && row.status) return false

      // 2. Service filter
      if (selectedServiceCode !== 'all' && row.serviceCode !== selectedServiceCode) {
        return false
      }

      // 3. Month/Period filter
      if (selectedMonth !== 'all') {
        const rowTime = row.month || row.period
        if (rowTime !== selectedMonth) return false
      }

      // 4. Text search
      if (query) {
        const matchesCode = row.serviceCode.toLowerCase().includes(query)
        const matchesName = row.serviceName.toLowerCase().includes(query)
        const matchesNotes = row.notes ? row.notes.toLowerCase().includes(query) : false
        const matchesDimensions = config.dimensions.some(d => {
          const val = row[d.field]
          return val ? String(val).toLowerCase().includes(query) : false
        })
        const matchesCounts =
          (row.originalCount != null && String(row.originalCount).includes(query)) ||
          (row.estimatedCount != null && String(row.estimatedCount).includes(query))
        const matchesExtras =
          (row.dataset && row.dataset.toLowerCase().includes(query)) ||
          (row.scope && row.scope.toLowerCase().includes(query)) ||
          (row.match && row.match.toLowerCase().includes(query))

        if (!matchesCode && !matchesName && !matchesNotes && !matchesDimensions && !matchesCounts && !matchesExtras) {
          return false
        }
      }

      return true
    })
  }, [rawRows, searchQuery, statusFilter, selectedServiceCode, selectedMonth, config])

  // DataGrid Column definitions
  const columns = useMemo(() => {
    if (config.id === 'errors') {
      return [
        {
          field: 'period',
          headerName: 'Period',
          width: 100,
          renderCell: params => (
            <Typography variant='body2' component='span' sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatPeriod(params.value) || params.value}
            </Typography>
          )
        },
        {
          field: 'dataset',
          headerName: 'Dataset',
          width: 130,
          renderCell: params => (
            <Chip
              label={DATASET_DISPLAY_NAMES[params.value] || params.value}
              size='small'
              variant='outlined'
              sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
            />
          )
        },
        {
          field: 'serviceName',
          headerName: 'Library service',
          minWidth: 180,
          flex: 1,
          renderCell: params => (
            <Typography variant='body2' component='span' sx={{ fontWeight: 500 }}>
              {params.value}
            </Typography>
          )
        },
        {
          field: 'status',
          headerName: 'Status',
          width: 130,
          headerAlign: 'center',
          align: 'center',
          renderCell: params => {
            const status = params.value
            if (status === 'excluded') {
              return <Chip label='Excluded' color='error' size='small' variant='filled' sx={{ fontWeight: 600, height: 24 }} />
            }
            if (status === 'replaced') {
              return <Chip label='Corrected' color='warning' size='small' variant='filled' sx={{ fontWeight: 600, height: 24 }} />
            }
            if (status === 'suspicious') {
              return <Chip label='Review' color='warning' size='small' variant='outlined' sx={{ fontWeight: 600, height: 24 }} />
            }
            if (status === 'standardised') {
              return <Chip label='Standardised' color='info' size='small' variant='filled' sx={{ fontWeight: 600, height: 24 }} />
            }
            return <Chip label='Valid' size='small' variant='outlined' sx={{ opacity: 0.6, height: 24 }} />
          }
        },
        {
          field: 'estimatedCount',
          headerName: 'Corrected figure',
          width: 140,
          headerAlign: 'right',
          align: 'right',
          renderCell: params => {
            const val = params.value
            if (!val || val === '—') return <Typography variant='body2' component='span' color='text.disabled'>—</Typography>
            const num = Number(val)
            return (
              <Typography variant='body2' component='span' sx={{ fontWeight: 600, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                {!isNaN(num) && String(num) === String(val) ? num.toLocaleString('en-GB') : val}
              </Typography>
            )
          }
        },
        {
          field: 'notes',
          headerName: 'Notes',
          minWidth: 320,
          flex: 2,
          renderCell: params => (
            <Tooltip title={params.value || ''} arrow placement='top-start'>
              <Typography
                variant='body2'
                component='span'
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  width: '100%'
                }}
              >
                {params.value}
              </Typography>
            </Tooltip>
          )
        }
      ]
    }

    const baseCols = [
      {
        field: 'serviceCode',
        headerName: 'Service code',
        width: 120,
        renderCell: params => (
          <Typography variant='body2' component='span' sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {params.value}
          </Typography>
        )
      },
      {
        field: 'serviceName',
        headerName: 'Library service',
        minWidth: 180,
        flex: 1,
        renderCell: params => (
          <Typography variant='body2' component='span' sx={{ fontWeight: 500 }}>
            {params.value || params.row.serviceCode}
          </Typography>
        )
      }
    ]

    const dimCols = config.dimensions.map(d => ({
      field: d.field,
      headerName: d.headerName,
      width: d.width || 130,
      renderCell: params => {
        let displayVal = params.value
        if (d.field === 'month' && displayVal && /^\d{4}-\d{2}$/.test(displayVal)) {
          displayVal = formatMonth(displayVal)
        } else if (d.field === 'period' && displayVal && /^\d{4}\/\d{4}$/.test(displayVal)) {
          displayVal = formatPeriod(displayVal)
        }
        return (
          <Typography variant='body2' component='span' sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {displayVal}
          </Typography>
        )
      }
    }))

    const countCols = config.simpleCount
      ? [{
          field: 'originalCount',
          headerName: config.metricName,
          width: 155,
          type: 'number',
          headerAlign: 'right',
          align: 'right',
          renderCell: params => (
            <Typography variant='body2' component='span' sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {Number(params.value || 0).toLocaleString('en-GB')}
            </Typography>
          )
        }]
      : [
      {
        field: 'originalCount',
        headerName: `Original (${config.metricName})`,
        width: 155,
        type: 'number',
        headerAlign: 'right',
        align: 'right',
        renderCell: params => {
          const val = params.value
          const isExcluded = params.row.status === 'excluded'
          const isReplaced = params.row.status === 'replaced'
          if (val == null) return <Typography variant='body2' component='span' color='text.disabled'>—</Typography>
          return (
            <Typography
              variant='body2'
              component='span'
              sx={{
                fontVariantNumeric: 'tabular-nums',
                textDecoration: isExcluded || isReplaced ? 'line-through' : 'none',
                color: isExcluded ? 'error.main' : isReplaced ? 'text.secondary' : 'text.primary',
                fontWeight: isExcluded ? 600 : 400
              }}
            >
              {Number(val).toLocaleString('en-GB')}
            </Typography>
          )
        }
      },
      {
        field: 'estimatedCount',
        headerName: `Corrected (${config.metricName})`,
        width: 155,
        type: 'number',
        headerAlign: 'right',
        align: 'right',
        renderCell: params => {
          const val = params.value
          const isExcluded = params.row.status === 'excluded'
          const isReplaced = params.row.status === 'replaced'
          if (isExcluded) {
            return (
              <Chip
                label='Excluded'
                size='small'
                color='error'
                variant='filled'
                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
              />
            )
          }
          if (val == null) return <Typography variant='body2' component='span' color='text.disabled'>—</Typography>
          return (
            <Typography
              variant='body2'
              component='span'
              sx={{
                fontVariantNumeric: 'tabular-nums',
                fontWeight: isReplaced ? 600 : 400,
                color: 'text.primary'
              }}
            >
              {Number(val).toLocaleString('en-GB')}
            </Typography>
          )
        }
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: params => {
          const status = params.value
          if (status === 'excluded') {
            return (
              <Chip
                label='Excluded'
                color='error'
                size='small'
                variant='filled'
                sx={{ fontWeight: 600, height: 24 }}
              />
            )
          }
          if (status === 'replaced') {
            return (
              <Chip
                label='Corrected'
                color='warning'
                size='small'
                variant='filled'
                sx={{ fontWeight: 600, height: 24 }}
              />
            )
          }
          if (status === 'suspicious') {
            return (
              <Chip
                label='Review'
                color='warning'
                size='small'
                variant='outlined'
                sx={{ fontWeight: 600, height: 24 }}
              />
            )
          }
          if (status === 'standardised') {
            return (
              <Chip
                label='Standardised'
                color='info'
                size='small'
                variant='filled'
                sx={{ fontWeight: 600, height: 24 }}
              />
            )
          }
          return (
            <Chip
              label='Valid'
              size='small'
              variant='outlined'
              sx={{ opacity: 0.6, height: 24 }}
            />
          )
        }
      },
      {
        field: 'notes',
        headerName: 'Notes',
        minWidth: 280,
        flex: 2,
        renderCell: params => {
          if (!params.value) return <Typography variant='body2' component='span' color='text.disabled'>—</Typography>
          return (
            <Tooltip title={params.row.issueDetails || params.value} arrow placement='top-start'>
              <Typography
                variant='body2'
                component='span'
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  width: '100%',
                  color: 'text.primary'
                }}
              >
                {params.value}
              </Typography>
            </Tooltip>
          )
        }
      }
    ]

    return [...baseCols, ...dimCols, ...countCols]
  }, [config])

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      {/* Dataset Summary & Download Bar */}
      <Card elevation={0} variant='outlined' sx={{ mb: 1.5, boxShadow: 'none' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' }
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction='row' spacing={1} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                  {config.filename}
                </Typography>
                <Chip
                  label={`${stats.totalRows.toLocaleString()} rows`}
                  size='small'
                  variant='outlined'
                />
                <Chip
                  label={`${stats.servicesCount} services`}
                  size='small'
                  variant='outlined'
                />
              </Stack>
              <Typography variant='body2' color='text.secondary'>
                {config.description}
              </Typography>
            </Box>

            {/* Single Download button */}
            <Button
              variant='contained'
              color='primary'
              size='small'
              startIcon={<DownloadRoundedIcon />}
              onClick={() =>
                downloadCsv(
                  filteredRows,
                  config,
                  filteredRows.length !== rawRows.length
                    ? `${config.id}_filtered.csv`
                    : config.filename
                )
              }
              disabled={filteredRows.length === 0}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Download CSV ({filteredRows.length.toLocaleString()})
            </Button>
          </Stack>

          {/* Quick Quality Legend & Filters */}
          <Stack
            direction='row'
            spacing={1.5}
            useFlexGap
            flexWrap='wrap'
            sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', alignItems: 'center' }}
          >

            {stats.excludedCount > 0 && (
              <Chip
                label={`${stats.excludedCount} Excluded`}
                size='small'
                color='error'
                variant={statusFilter === 'excluded' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter(statusFilter === 'excluded' ? 'all' : 'excluded')}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            )}

            {stats.replacedCount > 0 && (
              <Chip
                label={`${stats.replacedCount} Corrected`}
                size='small'
                color='warning'
                variant={statusFilter === 'replaced' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter(statusFilter === 'replaced' ? 'all' : 'replaced')}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            )}

            {stats.standardisedCount > 0 && (
              <Chip
                label={`${stats.standardisedCount} Standardised`}
                size='small'
                color='info'
                variant={statusFilter === 'standardised' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter(statusFilter === 'standardised' ? 'all' : 'standardised')}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            )}

            {stats.suspiciousCount > 0 && (
              <Chip
                label={`${stats.suspiciousCount} Review patterns`}
                size='small'
                color='warning'
                variant={statusFilter === 'suspicious' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter(statusFilter === 'suspicious' ? 'all' : 'suspicious')}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            )}

            {stats.cleanCount > 0 && config.id !== 'errors' && (
              <Chip
                label={`${stats.cleanCount.toLocaleString()} Valid (clean)`}
                size='small'
                variant={statusFilter === 'clean' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter(statusFilter === 'clean' ? 'all' : 'clean')}
                sx={{ cursor: 'pointer' }}
              />
            )}

            {statusFilter !== 'all' && (
              <Button
                size='small'
                variant='text'
                color='secondary'
                onClick={() => setStatusFilter('all')}
                startIcon={<ClearRoundedIcon fontSize='small' />}
                sx={{ ml: 'auto' }}
              >
                Reset filter
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <Paper elevation={0} variant='outlined' sx={{ p: 1.5, mb: 1.5, boxShadow: 'none' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
        >
          {/* Global search */}
          <TextField
            size='small'
            placeholder='Search...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ flex: 1.5, minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchRoundedIcon fontSize='small' color='action' />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => setSearchQuery('')} aria-label='Clear search'>
                    <ClearRoundedIcon fontSize='small' />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />

          {/* Service Dropdown Filter */}
          <FormControl size='small' sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel id={`service-filter-label-${config.id}`}>Library service</InputLabel>
            <Select
              labelId={`service-filter-label-${config.id}`}
              value={selectedServiceCode}
              label='Library service'
              onChange={e => setSelectedServiceCode(e.target.value)}
            >
              <MenuItem value='all'>All library services ({serviceOptions.length})</MenuItem>
              {serviceOptions.map(s => (
                <MenuItem key={s.code} value={s.code}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Dropdown Filter */}
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel id={`status-filter-label-${config.id}`}>Quality status</InputLabel>
            <Select
              labelId={`status-filter-label-${config.id}`}
              value={statusFilter}
              label='Quality status'
              onChange={e => setStatusFilter(e.target.value)}
            >
              <MenuItem value='all'>All records</MenuItem>
              {stats.anomaliesCount > 0 && <MenuItem value='anomalies'>All anomalies ({stats.anomaliesCount})</MenuItem>}
              {stats.excludedCount > 0 && <MenuItem value='excluded'>Excluded errors ({stats.excludedCount})</MenuItem>}
              {stats.replacedCount > 0 && <MenuItem value='replaced'>Corrected figures ({stats.replacedCount})</MenuItem>}
              {stats.standardisedCount > 0 && <MenuItem value='standardised'>Standardised ({stats.standardisedCount})</MenuItem>}
              {stats.suspiciousCount > 0 && (
                <MenuItem value='suspicious'>Review rows ({stats.suspiciousRowCount})</MenuItem>
              )}
              {stats.cleanCount > 0 && config.id !== 'errors' && <MenuItem value='clean'>Clean data only</MenuItem>}
            </Select>
          </FormControl>

          {/* Month / Period Filter if available */}
          {stats.uniqueMonths.length > 0 && (
            <FormControl size='small' sx={{ minWidth: 140 }}>
              <InputLabel id={`month-filter-label-${config.id}`}>
                {config.id === 'users' || config.id === 'errors' ? 'Period' : 'Month'}
              </InputLabel>
              <Select
                labelId={`month-filter-label-${config.id}`}
                value={selectedMonth}
                label={config.id === 'users' || config.id === 'errors' ? 'Period' : 'Month'}
                onChange={e => setSelectedMonth(e.target.value)}
              >
                <MenuItem value='all'>All {config.id === 'users' || config.id === 'errors' ? 'periods' : 'months'}</MenuItem>
                {stats.uniqueMonths.map(m => {
                  let label = m
                  if (/^\d{4}-\d{2}$/.test(m)) {
                    label = formatMonth(m)
                  } else if (/^\d{4}\/\d{4}$/.test(m)) {
                    label = formatPeriod(m)
                  }
                  return (
                    <MenuItem key={m} value={m}>
                      {label}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          )}

          {/* Clear filters button */}
          {(searchQuery || statusFilter !== 'all' || selectedServiceCode !== 'all' || selectedMonth !== 'all') && (
            <Button
              size='small'
              variant='outlined'
              color='secondary'
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setSelectedServiceCode('all')
                setSelectedMonth('all')
              }}
              startIcon={<ClearRoundedIcon fontSize='small' />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Clear filters
            </Button>
          )}
        </Stack>
      </Paper>

      {/* DataGrid Container */}
      <Paper
        elevation={0}
        variant='outlined'
        sx={{
          height,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none'
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              gap: 2
            }}
          >
            <CircularProgress color='primary' />
            <Typography variant='body2' color='text.secondary'>
              Loading {config.name} dataset...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color='error.main' gutterBottom sx={{ fontWeight: 600 }}>
              {error}
            </Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={row => row.id}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 50, page: 0 }
              }
            }}
            pageSizeOptions={[25, 50, 100, 250, 500]}
            pagination
            disableRowSelectionOnClick
            rowHeight={44}
            headerHeight={48}
            getRowClassName={params => {
              if (params.row.status === 'excluded') return 'row-quality-excluded'
              if (params.row.status === 'replaced') return 'row-quality-replaced'
              if (params.row.status === 'suspicious') return 'row-quality-suspicious'
              return ''
            }}
            sx={{
              border: 'none',
              boxShadow: 'none',
              '&, & .MuiDataGrid-main, & .MuiDataGrid-virtualScroller, & .MuiDataGrid-footerContainer': {
                boxShadow: 'none !important'
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid',
                borderColor: 'divider',
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: 'none !important'
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                fontSize: '0.875rem'
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid',
                borderColor: 'rgba(224, 224, 224, 0.6)'
              },
              '& .row-quality-excluded': {
                backgroundColor: 'rgba(211, 47, 47, 0.08) !important',
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.16) !important'
                }
              },
              '& .row-quality-replaced': {
                backgroundColor: 'rgba(237, 108, 2, 0.08) !important',
                '&:hover': {
                  backgroundColor: 'rgba(237, 108, 2, 0.16) !important'
                }
              },
              '& .row-quality-suspicious': {
                backgroundColor: 'rgba(255, 179, 0, 0.08) !important',
                '&:hover': {
                  backgroundColor: 'rgba(255, 179, 0, 0.16) !important'
                }
              }
            }}
          />
        )}
      </Paper>
    </Box>
  )
}

DatasetDataGrid.propTypes = {
  datasetId: PropTypes.string.isRequired,
  height: PropTypes.number
}

export default DatasetDataGrid
