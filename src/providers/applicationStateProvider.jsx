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
  computerUsage: null,
  events: null,
  loans: null,
  users: null,
  visits: null,
  wifiSessions: null,
  mapZoom: 7,
  mapPosition: [-1.155414, 52.691432]
}

// Rebuilds the service aggregates whenever the selected financial years change.
const buildPeriodState = (state, serviceRecords, selectedPeriods) => {
  const services = getServicesForPeriods(serviceRecords, selectedPeriods)
  const serviceLookup = {}
  services.forEach(service => {
    serviceLookup[service.code] = service
  })
  const periodMonthRange = getMonthRangeForPeriods(selectedPeriods)
  return {
    ...state,
    serviceRecords,
    services,
    serviceLookup,
    selectedPeriods,
    snapshotPeriod: selectedPeriods[selectedPeriods.length - 1] || null,
    periodMonthRange,
    monthRange: periodMonthRange
  }
}

const applicationReducer = (state, action) => {
  switch (action.type) {
    case 'AddServices': {
      const periods = [
        ...new Set(action.serviceRecords.map(record => record.period))
      ].sort()
      return {
        ...buildPeriodState(state, action.serviceRecords, periods),
        periods
      }
    }
    case 'SetSelectedPeriods': {
      const selectedPeriods = state.periods.filter(period =>
        action.selectedPeriods.includes(period)
      )
      if (selectedPeriods.length === 0) return state
      return buildPeriodState(state, state.serviceRecords, selectedPeriods)
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
        users: action.users
      }
    case 'SetLoans':
      return {
        ...state,
        loans: action.loans
      }
    case 'SetAttendance':
      return {
        ...state,
        attendance: action.attendance
      }
    case 'SetComputers':
      return {
        ...state,
        computers: action.computers
      }
    case 'SetEvents':
      return {
        ...state,
        events: action.events
      }
    case 'SetVisits':
      return {
        ...state,
        visits: action.visits
      }
    case 'SetWiFi':
      return {
        ...state,
        wifi: action.wifi
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
