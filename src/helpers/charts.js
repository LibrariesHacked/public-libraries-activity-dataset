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
  Legend
} from 'chart.js'

import { formatMonth } from './periods'

/**
 * ONS & UK Government Analysis Function accessible color palette.
 * Designed for contrast and accessibility on white backgrounds.
 */
export const ONS_PALETTE = [
  '#206095', // Ocean blue (primary ONS chart colour)
  '#28A197', // Turquoise
  '#801650', // Dark pink
  '#F46A25', // Orange
  '#12436D', // Dark blue
  '#A285D1', // Light purple
  '#3D3D3D', // Dark grey
  '#00A3A6', // Aqua teal
  '#672960' // Plum
]

/**
 * Custom Chart.js plugin to apply ONS color palette defaults to datasets.
 */
export const onsColorsPlugin = {
  id: 'onsColors',
  beforeLayout: chart => {
    const { data } = chart
    if (!data || !data.datasets) return

    const isDoughnutOrPie =
      chart.config.type === 'doughnut' || chart.config.type === 'pie'

    data.datasets.forEach((dataset, datasetIndex) => {
      const defaultColor = ONS_PALETTE[datasetIndex % ONS_PALETTE.length]

      if (isDoughnutOrPie) {
        if (!dataset.backgroundColor) {
          dataset.backgroundColor = ONS_PALETTE.slice(
            0,
            data.labels?.length || ONS_PALETTE.length
          )
        }
        if (!dataset.borderColor) {
          dataset.borderColor = '#ffffff'
        }
      } else {
        if (!dataset.backgroundColor) {
          dataset.backgroundColor = defaultColor
        }
        if (!dataset.borderColor) {
          dataset.borderColor = defaultColor
        }
      }
    })
  }
}

// Register Chart.js components and ONS styling plugin once for the entire application
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
  onsColorsPlugin
)

// Set global Chart.js typography and grid defaults per ONS guidance
ChartJS.defaults.font.family = '"Roboto", "Helvetica", "Arial", sans-serif'
ChartJS.defaults.color = '#3d3d3d'
ChartJS.defaults.borderColor = '#e5e7eb'

/**
 * Creates configuration options for monthly time-series charts.
 *
 * Designed in accordance with ONS (Office for National Statistics) visual standards:
 * - Omits redundant 'Month' x-axis label as dates are self-evident
 * - Date x-axis includes tick marks without distracting vertical gridlines
 * - Numeric y-axis starts at zero with an emphasized zero baseline
 * - Value tooltips and axis ticks are formatted with UK thousands separators
 *
 * @param {string} title - Chart title text.
 * @param {string} [yLeftTitle] - Title for the primary left y-axis.
 * @param {string} [yRightTitle] - Title for the optional secondary right y-axis (dual-axis charts).
 * @param {object} [config] - Optional configuration settings.
 * @param {boolean} [config.stacked=false] - Whether datasets should stack on the x and y axes.
 * @param {object} [config.interaction] - Chart.js interaction settings (e.g. tooltip hover mode).
 * @returns {object} Complete Chart.js options configuration object.
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
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8
        }
      },
      title: {
        display: Boolean(title),
        text: title,
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          bottom: 12
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || ''
            if (label) label += ': '
            if (context.parsed.y !== null && context.parsed.y !== undefined) {
              label += Number(context.parsed.y).toLocaleString('en-GB')
            }
            return label
          }
        }
      }
    },
    scales: {
      x: {
        // ONS: Date/time axes should have tick marks, but not gridlines.
        // Omit redundant 'Month' axis title as dates are self-evident.
        grid: {
          display: false
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
      beginAtZero: true,
      title: {
        display: true,
        text: yLeftTitle
      },
      grid: {
        color: context =>
          context.tick && context.tick.value === 0 ? '#707070' : '#e5e7eb',
        lineWidth: context =>
          context.tick && context.tick.value === 0 ? 1.5 : 1
      },
      ticks: {
        callback: value => Number(value).toLocaleString('en-GB')
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
      beginAtZero: true,
      title: {
        display: true,
        text: yRightTitle
      },
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        callback: value => Number(value).toLocaleString('en-GB')
      }
    }
    if (stacked) {
      options.scales.y1.stacked = true
    }
  }

  return options
}

/**
 * Creates configuration options for horizontal bar charts comparing library services.
 *
 * Designed in accordance with ONS (Office for National Statistics) visual standards:
 * - Horizontal layout (`indexAxis: 'y'`) for comfortable reading of long local authority names
 * - Numeric axis (x) always starts at zero with an emphasized zero baseline
 * - Categorical axis (y) disables vertical gridlines to reduce visual clutter
 * - Optional percentage formatting directly on numeric ticks and tooltips
 *
 * @param {string} title - Chart title text.
 * @param {string} xAxisTitle - Title label for the numeric horizontal x-axis.
 * @param {object} [config] - Optional configuration settings.
 * @param {boolean} [config.stacked=false] - Whether horizontal bars should be stacked.
 * @param {boolean} [config.showLegend=true] - Whether to display the chart legend.
 * @param {boolean} [config.isPercentage=false] - When true, appends '%' to tick labels and tooltips.
 * @returns {object} Complete Chart.js options configuration object.
 */
