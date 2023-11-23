import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { salamander } from '@fleker/salamander'
import { BadgeId, PokemonId } from '@paas/shared/lib/pokemon/types';
import * as B2 from '@paas/shared/lib/badge2'
import * as B3 from '@paas/shared/lib/badge3'
import { Users } from './db-types';
import { addPokemon, hasPokemon, removePokemon } from './users.utils';
import { get } from '@paas/shared/lib/pokemon';
import * as A from './adventure-log'

const db = salamander(admin.firestore())

interface BankListParams {
  /**
   * Specifies a particular filter for the response. Right now this is not
   * implemented.
   */
  tag?: string
  /**
   * A temporary flag to indicate whether to show the old or new badge strings.
   * This is only a field for output, not internal representation.
   */
  tmp_display_fmt: 'V1' | 'V2'
  /**
   * If a box is provided, the document then becomes `users/<user-id>/archive/pokemon<box>`
   */
  box?: number
}

type BankStructure = {
  [badge in PokemonId]?: number;
};
export type BankOperation = [BadgeId | PokemonId, number]

function isV1Format(badgeId: string) {
  if (badgeId.startsWith('potw')) {
    // Need to convert
    return true
  }
  return false
}

/**
 * Basic LIST/GET operation for system cold storage.
 */
export const bank_list = functions.https.onCall(async (data: BankListParams, context) => {
  const userId = context.auth!.uid
  // Go to /users/<user-id>/archive/pokemon
  const playerCollection = await db.collection('users')
    .doc(userId)
    .collection('archive')
    .doc(`pokemon${data.box || ''}`)
    .get<BankStructure>()
  if (!playerCollection.exists) {
    return {
      pokemon: {},
      notices: ['Your collection is empty.']
    }
  }
  const pokemon = playerCollection.data()
  const output = (() => {
    if (data?.tmp_display_fmt === 'V1') {
      // Convert everything
      const legacyArr: string[] = []
      Object.entries(pokemon).forEach(([key, count]) => {
        const legacyBadge = new B3.Badge(key).toLegacyString()
        for (let i = 0; i < count; i++) {
          legacyArr.push(legacyBadge)
        }
      })
      return {
        legacy: legacyArr,
      }
    } else {
      return pokemon
    }
  })()

  return {
    pokemon: output,
    notices: []
  }
})

interface BankIOParams {
  box?: number
  operations: BankOperation[]
}

/**
 * Write Pokemon into cold storage.
 */
export const bank_deposit = functions.https.onCall(async (data: BankIOParams, context) => {
  const userId = context.auth!.uid
  const notices: string[] = []
  await db.runTransaction(async t => {
    const userDb = db.collection('users').doc(userId)
    const archiveDb = db.collection('users')
      .doc(userId)
      .collection('archive')
      .doc(`pokemon${data.box || ''}`)
    const userDoc = await t.get<Users.Doc>(userDb)
    const archiveDoc = await t.get<BankStructure>(archiveDb)
    const user = userDoc.data()
    const archive = archiveDoc.data() || {}
    if (!Array.isArray(data.operations)) {
      throw new functions.https.HttpsError('failed-precondition',
        'data.operations needs to be an arrray')
    }
    for (const op of data.operations) {
      let badge = op[0]
      const count = op[1]
      if (typeof count !== 'number') {
        throw new functions.https.HttpsError('failed-precondition',
          'Nice try')
      }
      if (count <= 0) {
        notices.push(`Cannot deposit ${count} ${badge}`)
        continue;
      }
      const badge3 = (() => {
        if (isV1Format(badge)) {
          const badge3 = B3.Badge.fromLegacy(badge)
          // Update our search
          console.log(`Using legacy ${badge} for ${badge3.toString()}`)
          badge = badge3.toString() as BadgeId
          return badge3
        }
        return new B3.Badge(badge)
      })()
      const bostr = badge3.toOriginalString()
      const bstr = badge3.toString()
      const bleg = badge3.toLegacyString()
      await A.updatePokedex(t._raw, {
        userId,
        speciesId: bleg,
      })
      // Look up OriginalString, convert to String
      const checkArr: PokemonId[] = Array(count).fill(bostr)
      if (!hasPokemon(user, checkArr)) {
        notices.push(`User does not have ${count} ${bostr}/${bleg}`)
        continue;
      }
      if (get(bleg) === undefined) {
        notices.push(`${badge}/${bleg} is not a valid badge`)
        continue;
      }

      if (bstr in archive) {
        archive[bstr]! += count
      } else {
        archive[bstr] = count
      }
      removePokemon(user, badge3, count)
      notices.push(`Deposited ${badge} as ${bstr}`)
    }
    if (!archiveDoc.exists) {
      t.set(archiveDb, archive)
    } else {
      t.update(archiveDb, archive)
    }
    t.update(userDb, {
      pokemon: user.pokemon,
    })
  })
  return {
    notices,
  }
})

/**
 * Remove Pokemon into cold storage.
 */
 export const bank_withdraw = functions.https.onCall(async (data: BankIOParams, context) => {
  const userId = context.auth!.uid
  const notices: string[] = []
  await db.runTransaction(async t => {
    const userDb = db.collection('users').doc(userId)
    const archiveDb = db.collection('users')
      .doc(userId)
      .collection('archive')
      .doc(`pokemon${data.box || ''}`)
    const userDoc = await t.get<Users.Doc>(userDb)
    const archiveDoc = await t.get<BankStructure>(archiveDb)
    const user = userDoc.data()
    if (!archiveDoc.exists) {
      throw new functions.https.HttpsError('failed-precondition',
        'You cannot withdraw from a non-existent archive')
    }
    const archive = archiveDoc.data()
    if (!Array.isArray(data.operations)) {
      throw new functions.https.HttpsError('failed-precondition',
        'data.operations needs to be an arrray')
    }
    for (const op of data.operations) {
      let badge = op[0]
      const count = op[1]
      if (typeof count !== 'number') {
        throw new functions.https.HttpsError('failed-precondition',
          'Nice try')
      }
      const badge3 = (() => {
        if (isV1Format(badge)) {
          const badge2 = new B2.TeamsBadge(badge)
          const badge3 = B3.Badge.fromLegacy(badge)
          // Update our search
          badge = badge3.toString() as BadgeId
          console.log(`Using legacy ${badge2.toString()} for ${badge3.toString()}`)
          return badge3
        }
        return new B3.Badge(badge)
      })()
      const lookup = badge3.toLegacyString()
      if (get(lookup) === undefined) {
        notices.push(`${badge}/${lookup} is not a valid badge`)
        continue;
      }
      if (archive[badge] === undefined || archive[badge]! < count) {
        notices.push(`User does not have ${count} ${badge}`)
        continue;
      }
      if (count <= 0) {
        notices.push(`Cannot withdraw ${count} ${badge}`)
        continue;
      }
      archive[badge]! -= count
      if (archive[badge]! === 0) {
        notices.push(`Clear entry archive['${badge}']`)
        console.log(`Clear entry archive['${badge}']`)
        delete archive[badge]
      }
      addPokemon(user, badge3, count)
      // const badge3 = badge2To3(new B2.Badge(badge))
      notices.push(`Withdrew ${badge} as ${badge}`)
    }
    t.set(archiveDb, archive)
    t.update(userDb, {
      pokemon: user.pokemon
    })
  })
  return {
    notices,
  }
})
