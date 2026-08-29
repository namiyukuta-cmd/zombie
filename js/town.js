import {
  gameState,
  saveGameState,
  addGameMinutes,
  setLocation
} from './game-state.js';

import {
  addItem,
  removeItem,
  getInventoryEntries,
  getItemCount,
  hasItem
} from './inventory.js';

import {
  getItemName
} from './items.js';

const canvas = document.getElementById('town-world');
const ctx = canvas.getContext('2d');

const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const locationEl = document.getElementById('location');
const moneyEl = document.getElementById('money');
const sceneNameEl = document.getElementById('scene-name');
const messageEl = document.getElementById('message');
const panelEl = document.getElementById('panel');
const inventoryButton = document.getElementById('inventory-button');
const homeButton = document.getElementById('home-button');

const PLAYER_SOURCES = [
  'assets/player/player_walk_01.png',
  'assets/player/player_walk_02.png',
  'assets/player/player_walk_03.png',
  'assets/player/player_walk_04.png'
];

const playerFrames = PLAYER_SOURCES.map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const SCENE_NAMES = {
  street: '町の通り',
  grocery: '食料品店',
  station: '駅',
  harbor: '港',
  clinic: '診療所'
};

const NEWS = [
  {
    day: 1,
    title: '戦況の情報が錯綜',
    text: '南から届く知らせは途切れ途切れだ。港と鉄道の動きだけが急に増えている。'
  },
  {
    day: 2,
    title: '英国軍部隊が到着',
    text: '港と駅に兵士と貨物が集まり、町は朝から落ち着かない。'
  },
  {
    day: 4,
    title: '空襲への警戒',
    text: '駅と港を狙った空襲が懸念されている。夜間の灯火を抑えるよう呼びかけが出た。'
  },
  {
    day: 5,
    title: '町に被害',
    text: '爆撃で複数の建物が損傷した。店を閉め、町外へ避難する住民も出ている。'
  },
  {
    day: 7,
    title: '負傷者について奇妙な噂',
    text: '診療所に運ばれた負傷者の一部が高熱と異常な興奮状態を示したという噂がある。'
  }
];

const LOOT = {
  groceryShelfA: [
    ['canned_food', 0.85],
    ['canned_food', 0.50],
    ['cloth', 0.25]
  ],
  groceryShelfB: [
    ['canned_food', 0.65],
    ['wood', 0.25],
    ['cloth', 0.35]
  ],
  groceryBack: [
    ['canned_food', 0.90],
    ['canned_food', 0.70],
    ['knife', 0.12],
    ['cloth', 0.55]
  ],
  stationCrate: [
    ['cloth', 0.50],
    ['wood', 0.55],
    ['small_stone', 0.80],
    ['stick', 0.20]
  ],
  stationBench: [
    ['cloth', 0.30],
    ['small_stone', 0.75]
  ],
  harborCrate: [
    ['wood', 0.75],
    ['cloth', 0.55],
    ['canned_food', 0.35]
  ],
  harborShore: [
    ['small_stone', 0.95],
    ['small_stone', 0.75],
    ['stick', 0.28]
  ],
  clinicCabinet: [
    ['cloth', 0.80],
    ['cloth', 0.45],
    ['canned_food', 0.18]
  ]
};

const runtime = {
  scene: 'street',
  hitboxes: [],
  playerX: 70,
  targetX: 70,
  direction: 1,
  moving: false,
  pendingAction: null,
  frame: 0,
  frameTimer: 0,
  lastTimestamp: 0
};

function ensureTownState() {
  if (!gameState.town || typeof gameState.town !== 'object') {
    gameState.town = {};
  }

  const town = gameState.town;

  if (!SCENE_NAMES[town.scene]) town.scene = 'street';
  if (!Number.isFinite(town.money)) town.money = 12;
  if (!town.loot || typeof town.loot !== 'object') town.loot = {};
  if (!town.flags || typeof town.flags !== 'object') town.flags = {};
  if (!town.daily || typeof town.daily !== 'object') town.daily = {};
  if (!town.shopStock || typeof town.shopStock !== 'object') town.shopStock = {};
  if (!Number.isFinite(town.shopStockDay)) town.shopStockDay = 0;

  runtime.scene = town.scene;
  refreshShopStock();
  saveGameState();
}

