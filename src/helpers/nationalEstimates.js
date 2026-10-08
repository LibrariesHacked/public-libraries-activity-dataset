/**
 * Standard coverage threshold percentage (70% of authorities or population)
 * used to indicate robust sample size for national estimates.
 */
export const DCMS_THRESHOLD_PERCENT = 70.0

const getMinimumReportingAuthorities = totalAuthorities =>
  totalAuthorities > 0
    ? Math.max(1, Math.floor(totalAuthorities * DCMS_THRESHOLD_PERCENT / 100))
    : 0

/**
 * Reference URL for the DCMS secondary analysis baseline report.
 */
export const DCMS_PUBLICATION_URL =
  'https://www.gov.uk/government/publications/secondary-data-analysis-of-arts-council-englands-english-public-libraries-activity-dataset-2324'

/**
 * Baseline period used for multi-year comparisons.
 */
export const DCMS_BASELINE_PERIOD = '2023/2024'

/**
 * Core activity metrics included in national summary calculations.
 */
export const CORE_METRICS = [
  {
    key: 'users',
    label: 'Active library users',
    shortLabel: 'Users',
    description: 'Borrowers active in the past 12 months',
    unit: 'users',
    rateType: 'percent',
    rateLabel: '% of population',
    rateUnit: '%'
  },
  {
    key: 'visits',
    label: 'Visits',
    shortLabel: 'Visits',
    description: 'Library-location visits and mobile-library or home-delivery interactions',
    unit: 'visits',
    rateType: 'per1000',
    rateLabel: 'Visits per 1,000 residents',
    rateUnit: 'per 1,000'
  },
  {
    key: 'loans',
    label: 'Total loans',
    shortLabel: 'Loans',
    description: 'Physical book loans and digital resource issues',
    unit: 'loans',
    rateType: 'per1000',
    rateLabel: 'Loans per 1,000 residents',
    rateUnit: 'per 1,000'
  },
  {
    key: 'events',
    label: 'Events',
    shortLabel: 'Events',
    description: 'In-person and online events organised by library services',
    unit: 'events',
    rateType: 'per1000',
    rateLabel: 'Events per 1,000 residents',
    rateUnit: 'per 1,000'
  },
  {
    key: 'attendance',
    label: 'Event attendees',
    shortLabel: 'Attendees',
    description: 'Participants attending library events and activities',
    unit: 'attendees',
    rateType: 'per1000',
    rateLabel: 'Attendees per 1,000 residents',
    rateUnit: 'per 1,000'
  },
  {
    key: 'computerHours',
    label: 'Public computer hours',
    shortLabel: 'Computer hours',
    description: 'Hours of logged-in public computer terminal use',
    unit: 'hours',
    rateType: 'per1000',
    rateLabel: 'Hours per 1,000 residents',
    rateUnit: 'per 1,000'
  },
  {
    key: 'wifiSessions',
    label: 'Wi-Fi sessions',
    shortLabel: 'Wi-Fi sessions',
    description: 'Public Wi-Fi connections in libraries (low national reporting)',
    unit: 'sessions',
    rateType: 'per1000',
    rateLabel: 'Sessions per 1,000 residents',
    rateUnit: 'per 1,000'
  }
]

export const POLICY_METRICS = CORE_METRICS

const getNationalMetricValue = (record, metricKey) => {
  const status = record[`${metricKey}Status`]
  if (status === 'replaced' || status === 'excluded') return null

  const original = record[`${metricKey}Original`]
  if (original != null) return original

  return record[metricKey] ?? null
}

/**
 * Calculates headline national estimates for a single financial year period
 * using population-weighting grossing methodology.
 *
 * @param {Array<import('../models/service').Service>} serviceRecords - All annual service records.
 * @param {string} period - Financial year period to analyze (e.g. '2023/2024').
 * @returns {Array<Object>} Array of calculated metric estimate summaries.
 */
