// Quick test for Final Showdown with faster timing
// This is a development-only test file to verify the system works

import { finalShowdownSystem, GameTimer, ShowdownState } from '@rts-arena/core';

// For testing, you can temporarily modify these constants in final-showdown.ts:
// const PHASE_WARNING_TIME = 10; // 10 seconds instead of 120
// const PHASE_COLLAPSE_TIME = 15; // 15 seconds instead of 135
// const PHASE_SHOWDOWN_TIME = 20; // 20 seconds instead of 150
// const MATCH_END_TIME = 30; // 30 seconds instead of 180

export function logShowdownStatus(world: any) {
  const timerQuery = world.query([GameTimer, ShowdownState]);
  if (timerQuery && timerQuery.length > 0) {
    const timerEntity = timerQuery[0];
    const time = GameTimer.totalTime[timerEntity];
    const state = ShowdownState.state[timerEntity];

    const stateNames = ['NORMAL', 'WARNING', 'COLLAPSE', 'SHOWDOWN', 'ENDED'];
    console.log(`[SHOWDOWN] Time: ${time.toFixed(1)}s | Phase: ${stateNames[state]}`);
  }
}