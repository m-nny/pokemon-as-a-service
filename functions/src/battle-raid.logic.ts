import { Badge } from "@paas/shared/lib/badge3";
import {
  BattleOptions,
  ExecuteLog,
  execute,
} from "@paas/shared/lib/battle/battle-controller";
import { Inventory } from "@paas/shared/lib/battle/inventory";
import { Movepool } from "@paas/shared/lib/battle/movepool";
import {
  moveSelection,
  statAdjustment,
  targetSelection,
} from "@paas/shared/lib/battle/natures";
import { ConditionMap } from "@paas/shared/lib/battle/status";
import { Pokemon } from "@paas/shared/lib/battle/types";
import { ItemId } from "@paas/shared/lib/items-list";
import { Location } from "@paas/shared/lib/locations-list";
import * as Pkmn from "@paas/shared/lib/pokemon";
import { BadgeId, PokemonDoc } from "@paas/shared/lib/pokemon/types";
import { bossHeldItem } from "@paas/shared/lib/raid-bosses";
import { raidBattleSettings } from "./battle-raid.logic.utils";

// There is no Mega Evolution exception here.
export function buffRaidBoss(opponentPokemon, rating) {
  raidBattleSettings[rating].buff(opponentPokemon);
}

export async function matchup(
  players: Badge[],
  heldItems: ItemId[],
  opponent: BadgeId,
  rating: number,
  location: Location
): Promise<ExecuteLog> {
  const playerPokemon = players.map((badge, index) => {
    const data = { ...Pkmn.get(badge.toLegacyString()) } as PokemonDoc;
    const pkmn: Pokemon = {
      ...data,
      badge: badge,
      fainted: false,
      totalHp: (data.hp || 50) * 4,
      currentHp: (data.hp || 50) * 4,
      movepool: data.move.map((move) => Movepool[move] || Movepool.Tackle),
      heldItem: Inventory[heldItems[index]],
      heldItemKey: heldItems[index] as ItemId,
      heldItemConsumed: false,
      heldItemTotallyConsumed: false,
      statBuffs: {
        attack: 0,
        defense: 0,
        spAttack: 0,
        spDefense: 0,
        speed: 0,
        accuracy: 0,
        evasiveness: 0,
        criticalHit: 0,
      },
      targetingLogic: targetSelection[badge.personality.nature ?? "Hardy"],
      moveLogic: moveSelection[badge.personality.nature ?? "Hardy"],
      conditions: [{ ...ConditionMap.OnField }],
    };
    const { buff, nerf } = statAdjustment[badge.personality.nature ?? "Hardy"];
    if (buff) {
      pkmn[buff] *= 1.1;
    }
    if (nerf) {
      pkmn[nerf] /= 1.1;
    }
    const size = badge.size;
    pkmn.weight *= { xxs: 0.8, xxl: 1.2, n: 1 }[size ?? "n"];
    return pkmn;
  });

  const data = { ...Pkmn.get(opponent) } as PokemonDoc;
  const bossHeldItemKey = bossHeldItem[opponent] || "lum";
  const opponentPokemon: Pokemon = {
    ...Pkmn.get(opponent)!,
    badge: Badge.fromLegacy(opponent),
    fainted: false,
    totalHp: (data.hp || 50) * 4,
    currentHp: (data.hp || 50) * 4,
    movepool: data.move.map((move) => Movepool[move] || Movepool.Tackle),
    heldItem: Inventory[bossHeldItemKey],
    heldItemKey: bossHeldItemKey,
    heldItemConsumed: false,
    heldItemTotallyConsumed: false,
    statBuffs: {
      attack: 0,
      defense: 0,
      spAttack: 0,
      spDefense: 0,
      speed: 0,
      accuracy: 0,
      evasiveness: 0,
      criticalHit: 1,
    },
    conditions: [{ ...ConditionMap.Raid }, { ...ConditionMap.OnField }],
  };
  if (opponent.includes("-totem")) {
    opponentPokemon.conditions.push({ ...ConditionMap.RaidTotem });
  }
  if (opponent.includes("-alpha")) {
    opponentPokemon.conditions.push({ ...ConditionMap.RaidAlpha });
  }
  if (opponent.includes("-noble")) {
    opponentPokemon.conditions.push({ ...ConditionMap.RaidNoble });
  }
  // Raid bosses have no explicit size modifier
  // Buff Raid Boss
  buffRaidBoss(opponentPokemon, rating);

  const options: BattleOptions = {
    opponentMoves: raidBattleSettings[rating].moves,
    startMsg: `A ${opponentPokemon.species} has appeared and lets out a loud cry! It is dramatically larger than it should be!`,
    lossMsg: `The ${opponentPokemon.species} was overwhelming!`,
    victoryMsg: `The ${opponentPokemon.species} was defeated! It reverted to normal size!`,
    moveLogic: raidBattleSettings[rating].moveLogic,
    targetingLogic: raidBattleSettings[rating].targetingLogic,
    pctLogs: [...raidBattleSettings[rating].pctLogs],
  };
  return execute(playerPokemon, [opponentPokemon], options, location, {
    fieldSize: -1,
    partySize: -1,
    maxWins: 0,
    mega: true,
    zmoves: true,
  });
}