export const calculateNationalEstimates = (serviceRecords, period) => {
  if (!serviceRecords || !period) return []

  const periodRecords = serviceRecords.filter(r => r.period === period)
  const totalAuthorities = periodRecords.length
  const totalEnglandPopulation = periodRecords.reduce(
    (acc, r) => acc + (r.totalPopulation || 0),
    0
  )

  return CORE_METRICS.map(metric => {
    let reportingAuthorities = 0
    let reportingPopulation = 0
    let sampleTotal = 0

    periodRecords.forEach(r => {
      const val = getNationalMetricValue(r, metric.key)
      if (val != null && Number.isFinite(val)) {
        reportingAuthorities++
        reportingPopulation += r.totalPopulation || 0
        sampleTotal += val
      }
    })

    const minimumReportingAuthorities = getMinimumReportingAuthorities(totalAuthorities)
    const authorityCoveragePercent =
      totalAuthorities > 0 ? (reportingAuthorities / totalAuthorities) * 100 : 0

    const populationCoveragePercent =
      totalEnglandPopulation > 0
        ? (reportingPopulation / totalEnglandPopulation) * 100
        : 0

    const meetsThreshold =
      reportingAuthorities >= minimumReportingAuthorities ||
      populationCoveragePercent >= DCMS_THRESHOLD_PERCENT

    const grossedTotal =
      reportingPopulation > 0
        ? Math.round((sampleTotal / reportingPopulation) * totalEnglandPopulation)
        : 0

    const multiplier =
      reportingPopulation > 0 ? totalEnglandPopulation / reportingPopulation : 1

    let sampleRate = 0
    let grossedRate = 0
    if (reportingPopulation > 0) {
      if (metric.rateType === 'percent') {
        sampleRate = (sampleTotal / reportingPopulation) * 100
        grossedRate = (grossedTotal / totalEnglandPopulation) * 100
      } else {
        sampleRate = (sampleTotal / reportingPopulation) * 1000
        grossedRate = (grossedTotal / totalEnglandPopulation) * 1000
      }
    }

    return {
      ...metric,
      period,
      reportingAuthorities,
      totalAuthorities,
      minimumReportingAuthorities,
      authorityCoveragePercent,
      reportingPopulation,
      totalPopulation: totalEnglandPopulation,
      populationCoveragePercent,
      meetsThreshold,
      sampleTotal,
      grossedTotal,
      multiplier,
      sampleRate,
      grossedRate
    }
  })
}

/**
 * Calculates multi-year trend trajectories across available financial years,
 * comparing grossed estimates and matched-cohort figures against the 2023/2024 DCMS baseline.
 *
 * @param {Array<import('../models/service').Service>} serviceRecords - All annual service records.
 * @param {string[]} periods - Sorted list of financial year periods.
 * @returns {Array<Object>} Multi-year trend summaries for each metric.
 */
export const calculateMultiYearTrends = (serviceRecords, periods) => {
  if (!serviceRecords || !periods || periods.length === 0) return []

  const sortedPeriods = [...periods].sort()
  const baselinePeriod = sortedPeriods.includes(DCMS_BASELINE_PERIOD)
    ? DCMS_BASELINE_PERIOD
    : sortedPeriods[0]

  const estimatesByPeriod = {}
  sortedPeriods.forEach(p => {
    estimatesByPeriod[p] = calculateNationalEstimates(serviceRecords, p)
  })

  return CORE_METRICS.map(metric => {
    const periodData = {}
    const changeFromBaseline = {}
    const yearOnYearChange = {}
    const matchedCohortChange = {}

    const baselineMetricEst = estimatesByPeriod[baselinePeriod]?.find(
      e => e.key === metric.key
    )
    const baselineGrossed = baselineMetricEst ? baselineMetricEst.grossedTotal : 0

    sortedPeriods.forEach((p, idx) => {
      const metricEst = estimatesByPeriod[p]?.find(e => e.key === metric.key)
      periodData[p] = metricEst

      if (metricEst && baselineGrossed > 0) {
        changeFromBaseline[p] =
          ((metricEst.grossedTotal - baselineGrossed) / baselineGrossed) * 100
      } else {
        changeFromBaseline[p] = null
      }

      if (idx > 0) {
        const prevP = sortedPeriods[idx - 1]
        const prevEst = estimatesByPeriod[prevP]?.find(e => e.key === metric.key)
        if (metricEst && prevEst && prevEst.grossedTotal > 0) {
          yearOnYearChange[p] =
            ((metricEst.grossedTotal - prevEst.grossedTotal) / prevEst.grossedTotal) *
            100
        } else {
          yearOnYearChange[p] = null
        }
      } else {
        yearOnYearChange[p] = null
      }

      if (p !== baselinePeriod) {
        matchedCohortChange[p] = calculateMatchedCohortChange(
          serviceRecords,
          metric.key,
          baselinePeriod,
          p
        )
      } else {
        matchedCohortChange[p] = 0
      }
    })

    return {
      metric,
      baselinePeriod,
      baselineGrossed,
      periodData,
      changeFromBaseline,
      yearOnYearChange,
      matchedCohortChange
    }
  })
}

