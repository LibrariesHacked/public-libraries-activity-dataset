import React from 'react'

import InsightsIcon from '@mui/icons-material/Insights'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const NumberCard = props => {
  const { title, number, description, descriptionIcon } = props

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
            <Typography variant='h3' color='primary' sx={{ fontWeight: 700 }}>
              {number}
            </Typography>
            <Box>
              <Chip
                color='secondary'
                variant='outlined'
                icon={descriptionIcon || <InsightsIcon />}
                label={description}
              />
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default NumberCard
