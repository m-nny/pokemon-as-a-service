import test from 'ava'
import { optionallyRecycle } from '../recycler'
import { Potw } from '.@paas/shared/lib/badge2'
import { AZELF, SHAYMIN, UXIE } from '.@paas/shared/lib/legendary-quests'
import { BadgeId } from '.@paas/shared/lib/pokemon/types'
import * as P from '.@paas/shared/lib/gen/type-pokemon'
import { ItemId } from '.@paas/shared/lib/items-list'

const items: Partial<Record<ItemId, number>> = {
  pokeball: 1,
}

test('Nothing to be recycled', t => {
  const obtained = [AZELF, UXIE]
  const currentBadges: BadgeId[] = [P.Azelf, P.Uxie]
  const {needsUpdate, hiddenItemsFound} = optionallyRecycle(obtained, currentBadges, items)
  t.false(needsUpdate)
  t.deepEqual(hiddenItemsFound, [AZELF, UXIE])
})

test('Reset a pixie', t => {
  const obtained = [AZELF, UXIE]
  const currentBadges: BadgeId[] = [P.Azelf]
  const {needsUpdate, hiddenItemsFound} = optionallyRecycle(obtained, currentBadges, items)
  t.true(needsUpdate)
  t.deepEqual(hiddenItemsFound, [AZELF])
})

test('Do not reset formed Shaymin', t => {
  const obtained = [SHAYMIN]
  const currentBadges: BadgeId[] = [Potw(P.Shaymin, {form: 'sky'})]
  const {needsUpdate, hiddenItemsFound} = optionallyRecycle(obtained, currentBadges, items)
  t.false(needsUpdate)
  t.deepEqual(hiddenItemsFound, [SHAYMIN])
})
