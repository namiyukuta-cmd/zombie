import {
  gameState,
  saveGameState,
  nextDay,
  setLocation,
  setStoveLit
} from './game-state.js';

import {
  getItemCount,
  getStorageCount,
  removeItem,
  moveAllToStorage,
  moveItemFromStorage,
  getInventoryEntries,
  getStorageEntries
} from './inventory.js';


const canvas = document.getElementById('home-world');
const ctx = canvas.getContext('2d');

const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const locationEl = document.getElementById('location');
const lightLevelEl = document.getElementById('light-level');

const messageEl = document.getElementById('message');
const controlsEl = document.getElementById('controls');

const inventoryEl = document.getElementById('inventory');
const storageEl = document.getElementById('storage');


/* =========================
   主人公
========================= */

const playerImage = new Image();

playerImage.src =
  'assets/player/player_walk_01.png';

playerImage.onload =
  drawHome;


/* =========================
   家具タップ領域
========================= */

let hitboxes = [];


/* =========================
   共通
========================= */

function formatTime(minutes) {
  const t =
    (
      (
        Math.floor(minutes)
        % 1440
      )
      + 1440
    )
    % 1440;

  const h =
    Math.floor(t / 60);

  const m =
    t % 60;

  return (
    String(h).padStart(2, '0')
    + ':'
    + String(m).padStart(2, '0')
  );
}


function getSunlight(time) {
  const t =
    (
      (
        time % 1440
      )
      + 1440
    )
    % 1440;

  if (t < 300) {
    return 0.08;
  }

  if (t < 420) {
    return (
      0.08
      + ((t - 300) / 120)
      * 0.92
    );
  }

  if (t < 1020) {
    return 1;
  }

  if (t < 1140) {
    return (
      1
      - ((t - 1020) / 120)
      * 0.92
    );
  }

  return 0.08;
}


