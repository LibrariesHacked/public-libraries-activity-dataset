import React, { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'

import AddChartIcon from '@mui/icons-material/AddchartRounded'
import ClearAllIcon from '@mui/icons-material/ClearAllRounded'

import { useApplicationState } from '../hooks/useApplicationState'

import * as serviceModel from '../models/service'

/**
 * Dropdown menu and chip selection component allowing users to filter data down to
 * specific library services, clear filters, or add statistical nearest neighbour authorities.
 *
 * @returns {JSX.Element} The service selector UI with chips and dropdown menu.
 */
const ServiceSelection = () => {
  const [{ services, serviceLookup, filteredServices }, dispatchApplication] =
    useApplicationState()

  useEffect(() => {
    /**
     * Loads the initial list of library services and registers them in state.
     */
    async function getServices () {
      const serviceRecords = await serviceModel.getServices()
      dispatchApplication({
        type: 'AddServices',
        serviceRecords
      })
    }
    getServices()
  }, [dispatchApplication])

  const [serviceMenuAnchor, setServiceMenuAnchor] = useState(null)

  /**
   * Opens the service selection menu anchored to the specified DOM element.
   *
   * @param {HTMLElement} element - Target button element.
   */
  const openServiceMenu = element => setServiceMenuAnchor(element)

  /**
   * Closes the service selection menu.
   */
  const closeServiceMenu = () => setServiceMenuAnchor(null)

  /**
   * Adds a library service to the active filter comparison list.
   *
   * @param {import('../models/service').Service} service - Selected library service.
   */
  const addService = async service => {
    const newFilteredServices = [...filteredServices, service.code]
    dispatchApplication({
      type: 'SetFilteredServices',
      filteredServices: newFilteredServices
    })
    closeServiceMenu()
  }

  /**
   * Removes a specific library service from the active filter list.
   *
   * @param {string} service - Service code to remove.
   */
  const deleteService = service => {
    const newFilteredServices = filteredServices.filter(fs => fs !== service)
    dispatchApplication({
      type: 'SetFilteredServices',
      filteredServices: newFilteredServices
    })
  }

  /**
   * Clears all service filters, resetting the view to display all library authorities.
   */
  const handleClearAll = () => {
    dispatchApplication({
      type: 'SetFilteredServices',
      filteredServices: []
    })
  }

  /**
   * Automatically adds the CIPFA nearest statistical neighbours of the currently
   * selected service to form a benchmark comparison group.
   */
  const handleNearestNeighbours = () => {
    if (filteredServices && filteredServices.length === 1) {
      const service = serviceLookup[filteredServices[0]]
      const nearestNeighbours = service.nearestNeighbours || []
      const newFilteredServices = Array.from(
        new Set([...filteredServices, ...nearestNeighbours])
      )
      dispatchApplication({
        type: 'SetFilteredServices',
        filteredServices: newFilteredServices
      })
    }
  }


  return (
    <>
      <Tooltip title='Add library service to comparison group'>
        <Button
          size='large'
          color='primary'
          onClick={e => openServiceMenu(e.currentTarget)}
          startIcon={<AddChartIcon />}
        >
          Select service
        </Button>
      </Tooltip>
      <Menu
        id='menu-library-service'
        anchorEl={serviceMenuAnchor}
        keepMounted
        open={Boolean(serviceMenuAnchor)}
        onClose={() => closeServiceMenu()}
      >
        {services &&
          services
            .sort((a, b) => a.niceName.localeCompare(b.niceName))
            .map(s => {
              return (
                <MenuItem
                  key={'mnu_itm_org_' + s.code}
                  onClick={() => addService(s)}
                >
                  {s.niceName}
                </MenuItem>
              )
            })}
      </Menu>
      <Box>
        {!filteredServices || filteredServices.length === 0
          ? (
            <Chip
              label='Displaying all available services'
              color='secondary'
              variant='outlined'
              sx={{ mx: 0.5 }}
            />
            )
          : null}
        {filteredServices &&
          filteredServices.length > 0 &&
          filteredServices.map(s => {
            return (
              <Chip
                key={'chip_itm_org_' + s}
                label={serviceLookup[s] ? serviceLookup[s].niceName : s}
                onDelete={() => deleteService(s)}
                color='primary'
                variant='filled'
                sx={{ mx: 0.5, mb: 1 }}
              />
            )
          })}
        {filteredServices && filteredServices.length > 1
          ? (
            <IconButton variant='text' color='secondary' onClick={handleClearAll}>
              <ClearAllIcon />
            </IconButton>
            )
          : null}
        <Box sx={{ display: 'block' }}>
          {filteredServices && filteredServices.length === 1
            ? (
              <Button
                variant='text'
                color='secondary'
                onClick={handleNearestNeighbours}
              >
                Add nearest neighbours
              </Button>
              )
            : null}
        </Box>
      </Box>
    </>
  )
}

export default ServiceSelection
