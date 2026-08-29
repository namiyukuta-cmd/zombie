import {
  createDefaultZombies,
  findNearbyZombie,
  drawZombies
} from './zombie.js';

import {
  createCombatState,
  startCombat,
  playerAttack,
  playerPush,
  playerEscape,
  playerRangedAttack,
  getCombatStatusText,
  getCurrentRangedWeapon,
  isInCombat,
  endCombat
} from './combat.js';

import {
  getItemName
} from './items.js';

import {
  addItem,
  hasItem,
  getInventoryText
} from './inventory.js';

import {
  gameState,
  saveGameState,
  addGameMinutes as saveAddGameMinutes,
  equipMeleeWeapon,
  equipRangedWeapon,
  markItemPicked,
  isItemPicked,
  isZombieDefeated
} from './game-state.js';


/* =========================
   DOM
========================= */

const canvas =
  document.getElementById('world');

const ctx =
  canvas.getContext('2d');

const gameArea =
  document.getElementById('game-area');

const dateEl =
  document.getElementById('date');

const timeEl =
  document.getElementById('time');

const locationEl =
  document.getElementById('location');

const lightLevelEl =
  document.getElementById('light-level');

const messageEl =
  document.getElementById('message');

const controlsEl =
  document.getElementById('controls');


/* =========================
   主人公画像
========================= */

const PLAYER_WALK_SOURCES = [
  'assets/player/player_walk_01.png',
  'assets/player/player_walk_02.png',
  'assets/player/player_walk_03.png',
  'assets/player/player_walk_04.png'
];

const playerWalkFrames =
  PLAYER_WALK_SOURCES.map(
    (src) => {
      const image = new Image();

      image.src = src;

      image.addEventListener(
        'load',
        () => {
          drawWorld();
        }
      );

      return image;
    }
  );


/* =========================
   距離
========================= */

const HOME_DOOR_X = 334;

const HOME_DISTANCE = 55;

const PICKUP_DISTANCE = 38;


/* =========================
   ゾンビ初期化
========================= */

function createWorldZombies() {
  const zombies =
    createDefaultZombies();

  for (const zombie of zombies) {
    if (
      isZombieDefeated(
        zombie.id
      )
    ) {
      zombie.hp = 0;
      zombie.alive = false;
    }
  }

  return zombies;
}


/* =========================
   外マップ上のアイテム
========================= */

const worldItems = [

  {
    id: 'small_stone_01',
    itemId: 'small_stone',
    x: 520
  },

  {
    id: 'wood_01',
    itemId: 'wood',
    x: 690
  },

  {
    id: 'small_stone_02',
    itemId: 'small_stone',
    x: 745
  },

  {
    id: 'stick_01',
    itemId: 'stick',
    x: 810
  },

  {
    id: 'can_01',
    itemId: 'canned_food',
    x: 1080
  },

  {
    id: 'small_stone_03',
    itemId: 'small_stone',
    x: 1180
  },

  {
    id: 'cloth_01',
    itemId: 'cloth',
    x: 1460
  },

  {
    id: 'small_stone_04',
    itemId: 'small_stone',
    x: 1610
  },

  {
    id: 'small_stone_05',
    itemId: 'small_stone',
    x: 2080
  }

];


/* =========================
   一時的な画面状態
========================= */

const state = {

  worldWidth: 2400,

  player: gameState.player,

  cameraX: 0,

  movingLeft: false,
  movingRight: false,

  lastTimestamp: 0,

  /*
    現実時間の秒を貯める。
    1秒ごとにゲーム内3分進める。
  */
  timeAccumulator: 0,

  animationFrame: 0,
  animationTimer: 0,

  nearbyItemId: null,

  lastNotifiedItemId: null,

  nearbyHome: false,

  homeNotified: false,

  ignoreHomeUntilFar: false,

  zombies:
    createWorldZombies()
};


/* =========================
   戦闘状態
========================= */

const combatState =
  createCombatState();


/* =========================
   操作ボタン
========================= */

const controls = {
  leftButton: null,
  actionButton: null,
  rightButton: null
};

let rangedButton = null;


/* =========================
   共通
========================= */

