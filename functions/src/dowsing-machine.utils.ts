import { BadgeId } from "@paas/shared/lib/pokemon/types";
import { ItemId } from "@paas/shared/lib/items-list";

export const oneWeekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).getTime()

export interface OptCapt {
  species: BadgeId
  item?: ItemId
  html: string
}
