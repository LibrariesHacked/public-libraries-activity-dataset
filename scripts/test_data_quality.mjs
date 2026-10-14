import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { getQualitySummary, groupQualityIssues, resolveEffectiveValue } from '../src/helpers/dataQuality.js'
import { ErrorRecord } from '../src/models/errors.js'
import { getActivityRecordsPeriodChange, getMonthRangeForPeriods, getPeriodMonths, getPeriodsInMonthRange, isRecordInMonthRange } from '../src/helpers/periods.js'
import { getUsersPeriodChange, getUsersPopulationPercentages, Users } from '../src/models/users.js'
import { createActivityModel } from '../src/models/activityFactory.js'
import { getComparisonChart, getEventTurnout, getReportedTotal, getReportedTotalsByGroup, getReportingCoverageByGroup, getReportingSnapshotPercentage, perThousandReportingResidents } from '../src/helpers/reportingRates.js'

test('comparison charts separate measures, sort their own values and retain reported zero', () => {
  const data = {
    labels: ['Low', 'Missing', 'High', 'Zero'],
    datasets: [
      { label: 'Hours', data: [2, null, 10, 0] },
      { label: 'Sessions', data: [100, 900, 1, 5] },
      { label: 'Unavailable', data: [null, null, null, null] }
    ]
  }
  assert.deepEqual(getComparisonChart(data, ['Hours', 'Unavailable']), {
    labels: ['High', 'Low', 'Zero'],
    datasets: [{ label: 'Hours', data: [10, 2, 0] }]
  })
  assert.deepEqual(getComparisonChart(data, ['Unavailable']), { labels: [], datasets: [] })
  assert.equal(data.labels[0], 'Low')
})

test('all published activity counts decode exactly and honour the corrections toggle', () => {
  const fieldsByDataset = {
    attendance: ['type', 'ageGroup', 'month'],
    events: ['type', 'ageGroup', 'month'],
    loans: ['format', 'contentAgeGroup', 'month'],
    visits: ['location', 'month'],
    users: ['period', 'ageGroup'],
    computers: ['month'],
    wifi: ['month'],
    click_and_collect: ['month'],
    computer_inventory: ['measure', 'period']
  }
  for (const [dataset, fields] of Object.entries(fieldsByDataset)) {
    const payload = JSON.parse(readFileSync(new URL(`../public/${dataset}.json`, import.meta.url), 'utf8'))
    const rows = Array.isArray(payload) ? payload : payload.records
    const model = createActivityModel({ fields, countProp: 'count', endpoint: '' })
    for (const row of rows) {
      const record = model.fromJson(row)
      assert.equal(record.serviceCode, row[0])
      fields.forEach((field, index) => assert.equal(record[field], row[index + 1]))
      const offset = fields.length + 1
      const corrected = row[offset] == null ? null : Number(row[offset])
      const original = row[offset + 1] == null ? null : Number(row[offset + 1])
      assert.equal(record.originalCount, original, `${dataset} ${row[0]} original count`)
      assert.equal(record.estimatedCount, corrected, `${dataset} ${row[0]} corrected count`)
      for (const useEstimates of [false, true]) {
        record.updateCount(useEstimates)
        assert.equal(record.count, resolveEffectiveValue(original, corrected, row[offset + 2], useEstimates))
      }
    }
  }
})

test('map total percentages follow the same corrections preference as cards', () => {
  const service = {
    code: 'TEST', users: 50, totalPopulation: 1000,
    resolveMetric: (metric, useEstimates) => resolveEffectiveValue(100, 50, 'replaced', useEstimates)
  }
  assert.equal(getUsersPopulationPercentages([service], [], true).TEST.Total, 5)
  assert.equal(getUsersPopulationPercentages([service], [], false).TEST.Total, 10)
})