const calculateMatchedCohortChange = (
  serviceRecords,
  metricKey,
  baselinePeriod,
  comparisonPeriod
) => {
  const baselineValues = new Map()
  const comparisonValues = new Map()

  serviceRecords.forEach(record => {
    if (record.period !== baselinePeriod && record.period !== comparisonPeriod) return
    const value = getNationalMetricValue(record, metricKey)
    if (value == null || !Number.isFinite(value)) return
    const values = record.period === baselinePeriod ? baselineValues : comparisonValues
    values.set(record.code, value)
  })

  let baselineTotal = 0
  let comparisonTotal = 0
  baselineValues.forEach((value, code) => {
    if (!comparisonValues.has(code)) return
    baselineTotal += value
    comparisonTotal += comparisonValues.get(code)
  })

  if (baselineTotal === 0) return null
  return ((comparisonTotal - baselineTotal) / baselineTotal) * 100
}

/**
 * Calculates regional estimates across the 9 official English regions for a given period.
 *
 * @param {Array<import('../models/service').Service>} serviceRecords - All annual service records.
 * @param {string} period - Financial year period.
 * @returns {Array<Object>} Regional estimate breakdown by region.
 */
export const calculateRegionalEstimates = (serviceRecords, period) => {
  if (!serviceRecords || !period) return []

  const periodRecords = serviceRecords.filter(r => r.period === period)

  const regionMap = new Map()

  periodRecords.forEach(record => {
    const regionName = record.region || 'Other'
    if (!regionMap.has(regionName)) {
      regionMap.set(regionName, [])
    }
    regionMap.get(regionName).push(record)
  })

  const sortedRegions = [...regionMap.keys()].sort()

  return sortedRegions.map(regionName => {
    const regionRecords = regionMap.get(regionName)
    const totalAuthorities = regionRecords.length
    const totalPopulation = regionRecords.reduce(
      (acc, r) => acc + (r.totalPopulation || 0),
      0
    )

    const metricSummaries = {}

    CORE_METRICS.forEach(metric => {
      let reportingAuthorities = 0
      let reportingPopulation = 0
      let sampleTotal = 0

      regionRecords.forEach(r => {
        const val = getNationalMetricValue(r, metric.key)
        if (val != null && Number.isFinite(val)) {
          reportingAuthorities++
          reportingPopulation += r.totalPopulation || 0
          sampleTotal += val
        }
      })

      const minimumReportingAuthorities = getMinimumReportingAuthorities(totalAuthorities)
      const authorityCoveragePercent =
        totalAuthorities > 0 ? (reportingAuthorities / totalAuthorities) * 100 : 0

      const populationCoveragePercent =
        totalPopulation > 0 ? (reportingPopulation / totalPopulation) * 100 : 0

      const meetsThreshold =
        reportingAuthorities >= minimumReportingAuthorities ||
        populationCoveragePercent >= DCMS_THRESHOLD_PERCENT

      const grossedTotal =
        reportingPopulation > 0
          ? Math.round((sampleTotal / reportingPopulation) * totalPopulation)
          : 0

      let rate = 0
      if (reportingPopulation > 0) {
        rate =
          metric.rateType === 'percent'
            ? (sampleTotal / reportingPopulation) * 100
            : (sampleTotal / reportingPopulation) * 1000
      }

      metricSummaries[metric.key] = {
        reportingAuthorities,
        totalAuthorities,
        minimumReportingAuthorities,
        authorityCoveragePercent,
        reportingPopulation,
        totalPopulation,
        populationCoveragePercent,
        meetsThreshold,
        sampleTotal,
        grossedTotal,
        rate
      }
    })

    return {
      region: regionName,
      totalAuthorities,
      totalPopulation,
      metrics: metricSummaries
    }
  })
}

/**
 * Formats data into a structured CSV string containing headline national estimates,
 * multi-year comparisons against the 23/24 baseline, and regional breakdowns.
 *
 * @param {Array<Object>} nationalEstimates - Current period national estimates.
 * @param {Array<Object>} multiYearTrends - Multi-year trend summaries.
 * @param {Array<Object>} regionalEstimates - Regional breakdown summaries.
 * @param {string} period - Active financial year period.
 * @returns {string} Formatted CSV text.
 */
