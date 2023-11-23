import test from 'ava'
import { Badge, MATCH_GTS, Pokemon } from '.@paas/shared/lib/badge3'
import { PokemonId } from '.@paas/shared/lib/pokemon/types'
import { Users } from '../db-types'
import { addPokemon, calculateNetWorth, hasPokemon, hasPokemonFuzzy, removePokemon } from '../users.utils'
import * as P from '.@paas/shared/lib/gen/type-pokemon-ids'

const user: Users.Doc = {
  eggs: [],
  hiddenItemsFound: [],
  items: {},
  lastPokeball: 0,
  ldap: 'placeholder',
  battleStadiumRecord: [0, 0, 0, 0],
  location: 'US-MTV',
  raidRecord: [0, 0, 0, 0],
  settings: {
    disableRealtime: false,
    disableSyncTeams: false,
    pokeindex: false,
    union: false,
    theme: 'default',
    flagSearch2: false,
    flagTag: false,
    flagAchievementService: false,
    flagLocation2: false,
    notification: {
      BATTLE_LEADERBOARD: {inapp: true, push: true},
      GTS_COMPLETE: {inapp: true, push: true},
      ITEM_DISPENSE: {inapp: true, push: true},
      RAID_CLAIM: {inapp: true, push: true},
      RAID_COMPLETE: {inapp: true, push: true},
      RAID_EXPIRE: {inapp: true, push: true},
      RAID_RESET: {inapp: true, push: true},
      VOYAGE_COMPLETE: {inapp: true, push: true},
      PLAYER_EVENT: {inapp: true, push: true},
      GAME_EVENT: {inapp: true, push: true},
    }
  },
  strikes: 0,
  moveTutors: 0,
  eggsLaid: 0,
  pokemon: {},
}

test('User wealth general', t => {
  user.items = {
    greatball: 2,
    ultraball: 2,
  }
  t.is(calculateNetWorth(user as Users.Doc), 18)
})

test('User wealth Poké Balls', t => {
  user.items = {
    pokeball: 10,
    raidpass: 2,
  }
  t.is(calculateNetWorth(user as Users.Doc), 12)
})

test('User wealth negative', t => {
  user.items = {
    greatball: -2,
    pokeball: 10
  }
  t.is(calculateNetWorth(user as Users.Doc), 4)
})

test('User wealth NaN', t => {
  user.items = {
    greatball: NaN,
    pokeball: 10
  }
  t.is(calculateNetWorth(user as Users.Doc), 10)
})

test('hasPokemon', t => {
  user.pokemon = {
    ['1#Yf_4']: 1,
    ['2#Yf_4']: 1,
    ['3#Yf_4']: 2,
    ['4#Yf_4']: 1,
    ['7#3Yf_4' as PokemonId]: 1, // Squirtle w/MasterBall
  }
  t.true(hasPokemon(user as Users.Doc, '1#Yf_4'), 'Should have a Bulbasaur')
  t.true(hasPokemon(user as Users.Doc, ['1#Yf_4', '2#Yf_4']), 'Should have both Pkmn')
  t.true(hasPokemon(user as Users.Doc, '3#Yf_4'), 'Should have Venusaur in new format')
  t.true(hasPokemon(user as Users.Doc, ['3#Yf_4', '4#Yf_4']), 'Should have both new format')

  t.false(hasPokemon(user as Users.Doc, 'potw-010' as PokemonId), 'Should not have Caterpie')
  t.false(hasPokemon(user as Users.Doc, ['potw-001', 'potw-001'] as unknown as PokemonId[]), 'Should not have 2 Bulbas')
  t.false(hasPokemon(user as Users.Doc, ['4#Yf_4', '4#Yf_4'] as unknown as PokemonId[]), 'Only has one Charm')
  t.false(hasPokemon(user as Users.Doc, ['5#Yf_4'] as unknown as PokemonId[]), 'Does not have any Charmeleons')
})

test('hasPokemonFuzzy', t => {
  user.pokemon = {
    ['1#Yf_4']: 1,
    ['2#Yf_4']: 1,
    ['3#Yf_4']: 2,
    ['4#Yf_4']: 1,
    ['4#3Yf_4' as PokemonId]: 1, // Charm w/MasterBall
    ['7#3Yf_4' as PokemonId]: 1, // Squirtle w/MasterBall
    ['a#Yf_5' as PokemonId]: 1, // Caterpie in NYC
    ['2q#Yf_4' as PokemonId]: 5, // Meganium
    ['2q#YL_4' as PokemonId]: 1, // Fancy Meganium
  }
  const squirtMatch = Badge.match('7#Yf_4', ['7#3Yf_4'] as unknown as PokemonId[], MATCH_GTS)
  t.true(squirtMatch.match, 'SquirtMatch failed')
  t.is('7#3Yf_4', squirtMatch.result, 'SquirtMatch matched wrong')
  t.true(hasPokemonFuzzy(user as Users.Doc, '1#Yf_4'), 'Should have a Bulbasaur')
  t.true(hasPokemonFuzzy(user as Users.Doc, '7#Yf_4'), 'Should match Squirtle')
  t.true(hasPokemonFuzzy(user as Users.Doc, ['4#Yf_4', '4#Yf_4'] as unknown as PokemonId[]), 'Should have two valid Charm')
  t.true(hasPokemonFuzzy(user as Users.Doc, 'a#Yf_4'), 'Should have a valid Caterpie')
  t.true(hasPokemonFuzzy(user as Users.Doc, ['2q#Yf_4', '2q#YL_4' as PokemonId]), 'Should have both Meganium')

  t.false(hasPokemonFuzzy(user as Users.Doc, ['5#Yf_4'] as unknown as PokemonId[]), 'Does not have any Charmeleons')
})

// With FieldValues, the behavior here is not quite highly testable.
test.skip('Add/Remove Pokemon', t => {
  user.pokemon = {
    '1#Yf_4': 1,
    '2#Yf_4': 1,
  }

  const ivysaur = new Badge(Pokemon(P.Ivysaur))
  addPokemon(user, ivysaur, 2)
  t.deepEqual(user.pokemon, {
    '2#Yf_4': 3
  })

  removePokemon(user, ivysaur, 2)
  t.deepEqual(user.pokemon, {
    '2#Yf_4': 1
  })

  const venusaur = new Badge(Pokemon(P.Venusaur))
  t.throws(() => {
    removePokemon(user, venusaur)
  })

  addPokemon(user, venusaur)
  t.deepEqual(user.pokemon, {
    '2#Yf_4': 1,
    '3#Yf_4': 1,
  })

  // Verify getting to zero removes map entry
  removePokemon(user, venusaur)
  t.deepEqual(user.pokemon, {
    '2#Yf_4': 1,
  }, 'Venusaur entry should be removed.')
})