test('missing activity years are not reported as a 100% decline', () => {
  const options = { countProp: 'count', baselinePeriod: '2024/2025', targetPeriod: '2025/2026' }
  const baseline = { serviceCode: 'TEST', month: '2024-04', count: 10 }
  assert.equal(getActivityRecordsPeriodChange({ ...options, records: [baseline] }), null)
  assert.equal(getActivityRecordsPeriodChange({ ...options, records: [baseline, { serviceCode: 'TEST', month: '2025-04', count: null }] }), null)
  assert.equal(getActivityRecordsPeriodChange({ ...options, records: [baseline, { serviceCode: 'TEST', month: '2025-04', count: 0 }] }), -100)
})

test('user models and map percentages retain reported zero but not excluded or missing counts', () => {
  const users = [
    new Users().fromJson(['TEST', '2024/2025', 'Adult', null, 10, null, null]),
    new Users().fromJson(['TEST', '2025/2026', 'Adult', null, 0, null, null]),
    new Users().fromJson(['TEST', '2025/2026', 'Under 12', null, 100, 'excluded', 'Excluded'])
  ]
  assert.equal(getUsersPeriodChange(users, 'Adult', '2024/2025', '2025/2026'), -100)
  const result = getUsersPopulationPercentages([
    { code: 'TEST', users: 0, totalPopulation: 1000, populationAdult: 500, populationUnder12: 100 }
  ], users.filter(user => user.period === '2025/2026')).TEST
  assert.equal(result.Adult, 0)
  assert.equal(result.Total, 0)
  assert.equal(result['Under 12'], null)
  assert.equal(result['12-17'], null)
})

test('snapshot percentages use only reporting populations and preserve missing versus zero', () => {
  const reporting = { users: 100, totalPopulation: 1000 }
  const missing = { users: null, totalPopulation: 9000 }
  assert.equal(getReportingSnapshotPercentage([reporting, missing], 'users'), 10)
  assert.equal(getReportingSnapshotPercentage([missing], 'users'), null)
  assert.equal(getReportingSnapshotPercentage([{ users: 0, totalPopulation: 1000 }], 'users'), 0)
  assert.equal(getReportingSnapshotPercentage([{ users: 100, totalPopulation: 0 }], 'users'), null)
  assert.equal(getReportingSnapshotPercentage([reporting, { users: 100, totalPopulation: 0 }], 'users'), null)
})

test('turnout only compares matching reported service, month, type and age-group counts', () => {
  const base = { serviceCode: 'TEST', month: '2025-04', type: 'Physical', ageGroup: 'Adult' }
  const events = [
    { ...base, countEvents: 10 },
    { ...base, month: '2025-05', countEvents: 100 },
    { ...base, type: 'Digital', countEvents: 100 },
    { ...base, ageGroup: 'Child', countEvents: 100 },
    { ...base, serviceCode: 'OTHER', countEvents: 100 }
  ]
  const attendance = [
    { ...base, countAttendance: 50 },
    { ...base, month: '2025-06', countAttendance: 999 },
    { ...base, type: 'Digital', countAttendance: null }
  ]
  assert.equal(getEventTurnout(events, attendance), 5)
  assert.equal(getEventTurnout(events, [{ ...base, countAttendance: 0 }]), 0)
  assert.equal(getEventTurnout(events, [{ ...base, countAttendance: null }]), null)
  assert.equal(getEventTurnout([{ ...base, countEvents: 0 }], attendance), null)
  assert.equal(getEventTurnout([], attendance), null)
})

test('activity totals distinguish absent or excluded counts from reported zero', () => {
  assert.equal(getReportedTotal([], 'count'), null)
  assert.equal(getReportedTotal([{ count: null }, { count: undefined }], 'count'), null)
  assert.equal(getReportedTotal([{ count: NaN }, { count: Infinity }], 'count'), null)
  assert.equal(getReportedTotal([{ count: 0 }, { count: null }], 'count'), 0)
  assert.equal(getReportedTotal([{ count: 5 }, { count: 2.5 }, { count: null }], 'count'), 7.5)
})

