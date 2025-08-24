import { useContext } from 'react'

import { ApplicationStateContext } from '../context/applicationStateContext'

export const useApplicationStateValue = () =>
  useContext(ApplicationStateContext)
