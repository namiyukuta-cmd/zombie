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

playerImage.addEventListener(
  'load',
  () => {
    drawHome();
  }
);


/* =========================
   ゲーム状態
========================= */

const state = {
  day: 1,

  time: 7 * 60,

  inventory: {
    薪: 0,
    缶詰: 0,
    布: 0
  },

  storage: {
    薪: 0,
    缶詰: 0,
    布: 0
  },

  stoveLit: false
};


/* =========================
   家具タップ判定
========================= */

let furnitureHitboxes = [];


/* =========================
   共通
========================= */

function formatTime(totalMinutes) {
  const normalized =
    ((Math.floor(totalMinutes) % 1440) + 1440)
    % 1440;

  const hours =
    Math.floor(normalized / 60);

  const minutes =
    normalized % 60;

  return (
    String(hours).padStart(2, '0')
    + ':'
    + String(minutes).padStart(2, '0')
  );
}


function getSunlight(totalMinutes) {
  const t =
    ((totalMinutes % 1440) + 1440)
    % 1440;

  if (t < 300) {
    return 0.08;
  }

  if (t < 420) {
    return (
      0.08
      + ((t - 300) / 120) * 0.92
    );
  }

  if (t < 1020) {
    return 1;
  }

  if (t < 1140) {
    return (
      1
      - ((t - 1020) / 120) * 0.92
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


function itemText(items) {
  const entries =
    Object.entries(items)
      .filter(([, count]) => count > 0);

  if (entries.length === 0) {
    return 'なし';
  }

  return entries
    .map(
      ([name, count]) =>
        `${name}×${count}`
    )
    .join('　');
}


/* =========================
   HUD
========================= */

function updateHud() {
  const light =
    getSunlight(state.time);

  dateEl.textContent =
    `${state.day}日目`;

  timeEl.textContent =
    formatTime(state.time);

  locationEl.textContent =
    '自宅';

  lightLevelEl.textContent =
    `明るさ：${getLightLabel(light)}`;
}


function updateInventoryDisplay() {
  inventoryEl.textContent =
    `持ち物：${itemText(state.inventory)}`;

  storageEl.textContent =
    `自宅備蓄：${itemText(state.storage)}`;
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

  const width =
    Math.max(
      1,
      Math.round(rect.width * dpr)
    );

  const height =
    Math.max(
      1,
      Math.round(rect.height * dpr)
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

  ctx.imageSmoothingEnabled = false;
}


/* =========================
   タップ領域登録
========================= */

function addHitbox(
  id,
  name,
  x,
  y,
  width,
  height
) {
  furnitureHitboxes.push({
    id,
    name,
    x,
    y,
    width,
    height
  });
}


/* =========================
   部屋
========================= */

function drawRoom(
  width,
  height,
  groundY
) {
  /* 壁 */

  ctx.fillStyle = '#d8c9ad';

  ctx.fillRect(
    0,
    0,
    width,
    groundY
  );


  /* 壁板 */

  ctx.strokeStyle = '#c2af90';

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


  /* 床 */

  ctx.fillStyle = '#8f7459';

  ctx.fillRect(
    0,
    groundY,
    width,
    height - groundY
  );


  ctx.strokeStyle = '#705b46';

  for (
    let x = 0;
    x < width;
    x += 48
  ) {
    ctx.beginPath();

    ctx.moveTo(
      x,
      groundY
    );

    ctx.lineTo(
      x,
      height
    );

    ctx.stroke();
  }
}


/* =========================
   ベッド
========================= */

function drawBed(
  x,
  groundY,
  width
) {
  const bedWidth =
    Math.max(
      92,
      width * 0.22
    );

  const bedHeight = 52;

  ctx.fillStyle = '#654f3d';

  ctx.fillRect(
    x,
    groundY - 30,
    bedWidth,
    10
  );

  ctx.fillStyle = '#d2c6ad';

  ctx.fillRect(
    x + 4,
    groundY - bedHeight,
    bedWidth - 8,
    28
  );

  ctx.fillStyle = '#eee7d7';

  ctx.fillRect(
    x + 8,
    groundY - bedHeight + 4,
    28,
    18
  );

  addHitbox(
    'bed',
    'ベッド',
    x - 10,
    groundY - 85,
    bedWidth + 20,
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
  const shelfWidth =
    Math.max(
      62,
      width * 0.13
    );

  const shelfHeight =
    Math.min(
      126,
      groundY * 0.55
    );

  ctx.fillStyle = '#725b42';

  ctx.fillRect(
    x,
    groundY - shelfHeight,
    shelfWidth,
    shelfHeight
  );

  ctx.strokeStyle = '#4f3f30';

  ctx.lineWidth = 3;

  ctx.strokeRect(
    x,
    groundY - shelfHeight,
    shelfWidth,
    shelfHeight
  );

  ctx.beginPath();

  ctx.moveTo(
    x,
    groundY - shelfHeight * 0.66
  );

  ctx.lineTo(
    x + shelfWidth,
    groundY - shelfHeight * 0.66
  );

  ctx.moveTo(
    x,
    groundY - shelfHeight * 0.33
  );

  ctx.lineTo(
    x + shelfWidth,
    groundY - shelfHeight * 0.33
  );

  ctx.stroke();

  addHitbox(
    'storage',
    '収納棚',
    x - 12,
    groundY - shelfHeight - 10,
    shelfWidth + 24,
    shelfHeight + 20
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
  const kitchenWidth =
    Math.max(
      92,
      width * 0.2
    );

  const kitchenHeight = 65;

  ctx.fillStyle = '#8b806e';

  ctx.fillRect(
    x,
    groundY - kitchenHeight,
    kitchenWidth,
    kitchenHeight
  );

  ctx.fillStyle = '#b8b3a7';

  ctx.fillRect(
    x - 2,
    groundY - kitchenHeight - 8,
    kitchenWidth + 4,
    10
  );

  ctx.fillStyle = '#6f7675';

  ctx.fillRect(
    x + 14,
    groundY - kitchenHeight - 5,
    kitchenWidth * 0.38,
    5
  );

  addHitbox(
    'kitchen',
    '台所',
    x - 10,
    groundY - 105,
    kitchenWidth + 20,
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
  const stoveWidth = 54;

  const stoveHeight = 68;

  ctx.fillStyle = '#3c403d';

  ctx.fillRect(
    x,
    groundY - stoveHeight,
    stoveWidth,
    stoveHeight
  );

  ctx.fillStyle = '#222624';

  ctx.fillRect(
    x + 9,
    groundY - 52,
    36,
    34
  );


  if (state.stoveLit) {
    ctx.fillStyle = '#e49951';

    ctx.fillRect(
      x + 15,
      groundY - 44,
      24,
      21
    );
  }


  ctx.fillStyle = '#454945';

  ctx.fillRect(
    x + 19,
    groundY - 145,
    16,
    77
  );

  addHitbox(
    'stove',
    '薪ストーブ',
    x - 14,
    groundY - 160,
    stoveWidth + 28,
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
  const doorWidth = 62;

  const doorHeight =
    Math.min(
      148,
      groundY * 0.62
    );

  ctx.fillStyle = '#594b3e';

  ctx.fillRect(
    x,
    groundY - doorHeight,
    doorWidth,
    doorHeight
  );

  ctx.strokeStyle = '#3e342c';

  ctx.lineWidth = 4;

  ctx.strokeRect(
    x,
    groundY - doorHeight,
    doorWidth,
    doorHeight
  );

  ctx.fillStyle = '#c9b887';

  ctx.beginPath();

  ctx.arc(
    x + doorWidth - 12,
    groundY - doorHeight * 0.5,
    5,
    0,
    Math.PI * 2
  );

  ctx.fill();

  addHitbox(
    'door',
    '玄関',
    x - 14,
    groundY - doorHeight - 10,
    doorWidth + 28,
    doorHeight + 20
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

  ctx.save();

  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    playerImage,
    Math.round(x - 16),
    Math.round(groundY - 48),
    32,
    48
  );

  ctx.restore();
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

  furnitureHitboxes = [];

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


  /*
    家具配置

    ベッド
    収納棚
    主人公
    台所
    ストーブ
    玄関
  */

  const bedX =
    width * 0.035;

  const storageX =
    width * 0.30;

  const kitchenX =
    width * 0.49;

  const stoveX =
    width * 0.74;

  const doorX =
    width * 0.855;


  drawBed(
    bedX,
    groundY,
    width
  );

  drawStorage(
    storageX,
    groundY,
    width
  );

  drawKitchen(
    kitchenX,
    groundY,
    width
  );

  drawStove(
    stoveX,
    groundY
  );

  drawDoor(
    doorX,
    groundY
  );


  drawPlayer(
    width * 0.44,
    groundY
  );
}


/* =========================
   家具操作
========================= */

function useFurniture(id) {
  if (id === 'bed') {
    messageEl.textContent =
      'ベッドです。寝ると翌朝まで休みます。';

    showBedControls();

    return;
  }


  if (id === 'storage') {
    messageEl.textContent =
      '収納棚を開きました。';

    showStorageControls();

    return;
  }


  if (id === 'kitchen') {
    messageEl.textContent =
      '台所です。料理を作れます。';

    showKitchenControls();

    return;
  }


  if (id === 'stove') {
    showStoveControls();

    return;
  }


  if (id === 'door') {
    messageEl.textContent =
      '玄関です。';

    showDoorControls();
  }
}


/* =========================
   ボタン
========================= */

function makeButton(
  text,
  handler
) {
  const button =
    document.createElement('button');

  button.type = 'button';

  button.textContent = text;

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

  const button =
    makeButton(
      '持ち物を見る',
      () => {
        messageEl.textContent =
          `持ち物：${itemText(state.inventory)}`;
      }
    );

  button.className = 'safe';

  controlsEl.append(button);
}


function showBackButton() {
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

  const sleepButton =
    makeButton(
      '寝る',
      sleep
    );

  sleepButton.className = 'safe';

  controlsEl.append(
    sleepButton,
    showBackButton()
  );
}


function sleep() {
  state.day += 1;

  state.time =
    7 * 60;

  updateHud();

  messageEl.textContent =
    `${state.day}日目の朝になりました。`;

  showDefaultControls();

  drawHome();
}


/* =========================
   収納
========================= */

function showStorageControls() {
  clearControls();

  const storeButton =
    makeButton(
      '全部しまう',
      storeAllItems
    );

  storeButton.className = 'safe';

  controlsEl.append(
    storeButton,
    showBackButton()
  );
}


function storeAllItems() {
  let moved = 0;

  for (
    const [name, count]
    of Object.entries(state.inventory)
  ) {
    if (count <= 0) {
      continue;
    }

    state.storage[name] =
      (
        state.storage[name]
        || 0
      )
      + count;

    state.inventory[name] = 0;

    moved += count;
  }


  if (moved === 0) {
    messageEl.textContent =
      'しまう物を持っていません。';
  }

  else {
    messageEl.textContent =
      '持っていた物資を収納しました。';
  }


  updateInventoryDisplay();

  showStorageControls();
}


/* =========================
   台所
========================= */

function showKitchenControls() {
  clearControls();

  const foodButton =
    makeButton(
      '缶詰を見る',
      () => {
        const cans =
          (
            state.inventory.缶詰
            || 0
          )
          +
          (
            state.storage.缶詰
            || 0
          );

        messageEl.textContent =
          `使える缶詰：${cans}個`;
      }
    );

  controlsEl.append(
    foodButton,
    showBackButton()
  );
}


/* =========================
   ストーブ
========================= */

function showStoveControls() {
  clearControls();


  if (state.stoveLit) {
    messageEl.textContent =
      '薪ストーブには火がついています。';

    const offButton =
      makeButton(
        '火を消す',
        () => {
          state.stoveLit = false;

          messageEl.textContent =
            'ストーブの火を消しました。';

          drawHome();

          showStoveControls();
        }
      );

    controlsEl.append(
      offButton,
      showBackButton()
    );

    return;
  }


  messageEl.textContent =
    '薪ストーブです。';

  const lightButton =
    makeButton(
      '火をつける',
      lightStove
    );

  lightButton.className = 'safe';

  controlsEl.append(
    lightButton,
    showBackButton()
  );
}


function lightStove() {
  let source = null;


  if (
    (state.inventory.薪 || 0)
    > 0
  ) {
    source =
      state.inventory;
  }

  else if (
    (state.storage.薪 || 0)
    > 0
  ) {
    source =
      state.storage;
  }


  if (!source) {
    messageEl.textContent =
      '薪がありません。';

    return;
  }


  source.薪 -= 1;

  state.stoveLit = true;

  messageEl.textContent =
    '薪を1本使って、ストーブに火をつけました。';

  updateInventoryDisplay();

  drawHome();

  showStoveControls();
}


/* =========================
   玄関
========================= */

function showDoorControls() {
  clearControls();

  const outsideButton =
    makeButton(
      '外へ出る',
      () => {
        window.location.href =
          'zombie.html';
      }
    );

  outsideButton.className = 'safe';

  controlsEl.append(
    outsideButton,
    showBackButton()
  );
}


/* =========================
   Canvasタップ
========================= */

function handleCanvasPointer(event) {
  const rect =
    canvas.getBoundingClientRect();

  const x =
    event.clientX - rect.left;

  const y =
    event.clientY - rect.top;


  for (
    let i =
      furnitureHitboxes.length - 1;

    i >= 0;

    i -= 1
  ) {
    const box =
      furnitureHitboxes[i];

    const inside =
      x >= box.x
      && x <= box.x + box.width
      && y >= box.y
      && y <= box.y + box.height;


    if (!inside) {
      continue;
    }


    useFurniture(
      box.id
    );

    return;
  }


  messageEl.textContent =
    '家具をタップしてください。';

  showDefaultControls();
}


/* =========================
   初期化
========================= */

function init() {
  updateHud();

  updateInventoryDisplay();

  resizeCanvas();

  drawHome();

  showDefaultControls();

  messageEl.textContent =
    '自宅です。使いたい家具をタップしてください。';
}


/* =========================
   イベント
========================= */

canvas.addEventListener(
  'pointerup',
  handleCanvasPointer
);


window.addEventListener(
  'resize',
  () => {
    resizeCanvas();

    drawHome();
  }
);


init();