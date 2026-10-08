import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { getQualitySummary, groupQualityIssues, resolveEffectiveValue } from '../src/helpers/dataQuality.js'
import { ErrorRecord } from '../src/models/errors.js'
import { getMonthRangeForPeriods, getPeriodMonths, getPeriodsInMonthRange, isRecordInMonthRange } from '../src/helpers/periods.js'

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
  assert.match(getQualitySummary({ status: 'replaced' }), /estimated correction/)
  assert.match(getQualitySummary({ status: 'excluded' }), /left out/)
  assert.equal(groupQualityIssues([]).length, 0)
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