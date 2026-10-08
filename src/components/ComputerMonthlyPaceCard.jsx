import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'

import * as computersModel from '../models/computers'

import MonthlyPaceCard from './MonthlyPaceCard'

/**
 * Summary KPI card component displaying average monthly public computer access hours,
 * along with average computer hours logged per day and period-over-period trend analysis.
 *
 * @returns {JSX.Element} NumberCard configured for monthly computer usage pace.
 */
const ComputerMonthlyPaceCard = () => {
  return (
    <MonthlyPaceCard
      recordsKey='computers'
      countProp='countHours'
      actionType='SetComputers'
      fetcher={computersModel.getComputers}
      title='Monthly computer hours'
      unit='hours'
      icon={CalendarMonthRoundedIcon}
      colour='chartBlue'
    />
  )
}

export default ComputerMonthlyPaceCard