function getLightLabel(light) {
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


function itemListText(entries) {
  if (!entries.length) {
    return 'なし';
  }

  return entries
    .map(
      item =>
        `${item.name}×${item.count}`
    )
    .join('　');
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
    '自宅';

  lightLevelEl.textContent =
    `明るさ：${getLightLabel(light)}`;
}


function updateInventoryDisplay() {
  inventoryEl.textContent =
    `持ち物：${itemListText(
      getInventoryEntries()
    )}`;

  storageEl.textContent =
    `自宅備蓄：${itemListText(
      getStorageEntries()
    )}`;
}


/* =========================
   Canvas
========================= */

function resizeCanvas() {
  const rect =
    canvas.getBoundingClientRect();

  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  canvas.width =
    Math.max(
      1,
      Math.round(
        rect.width * dpr
      )
    );

  canvas.height =
    Math.max(
      1,
      Math.round(
        rect.height * dpr
      )
    );

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


function addHitbox(
  id,
  x,
  y,
  width,
  height
) {
  hitboxes.push({
    id,
    x,
    y,
    width,
    height
  });
}


/* =========================
   家全体
========================= */

function drawHome() {
  resizeCanvas();

  const width =
    canvas.clientWidth;

  const height =
    canvas.clientHeight;

  const groundY =
    Math.round(
      height * 0.78
    );

  hitboxes = [];

  ctx.clearRect(
    0,
    0,
    width,
    height
  );

  drawRoom(
    width,
    height,
    groundY
  );

  drawBed(
    width * 0.035,
    groundY,
    width
  );

  drawStorage(
    width * 0.30,
    groundY,
    width
  );

  drawKitchen(
    width * 0.49,
    groundY,
    width
  );

  drawStove(
    width * 0.74,
    groundY
  );

  drawDoor(
    width * 0.855,
    groundY
  );

  drawPlayer(
    width * 0.44,
    groundY
  );
}


/* =========================
   部屋
========================= */

function drawRoom(
  width,
  height,
  groundY
) {
  ctx.fillStyle =
    '#d8c9ad';

  ctx.fillRect(
    0,
    0,
    width,
    groundY
  );


  ctx.strokeStyle =
    '#c2af90';

  ctx.lineWidth = 1;

  for (
    let y = 42;
    y < groundY;
    y += 42
  ) {
    ctx.beginPath();

    ctx.moveTo(
      0,
      y
    );

    ctx.lineTo(
      width,
      y
    );

    ctx.stroke();
  }


  ctx.fillStyle =
    '#8f7459';

  ctx.fillRect(
    0,
    groundY,
    width,
    height - groundY
  );
}


/* =========================
   ベッド
========================= */

function drawBed(
  x,
  groundY,
  width
) {
  const w =
    Math.max(
      92,
      width * 0.22
    );

  ctx.fillStyle =
    '#654f3d';

  ctx.fillRect(
    x,
    groundY - 30,
    w,
    10
  );

  ctx.fillStyle =
    '#d2c6ad';

  ctx.fillRect(
    x + 4,
    groundY - 52,
    w - 8,
    30
  );

  ctx.fillStyle =
    '#eee7d7';

  ctx.fillRect(
    x + 8,
    groundY - 48,
    28,
    18
  );

  addHitbox(
    'bed',
    x - 10,
    groundY - 85,
    w + 20,
    90
  );
}


/* =========================
   収納棚
========================= */

function drawStorage(
  x,
  groundY,
  width
) {
  const w =
    Math.max(
      62,
      width * 0.13
    );

  const h =
    Math.min(
      126,
      groundY * 0.55
    );

  ctx.fillStyle =
    '#725b42';

  ctx.fillRect(
    x,
    groundY - h,
    w,
    h
  );

  ctx.strokeStyle =
    '#4f3f30';

  ctx.lineWidth = 3;

  ctx.strokeRect(
    x,
    groundY - h,
    w,
    h
  );

  ctx.beginPath();

  ctx.moveTo(
    x,
    groundY - h * 0.66
  );

  ctx.lineTo(
    x + w,
    groundY - h * 0.66
  );

  ctx.moveTo(
    x,
    groundY - h * 0.33
  );

  ctx.lineTo(
    x + w,
    groundY - h * 0.33
  );

  ctx.stroke();

  addHitbox(
    'storage',
    x - 12,
    groundY - h - 10,
    w + 24,
    h + 20
  );
}


/* =========================
   台所
========================= */

function drawKitchen(
  x,
  groundY,
  width
) {
  const w =
    Math.max(
      92,
      width * 0.20
    );

  ctx.fillStyle =
    '#8b806e';

  ctx.fillRect(
    x,
    groundY - 65,
    w,
    65
  );

  ctx.fillStyle =
    '#b8b3a7';

  ctx.fillRect(
    x - 2,
    groundY - 73,
    w + 4,
    10
  );

  ctx.fillStyle =
    '#6f7675';

  ctx.fillRect(
    x + 14,
    groundY - 70,
    w * 0.38,
    5
  );

  addHitbox(
    'kitchen',
    x - 10,
    groundY - 105,
    w + 20,
    110
  );
}


/* =========================
   ストーブ
========================= */

function drawStove(
  x,
  groundY
) {
  ctx.fillStyle =
    '#3c403d';

  ctx.fillRect(
    x,
    groundY - 68,
    54,
    68
  );

  ctx.fillStyle =
    '#222624';

  ctx.fillRect(
    x + 9,
    groundY - 52,
    36,
    34
  );


  if (
    gameState.home.stoveLit
  ) {
    ctx.fillStyle =
      '#e49951';

    ctx.fillRect(
      x + 15,
      groundY - 44,
      24,
      21
    );
  }


  ctx.fillStyle =
    '#454945';

  ctx.fillRect(
    x + 19,
    groundY - 145,
    16,
    77
  );

  addHitbox(
    'stove',
    x - 14,
    groundY - 160,
    82,
    165
  );
}


/* =========================
   玄関
========================= */

function drawDoor(
  x,
  groundY
) {
  const w = 62;

  const h =
    Math.min(
      148,
      groundY * 0.62
    );

  ctx.fillStyle =
    '#594b3e';

  ctx.fillRect(
    x,
    groundY - h,
    w,
    h
  );

  ctx.strokeStyle =
    '#3e342c';

  ctx.lineWidth = 4;

  ctx.strokeRect(
    x,
    groundY - h,
    w,
    h
  );

  ctx.fillStyle =
    '#c9b887';

  ctx.beginPath();

  ctx.arc(
    x + w - 12,
    groundY - h * 0.5,
    5,
    0,
    Math.PI * 2
  );

  ctx.fill();

  addHitbox(
    'door',
    x - 14,
    groundY - h - 10,
    w + 28,
    h + 20
  );
}


/* =========================
   主人公
========================= */

function drawPlayer(
  x,
  groundY
) {
  if (
    !playerImage.complete
    || !playerImage.naturalWidth
  ) {
    return;
  }

  ctx.drawImage(
    playerImage,
    Math.round(
      x - 16
    ),
    Math.round(
      groundY - 48
    ),
    32,
    48
  );
}


/* =========================
   ボタン
========================= */

function makeButton(
  text,
  handler,
  safe = false
) {
  const button =
    document.createElement(
      'button'
    );

  button.type =
    'button';

  button.textContent =
    text;

  if (safe) {
    button.className =
      'safe';
  }

  button.addEventListener(
    'click',
    handler
  );

  return button;
}


function clearControls() {
  controlsEl.replaceChildren();
}


function showDefaultControls() {
  clearControls();

  controlsEl.append(
    makeButton(
      '持ち物を見る',
      () => {
        messageEl.textContent =
          `持ち物：${itemListText(
            getInventoryEntries()
          )}`;
      },
      true
    )
  );
}


function backButton() {
  return makeButton(
    '戻る',
    () => {
      messageEl.textContent =
        '家具をタップしてください。';

      showDefaultControls();
    }
  );
}


/* =========================
   ベッド
========================= */

function showBedControls() {
  clearControls();

  controlsEl.append(
    makeButton(
      '寝る',
      sleep,
      true
    ),
    backButton()
  );
}


function sleep() {
  nextDay(
    7 * 60
  );

  messageEl.textContent =
    `${gameState.day}日目の朝になりました。`;

  updateHud();

  showDefaultControls();
}


/* =========================
   収納
========================= */

function showStorageControls() {
  clearControls();

  controlsEl.append(
    makeButton(
      '全部しまう',
      storeAll,
      true
    ),

    makeButton(
      '取り出す',
      showTakeOutControls
    ),

    backButton()
  );
}


function storeAll() {
  if (
    !getInventoryEntries().length
  ) {
    messageEl.textContent =
      'しまう物を持っていません。';

    return;
  }

  moveAllToStorage();

  messageEl.textContent =
    '持っていた物資を収納しました。';

  updateInventoryDisplay();

  showStorageControls();
}


/* =========================
   収納から取り出す
========================= */

function showTakeOutControls() {
  clearControls();

  const entries =
    getStorageEntries();


  if (
    entries.length === 0
  ) {
    messageEl.textContent =
      '収納は空です。';

    controlsEl.append(
      makeButton(
        '戻る',
        showStorageControls
      )
    );

    return;
  }


  messageEl.textContent =
    '取り出す物を選んでください。';


  for (
    const entry of entries
  ) {
    const button =
      makeButton(
        `${entry.name} ×${entry.count}`,
        () => {
          takeOutOne(
            entry.itemId
          );
        }
      );

    controlsEl.append(
      button
    );
  }


  controlsEl.append(
    makeButton(
      '戻る',
      showStorageControls
    )
  );
}


function takeOutOne(
  itemId
) {
  const success =
    moveItemFromStorage(
      itemId,
      1
    );


  if (!success) {
    messageEl.textContent =
      'これ以上持てません。';

    updateInventoryDisplay();

    showTakeOutControls();

    return;
  }


  updateInventoryDisplay();


  const remaining =
    getStorageCount(
      itemId
    );


  if (
    remaining > 0
  ) {
    messageEl.textContent =
      `1個取り出しました。収納にあと${remaining}個あります。`;
  }

  else {
    messageEl.textContent =
      '1個取り出しました。';
  }


  showTakeOutControls();
}


/* =========================
   台所
========================= */

function showKitchenControls() {
  clearControls();

  controlsEl.append(
    makeButton(
      '缶詰を見る',
      () => {
        const count =
          getItemCount(
            'canned_food'
          )
          +
          getStorageCount(
            'canned_food'
          );

        messageEl.textContent =
          `使える缶詰：${count}個`;
      }
    ),

    backButton()
  );
}


/* =========================
   ストーブ
========================= */

function consumeWood() {
  if (
    getItemCount(
      'wood'
    ) > 0
  ) {
    return removeItem(
      'wood',
      1
    ).success;
  }


  if (
    getStorageCount(
      'wood'
    ) > 0
  ) {
    gameState.storage.wood -= 1;

    if (
      gameState.storage.wood
      <= 0
    ) {
      delete gameState
        .storage
        .wood;
    }

    saveGameState();

    return true;
  }


  return false;
}


function showStoveControls() {
  clearControls();


  if (
    gameState.home.stoveLit
  ) {
    messageEl.textContent =
      '薪ストーブには火がついています。';

    controlsEl.append(
      makeButton(
        '火を消す',
        () => {
          setStoveLit(
            false
          );

          messageEl.textContent =
            'ストーブの火を消しました。';

          drawHome();

          showStoveControls();
        }
      ),

      backButton()
    );

    return;
  }


  messageEl.textContent =
    '薪ストーブです。';


  controlsEl.append(
    makeButton(
      '火をつける',
      () => {
        if (
          !consumeWood()
        ) {
          messageEl.textContent =
            '薪がありません。';

          return;
        }

        setStoveLit(
          true
        );

        messageEl.textContent =
          '薪を1本使って、ストーブに火をつけました。';

        updateInventoryDisplay();

        drawHome();

        showStoveControls();
      },
      true
    ),

    backButton()
  );
}


/* =========================
   玄関
========================= */

function showDoorControls() {
  clearControls();

  controlsEl.append(
    makeButton(
      '外へ出る',
      () => {
        setLocation(
          '自宅前'
        );

        saveGameState();

        window.location.href =
          'zombie.html';
      },
      true
    ),

    backButton()
  );
}


/* =========================
   家具
========================= */

function useFurniture(id) {
  if (
    id === 'bed'
  ) {
    messageEl.textContent =
      'ベッドです。寝ると翌朝まで休みます。';

    showBedControls();

    return;
  }


  if (
    id === 'storage'
  ) {
    messageEl.textContent =
      '収納棚を開きました。';

    showStorageControls();

    return;
  }


  if (
    id === 'kitchen'
  ) {
    messageEl.textContent =
      '台所です。';

    showKitchenControls();

    return;
  }


  if (
    id === 'stove'
  ) {
    showStoveControls();

    return;
  }


  if (
    id === 'door'
  ) {
    messageEl.textContent =
      '玄関です。';

    showDoorControls();
  }
}


/* =========================
   Canvasタップ
========================= */

function handleCanvasPointer(
  event
) {
  const rect =
    canvas.getBoundingClientRect();

  const x =
    event.clientX
    - rect.left;

  const y =
    event.clientY
    - rect.top;


  for (
    let i =
      hitboxes.length - 1;

    i >= 0;

    i -= 1
  ) {
    const box =
      hitboxes[i];


    if (
      x >= box.x
      && x
      <= box.x + box.width
      && y >= box.y
      && y
      <= box.y + box.height
    ) {
      useFurniture(
        box.id
      );

      return;
    }
  }


  messageEl.textContent =
    '家具をタップしてください。';

  showDefaultControls();
}


/* =========================
   初期化
========================= */

function init() {
  setLocation(
    '自宅'
  );

  updateHud();

  updateInventoryDisplay();

  drawHome();

  showDefaultControls();

  messageEl.textContent =
    '自宅です。使いたい家具をタップしてください。';
}


canvas.addEventListener(
  'pointerup',
  handleCanvasPointer
);


window.addEventListener(
  'resize',
  drawHome
);


window.addEventListener(
  'pagehide',
  saveGameState
);


init();