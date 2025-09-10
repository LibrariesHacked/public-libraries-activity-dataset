import React, { useState, useEffect } from 'react'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'

import BusinessIcon from '@mui/icons-material/BusinessRounded'

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

  return (
    <>
      <Tooltip title='Add library service to comparison group'>
        <Button
          size='large'
          color='primary'
          onClick={e => openServiceMenu(e.currentTarget)}
          startIcon={<BusinessIcon />}
        >
          Select library authority
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
    </>
  )
}

export default ServiceSelection
