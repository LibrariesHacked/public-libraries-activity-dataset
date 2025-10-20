import React, { useReducer } from 'react'

import { ApplicationStateContext } from '../context/applicationStateContext'

const initialApplicationState = {
  services: null,
  serviceLookup: null,
  filteredServices: [],
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

const applicationReducer = (state, action) => {
  switch (action.type) {
    case 'AddServices':
      return {
        ...state,
        services: action.services,
        serviceLookup: action.serviceLookup
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
