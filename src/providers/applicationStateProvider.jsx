import React, { useReducer } from 'react'

import { ApplicationStateContext } from '../context/applicationStateContext'

import { getMonthRangeForPeriods } from '../helpers/periods'

import { getServicesForPeriods } from '../models/service'

const initialApplicationState = {
  serviceRecords: null,
  services: null,
  serviceLookup: null,
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
  mapZoom: 7,
  mapPosition: [-1.155414, 52.691432]
}

// Rebuilds the service aggregates whenever the selected financial years change.
const buildPeriodState = (
  state,
  serviceRecords,
  selectedPeriods,
  useEstimates = state.useEstimates !== false
) => {
  if (!serviceRecords) return state
  const services = getServicesForPeriods(serviceRecords, selectedPeriods, useEstimates)
  const serviceLookup = {}
  services.forEach(service => {
    serviceLookup[service.code] = service
  })
  const periodMonthRange = getMonthRangeForPeriods(selectedPeriods)
  return {
    ...state,
    useEstimates,
    serviceRecords,
    services,
    serviceLookup,
    selectedPeriods,
    snapshotPeriod: selectedPeriods[selectedPeriods.length - 1] || null,
    periodMonthRange,
    monthRange: state.monthRange || periodMonthRange
  }
}

const ACTIVITY_KEYS = [
  'computers',
  'wifi',
  'loans',
  'visits',
  'events',
  'attendance',
  'users'
]

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

const applicationReducer = (state, action) => {
  switch (action.type) {
    case 'AddServices': {
      const periods = [
        ...new Set(action.serviceRecords.map(record => record.period))
      ].sort()
      return {
        ...buildPeriodState(state, action.serviceRecords, periods, state.useEstimates),
        periods
      }
    }
    case 'SetSelectedPeriods': {
      const selectedPeriods = state.periods.filter(period =>
        action.selectedPeriods.includes(period)
      )
      if (selectedPeriods.length === 0) return state
      return buildPeriodState(state, state.serviceRecords, selectedPeriods, state.useEstimates)
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
      return buildPeriodState(updatedState, state.serviceRecords, state.selectedPeriods, useEstimates)
    }
    case 'SetMonthRange':
      return {
        ...state,
        monthRange: action.monthRange
      }
    case 'SetFilteredServices':
      return {
        ...state,
        filteredServices: action.filteredServices
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

export const ApplicationStateProvider = ({ children }) => (
  <ApplicationStateContext.Provider
    value={useReducer(applicationReducer, initialApplicationState)}
  >
    {children}
  </ApplicationStateContext.Provider>
)
