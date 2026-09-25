import React from 'react'

import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const getChangeIcon = change => {
  if (change <= -0.05) return <TrendingDownRoundedIcon />
  if (change >= 0.05) return <TrendingUpRoundedIcon />
  return <TrendingFlatRoundedIcon />
}

const NumberCard = props => {
  const {
    title,
    number,
    description,
    descriptionIcon,
    change,
    changeDescription,
    colour,
    noData
  } = props

  return (
    <Card
      variant='outlined'
      sx={{ height: '100%', flexGrow: 1, textAlign: 'center' }}
    >
      <CardContent>
        <Typography
          component='h2'
          variant='subtitle2'
          color='text.secondary'
          gutterBottom
        >
          {title}
        </Typography>
        <Stack
          direction='column'
          sx={{
            justifyContent: 'space-between',
            flexGrow: '1',
            gap: 1,
            alignContent: 'center',
            alignItems: 'center'
          }}
        >
          <Stack
            sx={{ justifyContent: 'space-between', alignContent: 'center' }}
          >
            {noData
              ? (
                <Typography
                  variant='h4'
                  color='text.secondary'
                  sx={{ fontWeight: 700 }}
                >
                  No data
                </Typography>
                )
              : (
                <>
                  <Typography
                    variant='h3'
                    color={colour}
                    sx={{ fontWeight: 700 }}
                  >
                    {number}
                  </Typography>
                  <Box>
                    <Chip
                      sx={{ backgroundColor: 'rgb(245, 245, 245)' }}
                      variant='filled'
                      icon={descriptionIcon || <AutoAwesomeRoundedIcon />}
                      label={description}
                    />
                  </Box>
                  {Number.isFinite(change)
                    ? (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          size='small'
                          sx={{ backgroundColor: 'rgb(245, 245, 245)' }}
                          variant='filled'
                          icon={getChangeIcon(change)}
                          label={`${change > 0 ? '+' : ''}${change.toFixed(
                            1
                          )}% ${changeDescription}`}
                        />
                      </Box>
                      )
                    : null}
                </>
                )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default NumberCard