function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function formatTime(
  totalMinutes
) {
  const normalized =
    (
      (
        Math.floor(
          totalMinutes
        )
        % 1440
      )
      + 1440
    )
    % 1440;

  const hours =
    Math.floor(
      normalized / 60
    );

  const minutes =
    normalized % 60;

  return (
    String(hours)
      .padStart(2, '0')
    + ':'
    + String(minutes)
      .padStart(2, '0')
  );
}


/* =========================
   明るさ
========================= */

function getSunlight(
  totalMinutes
) {
  const t =
    (
      (
        totalMinutes
        % 1440
      )
      + 1440
    )
    % 1440;


  /* 深夜 */

  if (t < 300) {
    return 0.08;
  }


  /* 夜明け 05:00～07:00 */

  if (t < 420) {
    return (
      0.08
      + (
        (t - 300)
        / 120
      )
      * 0.92
    );
  }


  /* 昼 */

  if (t < 1020) {
    return 1;
  }


  /* 夕方 17:00～19:00 */

  if (t < 1140) {
    return (
      1
      - (
        (t - 1020)
        / 120
      )
      * 0.92
    );
  }


  /* 夜 */

  return 0.08;
}


function getLightLabel(
  light
) {
  if (light >= 0.8) {
    return '明るい';
  }

  if (light >= 0.45) {
    return '薄明るい';
  }

  if (light >= 0.2) {
    return '薄暗い';
  }

  return '暗い';
}


/* =========================
   HUD
========================= */

function updateHud() {
  const light =
    getSunlight(
      gameState.time
    );

  dateEl.textContent =
    `${gameState.day}日目`;

  timeEl.textContent =
    formatTime(
      gameState.time
    );

  locationEl.textContent =
    gameState.location;

  lightLevelEl.textContent =
    `明るさ：${getLightLabel(light)}`;
}


/* =========================
   時間
========================= */

function addActionMinutes(
  minutes
) {
  saveAddGameMinutes(
    minutes
  );

  updateHud();
}


function advanceTime(
  deltaSeconds
) {
  state.timeAccumulator +=
    deltaSeconds;

  if (
    state.timeAccumulator < 1
  ) {
    return;
  }

  const seconds =
    Math.floor(
      state.timeAccumulator
    );

  state.timeAccumulator -=
    seconds;

  /*
    現実1秒
    =
    ゲーム内3分
  */

  saveAddGameMinutes(
    seconds * 3
  );

  updateHud();
}


/* =========================
   Canvas
========================= */

function resizeCanvas() {
  const rect =
    canvas.getBoundingClientRect();

  const dpr =
    Math.min(
      window.devicePixelRatio
      || 1,
      2
    );

  const width =
    Math.max(
      1,
      Math.round(
        rect.width * dpr
      )
    );

  const height =
    Math.max(
      1,
      Math.round(
        rect.height * dpr
      )
    );

  if (
    canvas.width !== width
    || canvas.height !== height
  ) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  ctx.imageSmoothingEnabled =
    false;
}


/* =========================
   自宅描画
========================= */

function drawHouse(
  screenX,
  groundY
) {
  ctx.fillStyle =
    '#c7b69b';

  ctx.fillRect(
    screenX,
    groundY - 150,
    320,
    150
  );


  ctx.fillStyle =
    '#76695b';

  ctx.beginPath();

  ctx.moveTo(
    screenX - 18,
    groundY - 150
  );

  ctx.lineTo(
    screenX + 160,
    groundY - 235
  );

  ctx.lineTo(
    screenX + 338,
    groundY - 150
  );

  ctx.closePath();

  ctx.fill();


  /* ドア */

  ctx.fillStyle =
    '#62584d';

  ctx.fillRect(
    screenX + 215,
    groundY - 92,
    58,
    92
  );


  /* 窓 */

  ctx.fillStyle =
    '#cdd8d6';

  ctx.fillRect(
    screenX + 55,
    groundY - 110,
    68,
    58
  );

  ctx.strokeStyle =
    '#626861';

  ctx.lineWidth = 3;

  ctx.strokeRect(
    screenX + 55,
    groundY - 110,
    68,
    58
  );
}


/* =========================
   道の背景
========================= */

