import { useContext } from 'react'

import { ApplicationStateContext } from '../context/applicationStateContext'

/**
 * Custom React hook to access the global application state and reducer dispatch function.
 *
 * @returns {[Object, Function]} Tuple containing the current application state and the dispatch function.
 */
export const useApplicationState = () => useContext(ApplicationStateContext)

