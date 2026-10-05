import React, { useReducer } from 'react'

import { ApplicationStateContext } from '../context/applicationStateContext'

import { getMonthRangeForPeriods, getPeriodsInMonthRange } from '../helpers/periods'

import { getServicesForPeriods } from '../models/service'

/**
 * Default initial state configuration for the global application context.
 */
const initialApplicationState = {
  serviceRecords: null,
  services: null,
  serviceLookup: null,
  comparisonMode: 'services',
  selectedServices: [],
  selectedRegions: [],
  filteredServices: [],
  periods: [],
  selectedPeriods: [],
  snapshotPeriod: null,
  periodMonthRange: null,
  monthRange: null,
  attendance: null,
  computers: null,
  events: null,
  loans: null,
  users: null,
  visits: null,
  wifi: null,
  useEstimates: true,
  nationalGrossing: false,
  mapZoom: 7,
  mapPosition: [-1.155414, 52.691432]
}

/**
 * Resolves the active list of service codes based on the current comparison mode and selection.
 *
 * @param {string} [comparisonMode='services'] - Active comparison mode ('services' or 'regions').
 * @param {string[]} [selectedServices=[]] - Manually selected service codes in 'services' mode.
 * @param {string[]} [selectedRegions=[]] - Selected region names in 'regions' mode.
 * @param {import('../models/service').Service[]} [services=[]] - Current consolidated services list.
 * @returns {string[]} Filtered list of service codes to apply across the dashboard.
 */
const resolveFilteredServices = (
  comparisonMode = 'services',
  selectedServices = [],
  selectedRegions = [],
  services = []
) => {
  if (comparisonMode === 'services') {
    return selectedServices || []
  }
  if (comparisonMode === 'regions') {
    if (!selectedRegions || selectedRegions.length === 0 || !services) {
      return []
    }
    return services
      .filter(s => s.region && selectedRegions.includes(s.region))
      .map(s => s.code)
  }
  return []
}

/**
 * Recomputes derived service aggregates, service code lookups, and month date ranges
 * whenever the selected financial years or estimation preferences change.
 *
 * @param {Object} state - Current application state.
 * @param {import('../models/service').Service[]} serviceRecords - Raw annual service records.
 * @param {string[]} selectedPeriods - Array of financial year periods (e.g. ['2022/23']).
 * @param {boolean} [useEstimates=true] - Whether to use estimated or replaced data values.
 * @param {[string, string]|null} [monthRange] - Optional specific month range to apply.
 * @returns {Object} Updated application state slice containing recalculated services, ranges, and snapshot period.
 */
const buildPeriodState = (
  state,
  serviceRecords,
  selectedPeriods,
  useEstimates = state.useEstimates !== false,
  monthRange = state.monthRange
) => {
  if (!serviceRecords) return state
  const services = getServicesForPeriods(serviceRecords, selectedPeriods, useEstimates)
  const serviceLookup = {}
  services.forEach(service => {
    serviceLookup[service.code] = service
  })
  const allPeriodsMonthRange = getMonthRangeForPeriods(state.periods || selectedPeriods)
  const periodMonthRange = state.periodMonthRange || allPeriodsMonthRange
  const filteredServices = resolveFilteredServices(
    state.comparisonMode,
    state.selectedServices,
    state.selectedRegions,
    services
  )
  return {
    ...state,
    useEstimates,
    serviceRecords,
    services,
    serviceLookup,
    filteredServices,
    selectedPeriods,
    snapshotPeriod: selectedPeriods[selectedPeriods.length - 1] || null,
    periodMonthRange,
    monthRange: monthRange || state.monthRange || periodMonthRange
  }
}

/**
 * List of activity dataset keys stored in application state that contain ActivityRecord instances.
 */
const ACTIVITY_KEYS = [
  'computers',
  'wifi',
  'loans',
  'visits',
  'events',
  'attendance',
  'users'
]

/**
 * Iterates through a collection of activity records and updates their active count property
 * based on whether estimated figures should be included.
 *
 * @param {Array<import('../models/activityFactory').ActivityRecord>} records - Collection of activity records.
 * @param {boolean} useEstimates - Whether to use estimated or replaced count values.
 * @param {string} [fallbackProp] - Optional property name to update if record lacks `updateCount`.
 * @returns {Array<import('../models/activityFactory').ActivityRecord>|null} The updated records array, or null if input was null.
 */
const updateRecordCounts = (records, useEstimates, fallbackProp) => {
  if (!records) return records
  return records.map(r => {
    if (r.updateCount) {
      r.updateCount(useEstimates)
    } else if (r.resolveCount && fallbackProp) {
      r[fallbackProp] = r.resolveCount(useEstimates)
    }
    return r
  })
}

/**
 * Reducer function managing global application state transitions for library data,
 * filters, active periods, and map viewport settings.
 *
 * @param {Object} state - Current application state.
 * @param {Object} action - Action payload with a `type` string and optional parameters.
 * @returns {Object} New application state.
 */
