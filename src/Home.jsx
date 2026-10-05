import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded'

import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'

import homeMd from './content/home.md?raw'

import CardGrid from './components/CardGrid'

/**
 * Summary landing page view presenting introductory markdown guidance,
 * a policy briefing shortcut banner, and an overview grid of key library
 * performance indicator summary cards across all domains.
 *
 * @returns {JSX.Element} The rendered summary page view.
 */
const Home = () => {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Markdown>{homeMd}</Markdown>
      </Box>

      <Paper
        variant='outlined'
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          backgroundColor: 'rgba(25, 118, 210, 0.04)',
          borderColor: 'primary.light',
          borderRadius: 2
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' }
          }}
        >
          <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
            <SummarizeRoundedIcon color='primary' sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                National estimates
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Estimated totals for England, comparisons across years, and regional breakdowns.
              </Typography>
            </Box>
          </Stack>
          <Button
            component={Link}
            to='/national-estimates'
            variant='contained'
            size='small'
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            View estimates
          </Button>
        </Stack>
      </Paper>

      <CardGrid />
    </Box>
  )
}

export default Home
