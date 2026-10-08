import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'

import * as wifiModel from '../models/wifi'

import MonthlyPaceCard from './MonthlyPaceCard'

/**
 * Summary KPI card component displaying average monthly public Wi-Fi sessions,
 * along with average Wi-Fi sessions logged per day and period-over-period trend analysis.
 *
 * @returns {JSX.Element} NumberCard configured for monthly Wi-Fi usage pace.
 */
const WiFiMonthlyPaceCard = () => {
  return (
    <MonthlyPaceCard
      recordsKey='wifi'
      countProp='countSessions'
      actionType='SetWiFi'
      fetcher={wifiModel.getWiFi}
      title='Monthly Wi-Fi sessions'
      unit='sessions'
      icon={CalendarMonthRoundedIcon}
      colour='chartYellow'
    />
  )
}

export default WiFiMonthlyPaceCard