const applicationReducer = (state, action) => {

  switch (action.type) {
    case 'AddServices': {
      const periods = [
        ...new Set(action.serviceRecords.map(record => record.period))
      ].sort()
      const allPeriodsMonthRange = getMonthRangeForPeriods(periods)
      const nextState = {
        ...state,
        periods,
        periodMonthRange: allPeriodsMonthRange,
        monthRange: state.monthRange || allPeriodsMonthRange
      }
      return {
        ...buildPeriodState(
          nextState,
          action.serviceRecords,
          periods,
          state.useEstimates
        ),
        periods,
        periodMonthRange: allPeriodsMonthRange,
        monthRange: state.monthRange || allPeriodsMonthRange
      }
    }
    case 'SetSelectedPeriods': {
      const selectedPeriods = state.periods.filter(period =>
        action.selectedPeriods.includes(period)
      )
      if (selectedPeriods.length === 0) return state
      const monthRange = getMonthRangeForPeriods(selectedPeriods)
      return {
        ...buildPeriodState(
          state,
          state.serviceRecords,
          selectedPeriods,
          state.useEstimates,
          monthRange
        ),
        monthRange
      }
    }
    case 'SetDateRange':
    case 'SetMonthRange': {
      const monthRange = action.monthRange
      const selectedPeriods = getPeriodsInMonthRange(state.periods, monthRange)
      if (selectedPeriods.length === 0) return state
      return {
        ...buildPeriodState(
          state,
          state.serviceRecords,
          selectedPeriods,
          state.useEstimates,
          monthRange
        ),
        monthRange
      }
    }
    case 'SetUseEstimates': {
      const useEstimates = action.useEstimates
      const updatedDatasets = {}
      ACTIVITY_KEYS.forEach(key => {
        if (state[key]) {
          updatedDatasets[key] = updateRecordCounts(state[key], useEstimates)
        }
      })
      const updatedState = {
        ...state,
        useEstimates,
        ...updatedDatasets
      }
      return buildPeriodState(
        updatedState,
        state.serviceRecords,
        state.selectedPeriods,
        useEstimates,
        state.monthRange
      )
    }
    case 'SetNationalGrossing': {
      return {
        ...state,
        nationalGrossing: Boolean(action.nationalGrossing)
      }
    }
    case 'SetComparisonMode': {
      const comparisonMode = action.comparisonMode
      const filteredServices = resolveFilteredServices(
        comparisonMode,
        state.selectedServices,
        state.selectedRegions,
        state.services
      )
      return {
        ...state,
        comparisonMode,
        filteredServices
      }
    }
    case 'SetSelectedServices': {
      const selectedServices = action.selectedServices || []
      const filteredServices = resolveFilteredServices(
        'services',
        selectedServices,
        state.selectedRegions,
        state.services
      )
      return {
        ...state,
        comparisonMode: 'services',
        selectedServices,
        filteredServices
      }
    }
    case 'SetSelectedRegions': {
      const selectedRegions = action.selectedRegions || []
      const filteredServices = resolveFilteredServices(
        'regions',
        state.selectedServices,
        selectedRegions,
        state.services
      )
      return {
        ...state,
        comparisonMode: 'regions',
        selectedRegions,
        filteredServices
      }
    }
    case 'SetFilteredServices':
      return {
        ...state,
        selectedServices: action.filteredServices || [],
        filteredServices: action.filteredServices || []
      }
    case 'SetUsers':
      return {
        ...state,
        users: updateRecordCounts(action.users, state.useEstimates, 'countUsers')
      }
    case 'SetLoans':
      return {
        ...state,
        loans: updateRecordCounts(action.loans, state.useEstimates, 'countLoans')
      }
    case 'SetAttendance':
      return {
        ...state,
        attendance: updateRecordCounts(action.attendance, state.useEstimates, 'countAttendance')
      }
    case 'SetComputers':
      return {
        ...state,
        computers: updateRecordCounts(action.computers, state.useEstimates, 'countHours')
      }
    case 'SetEvents':
      return {
        ...state,
        events: updateRecordCounts(action.events, state.useEstimates, 'countEvents')
      }
    case 'SetVisits':
      return {
        ...state,
        visits: updateRecordCounts(action.visits, state.useEstimates, 'countVisits')
      }
    case 'SetWiFi':
    case 'SetWifi':
      return {
        ...state,
        wifi: updateRecordCounts(action.wifi, state.useEstimates, 'countSessions')
      }
    case 'SetMapPosition':
      return {
        ...state,
        mapPosition: action.mapPosition,
        mapZoom: action.mapZoom
      }
    default:
      return state
  }
}

/**
 * React context provider component that encapsulates global application state management.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child components to be wrapped with the application state context.
 * @returns {JSX.Element} The provider component exposing [state, dispatch].
 */
export const ApplicationStateProvider = ({ children }) => (
  <ApplicationStateContext.Provider
    value={useReducer(applicationReducer, initialApplicationState)}
  >
    {children}
  </ApplicationStateContext.Provider>
)
