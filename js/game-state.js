/* =========================
   セーブデータ設定
========================= */

export const SAVE_KEY =
  'zombie-save-v1';


/* =========================
   初期状態
========================= */

export function createDefaultGameState() {
  return {

    version: 1,

    /* 日時 */
    day: 1,
    time: 7 * 60,

    /* 現在地 */
    location: '自宅前',

    /* プレイヤー */
    player: {
      hp: 10,
      maxHp: 10,

      x: 260,
      direction: 1
    },

    /* 所持品
       itemId : 個数

       例
       {
         wood: 3,
         small_stone: 7,
         canned_food: 2
       }
    */
    inventory: {},

    /* 自宅の収納 */
    storage: {},

    /* 装備 */
    equipment: {

      /* null = 素手 */
      meleeWeaponId: null,

      /* 遠距離武器
         小石を選択した場合
         small_stone
      */
      rangedWeaponId: null
    },

    /* 自宅 */
    home: {
      stoveLit: false
    },

    /* 外の世界 */
    world: {

      /* 一度拾った物 */
      pickedItemIds: [],

      /* 倒したゾンビ */
      defeatedZombieIds: []
    }
  };
}


/* =========================
   コピー
========================= */

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}


/* =========================
   読み込んだデータを補正
========================= */

function normalizeGameState(data) {
  const defaults =
    createDefaultGameState();

  if (
    !data
    || typeof data !== 'object'
  ) {
    return defaults;
  }


  const result = {
    ...defaults,
    ...data,

    player: {
      ...defaults.player,
      ...(data.player || {})
    },

    inventory: {
      ...(data.inventory || {})
    },

    storage: {
      ...(data.storage || {})
    },

    equipment: {
      ...defaults.equipment,
      ...(data.equipment || {})
    },

    home: {
      ...defaults.home,
      ...(data.home || {})
    },

    world: {
      ...defaults.world,
      ...(data.world || {})
    }
  };


  if (
    !Array.isArray(
      result.world.pickedItemIds
    )
  ) {
    result.world.pickedItemIds = [];
  }


  if (
    !Array.isArray(
      result.world.defeatedZombieIds
    )
  ) {
    result.world.defeatedZombieIds = [];
  }


  if (
    !result.inventory
    || typeof result.inventory !== 'object'
  ) {
    result.inventory = {};
  }


  if (
    !result.storage
    || typeof result.storage !== 'object'
  ) {
    result.storage = {};
  }


  return result;
}


/* =========================
   セーブデータ読込
========================= */

export function loadGameState() {
  try {

    const json =
      localStorage.getItem(
        SAVE_KEY
      );


    if (!json) {
      return createDefaultGameState();
    }


    const data =
      JSON.parse(json);


    return normalizeGameState(
      data
    );

  }

  catch (error) {

    console.error(
      'セーブデータの読み込みに失敗しました。',
      error
    );


    return createDefaultGameState();
  }
}


/* =========================
   現在のゲーム状態

   main.js
   home.js

   の両方からこれを使う
========================= */

export let gameState =
  loadGameState();


/* =========================
   保存
========================= */

export function saveGameState(
  state = gameState
) {
  try {

    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(state)
    );


    return true;

  }

  catch (error) {

    console.error(
      'セーブデータの保存に失敗しました。',
      error
    );


    return false;
  }
}


/* =========================
   現在状態取得
========================= */

export function getGameState() {
  return gameState;
}


/* =========================
   状態更新
========================= */

export function updateGameState(
  callback
) {
  if (
    typeof callback !== 'function'
  ) {
    return gameState;
  }


  callback(
    gameState
  );


  saveGameState();


  return gameState;
}


/* =========================
   日時
========================= */

export function addGameMinutes(
  minutes
) {
  const amount =
    Math.max(
      0,
      Math.floor(minutes)
    );


  gameState.time +=
    amount;


  while (
    gameState.time >= 1440
  ) {
    gameState.time -= 1440;

    gameState.day += 1;
  }


  saveGameState();
}


/* =========================
   日付変更
========================= */

export function nextDay(
  startTime = 7 * 60
) {
  gameState.day += 1;

  gameState.time =
    startTime;


  saveGameState();
}


/* =========================
   現在地
========================= */

export function setLocation(
  location
) {
  gameState.location =
    String(location);


  saveGameState();
}


/* =========================
   プレイヤー位置
========================= */

export function setPlayerPosition(
  x
) {
  gameState.player.x =
    Number(x) || 0;


  saveGameState();
}


/* =========================
   プレイヤー方向
========================= */

export function setPlayerDirection(
  direction
) {
  gameState.player.direction =
    direction < 0
      ? -1
      : 1;


  saveGameState();
}


/* =========================
   ダメージ
========================= */

export function damagePlayer(
  damage
) {
  const amount =
    Math.max(
      0,
      Math.floor(damage)
    );


  gameState.player.hp -=
    amount;


  if (
    gameState.player.hp < 0
  ) {
    gameState.player.hp = 0;
  }


  saveGameState();


  return gameState.player.hp;
}


/* =========================
   回復
========================= */

export function healPlayer(
  amount
) {
  const heal =
    Math.max(
      0,
      Math.floor(amount)
    );


  gameState.player.hp +=
    heal;


  if (
    gameState.player.hp
    > gameState.player.maxHp
  ) {
    gameState.player.hp =
      gameState.player.maxHp;
  }


  saveGameState();


  return gameState.player.hp;
}


/* =========================
   近接武器装備
========================= */

export function equipMeleeWeapon(
  itemId
) {
  gameState.equipment.meleeWeaponId =
    itemId || null;


  saveGameState();
}


/* =========================
   遠距離武器装備
========================= */

export function equipRangedWeapon(
  itemId
) {
  gameState.equipment.rangedWeaponId =
    itemId || null;


  saveGameState();
}


/* =========================
   拾った物を記録
========================= */

export function markItemPicked(
  worldItemId
) {
  if (
    !worldItemId
  ) {
    return;
  }


  const list =
    gameState.world.pickedItemIds;


  if (
    !list.includes(
      worldItemId
    )
  ) {
    list.push(
      worldItemId
    );

    saveGameState();
  }
}


/* =========================
   拾得済み確認
========================= */

export function isItemPicked(
  worldItemId
) {
  return (
    gameState.world.pickedItemIds
      .includes(worldItemId)
  );
}


/* =========================
   ゾンビ撃破記録
========================= */

export function markZombieDefeated(
  zombieId
) {
  if (
    !zombieId
  ) {
    return;
  }


  const list =
    gameState.world.defeatedZombieIds;


  if (
    !list.includes(
      zombieId
    )
  ) {
    list.push(
      zombieId
    );

    saveGameState();
  }
}


/* =========================
   撃破済み確認
========================= */

export function isZombieDefeated(
  zombieId
) {
  return (
    gameState.world.defeatedZombieIds
      .includes(zombieId)
  );
}


/* =========================
   ストーブ
========================= */

export function setStoveLit(
  lit
) {
  gameState.home.stoveLit =
    Boolean(lit);


  saveGameState();
}


/* =========================
   セーブ削除・最初から
========================= */

export function resetGameState() {
  gameState =
    clone(
      createDefaultGameState()
    );


  saveGameState();


  return gameState;
}


/* =========================
   ページ移動時にも保存

   外
   ↓
   HOME

   HOME
   ↓
   外

   の移動でも状態を残す
========================= */

window.addEventListener(
  'pagehide',
  () => {
    saveGameState();
  }
);