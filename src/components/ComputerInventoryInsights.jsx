import React, { useEffect, useMemo } from 'react'
import Markdown from 'react-markdown'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded'
import LaptopChromebookRoundedIcon from '@mui/icons-material/LaptopChromebookRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'

import { useApplicationState } from '../hooks/useApplicationState'
import { formatCompactNumber } from '../helpers/numbers'
import { createTimelineChartOptions } from '../helpers/charts'
import { formatPeriod, getPeriodForMonth, getPeriodMonths } from '../helpers/periods'
import * as computerInventoryModel from '../models/computerInventory'
import computerInventoryMd from '../content/computer-inventory.md?raw'

import { AppChart } from './charts'
import NumberCard from './NumberCard'

const DEVICES_IN_SERVICE = 'Computers and devices in service'
const DEVICES_AVAILABLE_TO_BORROW = 'Devices available to borrow'
const LOANABLE_DEVICE_ISSUES = 'Issues of loanable devices'

const usageChartOptions = createTimelineChartOptions(
  '',
  'Computer hours per in-service device'
)

const ComputerInventoryInsights = ({ children }) => {
  const [
    {
      computerInventory,
      computers,
      filteredServices,
      selectedPeriods,
      monthRange
    },
    dispatchApplication
  ] = useApplicationState()

  useEffect(() => {
    if (!computerInventory) {
      computerInventoryModel.getComputerInventory().then(records => {
        dispatchApplication({
          type: 'SetComputerInventory',
          computerInventory: records
        })
      })
    }
  }, [computerInventory, dispatchApplication])

  const annualData = useMemo(() => {
    const selected = [...(selectedPeriods || [])].sort()
    const fullPeriods = selected.filter(period => {
      const months = getPeriodMonths(period)
      return (
        monthRange &&
        months[0] >= monthRange[0] &&
        months[months.length - 1] <= monthRange[1]
      )
    })
    const fullPeriodSet = new Set(fullPeriods)
    const selectedServices = filteredServices?.length
      ? new Set(filteredServices)
      : null
    const inventoryByPeriod = new Map()

    for (const record of computerInventory || []) {
      if (
        !fullPeriodSet.has(record.period) ||
        (selectedServices && !selectedServices.has(record.serviceCode)) ||
        !Number.isFinite(record.countInventory)
      ) continue

      if (!inventoryByPeriod.has(record.period)) {
        inventoryByPeriod.set(record.period, new Map())
      }
      const measures = inventoryByPeriod.get(record.period)
      if (!measures.has(record.measure)) measures.set(record.measure, new Map())
      measures.get(record.measure).set(record.serviceCode, record.countInventory)
    }

    const usageByPeriod = new Map()
    for (const record of computers || []) {
      const period = getPeriodForMonth(record.month)
      if (
        !fullPeriodSet.has(period) ||
        (selectedServices && !selectedServices.has(record.serviceCode)) ||
        !Number.isFinite(record.countHours)
      ) continue

      if (!usageByPeriod.has(period)) usageByPeriod.set(period, new Map())
      const services = usageByPeriod.get(period)
      if (!services.has(record.serviceCode)) services.set(record.serviceCode, new Map())
      const months = services.get(record.serviceCode)
      months.set(record.month, (months.get(record.month) || 0) + record.countHours)
    }

    return fullPeriods.map(period => {
      const measures = inventoryByPeriod.get(period) || new Map()
      const inService = measures.get(DEVICES_IN_SERVICE) || new Map()
      const available = measures.get(DEVICES_AVAILABLE_TO_BORROW) || new Map()
      const issues = measures.get(LOANABLE_DEVICE_ISSUES) || new Map()
      const expectedMonths = getPeriodMonths(period)
      const usageByService = usageByPeriod.get(period) || new Map()
      let usageHours = 0
      let usageDevices = 0
      let usageServiceCount = 0

      for (const [serviceCode, months] of usageByService) {
        const deviceCount = inService.get(serviceCode)
        if (
          !Number.isFinite(deviceCount) ||
          deviceCount <= 0 ||
          !expectedMonths.every(month => months.has(month))
        ) continue

        usageHours += expectedMonths.reduce((sum, month) => sum + months.get(month), 0)
        usageDevices += deviceCount
        usageServiceCount += 1
      }

      let loanIssues = 0
      let loanableDevices = 0
      let loanServiceCount = 0
      for (const [serviceCode, issueCount] of issues) {
        const deviceCount = available.get(serviceCode)
        if (!Number.isFinite(deviceCount) || deviceCount <= 0) continue
        loanIssues += issueCount
        loanableDevices += deviceCount
        loanServiceCount += 1
      }

      const sum = values => [...values.values()].reduce((total, value) => total + value, 0)
      return {
        period,
        devicesInService: sum(inService),
        devicesInServiceCount: inService.size,
        devicesAvailable: sum(available),
        devicesAvailableCount: available.size,
        hoursPerDevice: usageDevices ? usageHours / usageDevices : null,
        usageServiceCount,
        issuesPerDevice: loanableDevices ? loanIssues / loanableDevices : null,
        loanServiceCount
      }
    })
  }, [computerInventory, computers, filteredServices, selectedPeriods, monthRange])

  const latest = annualData[annualData.length - 1]
  const usageChartData = useMemo(() => ({
    labels: annualData.map(record => formatPeriod(record.period)),
    datasets: [{
      label: 'Computer hours per in-service device',
      data: annualData.map(record => record.hoursPerDevice)
    }]
  }), [annualData])

  const periodLabel = latest ? formatPeriod(latest.period) : ''

  return (
    <>
      <Grid container spacing={2} sx={{ mt: 2, mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <NumberCard
            title='Devices in service'
            number={formatCompactNumber(latest?.devicesInService || 0)}
            description={latest ? `${latest.devicesInServiceCount} services reporting in ${periodLabel}` : ''}
            icon={ComputerRoundedIcon}
            colour='chartBlue'
            noData={!latest || latest.devicesInServiceCount === 0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <NumberCard
            title='Devices available to borrow'
            number={formatCompactNumber(latest?.devicesAvailable || 0)}
            description={latest ? `${latest.devicesAvailableCount} services reporting in ${periodLabel}` : ''}
            icon={LaptopChromebookRoundedIcon}
            colour='chartGreen'
            noData={!latest || latest.devicesAvailableCount === 0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <NumberCard
            title='Computer hours per device'
            number={formatCompactNumber(latest?.hoursPerDevice || 0, 1)}
            description={latest ? `${latest.usageServiceCount} services with a full year of use and device counts` : ''}
            context={`Annual hours per device (${periodLabel})`}
            icon={TrendingUpRoundedIcon}
            colour='chartRed'
            noData={!latest || latest.hoursPerDevice == null}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <NumberCard
            title='Device loans per available device'
            number={formatCompactNumber(latest?.issuesPerDevice || 0, 1)}
            description={latest ? `${latest.loanServiceCount} services reporting both measures` : ''}
            context={`Annual loans per device (${periodLabel})`}
            icon={SwapHorizRoundedIcon}
            colour='chartOrange'
            noData={!latest || latest.issuesPerDevice == null}
          />
        </Grid>
      </Grid>

      {children}

      <Typography variant='h5' sx={{ fontWeight: 700, mt: 5, mb: 0.5 }}>
        Device inventory and use
      </Typography>
      <Markdown>{computerInventoryMd}</Markdown>
      {annualData.length > 1
        ? (
            <AppChart
              type='bar'
              data={usageChartData}
              options={usageChartOptions}
              title='Annual computer usage per in-service device'
              height={{ xs: 280, sm: 300 }}
            />
          )
        : !latest && (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Select at least one complete financial year to view inventory and usage comparisons.
          </Typography>
          )}
    </>
  )
}

export default ComputerInventoryInsights