test('selected event timeline values equal selected source counts, not national counts', () => {
  for (const [dataset, countProp] of [['events', 'countEvents'], ['attendance', 'countAttendance']]) {
    const rows = JSON.parse(readFileSync(new URL(`../public/${dataset}.json`, import.meta.url), 'utf8'))
    const records = rows.map(row => ({
      serviceCode: row[0], type: row[1], month: row[3],
      [countProp]: resolveEffectiveValue(row[5], row[4], row[6], true)
    }))
    const code = records.find(record => Number.isFinite(record[countProp])).serviceCode
    const selected = records.filter(record => record.serviceCode === code)
    const keyFor = record => `${record.type}|||${record.month}`
    const totals = getReportedTotalsByGroup(selected, countProp, keyFor)
    const coverage = getReportingCoverageByGroup(selected, [{ code, totalPopulation: 1000 }], countProp, keyFor)
    for (const [key, total] of totals) {
      const expected = selected.filter(record => keyFor(record) === key && Number.isFinite(record[countProp]))
        .reduce((sum, record) => sum + record[countProp], 0)
      assert.equal(total, expected)
      assert.ok(Math.abs(perThousandReportingResidents(total, coverage.get(key)) - expected) < 1e-9)
    }
  }
  const source = readFileSync(new URL('../src/Events.jsx', import.meta.url), 'utf8')
  assert.match(source, /getReportedTotalsByGroup\(\s*reportingEvents,/)
  assert.match(source, /getReportedTotalsByGroup\(\s*reportingAttendance,/)
})

test('shared slider filters monthly records and overlapping financial-year records', () => {
  const range = ['2024-07', '2024-07']
  assert.equal(isRecordInMonthRange({ month: '2024-07' }, range), true)
  assert.equal(isRecordInMonthRange({ month: '2024-06' }, range), false)
  assert.equal(isRecordInMonthRange({ month: '2024-08' }, range), false)
  assert.equal(isRecordInMonthRange({ period: '2024/2025' }, range), true)
  assert.equal(isRecordInMonthRange({ period: '2023/2024' }, range), false)
  assert.equal(isRecordInMonthRange({ period: '2025/2026' }, range), false)
  assert.equal(isRecordInMonthRange({ period: '2024/2025' }, ['2024-03', '2024-04']), true)
  assert.equal(isRecordInMonthRange({ month: '2024-06' }, null), true)
})

test('year shortcuts and slider ranges select continuous financial years', () => {
  const periods = ['2023/2024', '2024/2025', '2025/2026']
  for (const period of periods) {
    const months = getPeriodMonths(period)
    assert.equal(months.length, 12)
    assert.equal(months[0], `${period.slice(0, 4)}-04`)
    assert.equal(months[11], `${period.slice(5)}-03`)
    assert.deepEqual(getPeriodsInMonthRange(periods, [months[0], months[11]]), [period])
  }
  const spanningRange = getMonthRangeForPeriods([periods[0], periods[2]])
  assert.deepEqual(getPeriodsInMonthRange(periods, spanningRange), periods)
  assert.deepEqual(getPeriodsInMonthRange(periods, ['2024-03', '2024-04']), periods.slice(0, 2))
  assert.deepEqual(getPeriodsInMonthRange(periods, ['2025-04', '2025-04']), [periods[2]])
})

test('published register has documented rules and grouping preserves each one', () => {
  const published = JSON.parse(readFileSync(new URL('../public/errors.json', import.meta.url), 'utf8'))
  const records = published.map(row => new ErrorRecord(row))
  const groups = groupQualityIssues(records)
  const groupedRecords = groups.flatMap(group => group.records)
  assert.ok(records.length > 0)
  assert.equal(groupedRecords.length, records.length)
  assert.equal(new Set(groupedRecords).size, records.length)
  for (const record of records) {
    assert.ok(record.serviceCode && record.period && record.dataset)
    assert.ok(record.notes?.trim(), `Missing explanation for ${record.serviceCode} ${record.period}`)
    assert.ok(['excluded', 'replaced', 'suspicious', 'standardised'].includes(record.status))
    if (record.status === 'replaced') assert.notEqual(record.estimatedCount, undefined)
    assert.ok(groupedRecords.includes(record))
  }
  for (const group of groups) {
    for (const record of group.records) {
      assert.equal(record.serviceCode, group.serviceCode)
      assert.equal(record.period, group.period)
      assert.equal(record.dataset, group.dataset)
      assert.ok(group.statuses.includes(record.status))
      assert.ok(group.notes.includes(record.notes))
    }
  }
})

test('register groups retain all rules and distinct notes', () => {
  const base = { serviceCode: 'TEST', period: '2025/2026', dataset: 'events', status: 'suspicious' }
  const rows = [
    { ...base, scope: 'total', notes: 'Category sum exceeds total.' },
    { ...base, scope: 'series', match: 'children', notes: 'Category sum exceeds total.' },
    { ...base, scope: 'series', match: 'adults', status: 'replaced', notes: 'Correction available.' },
    { ...base, period: '2024/2025', notes: 'Other year.' }
  ]
  const groups = groupQualityIssues(rows)
  assert.equal(groups.length, 2)
  assert.equal(groups[0].records.length, 3)
  assert.equal(groups[0].status, 'replaced')
  assert.deepEqual(groups[0].statuses, ['suspicious', 'replaced'])
  assert.equal(groups[0].notes, 'Category sum exceeds total.\n\nCorrection available.')
  assert.deepEqual(groups.flatMap(group => group.records), rows)
  assert.ok(groups[0].match.includes('children'))
})

test('plain summaries distinguish unchanged values from corrections and exclusions', () => {
  assert.match(getQualitySummary({ status: 'suspicious', notes: 'Annual SUM ignores numeric text.' }), /total is unchanged/)
  assert.match(getQualitySummary({ status: 'suspicious', notes: 'category sum 20,385' }), /remain unchanged/)
  assert.match(getQualitySummary({ status: 'replaced' }), /correction is available/)
  assert.match(getQualitySummary({ status: 'excluded' }), /left out/)
  assert.equal(groupQualityIssues([]).length, 0)
})

test('public correction wording does not use national-estimate terminology', () => {
  assert.doesNotMatch(getQualitySummary({ status: 'replaced' }), /\bestimat\w*/i)
  for (const path of ['src/components/NumberCard.jsx', 'src/content/data-quality.md']) {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /\bestimat\w*/i, path)
  }
  const table = readFileSync(new URL('../src/components/DatasetDataGrid.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(table, /estimated correction|label: 'Estimated count'/i)
  const register = JSON.parse(readFileSync(new URL('../public/errors.json', import.meta.url), 'utf8'))
  for (const record of register.filter(record => record.Status === 'replaced')) {
    const authoredNote = record.Notes.split('Respondent explanation', 1)[0]
    assert.doesNotMatch(authoredNote, /\bestimat\w*/i, `${record['Authority name']} ${record.Period}`)
  }
})

test('data modes preserve zero, missing values, exclusions and unchanged review figures', () => {
  for (const useEstimates of [true, false]) {
    assert.equal(resolveEffectiveValue(100, 10, 'excluded', useEstimates), null)
    assert.equal(resolveEffectiveValue(100, 10, 'suspicious', useEstimates), 100)
    assert.equal(resolveEffectiveValue(0, null, null, useEstimates), 0)
    assert.equal(resolveEffectiveValue(null, null, null, useEstimates), null)
  }
  assert.equal(resolveEffectiveValue(100, 0, 'replaced', true), 0)
  assert.equal(resolveEffectiveValue(100, 0, 'replaced', false), 100)
  assert.equal(resolveEffectiveValue(100, null, 'replaced', true), 100)
})