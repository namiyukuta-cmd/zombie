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

const PLAYER_WALK_SOURCES = [
  'assets/player/player_walk_01.png',
  'assets/player/player_walk_02.png',
  'assets/player/player_walk_03.png',
  'assets/player/player_walk_04.png'
];

const playerWalkFrames = PLAYER_WALK_SOURCES.map((src) => {
  const image = new Image();
  image.src = src;
  image.addEventListener('load', drawHome);
  return image;
});

const furniture = [
  { id: 'bed', name: 'ベッド', x: 90, width: 120, action: '寝る' },
  { id: 'storage', name: '収納棚', x: 285, width: 80, action: '収納' },
  { id: 'kitchen', name: '台所', x: 470, width: 120, action: '料理' },
  { id: 'stove', name: 'ストーブ', x: 675, width: 70, action: '使う' },
  { id: 'door', name: '玄関', x: 865, width: 80, action: '外へ出る' }
];

const INTERACTION_DISTANCE = 44;
const RELEASE_DISTANCE = 72;

const state = {
  day: 1,
  time: 7 * 60,
  location: '自宅',
  homeWidth: 1050,
  player: {
    x: 240,
    speed: 110,
    direction: 1,
    animationFrame: 0,
    animationTimer: 0
  },
  cameraX: 0,
  moveDirection: 0,
  lastTimestamp: 0,
  nearbyFurniture: null,
  ignoredFurnitureId: null,
  inventory: {
    薪: 0,
    缶詰: 0,
    布: 0
  },
  storage: {
    薪: 0,
    缶詰: 0,
    布: 0
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(totalMinutes) {
  const minutesInDay = 24 * 60;
  const normalized = ((Math.floor(totalMinutes) % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getSunlight(totalMinutes) {
  const t = ((totalMinutes % 1440) + 1440) % 1440;
  if (t < 300) return 0.08;
  if (t < 420) return 0.08 + ((t - 300) / 120) * 0.92;
  if (t < 1020) return 1;
  if (t < 1140) return 1 - ((t - 1020) / 120) * 0.92;
  return 0.08;
}

function getLightLabel(light) {
  if (light >= 0.8) return '明るい';
  if (light >= 0.45) return '薄明るい';
  if (light >= 0.2) return '薄暗い';
  return '暗い';
}

function updateHud() {
  const light = getSunlight(state.time);
  dateEl.textContent = `${state.day}日目`;
  timeEl.textContent = formatTime(state.time);
  locationEl.textContent = state.location;
  lightLevelEl.textContent = `明るさ：${getLightLabel(light)}`;
}

function itemText(items) {
  const entries = Object.entries(items).filter(([, count]) => count > 0);
  if (entries.length === 0) return 'なし';
  return entries.map(([name, count]) => `${name}×${count}`).join('　');
}

function updateInventoryDisplay() {
  inventoryEl.textContent = `持ち物：${itemText(state.inventory)}`;
  storageEl.textContent = `自宅備蓄：${itemText(state.storage)}`;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function drawRoom(groundY) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.fillStyle = '#d8c9ad';
  ctx.fillRect(0, 0, width, groundY);

  ctx.strokeStyle = '#c2af90';
  ctx.lineWidth = 1;
  for (let y = 45; y < groundY; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#8f7459';
  ctx.fillRect(0, groundY, width, height - groundY);

  ctx.strokeStyle = '#705b46';
  for (let x = 0; x < width; x += 55) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

function drawBed(screenX, groundY) {
  ctx.fillStyle = '#654f3d';
  ctx.fillRect(screenX, groundY - 39, 120, 12);
  ctx.fillStyle = '#d2c6ad';
  ctx.fillRect(screenX + 5, groundY - 62, 110, 26);
  ctx.fillStyle = '#eee7d7';
  ctx.fillRect(screenX + 8, groundY - 60, 28, 18);
}

function drawStorage(screenX, groundY) {
  ctx.fillStyle = '#725b42';
  ctx.fillRect(screenX, groundY - 125, 76, 125);
  ctx.strokeStyle = '#4f3f30';
  ctx.lineWidth = 3;
  ctx.strokeRect(screenX, groundY - 125, 76, 125);
  ctx.beginPath();
  ctx.moveTo(screenX, groundY - 84);
  ctx.lineTo(screenX + 76, groundY - 84);
  ctx.moveTo(screenX, groundY - 43);
  ctx.lineTo(screenX + 76, groundY - 43);
  ctx.stroke();
}

function drawKitchen(screenX, groundY) {
  ctx.fillStyle = '#8b806e';
  ctx.fillRect(screenX, groundY - 68, 120, 68);
  ctx.fillStyle = '#b8b3a7';
  ctx.fillRect(screenX - 3, groundY - 74, 126, 10);
  ctx.fillStyle = '#6f7675';
  ctx.fillRect(screenX + 15, groundY - 71, 45, 5);
}

function drawStove(screenX, groundY) {
  ctx.fillStyle = '#3c403d';
  ctx.fillRect(screenX, groundY - 70, 65, 70);
  ctx.fillStyle = '#222624';
  ctx.fillRect(screenX + 12, groundY - 54, 41, 36);
  ctx.fillStyle = '#e49951';
  ctx.fillRect(screenX + 18, groundY - 46, 29, 23);
  ctx.fillStyle = '#454945';
  ctx.fillRect(screenX + 23, groundY - 160, 20, 90);
}

function drawDoor(screenX, groundY) {
  ctx.fillStyle = '#594b3e';
  ctx.fillRect(screenX, groundY - 150, 72, 150);
  ctx.strokeStyle = '#3e342c';
  ctx.lineWidth = 4;
  ctx.strokeRect(screenX, groundY - 150, 72, 150);
  ctx.fillStyle = '#c9b887';
  ctx.beginPath();
  ctx.arc(screenX + 57, groundY - 75, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFurniture(groundY) {
  for (const object of furniture) {
    const x = object.x - state.cameraX;
    if (x < -160 || x > canvas.clientWidth + 160) continue;

    if (object.id === 'bed') drawBed(x, groundY);
    else if (object.id === 'storage') drawStorage(x, groundY);
    else if (object.id === 'kitchen') drawKitchen(x, groundY);
    else if (object.id === 'stove') drawStove(x, groundY);
    else if (object.id === 'door') drawDoor(x, groundY);
  }
}

function drawPlayer(screenX, groundY) {
  const frame = playerWalkFrames[state.player.animationFrame];
  if (!frame || !frame.complete || !frame.naturalWidth) return;

  const x = Math.round(screenX);
  const y = Math.round(groundY - 48);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (state.player.direction < 0) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, -16, y, 32, 48);
  } else {
    ctx.drawImage(frame, x - 16, y, 32, 48);
  }

  ctx.restore();
}

function drawHome() {
  resizeCanvas();

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const groundY = Math.round(height * 0.78);

  ctx.clearRect(0, 0, width, height);
  drawRoom(groundY);
  drawFurniture(groundY);
  drawPlayer(state.player.x - state.cameraX, groundY);
}

function updateCamera() {
  const width = canvas.clientWidth;
  const desired = state.player.x - width * 0.5;
  state.cameraX = clamp(desired, 0, Math.max(0, state.homeWidth - width));
}

function furnitureCenter(object) {
  return object.x + object.width / 2;
}

function distanceToFurniture(object) {
  return Math.abs(state.player.x - furnitureCenter(object));
}

function findNearbyFurniture() {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const object of furniture) {
    const distance = distanceToFurniture(object);

    if (object.id === state.ignoredFurnitureId) {
      if (distance <= RELEASE_DISTANCE) continue;
      state.ignoredFurnitureId = null;
    }

    if (distance <= INTERACTION_DISTANCE && distance < nearestDistance) {
      nearest = object;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function checkFurniture() {
  const nearby = findNearbyFurniture();

  if (nearby === state.nearbyFurniture) return;

  state.nearbyFurniture = nearby;

  if (nearby) {
    stopMovement();
    messageEl.textContent = `${nearby.name}があります。`;
  }

  buildControls();
}

function stopMovement() {
  state.moveDirection = 0;
}

function startMove(direction) {
  if (state.nearbyFurniture) {
    state.ignoredFurnitureId = state.nearbyFurniture.id;
    state.nearbyFurniture = null;
  }

  state.moveDirection = direction;
  state.player.direction = direction;
  buildControls();
}

function updatePlayerAnimation(deltaSeconds, moving) {
  if (!moving) {
    state.player.animationFrame = 0;
    state.player.animationTimer = 0;
    return;
  }

  state.player.animationTimer += deltaSeconds;
  const frameDuration = 0.13;

  while (state.player.animationTimer >= frameDuration) {
    state.player.animationTimer -= frameDuration;
    state.player.animationFrame = (state.player.animationFrame + 1) % playerWalkFrames.length;
  }
}

function useFurniture(object) {
  if (!object) return;

  stopMovement();

  if (object.id === 'bed') {
    messageEl.textContent = 'ベッドです。ここで休むことができます。';
    return;
  }

  if (object.id === 'storage') {
    let moved = 0;

    for (const item of Object.keys(state.inventory)) {
      const count = state.inventory[item];
      if (count <= 0) continue;

      state.storage[item] = (state.storage[item] || 0) + count;
      state.inventory[item] = 0;
      moved += count;
    }

    messageEl.textContent = moved > 0
      ? '持っていた物資を収納棚へ入れました。'
      : '収納する物を持っていません。';

    updateInventoryDisplay();
    return;
  }

  if (object.id === 'kitchen') {
    messageEl.textContent = '台所です。まだ料理できるものはありません。';
    return;
  }

  if (object.id === 'stove') {
    messageEl.textContent = '薪ストーブです。';
    return;
  }

  if (object.id === 'door') {
    messageEl.textContent = '外へ出ます。';
    setTimeout(() => {
      window.location.href = 'zombie.html';
    }, 250);
  }
}

function makeButton(label, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (className) button.className = className;
  return button;
}

function buildControls() {
  controlsEl.replaceChildren();

  const leftButton = makeButton('←');
  const rightButton = makeButton('→');
  let centerButton;

  if (state.nearbyFurniture) {
    centerButton = makeButton(state.nearbyFurniture.action, 'safe');
    centerButton.addEventListener('click', () => {
      useFurniture(state.nearbyFurniture);
    });
  } else {
    centerButton = makeButton('止まる', 'safe');
    centerButton.addEventListener('click', () => {
      stopMovement();
      messageEl.textContent = '立ち止まりました。';
    });
  }

  leftButton.addEventListener('click', () => startMove(-1));
  rightButton.addEventListener('click', () => startMove(1));

  controlsEl.append(leftButton, centerButton, rightButton);
}

function update(timestamp) {
  if (!state.lastTimestamp) state.lastTimestamp = timestamp;

  const deltaSeconds = Math.min((timestamp - state.lastTimestamp) / 1000, 0.05);
  state.lastTimestamp = timestamp;

  if (state.moveDirection !== 0) {
    state.player.x += state.moveDirection * state.player.speed * deltaSeconds;
    state.player.x = clamp(state.player.x, 30, state.homeWidth - 30);

    if (state.player.x <= 30 || state.player.x >= state.homeWidth - 30) {
      stopMovement();
    }
  }

  updatePlayerAnimation(deltaSeconds, state.moveDirection !== 0);
  checkFurniture();
  updateCamera();
  drawHome();

  requestAnimationFrame(update);
}

function init() {
  updateHud();
  updateInventoryDisplay();
  buildControls();
  resizeCanvas();
  updateCamera();
  drawHome();
  messageEl.textContent = '自宅です。左右のボタンを1回押すと、その方向へ歩き続けます。';
  requestAnimationFrame(update);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  updateCamera();
  drawHome();
});

window.addEventListener('blur', () => {
  stopMovement();
});

init();