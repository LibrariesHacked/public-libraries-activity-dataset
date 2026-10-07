import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing monthly click-and-collect interactions.
 */
export class ClickAndCollect extends ActivityRecord {}

const { fetchRecords: getClickAndCollect } = createActivityModel({
  fields: ['month'],
  countProp: 'countInteractions',
  endpoint: './click_and_collect.json',
  RecordClass: ClickAndCollect
})

export { getClickAndCollect }