function refreshShopStock() {
  const town = gameState.town;
  if (town.shopStockDay === gameState.day) return;

  town.shopStockDay = gameState.day;
  town.shopStock = {
    canned_food: gameState.day >= 6 ? 1 : 4,
    cloth: gameState.day >= 6 ? 1 : 3,
    wood: 4,
    knife: gameState.day >= 2 && gameState.day <= 5 ? 1 : 0
  };
}

function formatTime(totalMinutes) {
  const t = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function dateText() {
  const date = new Date(Date.UTC(1940, 3, 15 + gameState.day));
  return `1940/4/${date.getUTCDate()}　${gameState.day}日目`;
}

function currentNews() {
  let selected = NEWS[0];
  for (const news of NEWS) {
    if (gameState.day >= news.day) selected = news;
  }
  return selected;
}

function updateHud() {
  dateEl.textContent = dateText();
  timeEl.textContent = formatTime(gameState.time);
  locationEl.textContent = SCENE_NAMES[runtime.scene];
  moneyEl.textContent = `${gameState.town.money} kr`;
  sceneNameEl.textContent = SCENE_NAMES[runtime.scene];
}

function setMessage(text) {
  messageEl.textContent = text;
}

function clearPanel() {
  panelEl.replaceChildren();
}

function makeButton(text, handler, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  if (className) button.className = className;
  button.addEventListener('click', handler);
  return button;
}

function addPanelText(text) {
  const div = document.createElement('div');
  div.className = 'panel-text';
  div.textContent = text;
  panelEl.appendChild(div);
}

function advance(minutes) {
  addGameMinutes(minutes);
  refreshShopStock();
  updateHud();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function addHotspot(id, label, x, y, w, h, action) {
  runtime.hitboxes.push({ id, label, x, y, w, h, action });
}

function drawLabel(label, x, y) {
  ctx.save();
  ctx.font = '700 17px sans-serif';
  const width = ctx.measureText(label).width + 18;
  ctx.fillStyle = 'rgba(255,253,248,.90)';
  ctx.strokeStyle = 'rgba(66,60,52,.70)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - 17, width, 32, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#292725';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawSkyAndGround(width, height, indoor = false) {
  if (indoor) {
    ctx.fillStyle = '#d6cab6';
    ctx.fillRect(0, 0, width, height * 0.72);
    ctx.fillStyle = '#8b7259';
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
    return;
  }

  ctx.fillStyle = '#bcc9ca';
  ctx.fillRect(0, 0, width, height * 0.68);
  ctx.fillStyle = '#8b8375';
  ctx.fillRect(0, height * 0.68, width, height * 0.32);
}

function drawBuilding(x, groundY, w, h, wall, roof, sign = '') {
  ctx.fillStyle = wall;
  ctx.fillRect(x, groundY - h, w, h);
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 8, groundY - h);
  ctx.lineTo(x + w / 2, groundY - h - 38);
  ctx.lineTo(x + w + 8, groundY - h);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#554b40';
  ctx.fillRect(x + w * 0.42, groundY - 70, 42, 70);
  ctx.fillStyle = '#b9c7c5';
  ctx.fillRect(x + 14, groundY - h + 25, 48, 45);

  if (sign) {
    ctx.fillStyle = '#f2eadb';
    ctx.strokeStyle = '#665b4e';
    ctx.fillRect(x + 8, groundY - h + 84, w - 16, 32);
    ctx.strokeRect(x + 8, groundY - h + 84, w - 16, 32);
    ctx.fillStyle = '#332f2a';
    ctx.font = '700 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sign, x + w / 2, groundY - h + 106);
  }
}

function drawStreet(width, height) {
  drawSkyAndGround(width, height, false);
  const groundY = height * 0.78;

  drawBuilding(width * 0.03, groundY, width * 0.25, height * 0.44, '#b89b78', '#6d6257', '食料品店');
  drawBuilding(width * 0.30, groundY, width * 0.25, height * 0.49, '#c5b79d', '#5f5a52', '駅');
  drawBuilding(width * 0.58, groundY, width * 0.22, height * 0.42, '#d2cec2', '#6a655d', '診療所');

  ctx.fillStyle = '#778e95';
  ctx.fillRect(width * 0.82, height * 0.33, width * 0.18, height * 0.35);
  ctx.fillStyle = '#655c51';
  ctx.fillRect(width * 0.82, height * 0.68, width * 0.18, height * 0.10);

  ctx.fillStyle = '#776957';
  ctx.fillRect(width * 0.46, groundY - 48, 34, 48);
  ctx.fillStyle = '#ede6d7';
  ctx.fillRect(width * 0.455, groundY - 64, 44, 25);

  if (gameState.day >= 5) {
    ctx.fillStyle = 'rgba(70,65,60,.22)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#413c37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.09, groundY - 160);
    ctx.lineTo(width * 0.18, groundY - 92);
    ctx.stroke();
  }

  addHotspot('grocery', '入る', width * 0.05, groundY - 160, width * 0.22, 160, () => travelTo('grocery'));
  addHotspot('station', '駅', width * 0.31, groundY - 180, width * 0.23, 180, () => travelTo('station'));
  addHotspot('clinic', '診療所', width * 0.59, groundY - 160, width * 0.21, 160, () => travelTo('clinic'));
  addHotspot('harbor', '港へ →', width * 0.82, groundY - 95, width * 0.17, 110, () => travelTo('harbor'));
  addHotspot('news', '新聞', width * 0.43, groundY - 80, 80, 85, showNews);
  addHotspot('solveig', 'ソルヴェイ', width * 0.19, groundY - 58, 70, 65, talkSolveig);

  drawLabel('食料品店', width * 0.155, groundY - 180);
  drawLabel('駅', width * 0.425, groundY - 205);
  drawLabel('診療所', width * 0.69, groundY - 180);
  drawLabel('港 →', width * 0.91, groundY - 115);
  drawLabel('新聞', width * 0.49, groundY - 90);
  drawLabel('ソルヴェイ', width * 0.19, groundY - 70);
}

function drawGrocery(width, height) {
  drawSkyAndGround(width, height, true);
  const groundY = height * 0.79;

  ctx.fillStyle = '#806b52';
  ctx.fillRect(width * 0.06, groundY - 190, width * 0.24, 190);
  ctx.fillRect(width * 0.36, groundY - 190, width * 0.24, 190);
  ctx.fillStyle = '#6a5744';
  for (let i = 0; i < 3; i += 1) {
    const y = groundY - 55 - i * 55;
    ctx.fillRect(width * 0.06, y, width * 0.24, 8);
    ctx.fillRect(width * 0.36, y, width * 0.24, 8);
  }

  ctx.fillStyle = '#80664d';
  ctx.fillRect(width * 0.66, groundY - 82, width * 0.24, 82);
  ctx.fillStyle = '#4f4338';
  ctx.fillRect(width * 0.86, groundY - 210, width * 0.12, 210);

  ctx.fillStyle = '#4f5a52';
  ctx.beginPath();
  ctx.arc(width * 0.74, groundY - 115, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(width * 0.72, groundY - 100, 22, 48);

  if (gameState.day >= 6) {
    ctx.strokeStyle = '#534c45';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.10, groundY - 172);
    ctx.lineTo(width * 0.25, groundY - 130);
    ctx.stroke();
  }

  addHotspot('shelfA', '棚を漁る', width * 0.05, groundY - 200, width * 0.27, 205, () => lootSpot('groceryShelfA', LOOT.groceryShelfA));
  addHotspot('shelfB', '棚を漁る', width * 0.35, groundY - 200, width * 0.27, 205, () => lootSpot('groceryShelfB', LOOT.groceryShelfB));
  addHotspot('marta', 'マルタ', width * 0.67, groundY - 170, width * 0.13, 130, talkMarta);
  addHotspot('back', '奥を調べる', width * 0.84, groundY - 220, width * 0.15, 225, searchBackRoom);
  addHotspot('exit', '外へ', 0, groundY - 90, width * 0.08, 95, () => travelTo('street'));

  drawLabel('棚', width * 0.18, groundY - 205);
  drawLabel('棚', width * 0.48, groundY - 205);
  drawLabel('マルタ', width * 0.74, groundY - 150);
  drawLabel('奥', width * 0.92, groundY - 225);
  drawLabel('← 外', width * 0.07, groundY - 105);
}

function drawStation(width, height) {
  drawSkyAndGround(width, height, true);
  const groundY = height * 0.79;

  ctx.fillStyle = '#9a8a74';
  ctx.fillRect(0, groundY - 48, width, 48);
  ctx.strokeStyle = '#4f4b45';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, groundY - 18);
  ctx.lineTo(width, groundY - 18);
  ctx.stroke();

  ctx.fillStyle = '#7d684e';
  ctx.fillRect(width * 0.12, groundY - 80, width * 0.20, 80);
  ctx.fillRect(width * 0.67, groundY - 72, width * 0.18, 72);

  ctx.fillStyle = '#e8e1d4';
  ctx.fillRect(width * 0.40, groundY - 190, width * 0.18, 115);
  ctx.strokeStyle = '#61594e';
  ctx.strokeRect(width * 0.40, groundY - 190, width * 0.18, 115);

  const injured = gameState.day >= 2 && !gameState.town.flags.porterHelped;
  if (injured) {
    ctx.fillStyle = '#6c5d55';
    ctx.beginPath();
    ctx.arc(width * 0.58, groundY - 55, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(width * 0.56, groundY - 42, 25, 38);
  }

  if (gameState.day >= 5) {
    ctx.fillStyle = 'rgba(64,58,54,.20)';
    ctx.fillRect(0, 0, width, height);
  }

  addHotspot('crate', '木箱', width * 0.10, groundY - 95, width * 0.24, 100, () => lootSpot('stationCrate', LOOT.stationCrate));
  addHotspot('notice', '掲示板', width * 0.39, groundY - 205, width * 0.20, 140, showNews);
  addHotspot('bench', 'ベンチ', width * 0.67, groundY - 90, width * 0.20, 95, () => lootSpot('stationBench', LOOT.stationBench));
  if (injured) addHotspot('porter', '負傷した荷役係', width * 0.52, groundY - 100, width * 0.15, 105, injuredPorter);
  addHotspot('exit', '外へ', 0, groundY - 90, width * 0.08, 95, () => travelTo('street'));

  drawLabel('木箱', width * 0.22, groundY - 105);
  drawLabel('掲示板', width * 0.49, groundY - 215);
  drawLabel('ベンチ', width * 0.77, groundY - 100);
  if (injured) drawLabel('負傷者', width * 0.59, groundY - 115);
  drawLabel('← 外', width * 0.07, groundY - 105);
}

function drawHarbor(width, height) {
  ctx.fillStyle = '#aebfc4';
  ctx.fillRect(0, 0, width, height * 0.45);
  ctx.fillStyle = '#748e96';
  ctx.fillRect(0, height * 0.45, width, height * 0.27);
  ctx.fillStyle = '#746758';
  ctx.fillRect(0, height * 0.72, width, height * 0.28);
  const groundY = height * 0.80;

  ctx.fillStyle = '#7d684e';
  ctx.fillRect(width * 0.18, groundY - 78, width * 0.22, 78);
  ctx.fillStyle = '#6b5947';
  ctx.fillRect(width * 0.48, groundY - 95, width * 0.18, 95);

  ctx.fillStyle = '#55645d';
  ctx.beginPath();
  ctx.arc(width * 0.75, groundY - 85, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(width * 0.73, groundY - 70, 24, 50);

  if (gameState.day >= 5) {
    ctx.fillStyle = 'rgba(58,55,52,.16)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#5d5650';
    ctx.fillRect(width * 0.51, groundY - 110, 8, 110);
  }

  addHotspot('crate', '荷箱', width * 0.16, groundY - 98, width * 0.27, 105, () => lootSpot('harborCrate', LOOT.harborCrate));
  addHotspot('shore', '岸辺', width * 0.45, groundY - 118, width * 0.23, 125, () => lootSpot('harborShore', LOOT.harborShore));
  addHotspot('ingrid', 'イングリッド', width * 0.69, groundY - 130, width * 0.15, 130, talkIngrid);
  addHotspot('exit', '町へ', 0, groundY - 95, width * 0.10, 100, () => travelTo('street'));

  drawLabel('荷箱', width * 0.29, groundY - 110);
  drawLabel('岸辺', width * 0.57, groundY - 130);
  drawLabel('イングリッド', width * 0.76, groundY - 145);
  drawLabel('← 町', width * 0.08, groundY - 110);
}

function drawClinic(width, height) {
  drawSkyAndGround(width, height, true);
  const groundY = height * 0.79;

  ctx.fillStyle = '#ede9de';
  ctx.fillRect(width * 0.06, groundY - 115, width * 0.34, 80);
  ctx.fillStyle = '#d2d8d5';
  ctx.fillRect(width * 0.08, groundY - 105, width * 0.30, 42);

  ctx.fillStyle = '#91826e';
  ctx.fillRect(width * 0.67, groundY - 180, width * 0.22, 180);

  ctx.fillStyle = '#53645e';
  ctx.beginPath();
  ctx.arc(width * 0.54, groundY - 96, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(width * 0.52, groundY - 80, 24, 52);

  if (gameState.day >= 7) {
    ctx.fillStyle = '#6f625b';
    ctx.beginPath();
    ctx.arc(width * 0.24, groundY - 88, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  addHotspot('cabinet', '薬品棚', width * 0.66, groundY - 195, width * 0.24, 200, () => lootSpot('clinicCabinet', LOOT.clinicCabinet));
  addHotspot('nurse', 'リヴ', width * 0.48, groundY - 140, width * 0.14, 140, talkLiv);
  if (gameState.day >= 7) addHotspot('patient', '患者', width * 0.14, groundY - 130, width * 0.20, 135, strangePatient);
  addHotspot('exit', '外へ', 0, groundY - 90, width * 0.08, 95, () => travelTo('street'));

  drawLabel('薬品棚', width * 0.78, groundY - 205);
  drawLabel('リヴ', width * 0.55, groundY - 150);
  if (gameState.day >= 7) drawLabel('患者', width * 0.24, groundY - 145);
  drawLabel('← 外', width * 0.07, groundY - 105);
}

function drawPlayer(width, height) {
  const frame = playerFrames[runtime.frame];
  if (!frame || !frame.complete || !frame.naturalWidth) return;

  const groundY = height * 0.82;
  const x = runtime.playerX;
  const y = groundY - 48;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (runtime.direction < 0) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, -16, y, 32, 48);
  } else {
    ctx.drawImage(frame, x - 16, y, 32, 48);
  }
  ctx.restore();
}

function drawNightOverlay(width, height) {
  const hour = (gameState.time / 60) % 24;
  let alpha = 0;
  if (hour >= 20 || hour < 5) alpha = 0.48;
  else if (hour >= 18) alpha = (hour - 18) * 0.18;
  else if (hour < 7) alpha = (7 - hour) * 0.18;

  if (alpha > 0) {
    ctx.fillStyle = `rgba(18,24,31,${Math.min(alpha, 0.55)})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawScene() {
  resizeCanvas();
  runtime.hitboxes = [];

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.clearRect(0, 0, width, height);

  if (runtime.scene === 'street') drawStreet(width, height);
  else if (runtime.scene === 'grocery') drawGrocery(width, height);
  else if (runtime.scene === 'station') drawStation(width, height);
  else if (runtime.scene === 'harbor') drawHarbor(width, height);
  else if (runtime.scene === 'clinic') drawClinic(width, height);

  drawPlayer(width, height);
  drawNightOverlay(width, height);
}

function travelTo(sceneId) {
  if (!SCENE_NAMES[sceneId]) return;

  advance(sceneId === 'harbor' || runtime.scene === 'harbor' ? 8 : 5);
  runtime.scene = sceneId;
  gameState.town.scene = sceneId;
  runtime.playerX = canvas.clientWidth * 0.13;
  runtime.targetX = runtime.playerX;
  clearPanel();
  setLocation(SCENE_NAMES[sceneId]);
  saveGameState();
  updateHud();
  setMessage(`${SCENE_NAMES[sceneId]}に来た。画面の物や人を直接タップできます。`);
  drawScene();
}

function showInventory() {
  clearPanel();
  const entries = getInventoryEntries();

  if (!entries.length) {
    addPanelText('持ち物はありません。');
    return;
  }

  addPanelText(entries.map((e) => `${e.name}×${e.count}`).join('　'));
}

function showNews() {
  advance(3);
  const news = currentNews();
  clearPanel();
  addPanelText(`【${news.title}】\n${news.text}`);
  setMessage('掲示された記事を読んだ。');
  gameState.town.flags.lastNewsDay = gameState.day;
  saveGameState();
}

function talkSolveig() {
  advance(4);
  clearPanel();

  let text;
  if (gameState.day === 1) {
    text = '「港も駅も、朝からずっと騒がしいわ。食べ物は少し多めに買っておいた方がいいかもしれない」';
  } else if (gameState.day < 5) {
    text = '「昨夜も汽笛が聞こえたわ。眠れなかった。あなたも暗くなる前には帰ってきて」';
  } else {
    text = '「向こうの家、昨日の爆撃で窓が全部割れたの。ここもいつまで無事か……」';
  }

  addPanelText(`ソルヴェイ\n${text}`);
  setMessage('隣人のソルヴェイと話した。');
}

function talkMarta() {
  advance(3);
  clearPanel();

  if (gameState.day >= 7) {
    addPanelText('マルタ「もう棚にほとんど残ってない。売れる物だけ出しておくよ」');
  } else {
    addPanelText('マルタ「必要な物があるなら今のうちに。次の荷が来る保証はないよ」');
  }

  const goods = [
    ['canned_food', 3],
    ['cloth', 2],
    ['wood', 1],
    ['knife', 12]
  ];

  for (const [itemId, price] of goods) {
    const stock = gameState.town.shopStock[itemId] || 0;
    if (stock <= 0) continue;

    panelEl.appendChild(makeButton(
      `${getItemName(itemId)}　${price}kr　残${stock}`,
      () => buyItem(itemId, price),
      'safe'
    ));
  }
}

function buyItem(itemId, price) {
  if ((gameState.town.shopStock[itemId] || 0) <= 0) {
    setMessage('売り切れです。');
    talkMarta();
    return;
  }

  if (gameState.town.money < price) {
    setMessage('お金が足りません。');
    return;
  }

  const result = addItem(itemId, 1);
  if (!result.success) {
    setMessage('これ以上持てません。');
    return;
  }

  gameState.town.money -= price;
  gameState.town.shopStock[itemId] -= 1;
  advance(2);
  saveGameState();
  updateHud();
  setMessage(`${getItemName(itemId)}を1個買いました。`);
  talkMarta();
}

function talkIngrid() {
  advance(3);
  clearPanel();

  if (gameState.town.flags.porterHelped && !gameState.town.flags.porterThanksSeen) {
    gameState.town.flags.porterThanksSeen = true;
    addPanelText('イングリッド「駅のホーコンを助けたんだって？　さっき港の連中もその話をしてたよ」');
  } else {
    addPanelText('イングリッド「荷物が増えるばかりで、人手が足りない。少し働くなら賃金は出すよ」');
  }

  const key = `harborWorkDay${gameState.day}`;
  if (!gameState.town.daily[key]) {
    panelEl.appendChild(makeButton('荷下ろしを手伝う　+4kr / 25分', doHarborWork, 'safe'));
  }

  saveGameState();
}

function doHarborWork() {
  const key = `harborWorkDay${gameState.day}`;
  if (gameState.town.daily[key]) {
    setMessage('今日はもう十分働きました。');
    return;
  }

  gameState.town.daily[key] = true;
  gameState.town.money += 4;
  advance(25);
  saveGameState();
  updateHud();
  setMessage('荷下ろしを手伝って4kr受け取りました。');
  talkIngrid();
}

function injuredPorter() {
  clearPanel();
  addPanelText('駅の荷役係ホーコンが、脚から血を流して壁際に座り込んでいる。');

  if (hasItem('cloth', 1)) {
    panelEl.appendChild(makeButton('布を1枚使って手当てする', () => {
      const removed = removeItem('cloth', 1);
      if (!removed.success) return;
      gameState.town.flags.porterHelped = true;
      advance(12);
      saveGameState();
      setMessage('傷を縛って止血した。ホーコンは何度も礼を言った。');
      clearPanel();
      drawScene();
    }, 'safe'));
  } else {
    addPanelText('傷を縛れそうな布を持っていません。');
  }
}

function talkLiv() {
  advance(4);
  clearPanel();

  if (gameState.day >= 7) {
    addPanelText('リヴ「高熱の患者が増えてる。でも、熱だけじゃないの。噛みつこうとする人までいる……」');
  } else if (gameState.town.flags.porterHelped) {
    addPanelText('リヴ「駅の負傷者に応急手当てをしたそうね。助かったわ。今は怪我人が多すぎるの」');
  } else {
    addPanelText('リヴ「包帯も消毒薬も足りない。まだ町が静かなうちに備えないと」');
  }

  setMessage('看護師のリヴと話した。');
}

function strangePatient() {
  advance(3);
  clearPanel();

  if (!gameState.town.flags.strangePatientSeen) {
    gameState.town.flags.strangePatientSeen = true;
    addPanelText('ベッドの男は汗だくで、手首を革帯で固定されている。こちらを見ると、歯をむき出して低く唸った。');
    setMessage('普通の負傷者には見えない。');
  } else {
    addPanelText('男は返事をしない。呼吸だけが荒い。近づくとリヴに止められた。');
  }

  saveGameState();
}

function searchBackRoom() {
  if (gameState.day < 5 && !gameState.town.flags.backRoomOpened) {
    clearPanel();
    addPanelText('奥の扉には鍵が掛かっている。');

    if (hasItem('knife', 1)) {
      panelEl.appendChild(makeButton('ナイフで古い掛け金を外す　15分', () => {
        gameState.town.flags.backRoomOpened = true;
        advance(15);
        saveGameState();
        setMessage('掛け金を外して奥へ入れるようになった。');
        clearPanel();
        drawScene();
      }, 'warn'));
    }
    return;
  }

  gameState.town.flags.backRoomOpened = true;
  lootSpot('groceryBack', LOOT.groceryBack, 12);
}

function lootSpot(key, pool, minutes = 8) {
  const record = gameState.town.loot[key];

  if (record && record.day === gameState.day) {
    setMessage('今日はもう調べました。残っている物はなさそうです。');
    clearPanel();
    return;
  }

  gameState.town.loot[key] = { day: gameState.day };
  advance(minutes);

  const found = [];
  for (const [itemId, baseChance] of pool) {
    let chance = baseChance;
    if (gameState.day >= 6 && key.startsWith('grocery')) chance *= 0.55;
    if (Math.random() <= chance) {
      const result = addItem(itemId, 1);
      if (result.success) found.push(getItemName(itemId));
    }
  }

  saveGameState();
  clearPanel();

  if (!found.length) {
    setMessage('探しましたが、持ち帰れる物は見つかりませんでした。');
    return;
  }

  setMessage(`${found.join('、')}を見つけて持ち帰りました。`);
  showInventory();
}

function queueHotspot(box) {
  if (runtime.moving) return;

  clearPanel();
  runtime.targetX = box.x + box.w / 2;
  runtime.direction = runtime.targetX < runtime.playerX ? -1 : 1;
  runtime.pendingAction = box.action;

  if (Math.abs(runtime.targetX - runtime.playerX) < 12) {
    const action = runtime.pendingAction;
    runtime.pendingAction = null;
    if (action) action();
    return;
  }

  runtime.moving = true;
  setMessage(`${box.label}へ移動中……`);
}

function handlePointer(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  for (let i = runtime.hitboxes.length - 1; i >= 0; i -= 1) {
    const box = runtime.hitboxes[i];
    if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
      queueHotspot(box);
      return;
    }
  }

  clearPanel();
  setMessage('建物、人、棚、箱などを直接タップしてください。');
}

function update(timestamp) {
  if (!runtime.lastTimestamp) runtime.lastTimestamp = timestamp;
  const dt = Math.min((timestamp - runtime.lastTimestamp) / 1000, 0.05);
  runtime.lastTimestamp = timestamp;

  if (runtime.moving) {
    const distance = runtime.targetX - runtime.playerX;
    const step = 190 * dt;

    if (Math.abs(distance) <= step) {
      runtime.playerX = runtime.targetX;
      runtime.moving = false;
      runtime.frame = 0;
      runtime.frameTimer = 0;

      const action = runtime.pendingAction;
      runtime.pendingAction = null;
      if (action) action();
    } else {
      runtime.playerX += Math.sign(distance) * step;
      runtime.frameTimer += dt;
      if (runtime.frameTimer >= 0.13) {
        runtime.frameTimer -= 0.13;
        runtime.frame = (runtime.frame + 1) % playerFrames.length;
      }
    }
  }

  drawScene();
  requestAnimationFrame(update);
}

function returnHome() {
  gameState.town.scene = 'street';
  setLocation('自宅');
  saveGameState();
  window.location.href = 'zombie_home.html';
}

function init() {
  ensureTownState();
  setLocation(SCENE_NAMES[runtime.scene]);
  updateHud();
  setMessage('町に出ました。画面の建物・人・物を直接タップしてください。');
  resizeCanvas();
  runtime.playerX = canvas.clientWidth * 0.12;
  runtime.targetX = runtime.playerX;
  drawScene();
  requestAnimationFrame(update);
}

canvas.addEventListener('pointerup', handlePointer);
inventoryButton.addEventListener('click', showInventory);
homeButton.addEventListener('click', returnHome);

window.addEventListener('resize', () => {
  resizeCanvas();
  runtime.playerX = Math.min(runtime.playerX, canvas.clientWidth - 30);
  runtime.targetX = runtime.playerX;
  drawScene();
});

window.addEventListener('pagehide', saveGameState);

init();