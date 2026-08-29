/* =========================================================
   HOME DATA
   js/HOME/home-data.js

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


import {
  getNPC
} from '../npc.js';



/* =========================================================
   HOME基本設定
========================================================= */

export const HOME_CONFIG = {

  id: 'home',

  name: 'HOME',

  /*
    現在の固定ドールハウス背景。

    家そのものの画像は今後変更せず、
    deco側で変化を追加していく。
  */
  baseBackground: 'assets/home/home.jpeg',


  /* 初期DECO */
  initialDecoId: HOME_DECO_001_ID,


  /* 初回イベント */
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

   イベントは関数として登録する。

   playerNameなど、
   実行時の情報を渡せるようにする。
========================================================= */

export const HOME_EVENTS = {

  [HOME_EVENT_001_ID]: createHomeEvent001

};



/* =========================================================
   HOMEに関係するNPC
========================================================= */

export const HOME_NPCS = {

  father_001: getNPC('father_001'),

  mia_001: getNPC('mia_001')

};



/* =========================================================
   DECO取得
========================================================= */

export function getHomeDeco(id) {

  if (!id) {
    return null;
  }

  return HOME_DECOS[id] ?? null;

}



/* =========================================================
   初期DECO取得
========================================================= */

export function getInitialHomeDeco() {

  return getHomeDeco(
    HOME_CONFIG.initialDecoId
  );

}



/* =========================================================
   イベント生成
========================================================= */

export function createHomeEvent(
  id,
  options = {}
) {

  const eventFactory =
    HOME_EVENTS[id];

  if (!eventFactory) {

    console.warn(
      `HOME event not found: ${id}`
    );

    return null;

  }


  const playerName =
    options.playerName ?? '◯◯';


  return eventFactory(
    playerName
  );

}



/* =========================================================
   初回イベント生成
========================================================= */

export function createInitialHomeEvent(
  options = {}
) {

  return createHomeEvent(
    HOME_CONFIG.initialEventId,
    options
  );

}



/* =========================================================
   NPC取得
========================================================= */

export function getHomeNPC(id) {

  if (!id) {
    return null;
  }

  return HOME_NPCS[id] ?? null;

}



/* =========================================================
   HOME NPC一覧
========================================================= */

export function getAllHomeNPCs() {

  return Object.values(
    HOME_NPCS
  ).filter(Boolean);

}



/* =========================================================
   存在確認
========================================================= */

export function hasHomeDeco(id) {

  return Boolean(
    HOME_DECOS[id]
  );

}


export function hasHomeEvent(id) {

  return Boolean(
    HOME_EVENTS[id]
  );

}


export function hasHomeNPC(id) {

  return Boolean(
    HOME_NPCS[id]
  );

}



/* =========================================================
   初期HOME状態

   game-state側にHOME状態がまだ無い場合、
   home-loader.jsから使用できる。
========================================================= */

export function createDefaultHomeState() {

  return {

    currentDecoId:
      HOME_CONFIG.initialDecoId,

    currentEventId:
      HOME_CONFIG.initialEventId,

    eventStep: 0,


    /* -----------------------------------------
       HOMEイベントフラグ
    ----------------------------------------- */

    flags: {

      home_event_001_complete: false,

      cole_met: false,

      mia_met: false,

      home_unlocked: false,


      /*
        コールから許可されたらtrueにする。
      */

      home_upper_floor_allowed: false,

      home_basement_allowed: false

    }

  };

}