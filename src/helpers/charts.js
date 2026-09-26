import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Colors
} from 'chart.js'

import { formatMonth } from './periods'

// Register Chart.js components once for the entire application
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Colors
)

/**
 * Options for time-series charts across months.
 */
export const createTimelineChartOptions = (
  title,
  yLeftTitle,
  yRightTitle,
  { stacked = false, interaction } = {}
) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: Boolean(title),
        text: title
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month'
        },
        ticks: {
          callback: function (value) {
            return formatMonth(this.getLabelForValue(value))
          }
        }
      }
    }
  }

  if (interaction) {
    options.interaction = interaction
  }

  if (stacked) {
    options.scales.x.stacked = true
  }

  if (yLeftTitle) {
    options.scales.y = {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: yLeftTitle
      }
    }
    if (stacked) {
      options.scales.y.stacked = true
    }
  }

  if (yRightTitle) {
    options.scales.y1 = {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: yRightTitle
      },
      grid: {
        drawOnChartArea: false
      }
    }
    if (stacked) {
      options.scales.y1.stacked = true
    }
  }

  return options
}

/**
 * Options for horizontal bar charts comparing library services.
 */
export const createServiceBarChartOptions = (
  title,
  xAxisTitle,
  { stacked = false, showLegend = true } = {}
) => {
  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: showLegend
      },
      title: {
        display: Boolean(title),
        text: title
      }
    },
    scales: {
      x: {
        title: {
          display: Boolean(xAxisTitle),
          text: xAxisTitle
        },
        beginAtZero: true,
        stacked
      }
    }
  }

  if (stacked) {
    options.scales.y = {
      stacked: true
    }
  }

  return options
}

/**
 * Appends '(no data)' to labels for services that do not have data for a given metric.
 */
export const formatServiceLabelsWithNoData = (
  labels,
  serviceByNiceName,
  hasDataFn
) => {
  return labels.map(label => {
    const service = serviceByNiceName.get(label)
    return hasDataFn(service) ? label : `${label} (no data)`
  })
}

