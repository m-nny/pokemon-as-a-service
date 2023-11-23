import { raidBattleSettings as sharedSettings, SharedRaidSetting } from "@paas/shared/lib/raid-settings";


export interface RaidBattleSetting extends SharedRaidSetting {
  /**
   * Custom messages to give when the boss drops below a certain percentage at the end of a turn
   */
  pctLogs: Array<Array<number | string>>;
  /**
   * If true, players must manually claim prizes after raid.
   */
  mandateClaim: boolean;
}

export const raidBattleSettings: RaidBattleSetting[] = [
  // 0-Star. Not used.
  {
    ...sharedSettings[0],
    pctLogs: [],
    mandateClaim: false,
  },
  // 1-Star
  {
    ...sharedSettings[1],
    pctLogs: [
      [0.5, 'The opponent is growing frustrated!'],
    ],
    mandateClaim: false,
  },
  // 2-Star
  {
    ...sharedSettings[2],
    pctLogs: [
      [0.25, 'The opponent is looking tired. It is acting more aggressively!']
    ],
    mandateClaim: false,
  },
  // 3-Star
  {
    ...sharedSettings[3],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more aggressively!']
    ],
    mandateClaim: false,
  },
  // 4-Star
  {
    ...sharedSettings[4],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more aggressively!']
    ],
    mandateClaim: false,
  },
  // 5-Star
  {
    ...sharedSettings[5],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more defensively!'],
      [0.33, 'The opponent is looking exhausted. It is acting more aggressively!'],
    ],
    mandateClaim: true,
  },
  // 6-Star
  {
    ...sharedSettings[6],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more defensively!'],
      [0.15, 'The opponent is looking exhausted. It is acting more aggressively!'],
    ],
    mandateClaim: true,
  },
  // 7-Star (Tiny Raids)
  {
    ...sharedSettings[7],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more defensively!'],
    ],
    mandateClaim: true,
  },
  // 8-Star (Expert Raids)
  {
    ...sharedSettings[8],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more aggressively!'],
    ],
    mandateClaim: true,
  },
  // 9-Star (Grand Underground Raids)
  {
    ...sharedSettings[9],
    pctLogs: [
      [0.67, 'The opponent is looking endangered. It is acting more aggressively!'],
      [0.1, 'The opponent is looking extinct. It is acting more assertive!'],
    ],
    mandateClaim: true,
  },
  // 10-Star (Legendary Raids)
  {
    ...sharedSettings[10],
    pctLogs: [
      [0.5, 'The opponent is growing tired but not finished. It is acting more aggressively!'],
      [0.33, 'The opponent has become enraged. It is acting more assertive!'],
    ],
    mandateClaim: true,
  },
  // 11-Star (Voyage Raids)
  {
    ...sharedSettings[11],
    pctLogs: [
      [0.5, 'The opponent is growing tired but not finished. It is acting more aggressively!'],
      [0.33, 'The opponent has become enraged. It is acting more assertive!'],
    ],
    mandateClaim: true,
  },
];
