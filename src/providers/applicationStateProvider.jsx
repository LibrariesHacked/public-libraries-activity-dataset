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
  members: null,
  visits: null,
  wifiSessions: null
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
    case 'SetMembers':
      return {
        ...state,
        members: action.members
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
