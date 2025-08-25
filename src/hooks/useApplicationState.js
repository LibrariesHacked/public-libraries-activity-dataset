import { useContext } from 'react'

import { ApplicationStateContext } from '../context/applicationStateContext'

export const useApplicationState = () => useContext(ApplicationStateContext)
