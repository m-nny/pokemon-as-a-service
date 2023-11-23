import { ItemId } from "@paas/shared/lib/items-list"

export function getMaxItemsToBuy(playerItems: Partial<Record<ItemId, number>>, item: ItemId, toBuy: number, maxItems?: number): number {
  if (!maxItems) {
    return toBuy
  }
  const ownedItems = playerItems[item] || 0
  return Math.max(Math.min(maxItems - ownedItems, toBuy), 0)
}
