import React, { useReducer } from 'react'

import { ApplicationStateContext } from '../context/applicationStateContext'

const initialApplicationState = {
  services: [],
  serviceLookup: {},
  filteredServices: []
}

const applicationReducer = (state, action) => {
  switch (action.type) {
    case 'AddServices':
      return {
        ...state,
        services: action.services,
        serviceLookup: action.serviceLookup
      }
    case 'FilterServices':
      return {
        ...state,
        filteredServices: action.filteredServices
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
