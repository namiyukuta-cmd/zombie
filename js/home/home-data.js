/* =========================================================
   HOME DATA
   js/home/home-data.js
========================================================= */

import {
  createHomeEvent001,
  HOME_EVENT_001_ID
} from './event/event001.js';

import {
  homeDeco001,
  HOME_DECO_001_ID
} from './deco/deco001.js';

import { getNPC } from '../npc.js';


export const HOME_CONFIG = {
  id: 'home',
  name: 'HOME',
  baseBackground: 'assets/home.JPEG',
  initialDecoId: HOME_DECO_001_ID,
  initialEventId: HOME_EVENT_001_ID
};


export const HOME_DECOS = {
  [HOME_DECO_001_ID]: homeDeco001
};


export const HOME_EVENTS = {
  [HOME_EVENT_001_ID]: createHomeEvent001
};


export const HOME_NPCS = {
  father_001: getNPC('father_001'),
  mia_001: getNPC('mia_001')
};


export function getHomeDeco(id) {
  if (!id) return null;
  return HOME_DECOS[id] ?? null;
}

export function getInitialHomeDeco() {
  return getHomeDeco(HOME_CONFIG.initialDecoId);
}


export function createHomeEvent(id, options = {}) {
  const eventFactory = HOME_EVENTS[id];

  if (!eventFactory) {
    console.warn(`HOME event not found: ${id}`);
    return null;
  }

  return eventFactory(options.playerName ?? '◯◯');
}

export function createInitialHomeEvent(options = {}) {
  return createHomeEvent(HOME_CONFIG.initialEventId, options);
}


export function getHomeNPC(id) {
  if (!id) return null;
  return HOME_NPCS[id] ?? null;
}

export function getAllHomeNPCs() {
  return Object.values(HOME_NPCS).filter(Boolean);
}


export function hasHomeDeco(id) {
  return Boolean(HOME_DECOS[id]);
}

export function hasHomeEvent(id) {
  return Boolean(HOME_EVENTS[id]);
}

export function hasHomeNPC(id) {
  return Boolean(HOME_NPCS[id]);
}


export function createDefaultHomeState() {
  return {
    currentDecoId: HOME_CONFIG.initialDecoId,
    currentEventId: HOME_CONFIG.initialEventId,
    eventStep: 0,

    flags: {
      home_event_001_complete: false,
      cole_met: false,
      mia_met: false,
      home_unlocked: false,
      home_upper_floor_allowed: false,
      home_basement_allowed: false
    }
  };
}