export const generatePolicyBriefingCsv = (
  nationalEstimates,
  multiYearTrends,
  regionalEstimates,
  period
) => {
  const lines = []

  lines.push('PUBLIC LIBRARIES NATIONAL ESTIMATES (ENGLAND)')
  lines.push(`Period: ${period}`)
  lines.push('Methodology: Population-weighted grossing to England totals based on reporting services')
  lines.push('Data Source: Arts Council England Libraries Activity Dataset / ONS Mid-Year Population Estimates')
  lines.push('')

  // Section 1: Headline National Estimates
  lines.push('SECTION 1: HEADLINE NATIONAL ESTIMATES')
  lines.push(
    [
      'Metric',
      'Reporting Authorities',
      'Total Authorities',
      'Authority Coverage (%)',
      'Reporting Population',
      'Total Population',
      'Population Coverage (%)',
      'DCMS Coverage Threshold Met',
      'Reported Sample Total',
      'Grossed 100% England Estimate',
      'Grossing Multiplier',
      'Standardised Rate',
      'Rate Unit'
    ]
      .map(col => `"${col}"`)
      .join(',')
  )

  nationalEstimates.forEach(est => {
    lines.push(
      [
        `"${est.label}"`,
        est.reportingAuthorities,
        est.totalAuthorities,
        est.authorityCoveragePercent.toFixed(1),
        est.reportingPopulation,
        est.totalPopulation,
        est.populationCoveragePercent.toFixed(1),
        est.meetsThreshold ? 'Yes' : 'Caution',
        est.sampleTotal,
        est.grossedTotal,
        est.multiplier.toFixed(3),
        est.grossedRate.toFixed(1),
        `"${est.rateLabel}"`
      ].join(',')
    )
  })

  lines.push('')

  // Section 2: Multi-Year Trends
  lines.push('SECTION 2: MULTI-YEAR COMPARISON (2023/24 BASELINE)')
  const periods = multiYearTrends[0]
    ? Object.keys(multiYearTrends[0].periodData).sort()
    : []

  const trendHeaders = ['Metric', 'Baseline (2023/24 Grossed)']
  periods.forEach(p => {
    trendHeaders.push(`${p} Grossed`)
    if (p !== DCMS_BASELINE_PERIOD) {
      trendHeaders.push(`${p} vs 23/24 Change (%)`)
    }
  })
  lines.push(trendHeaders.map(col => `"${col}"`).join(','))

  multiYearTrends.forEach(trend => {
    const row = [`"${trend.metric.label}"`, trend.baselineGrossed]
    periods.forEach(p => {
      const pEst = trend.periodData[p]
      row.push(pEst ? pEst.grossedTotal : '')
      if (p !== DCMS_BASELINE_PERIOD) {
        const chg = trend.changeFromBaseline[p]
        row.push(chg != null ? chg.toFixed(1) : '')
      }
    })
    lines.push(row.join(','))
  })

  lines.push('')

  // Section 3: Regional Distribution
  lines.push('SECTION 3: REGIONAL DISTRIBUTION (SELECTED PERIOD)')
  lines.push(
    [
      'Region',
      'Total Authorities',
      'Regional Population',
      'Visits (Reported)',
      'Visits (Grossed)',
      'Visits per 1,000',
      'Loans (Reported)',
      'Loans (Grossed)',
      'Loans per 1,000',
      'Users (Reported)',
      'Users (Grossed)',
      'Users (% Pop)',
      'Events (Reported)',
      'Events (Grossed)',
      'Computer Hours (Grossed)'
    ]
      .map(col => `"${col}"`)
      .join(',')
  )

  regionalEstimates.forEach(reg => {
    const v = reg.metrics.visits
    const l = reg.metrics.loans
    const u = reg.metrics.users
    const e = reg.metrics.events
    const c = reg.metrics.computerHours
    lines.push(
      [
        `"${reg.region}"`,
        reg.totalAuthorities,
        reg.totalPopulation,
        v?.sampleTotal ?? '',
        v?.grossedTotal ?? '',
        v?.rate?.toFixed(1) ?? '',
        l?.sampleTotal ?? '',
        l?.grossedTotal ?? '',
        l?.rate?.toFixed(1) ?? '',
        u?.sampleTotal ?? '',
        u?.grossedTotal ?? '',
        u?.rate?.toFixed(1) ?? '',
        e?.sampleTotal ?? '',
        e?.grossedTotal ?? '',
        c?.grossedTotal ?? ''
      ].join(',')
    )
  })

  return lines.join('\n')
}

/**
 * Triggers a browser file download of the generated national estimates CSV.
 *
 * @param {Array<Object>} nationalEstimates - Current period national estimates.
 * @param {Array<Object>} multiYearTrends - Multi-year trend summaries.
 * @param {Array<Object>} regionalEstimates - Regional breakdown summaries.
 * @param {string} period - Active financial year period.
 */
export const downloadNationalEstimatesCsv = (
  nationalEstimates,
  multiYearTrends,
  regionalEstimates,
  period
) => {
  const csvContent = generatePolicyBriefingCsv(
    nationalEstimates,
    multiYearTrends,
    regionalEstimates,
    period
  )
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const cleanPeriod = (period || 'all').replace(/[^a-zA-Z0-9]/g, '_')
  const filename = `public_libraries_national_estimates_${cleanPeriod}.csv`

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadPolicyBriefingCsv = downloadNationalEstimatesCsv
export const generateNationalEstimatesCsv = generatePolicyBriefingCsv


