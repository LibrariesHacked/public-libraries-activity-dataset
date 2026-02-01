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

const ServiceSelection = () => {
  useEffect(() => {
    async function getServices () {
      const services = await serviceModel.getServices()
      const serviceLookup = {}
      services.forEach(service => {
        serviceLookup[service.code] = service
      })
      dispatchApplication({
        type: 'AddServices',
        services,
        serviceLookup
      })
    }
    getServices()
  }, []) // eslint-disable-line

  const [{ services, serviceLookup, filteredServices }, dispatchApplication] =
    useApplicationState() //eslint-disable-line

  const [serviceMenuAnchor, setServiceMenuAnchor] = useState(null)

  const openServiceMenu = element => setServiceMenuAnchor(element)

  const closeServiceMenu = () => setServiceMenuAnchor(null)

  const addService = async service => {
    const newFilteredServices = [...filteredServices, service.code]
    dispatchApplication({
      type: 'SetFilteredServices',
      filteredServices: newFilteredServices
    })
    closeServiceMenu()
  }

  const deleteService = service => {
    const newFilteredServices = filteredServices.filter(fs => fs !== service)
    dispatchApplication({
      type: 'SetFilteredServices',
      filteredServices: newFilteredServices
    })
  }

  const handleClearAll = () => {
    dispatchApplication({
      type: 'SetFilteredServices',
      filteredServices: []
    })
  }

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