function drawRoadObjects(
  groundY
) {
  const objects = [

    {
      x: 790,
      type: 'tree'
    },

    {
      x: 1200,
      type: 'crate'
    },

    {
      x: 1570,
      type: 'tree'
    },

    {
      x: 1910,
      type: 'crate'
    }

  ];


  for (
    const object of objects
  ) {
    const x =
      object.x
      - state.cameraX;


    if (
      x < -100
      || x
      > canvas.clientWidth + 100
    ) {
      continue;
    }


    if (
      object.type === 'tree'
    ) {
      ctx.fillStyle =
        '#675e4d';

      ctx.fillRect(
        x - 8,
        groundY - 96,
        16,
        96
      );

      ctx.fillStyle =
        '#67735f';

      ctx.beginPath();

      ctx.arc(
        x,
        groundY - 122,
        48,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    else {
      ctx.fillStyle =
        '#8b7658';

      ctx.fillRect(
        x - 24,
        groundY - 38,
        48,
        38
      );

      ctx.strokeStyle =
        '#5f513d';

      ctx.lineWidth = 2;

      ctx.strokeRect(
        x - 24,
        groundY - 38,
        48,
        38
      );
    }
  }
}


/* =========================
   地面アイテム描画
========================= */

function drawCollectibleItem(
  item,
  groundY
) {
  if (
    isItemPicked(
      item.id
    )
  ) {
    return;
  }


  const x =
    Math.round(
      item.x
      - state.cameraX
    );


  if (
    x < -60
    || x
    > canvas.clientWidth + 60
  ) {
    return;
  }


  ctx.save();

  ctx.lineWidth = 2;


  /* 薪 */

  if (
    item.itemId === 'wood'
  ) {
    ctx.strokeStyle =
      '#554638';

    ctx.fillStyle =
      '#8a6c4d';

    for (
      let i = 0;
      i < 3;
      i += 1
    ) {
      ctx.fillRect(
        x - 17 + i * 8,
        groundY - 14 - i * 3,
        24,
        6
      );

      ctx.strokeRect(
        x - 17 + i * 8,
        groundY - 14 - i * 3,
        24,
        6
      );
    }
  }


  /* 木の棒 */

  else if (
    item.itemId === 'stick'
  ) {
    ctx.strokeStyle =
      '#493a2d';

    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.moveTo(
      x - 18,
      groundY - 4
    );

    ctx.lineTo(
      x + 18,
      groundY - 28
    );

    ctx.stroke();
  }


  /* 小石 */

  else if (
    item.itemId
    === 'small_stone'
  ) {
    ctx.fillStyle =
      '#777a77';

    ctx.strokeStyle =
      '#4f5350';

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.ellipse(
      x,
      groundY - 6,
      9,
      6,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    ctx.beginPath();

    ctx.ellipse(
      x + 9,
      groundY - 4,
      6,
      4,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();
  }


  /* 缶詰 */

  else if (
    item.itemId
    === 'canned_food'
  ) {
    ctx.fillStyle =
      '#9da4a0';

    ctx.strokeStyle =
      '#565c59';

    ctx.fillRect(
      x - 10,
      groundY - 23,
      20,
      23
    );

    ctx.strokeRect(
      x - 10,
      groundY - 23,
      20,
      23
    );

    ctx.beginPath();

    ctx.ellipse(
      x,
      groundY - 23,
      10,
      3,
      0,
      0,
      Math.PI * 2
    );

    ctx.stroke();
  }


  /* 布 */

  else if (
    item.itemId === 'cloth'
  ) {
    ctx.fillStyle =
      '#b7aa95';

    ctx.strokeStyle =
      '#6b6257';

    ctx.fillRect(
      x - 14,
      groundY - 18,
      28,
      18
    );

    ctx.strokeRect(
      x - 14,
      groundY - 18,
      28,
      18
    );

    ctx.beginPath();

    ctx.moveTo(
      x - 4,
      groundY - 18
    );

    ctx.lineTo(
      x + 4,
      groundY
    );

    ctx.stroke();
  }


  ctx.restore();
}


function drawWorldItems(
  groundY
) {
  for (
    const item
    of worldItems
  ) {
    drawCollectibleItem(
      item,
      groundY
    );
  }
}


/* =========================
   主人公描画
========================= */

function drawPlayer(
  screenX,
  groundY
) {
  const frame =
    playerWalkFrames[
      state.animationFrame
    ];


  if (
    !frame
    || !frame.complete
    || !frame.naturalWidth
  ) {
    return;
  }


  const x =
    Math.round(
      screenX
    );

  const y =
    Math.round(
      groundY - 48
    );


  ctx.save();

  ctx.imageSmoothingEnabled =
    false;


  if (
    state.player.direction < 0
  ) {
    ctx.translate(
      x,
      0
    );

    ctx.scale(
      -1,
      1
    );

    ctx.drawImage(
      frame,
      -16,
      y,
      32,
      48
    );
  }

  else {
    ctx.drawImage(
      frame,
      x - 16,
      y,
      32,
      48
    );
  }


  ctx.restore();
}


/* =========================
   世界描画
========================= */

function drawWorld() {
  resizeCanvas();


  const width =
    canvas.clientWidth;

  const height =
    canvas.clientHeight;

  const groundY =
    Math.round(
      height * 0.76
    );

  const light =
    getSunlight(
      gameState.time
    );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  /* 空 */

  ctx.fillStyle =
    '#dce7e9';

  ctx.fillRect(
    0,
    0,
    width,
    groundY
  );


  /* 地面 */

  ctx.fillStyle =
    '#aaa894';

  ctx.fillRect(
    0,
    groundY,
    width,
    height - groundY
  );


  drawHouse(
    90 - state.cameraX,
    groundY
  );


  drawRoadObjects(
    groundY
  );


  drawWorldItems(
    groundY
  );


  drawZombies({
    ctx,

    zombies:
      state.zombies,

    cameraX:
      state.cameraX,

    groundY
  });


  /* 道 */

  ctx.strokeStyle =
    '#757568';

  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.moveTo(
    0,
    groundY + 26
  );

  ctx.lineTo(
    width,
    groundY + 26
  );

  ctx.stroke();


  drawPlayer(
    state.player.x
      - state.cameraX,

    groundY
  );


  /* 夜の暗さ */

  const darkness =
    clamp(
      0.68
      * (
        1 - light
      ),
      0,
      0.68
    );


  if (
    darkness > 0.01
  ) {
    ctx.fillStyle =
      `rgba(18, 24, 31, ${darkness})`;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );
  }
}


/* =========================
   カメラ
========================= */

function updateCamera() {
  const width =
    canvas.clientWidth;

  const desired =
    state.player.x
    - width * 0.46;

  state.cameraX =
    clamp(
      desired,
      0,
      Math.max(
        0,
        state.worldWidth - width
      )
    );
}


/* =========================
   歩行アニメーション
========================= */

function updatePlayerAnimation(
  deltaSeconds,
  isMoving
) {
  if (!isMoving) {
    state.animationFrame = 0;
    state.animationTimer = 0;

    return;
  }


  state.animationTimer +=
    deltaSeconds;

  const frameDuration =
    0.13;


  while (
    state.animationTimer
    >= frameDuration
  ) {
    state.animationTimer -=
      frameDuration;

    state.animationFrame =
      (
        state.animationFrame
        + 1
      )
      % playerWalkFrames.length;
  }
}


/* =========================
   移動
========================= */

function stopMovement(
  save = true
) {
  const wasMoving =
    state.movingLeft
    || state.movingRight;

  state.movingLeft = false;
  state.movingRight = false;


  if (
    save
    && wasMoving
  ) {
    saveGameState();
  }
}


function startAutoMove(
  direction
) {
  if (
    isInCombat(
      combatState
    )
  ) {
    return;
  }


  if (
    state.nearbyHome
  ) {
    state.ignoreHomeUntilFar =
      true;

    state.nearbyHome =
      false;

    state.homeNotified =
      false;
  }


  if (
    direction < 0
  ) {
    state.movingLeft = true;
    state.movingRight = false;

    state.player.direction = -1;
  }

  else {
    state.movingLeft = false;
    state.movingRight = true;

    state.player.direction = 1;
  }
}


/* =========================
   近くのアイテム
========================= */

function getNearbyItem() {
  let nearest = null;

  let nearestDistance =
    Infinity;


  for (
    const item
    of worldItems
  ) {
    if (
      isItemPicked(
        item.id
      )
    ) {
      continue;
    }


    const distance =
      Math.abs(
        item.x
        - state.player.x
      );


    if (
      distance
      <= PICKUP_DISTANCE
      && distance
      < nearestDistance
    ) {
      nearest = item;

      nearestDistance =
        distance;
    }
  }


  return nearest;
}


function findWorldItemById(
  id
) {
  return (
    worldItems.find(
      (item) =>
        item.id === id
    )
    || null
  );
}


/* =========================
   アイテムを拾う
========================= */

function pickUpItem(
  worldItem
) {
  if (!worldItem) {
    return;
  }


  if (
    isItemPicked(
      worldItem.id
    )
  ) {
    return;
  }


  const itemId =
    worldItem.itemId;

  const itemName =
    getItemName(
      itemId
    );


  const result =
    addItem(
      itemId,
      1
    );


  if (
    !result.success
  ) {
    if (
      result.reason === 'full'
    ) {
      messageEl.textContent =
        `${itemName}はこれ以上持てません。`;
    }

    else {
      messageEl.textContent =
        `${itemName}を拾えませんでした。`;
    }

    return;
  }


  markItemPicked(
    worldItem.id
  );


  state.nearbyItemId =
    null;

  state.lastNotifiedItemId =
    null;


  /*
    木の棒を初めて拾ったら
    自動で近接武器にする
  */

  if (
    itemId === 'stick'
    && !gameState
      .equipment
      .meleeWeaponId
  ) {
    equipMeleeWeapon(
      'stick'
    );
  }


  /*
    小石を初めて拾ったら
    遠距離攻撃に設定
  */

  if (
    itemId === 'small_stone'
    && !gameState
      .equipment
      .rangedWeaponId
  ) {
    equipRangedWeapon(
      'small_stone'
    );
  }


  messageEl.textContent =
    `${itemName}を拾いました。`
    + getInventoryText();


  updateRangedButton();

  updateActionButton();

  drawWorld();
}


/* =========================
   装備確認
========================= */

function validateEquipment() {
  const meleeId =
    gameState
      .equipment
      .meleeWeaponId;

  const rangedId =
    gameState
      .equipment
      .rangedWeaponId;


  /*
    HOMEで収納した武器を
    手に持ったままにしない
  */

  if (
    meleeId
    && !hasItem(
      meleeId,
      1
    )
  ) {
    equipMeleeWeapon(
      null
    );
  }


  if (
    rangedId
    && !hasItem(
      rangedId,
      1
    )
  ) {
    equipRangedWeapon(
      null
    );
  }


  /*
    武器未設定なら
    持っている基本武器を装備
  */

  if (
    !gameState
      .equipment
      .meleeWeaponId
    && hasItem(
      'stick',
      1
    )
  ) {
    equipMeleeWeapon(
      'stick'
    );
  }


  if (
    !gameState
      .equipment
      .rangedWeaponId
    && hasItem(
      'small_stone',
      1
    )
  ) {
    equipRangedWeapon(
      'small_stone'
    );
  }
}


/* =========================
   近接戦闘開始
========================= */

function beginCombat(
  zombie
) {
  stopMovement();


  state.nearbyItemId =
    null;


  const light =
    getSunlight(
      gameState.time
    );


  const started =
    startCombat({
      combatState,

      zombie,

      lightLevel:
        light,

      strongArtificialLight:
        false
    });


  if (!started) {
    return;
  }


  messageEl.textContent =
    `${combatState.lastMessage} `
    + getCombatStatusText(
      combatState
    );


  buildCombatControls();

  updateRangedButton();
}


/* =========================
   近接戦闘操作
========================= */

function handleCombatAction(
  action
) {
  if (
    !isInCombat(
      combatState
    )
  ) {
    buildControls();

    return;
  }


  const zombie =
    combatState.zombie;

  let result = null;


  if (
    action === 'attack'
  ) {
    result =
      playerAttack({
        combatState,

        addGameMinutes:
          addActionMinutes
      });
  }


  else if (
    action === 'push'
  ) {
    result =
      playerPush({
        combatState,

        playerX:
          state.player.x,

        addGameMinutes:
          addActionMinutes
      });
  }


  else if (
    action === 'escape'
  ) {
    result =
      playerEscape({
        combatState,

        addGameMinutes:
          addActionMinutes
      });


    /*
      ゾンビと反対方向へ離れる
    */

    if (
      result
      && zombie
    ) {
      const direction =
        zombie.x
        >= state.player.x
          ? -1
          : 1;


      state.player.x =
        clamp(
          state.player.x
          + direction * 90,

          30,

          state.worldWidth - 30
        );
    }
  }


  if (!result) {
    return;
  }


  saveGameState();


  /* 主人公が倒れた */

  if (
    gameState.player.hp <= 0
  ) {
    gameState.player.hp = 0;

    endCombat(
      combatState
    );

    stopMovement();

    saveGameState();

    messageEl.textContent =
      'ゾンビに襲われて倒れました。';

    buildDownControls();

    updateRangedButton();

    return;
  }


  /* 戦闘継続 */

  if (
    isInCombat(
      combatState
    )
  ) {
    messageEl.textContent =
      `${result.message} `
      + getCombatStatusText(
        combatState
      );

    buildCombatControls();

    updateRangedButton();

    return;
  }


  /* 戦闘終了 */

  messageEl.textContent =
    result.message;

  buildControls();

  updateRangedButton();
}


/* =========================
   遠距離攻撃ボタン
========================= */

function createRangedButton() {
  if (rangedButton) {
    return;
  }


  /*
    game-areaの右下に重ねる
  */

  const position =
    getComputedStyle(
      gameArea
    ).position;

  if (
    position === 'static'
  ) {
    gameArea.style.position =
      'relative';
  }


  rangedButton =
    document.createElement(
      'button'
    );

  rangedButton.type =
    'button';

  rangedButton.setAttribute(
    'aria-label',
    '遠距離攻撃'
  );


  /*
    CSSを別途変更しなくても
    丸ボタンになるようにする
  */

  Object.assign(
    rangedButton.style,
    {
      position: 'absolute',

      right: '14px',
      bottom: '14px',

      width: '72px',
      height: '72px',

      borderRadius: '50%',

      border:
        '3px solid #544d45',

      background:
        'rgba(248, 244, 232, 0.94)',

      color:
        '#2e2c29',

      fontSize:
        '17px',

      fontWeight:
        '700',

      lineHeight:
        '1.15',

      whiteSpace:
        'pre-line',

      zIndex:
        '10',

      touchAction:
        'manipulation',

      userSelect:
        'none',

      WebkitUserSelect:
        'none',

      WebkitTouchCallout:
        'none'
    }
  );


  rangedButton.addEventListener(
    'click',
    handleRangedAttack
  );


  gameArea.appendChild(
    rangedButton
  );


  updateRangedButton();
}


/* =========================
   遠距離ボタン表示
========================= */

function updateRangedButton() {
  if (!rangedButton) {
    return;
  }


  const weapon =
    getCurrentRangedWeapon();


  if (!weapon) {
    rangedButton.textContent =
      '遠距離\nなし';

    rangedButton.disabled =
      true;

    rangedButton.style.opacity =
      '0.45';

    return;
  }


  const ammoId =
    weapon.ammoItemId;

  const count =
    gameState.inventory[
      ammoId
    ]
    || 0;


  rangedButton.textContent =
    `${weapon.name}\n×${count}`;


  const disabled =
    count <= 0
    || isInCombat(
      combatState
    )
    || gameState.player.hp <= 0;


  rangedButton.disabled =
    disabled;

  rangedButton.style.opacity =
    disabled
      ? '0.45'
      : '1';
}


/* =========================
   遠距離攻撃
========================= */

function handleRangedAttack() {
  if (
    isInCombat(
      combatState
    )
  ) {
    return;
  }


  if (
    gameState.player.hp <= 0
  ) {
    return;
  }


  /*
    投げる時はいったん止まる
  */

  stopMovement();


  const result =
    playerRangedAttack({

      zombies:
        state.zombies,

      playerX:
        state.player.x,

      addGameMinutes:
        addActionMinutes
    });


  if (!result) {
    return;
  }


  messageEl.textContent =
    result.message;


  saveGameState();

  updateActionButton();

  updateRangedButton();

  drawWorld();
}


/* =========================
   倒れた時
========================= */

function buildDownControls() {
  controlsEl.replaceChildren();


  const homeButton =
    makeButton(
      '自宅へ戻る',
      'safe'
    );


  homeButton.addEventListener(
    'click',
    () => {

      gameState.player.hp =
        gameState.player.maxHp;

      gameState.player.x =
        260;

      gameState.player.direction =
        1;

      gameState.day += 1;

      gameState.time =
        7 * 60;

      gameState.location =
        '自宅前';


      state.timeAccumulator =
        0;

      state.nearbyHome =
        false;

      state.homeNotified =
        false;

      state.ignoreHomeUntilFar =
        false;


      saveGameState();

      updateHud();

      updateCamera();

      messageEl.textContent =
        '翌朝、自宅前で目を覚ましました。';

      buildControls();

      updateRangedButton();

      drawWorld();
    }
  );


  controlsEl.append(
    homeButton
  );
}


/* =========================
   近くの対象判定
========================= */

function updateNearbyTargets() {
  if (
    isInCombat(
      combatState
    )
  ) {
    return;
  }


  /* 自宅 */

  const homeDistance =
    Math.abs(
      state.player.x
      - HOME_DOOR_X
    );


  if (
    state.ignoreHomeUntilFar
  ) {
    if (
      homeDistance
      > HOME_DISTANCE + 40
    ) {
      state.ignoreHomeUntilFar =
        false;
    }
  }

  else if (
    homeDistance
    <= HOME_DISTANCE
  ) {
    state.nearbyHome = true;

    state.nearbyItemId = null;


    if (
      state.movingLeft
      || state.movingRight
    ) {
      stopMovement();
    }


    if (
      !state.homeNotified
    ) {
      messageEl.textContent =
        '自宅の玄関です。「家に入る」で中へ入れます。';

      state.homeNotified =
        true;
    }


    return;
  }

  else {
    state.nearbyHome = false;

    state.homeNotified = false;
  }


  /* ゾンビ */

  const zombie =
    findNearbyZombie(
      state.zombies,
      state.player.x
    );


  if (zombie) {
    beginCombat(
      zombie
    );

    return;
  }


  /* アイテム */

  const item =
    getNearbyItem();


  state.nearbyItemId =
    item
      ? item.id
      : null;


  if (!item) {
    state.lastNotifiedItemId =
      null;

    return;
  }


  if (
    state.movingLeft
    || state.movingRight
  ) {
    stopMovement();
  }


  if (
    state.lastNotifiedItemId
    !== item.id
  ) {
    const name =
      getItemName(
        item.itemId
      );

    messageEl.textContent =
      `${name}を見つけました。「拾う」で持ち物に入ります。`;

    state.lastNotifiedItemId =
      item.id;
  }
}


/* =========================
   ボタン生成
========================= */

function makeButton(
  label,
  className = ''
) {
  const button =
    document.createElement(
      'button'
    );

  button.type =
    'button';

  button.textContent =
    label;


  if (className) {
    button.className =
      className;
  }


  return button;
}


/* =========================
   中央ボタン
========================= */

function updateActionButton() {
  if (
    !controls.actionButton
  ) {
    return;
  }


  if (
    isInCombat(
      combatState
    )
  ) {
    return;
  }


  if (
    state.movingLeft
    || state.movingRight
  ) {
    controls.actionButton.textContent =
      '止まる';

    return;
  }


  if (
    state.nearbyItemId
  ) {
    controls.actionButton.textContent =
      '拾う';

    return;
  }


  if (
    state.nearbyHome
  ) {
    controls.actionButton.textContent =
      '家に入る';

    return;
  }


  controls.actionButton.textContent =
    '持ち物';
}


/* =========================
   通常操作
========================= */

function buildControls() {
  controlsEl.replaceChildren();


  controls.leftButton =
    makeButton('←');

  controls.actionButton =
    makeButton(
      '持ち物',
      'safe'
    );

  controls.rightButton =
    makeButton('→');


  /* 左 */

  controls.leftButton
    .addEventListener(
      'click',
      () => {
        startAutoMove(-1);

        messageEl.textContent =
          '左へ移動中です。';

        updateActionButton();
      }
    );


  /* 中央 */

  controls.actionButton
    .addEventListener(
      'click',
      () => {

        /* 停止 */

        if (
          state.movingLeft
          || state.movingRight
        ) {
          stopMovement();

          messageEl.textContent =
            '立ち止まりました。';

          updateActionButton();

          return;
        }


        /* 拾う */

        const item =
          state.nearbyItemId
            ? findWorldItemById(
                state.nearbyItemId
              )
            : getNearbyItem();


        if (item) {
          pickUpItem(
            item
          );

          return;
        }


        /* HOME */

        if (
          state.nearbyHome
        ) {
          gameState.location =
            '自宅';

          saveGameState();

          window.location.href =
            'zombie_home.html';

          return;
        }


        /* 持ち物 */

        messageEl.textContent =
          getInventoryText();
      }
    );


  /* 右 */

  controls.rightButton
    .addEventListener(
      'click',
      () => {
        startAutoMove(1);

        messageEl.textContent =
          '右へ移動中です。';

        updateActionButton();
      }
    );


  controlsEl.append(
    controls.leftButton,
    controls.actionButton,
    controls.rightButton
  );


  updateActionButton();
}


/* =========================
   近接戦闘ボタン
========================= */

function buildCombatControls() {
  controlsEl.replaceChildren();


  const attackButton =
    makeButton(
      '攻撃',
      'safe'
    );

  const pushButton =
    makeButton(
      '押しのける'
    );

  const escapeButton =
    makeButton(
      '逃げる'
    );


  attackButton.addEventListener(
    'click',
    () => {
      handleCombatAction(
        'attack'
      );
    }
  );


  pushButton.addEventListener(
    'click',
    () => {
      handleCombatAction(
        'push'
      );
    }
  );


  escapeButton.addEventListener(
    'click',
    () => {
      handleCombatAction(
        'escape'
      );
    }
  );


  controlsEl.append(
    attackButton,
    pushButton,
    escapeButton
  );
}


/* =========================
   メインループ
========================= */

function update(
  timestamp
) {
  if (
    !state.lastTimestamp
  ) {
    state.lastTimestamp =
      timestamp;
  }


  const deltaSeconds =
    Math.min(
      (
        timestamp
        - state.lastTimestamp
      )
      / 1000,

      0.05
    );


  state.lastTimestamp =
    timestamp;


  let direction = 0;


  if (
    !isInCombat(
      combatState
    )
  ) {
    if (
      state.movingLeft
    ) {
      direction -= 1;
    }

    if (
      state.movingRight
    ) {
      direction += 1;
    }
  }


  /* 移動 */

  if (
    direction !== 0
  ) {
    state.player.direction =
      direction;


    state.player.x +=
      direction
      * 130
      * deltaSeconds;


    state.player.x =
      clamp(
        state.player.x,
        30,
        state.worldWidth - 30
      );


    if (
      (
        direction < 0
        && state.player.x <= 30
      )
      ||
      (
        direction > 0
        && state.player.x
        >= state.worldWidth - 30
      )
    ) {
      stopMovement();
    }
  }


  updateNearbyTargets();


  const moving =
    state.movingLeft
    || state.movingRight;


  updatePlayerAnimation(
    deltaSeconds,
    moving
  );


  /*
    通常の外時間。

    近接戦闘中は止めて、
    戦闘コマンドの時間だけ進む。
  */

  if (
    !isInCombat(
      combatState
    )
  ) {
    advanceTime(
      deltaSeconds
    );
  }


  updateCamera();

  updateActionButton();

  updateRangedButton();

  drawWorld();


  requestAnimationFrame(
    update
  );
}


/* =========================
   初期化
========================= */

function init() {

  /*
    HOMEから戻ってきても
    同じgameStateを使う
  */

  gameState.location =
    '自宅前';


  /*
    壊れた位置データ対策
  */

  state.player.x =
    clamp(
      Number(
        state.player.x
      )
      || 260,

      30,

      state.worldWidth - 30
    );


  state.player.direction =
    state.player.direction < 0
      ? -1
      : 1;


  validateEquipment();

  saveGameState();


  updateHud();

  buildControls();

  createRangedButton();


  messageEl.textContent =
    '朝。自宅前から探索を始めます。';


  resizeCanvas();

  updateCamera();

  updateNearbyTargets();

  updateActionButton();

  updateRangedButton();

  drawWorld();


  requestAnimationFrame(
    update
  );
}


/* =========================
   イベント
========================= */

window.addEventListener(
  'resize',
  () => {
    resizeCanvas();

    updateCamera();

    drawWorld();
  }
);


window.addEventListener(
  'blur',
  () => {
    stopMovement();

    saveGameState();

    updateActionButton();

    updateRangedButton();
  }
);


window.addEventListener(
  'pagehide',
  () => {
    saveGameState();
  }
);


init();