import test, { ExecutionContext } from 'ava'
import { TeamsBadge } from '../badge2'
import { get } from '../pokemon'
import { BadgeId } from '../pokemon/types'
import { forecastBoss, regionBoss, standardBosses, terrainBoss, timeBoss } from '../raid-bosses'

function haveNovelMoves(t: ExecutionContext, pkmn: BadgeId) {
  const badge = new TeamsBadge(pkmn)
  const pokemon = get(pkmn)!
  if (badge.variant === 0) {
    t.fail(`${pkmn} should not be a var0`)
  }
  if (badge.variant !== undefined) {
    const variantSize = pokemon.novelMoves?.length
    t.true(variantSize! > badge.variant,
      `${pkmn} has no novel moves`)
  } else {
    t.pass()
  }
}

test('Every raid boss has apppropriate novelMoves', t => {
  for (const rating of standardBosses) {
    for (const boss of rating) {
      haveNovelMoves(t, boss.species)
    }
  }

  for (const region of Object.values(regionBoss)) {
    for (const rating of Object.values(region)) {
      for (const boss of rating) {
        haveNovelMoves(t, boss.species)
      }
    }
  }

  for (const terrain of Object.values(terrainBoss)) {
    for (const rating of Object.values(terrain)) {
      for (const boss of rating) {
        haveNovelMoves(t, boss.species)
      }
    }
  }

  for (const forecast of Object.values(forecastBoss)) {
    for (const rating of Object.values(forecast)) {
      for (const boss of rating) {
        haveNovelMoves(t, boss.species)
      }
    }
  }

  for (const tod of Object.values(timeBoss)) {
    for (const rating of Object.values(tod)) {
      for (const boss of rating) {
        haveNovelMoves(t, boss.species)
      }
    }
  }
})