export const createServiceBarChartOptions = (
  title,
  xAxisTitle,
  { stacked = false, showLegend = true, isPercentage = false } = {}
) => {
  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: showLegend,
        labels: {
          usePointStyle: true,
          boxWidth: 8
        }
      },
      title: {
        display: Boolean(title),
        text: title,
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          bottom: 12
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || ''
            if (label) label += ': '
            if (context.parsed.x !== null && context.parsed.x !== undefined) {
              const val = context.parsed.x
              label += isPercentage
                ? `${val}%`
                : Number(val).toLocaleString('en-GB')
            }
            return label
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: Boolean(xAxisTitle),
          text: xAxisTitle
        },
        beginAtZero: true,
        stacked,
        grid: {
          color: context =>
            context.tick && context.tick.value === 0 ? '#707070' : '#e5e7eb',
          lineWidth: context =>
            context.tick && context.tick.value === 0 ? 1.5 : 1
        },
        ticks: {
          callback: value =>
            isPercentage ? `${value}%` : Number(value).toLocaleString('en-GB')
        }
      },
      y: {
        // ONS: Categorical axes should not have gridlines
        grid: {
          display: false
        },
        stacked
      }
    }
  }

  return options
}

/**
 * Sorts library services in descending order by metric value for bar charts.
 *
 * In line with ONS guidance, categories in horizontal bar charts should be sorted
 * from highest to lowest value so readers can quickly compare performance. Services
 * without reported data are grouped at the bottom and sorted alphabetically.
 *
 * @param {Array<object>} services - Array of library service objects to sort.
 * @param {function(object): number} getMetricValue - Function returning the numeric value for a service.
 * @param {function(object): boolean} [hasDataFn] - Optional function returning true if the service has data.
 * @returns {Array<object>} A new sorted array of services.
 */
export const sortServicesByMetric = (services, getMetricValue, hasDataFn) => {
  return [...services].sort((a, b) => {
    const aHasData = hasDataFn ? Boolean(hasDataFn(a)) : true
    const bHasData = hasDataFn ? Boolean(hasDataFn(b)) : true

    // Group services with no data at the bottom
    if (aHasData && !bHasData) return -1
    if (!aHasData && bHasData) return 1

    // If neither has data, order alphabetically
    if (!aHasData && !bHasData) {
      return (a.niceName || '').localeCompare(b.niceName || '')
    }

    // Both have data: sort descending by metric value
    const aVal = getMetricValue(a) || 0
    const bVal = getMetricValue(b) || 0
    if (bVal !== aVal) {
      return bVal - aVal
    }

    // Tie-breaker: alphabetical
    return (a.niceName || '').localeCompare(b.niceName || '')
  })
}

/**
 * Appends '(no data)' to authority labels when a service has no recorded activity.
 *
 * Ensures chart axes clearly communicate missing or unsubmitted data rather than
 * appearing as an unlabelled zero.
 *
 * @param {string[]} labels - Array of service niceName strings.
 * @param {Map<string, object>} serviceByNiceName - Map keyed by niceName returning service objects.
 * @param {function(object): boolean} hasDataFn - Function testing whether a service has valid data.
 * @returns {string[]} Formatted label strings with '(no data)' appended where appropriate.
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
