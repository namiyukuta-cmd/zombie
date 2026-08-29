/* =========================================================
   HOME DATA
   js/home/home-data.js

   HOMEで使用する
   ・イベント
   ・DECO
   ・NPC
   の参照をまとめる。
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


/* =========================================================
   HOME基本設定
========================================================= */

export const HOME_CONFIG = {
  id: 'home',
  name: 'HOME',

  // ドールハウス本体は固定。変化はdeco側で重ねる。
  baseBackground: 'assets/home.JPEG',

  initialDecoId: HOME_DECO_001_ID,
  initialEventId: HOME_EVENT_001_ID
};


/* =========================================================
   DECO一覧
========================================================= */

export const HOME_DECOS = {
  [HOME_DECO_001_ID]: homeDeco001
};


/* =========================================================
   イベント一覧
========================================================= */

export const HOME_EVENTS = {
  [HOME_EVENT_001_ID]: createHomeEvent001
};


/* =========================================================
   HOME NPC画像

   01を通常立ち絵として使用。
   02～05も後のイベント差分で使えるよう保持する。
========================================================= */

const cole = getNPC('father_001');
const mia = getNPC('mia_001');

if (cole) {
  cole.image = 'assets/Cole/cole01.png';
  cole.portraits = [
    'assets/Cole/cole01.png',
    'assets/Cole/cole02.png',
    'assets/Cole/cole03.png',
    'assets/Cole/cole04.png',
    'assets/Cole/cole05.png'
  ];
}

if (mia) {
  mia.image = 'assets/mia/mia01.PNG';
  mia.portraits = [
    'assets/mia/mia01.PNG',
    'assets/mia/mia02.PNG',
    'assets/mia/mia03.PNG',
    'assets/mia/mia04.PNG',
    'assets/mia/mia05.PNG'
  ];
}

export const HOME_NPCS = {
  father_001: cole,
  mia_001: mia
};


/* =========================================================
   DECO取得
========================================================= */

export function getHomeDeco(id) {
  if (!id) return null;
  return HOME_DECOS[id] ?? null;
}

export function getInitialHomeDeco() {
  return getHomeDeco(HOME_CONFIG.initialDecoId);
}


/* =========================================================
   イベント生成
========================================================= */

export function createHomeEvent(id, options = {}) {
  const eventFactory = HOME_EVENTS[id];

  if (!eventFactory) {
    console.warn(`HOME event not found: ${id}`);
    return null;
  }

  const playerName = options.playerName ?? '◯◯';
  return eventFactory(playerName);
}

export function createInitialHomeEvent(options = {}) {
  return createHomeEvent(HOME_CONFIG.initialEventId, options);
}


/* =========================================================
   NPC取得
========================================================= */

export function getHomeNPC(id) {
  if (!id) return null;
  return HOME_NPCS[id] ?? null;
}

export function getAllHomeNPCs() {
  return Object.values(HOME_NPCS).filter(Boolean);
}


/* =========================================================
   存在確認
========================================================= */

export function hasHomeDeco(id) {
  return Boolean(HOME_DECOS[id]);
}

export function hasHomeEvent(id) {
  return Boolean(HOME_EVENTS[id]);
}

export function hasHomeNPC(id) {
  return Boolean(HOME_NPCS[id]);
}


/* =========================================================
   初期HOME状態
========================================================= */

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
