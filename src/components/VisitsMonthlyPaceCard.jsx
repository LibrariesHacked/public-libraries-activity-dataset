import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'

import * as visitsModel from '../models/visits'

import MonthlyPaceCard from './MonthlyPaceCard'

/**
 * Summary KPI card component displaying average monthly library visits,
 * along with average visits logged per day and period-over-period trend analysis.
 *
 * @returns {JSX.Element} NumberCard configured for monthly library visit pace.
 */
const VisitsMonthlyPaceCard = () => {
  return (
    <MonthlyPaceCard
      recordsKey='visits'
      countProp='countVisits'
      actionType='SetVisits'
      fetcher={visitsModel.getVisits}
      title='Monthly visits'
      unit='visits'
      icon={CalendarMonthRoundedIcon}
      colour='chartGreen'
    />
  )
}

export default VisitsMonthlyPaceCard
