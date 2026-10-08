import React, { useState, useEffect, useMemo } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import AddChartIcon from '@mui/icons-material/AddchartRounded'
import ClearAllIcon from '@mui/icons-material/ClearAllRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded'

import { useApplicationState } from '../hooks/useApplicationState'

import * as serviceModel from '../models/service'

/**
 * Top-level comparator selection component allowing users to choose between:
 * - Comparing individual library services (one to many)
 * - Comparing geographic regions (one to many)
 *
 * @returns {JSX.Element} The comparison selector UI.
 */
const ServiceSelection = () => {
  const [
    {
      services,
      serviceLookup,
      comparisonMode,
      selectedServices,
      selectedRegions
    },
    dispatchApplication
  ] = useApplicationState()

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
  const [regionMenuAnchor, setRegionMenuAnchor] = useState(null)

  const activeMode = comparisonMode || 'services'

  /**
   * Switches the active top-level comparison mode.
   *
   * @param {React.MouseEvent} event - Click event.
   * @param {'services'|'regions'|null} newMode - New comparison mode.
   */
  const handleComparisonModeChange = (event, newMode) => {
    if (!newMode) return
    dispatchApplication({
      type: 'SetComparisonMode',
      comparisonMode: newMode
    })
  }

  // ---------------------------------------------------------------------------
  // Region Helpers & Handlers
  // ---------------------------------------------------------------------------
  const availableRegions = useMemo(
    () => serviceModel.getAvailableRegions(services || []),
    [services]
  )

  const regionCounts = useMemo(() => {
    const counts = {}
    if (services) {
      services.forEach(s => {
        if (s.region) {
          counts[s.region] = (counts[s.region] || 0) + 1
        }
      })
    }
    return counts
  }, [services])

  const addRegion = region => {
    const current = selectedRegions || []
    if (!current.includes(region)) {
      dispatchApplication({
        type: 'SetSelectedRegions',
        selectedRegions: [...current, region]
      })
    }
    setRegionMenuAnchor(null)
  }

  const deleteRegion = region => {
    const next = (selectedRegions || []).filter(r => r !== region)
    dispatchApplication({
      type: 'SetSelectedRegions',
      selectedRegions: next
    })
  }

  const clearRegions = () => {
    dispatchApplication({
      type: 'SetSelectedRegions',
      selectedRegions: []
    })
  }

  // ---------------------------------------------------------------------------
  // Individual Services Handlers
  // ---------------------------------------------------------------------------
  const addService = service => {
    const current = selectedServices || []
    if (!current.includes(service.code)) {
      dispatchApplication({
        type: 'SetSelectedServices',
        selectedServices: [...current, service.code]
      })
    }
    setServiceMenuAnchor(null)
  }

  const deleteService = serviceCode => {
    const next = (selectedServices || []).filter(s => s !== serviceCode)
    dispatchApplication({
      type: 'SetSelectedServices',
      selectedServices: next
    })
  }

  const clearServices = () => {
    dispatchApplication({
      type: 'SetSelectedServices',
      selectedServices: []
    })
  }

  /**
   * Shortcut to automatically add the statistical nearest neighbours of the currently
   * selected service to form a benchmark comparison group.
   */
  const handleNearestNeighbours = () => {
    if (selectedServices && selectedServices.length === 1) {
      const service = serviceLookup?.[selectedServices[0]]
      const neighbours = service?.nearestNeighbours || []
      if (neighbours.length === 0) return
      const nextServices = Array.from(
        new Set([...selectedServices, ...neighbours])
      )
      dispatchApplication({
        type: 'SetSelectedServices',
        selectedServices: nextServices
      })
    }
  }

  // Derived state for display
  const hasSelectedServices = selectedServices && selectedServices.length > 0
  const hasSelectedRegions = selectedRegions && selectedRegions.length > 0
  const singleService =
    selectedServices && selectedServices.length === 1
      ? serviceLookup?.[selectedServices[0]]
      : null
  const canAddNearestNeighbours = Boolean(
    singleService?.nearestNeighbours?.length
  )

  const sortedServices = useMemo(() => {
    if (!services) return []
    return [...services].sort((a, b) => a.niceName.localeCompare(b.niceName))
  }, [services])

  return (
    <Box sx={{ width: '100%', mt: 1, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Top-level comparison mode toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
        <Paper
          variant='outlined'
          sx={{
            display: 'inline-flex',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <ToggleButtonGroup
            value={activeMode}
            exclusive
            onChange={handleComparisonModeChange}
            aria-label='Grouping option'
            sx={{
              border: 'none',
              borderRadius: 0,
              '& .MuiToggleButtonGroup-grouped': {
                border: 'none',
                borderRadius: 0,
                borderRight: '1px solid',
                borderColor: 'divider',
                '&:last-of-type': {
                  borderRight: 'none'
                },
                '&:not(:first-of-type)': {
                  marginLeft: 0
                }
              }
            }}
          >
            <ToggleButton
              value='services'
              aria-label='Group by service'
              sx={{ px: 3, minWidth: 135, minHeight: 44 }}
            >
              <LocationCityRoundedIcon sx={{ mr: 1, fontSize: 20 }} />
              By service
            </ToggleButton>
            <ToggleButton
              value='regions'
              aria-label='Group by region'
              sx={{ px: 3, minWidth: 135, minHeight: 44 }}
            >
              <HubRoundedIcon sx={{ mr: 1, fontSize: 20 }} />
              By region
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      </Box>

      {/* Mode 1: Individual Services Comparison */}
      {activeMode === 'services' && (
        <>
          <Stack
            direction='row'
            spacing={1.5}
            sx={{ justifyContent: 'center', alignItems: 'center', mb: 1, width: '100%' }}
          >
            <Tooltip title='Add library service to comparison group'>
              <Button
                size='small'
                variant='contained'
                color='primary'
                onClick={e => setServiceMenuAnchor(e.currentTarget)}
                startIcon={<AddChartIcon fontSize='small' />}
              >
                Add service
              </Button>
            </Tooltip>
            {canAddNearestNeighbours && (
              <Tooltip title={`Add nearest statistical neighbours for ${singleService.niceName}`}>
                <Button
                  size='small'
                  variant='outlined'
                  color='primary'
                  startIcon={<GroupsRoundedIcon fontSize='small' />}
                  onClick={handleNearestNeighbours}
                >
                  Add nearest neighbours
                </Button>
              </Tooltip>
            )}
            {hasSelectedServices && (
              <Button
                size='small'
                variant='text'
                color='primary'
                startIcon={<ClearAllIcon fontSize='small' />}
                onClick={clearServices}
              >
                Clear all ({selectedServices.length})
              </Button>
            )}
          </Stack>

          <Menu
            id='menu-library-service'
            anchorEl={serviceMenuAnchor}
            keepMounted
            open={Boolean(serviceMenuAnchor)}
            onClose={() => setServiceMenuAnchor(null)}
          >
            {sortedServices.map(s => (
              <MenuItem
                key={'mnu_svc_' + s.code}
                onClick={() => addService(s)}
                disabled={selectedServices?.includes(s.code)}
              >
                {s.niceName}
              </MenuItem>
            ))}
          </Menu>

          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {!hasSelectedServices ? (
              <Typography variant='body2' color='text.secondary' sx={{ py: 1 }}>
                Displaying all services
              </Typography>
            ) : (
              <Stack
                direction='row'
                spacing={1}
                useFlexGap
                flexWrap='wrap'
                sx={{ justifyContent: 'center', alignItems: 'center', py: 0.5, maxWidth: '100%' }}
              >
                {selectedServices.map(code => (
                  <Chip
                    key={'chip_svc_' + code}
                    label={serviceLookup?.[code]?.niceName || code}
                    onDelete={() => deleteService(code)}
                    color='primary'
                    variant='filled'
                    size='small'
                  />
                ))}
              </Stack>
            )}
          </Box>
        </>
      )}

      {/* Mode 2: Regions Comparison */}
      {activeMode === 'regions' && (
        <>
          <Stack
            direction='row'
            spacing={1.5}
            sx={{ justifyContent: 'center', alignItems: 'center', mb: 1, width: '100%' }}
          >
            <Tooltip title='Add region to comparison group'>
              <Button
                size='small'
                variant='contained'
                color='primary'
                onClick={e => setRegionMenuAnchor(e.currentTarget)}
                startIcon={<HubRoundedIcon fontSize='small' />}
              >
                Add region
              </Button>
            </Tooltip>
            {hasSelectedRegions && (
              <Button
                size='small'
                variant='text'
                color='primary'
                startIcon={<ClearAllIcon fontSize='small' />}
                onClick={clearRegions}
              >
                Clear all ({selectedRegions.length})
              </Button>
            )}
          </Stack>

          <Menu
            id='menu-region-selection'
            anchorEl={regionMenuAnchor}
            keepMounted
            open={Boolean(regionMenuAnchor)}
            onClose={() => setRegionMenuAnchor(null)}
          >
            {availableRegions.map(region => (
              <MenuItem
                key={'mnu_reg_' + region}
                onClick={() => addRegion(region)}
                disabled={selectedRegions?.includes(region)}
              >
                {region} {regionCounts[region] ? `(${regionCounts[region]} services)` : ''}
              </MenuItem>
            ))}
          </Menu>

          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {!hasSelectedRegions ? (
              <Typography variant='body2' color='text.secondary' sx={{ py: 1 }}>
                Displaying all regions
              </Typography>
            ) : (
              <Stack
                direction='row'
                spacing={1}
                useFlexGap
                flexWrap='wrap'
                sx={{ justifyContent: 'center', alignItems: 'center', py: 0.5, maxWidth: '100%' }}
              >
                {selectedRegions.map(region => (
                  <Chip
                    key={'chip_reg_' + region}
                    label={`${region} (${regionCounts[region] || 0})`}
                    onDelete={() => deleteRegion(region)}
                    color='primary'
                    variant='filled'
                    size='small'
                  />
                ))}
              </Stack>
            )}
          </Box>

        </>
      )}
    </Box>
  )
}

export default ServiceSelection
