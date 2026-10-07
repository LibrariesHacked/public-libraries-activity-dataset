import { ActivityRecord, createActivityModel } from './activityFactory'

/**
 * Domain model representing annual public computer and device inventory figures.
 */
export class ComputerInventory extends ActivityRecord {}

const { fetchRecords: getComputerInventory } = createActivityModel({
  fields: ['measure', 'period'],
  countProp: 'countInventory',
  endpoint: './computer_inventory.json',
  RecordClass: ComputerInventory
})

export { getComputerInventory }