const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');

const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const locationEl = document.getElementById('location');
const lightLevelEl = document.getElementById('light-level');
const messageEl = document.getElementById('message');
const controlsEl = document.getElementById('controls');

const PLAYER_WALK_SOURCES = [
  'assets/player/player_walk_01.png',
  'assets/player/player_walk_02.png',
  'assets/player/player_walk_03.png',
  'assets/player/player_walk_04.png'
];

const playerWalkFrames = PLAYER_WALK_SOURCES.map((src) => {
  const image = new Image();
  image.src = src;
  image.addEventListener('load', () => drawWorld());
  return image;
});

const HOME_DOOR_X = 334;
const HOME_DISTANCE = 55;
const PICKUP_DISTANCE = 38;

const state = {
  day: 1,
  time: 7 * 60,
  location: '自宅前',
  worldWidth: 2400,
  player: {
    x: 260,
    speed: 130,
    direction: 1,
    animationFrame: 0,
    animationTimer: 0
  },
  inventory: {},
  worldItems: [
    { id: 'wood_01', name: '薪', type: 'wood', x: 690, picked: false },
    { id: 'can_01', name: '缶詰', type: 'can', x: 1080, picked: false },
    { id: 'cloth_01', name: '布', type: 'cloth', x: 1460, picked: false }
  ],
  cameraX: 0,
  movingLeft: false,
  movingRight: false,
  lastTimestamp: 0,
  minuteAccumulator: 0,
  nearbyItemId: null,
  lastNotifiedItemId: null,
  nearbyHome: false,
  homeNotified: false,
  ignoreHomeUntilFar: false
};

const controls = {
  leftButton: null,
  actionButton: null,
  rightButton: null
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(totalMinutes) {
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
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

function drawHouse(screenX, groundY) {
  ctx.fillStyle = '#c7b69b';
  ctx.fillRect(screenX, groundY - 150, 320, 150);

  ctx.fillStyle = '#76695b';
  ctx.beginPath();
  ctx.moveTo(screenX - 18, groundY - 150);
  ctx.lineTo(screenX + 160, groundY - 235);
  ctx.lineTo(screenX + 338, groundY - 150);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#62584d';
  ctx.fillRect(screenX + 215, groundY - 92, 58, 92);

  ctx.fillStyle = '#cdd8d6';
  ctx.fillRect(screenX + 55, groundY - 110, 68, 58);
  ctx.strokeStyle = '#626861';
  ctx.lineWidth = 3;
  ctx.strokeRect(screenX + 55, groundY - 110, 68, 58);
}

function drawRoadObjects(groundY) {
  const objects = [
    { x: 790, type: 'tree' },
    { x: 1200, type: 'crate' },
    { x: 1570, type: 'tree' },
    { x: 1910, type: 'crate' }
  ];

  for (const object of objects) {
    const x = object.x - state.cameraX;
    if (x < -100 || x > canvas.clientWidth + 100) continue;

    if (object.type === 'tree') {
      ctx.fillStyle = '#675e4d';
      ctx.fillRect(x - 8, groundY - 96, 16, 96);
      ctx.fillStyle = '#67735f';
      ctx.beginPath();
      ctx.arc(x, groundY - 122, 48, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#8b7658';
      ctx.fillRect(x - 24, groundY - 38, 48, 38);
      ctx.strokeStyle = '#5f513d';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 24, groundY - 38, 48, 38);
    }
  }
}

function drawCollectibleItem(item, groundY) {
  if (item.picked) return;
  const x = Math.round(item.x - state.cameraX);
  if (x < -60 || x > canvas.clientWidth + 60) return;

  ctx.save();
  ctx.lineWidth = 2;

  if (item.type === 'wood') {
    ctx.strokeStyle = '#554638';
    ctx.fillStyle = '#8a6c4d';
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(x - 17 + i * 8, groundY - 14 - i * 3, 24, 6);
      ctx.strokeRect(x - 17 + i * 8, groundY - 14 - i * 3, 24, 6);
    }
  } else if (item.type === 'can') {
    ctx.fillStyle = '#9da4a0';
    ctx.strokeStyle = '#565c59';
    ctx.fillRect(x - 10, groundY - 23, 20, 23);
    ctx.strokeRect(x - 10, groundY - 23, 20, 23);
    ctx.beginPath();
    ctx.ellipse(x, groundY - 23, 10, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (item.type === 'cloth') {
    ctx.fillStyle = '#b7aa95';
    ctx.strokeStyle = '#6b6257';
    ctx.fillRect(x - 14, groundY - 18, 28, 18);
    ctx.strokeRect(x - 14, groundY - 18, 28, 18);
    ctx.beginPath();
    ctx.moveTo(x - 4, groundY - 18);
    ctx.lineTo(x + 4, groundY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWorldItems(groundY) {
  for (const item of state.worldItems) {
    drawCollectibleItem(item, groundY);
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

function drawWorld() {
  resizeCanvas();

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const groundY = Math.round(height * 0.76);
  const light = getSunlight(state.time);

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#dce7e9';
  ctx.fillRect(0, 0, width, groundY);

  ctx.fillStyle = '#aaa894';
  ctx.fillRect(0, groundY, width, height - groundY);

  drawHouse(90 - state.cameraX, groundY);
  drawRoadObjects(groundY);
  drawWorldItems(groundY);

  ctx.strokeStyle = '#757568';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 26);
  ctx.lineTo(width, groundY + 26);
  ctx.stroke();

  drawPlayer(state.player.x - state.cameraX, groundY);

  const darkness = clamp(0.68 * (1 - light), 0, 0.68);
  if (darkness > 0.01) {
    ctx.fillStyle = `rgba(18, 24, 31, ${darkness})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function updateCamera() {
  const width = canvas.clientWidth;
  const desired = state.player.x - width * 0.46;
  state.cameraX = clamp(desired, 0, Math.max(0, state.worldWidth - width));
}

function advanceTimeByMovement(deltaSeconds, isMoving) {
  if (!isMoving) return;

  state.minuteAccumulator += deltaSeconds;

  if (state.minuteAccumulator >= 1.5) {
    const minutes = Math.floor(state.minuteAccumulator / 1.5);
    state.minuteAccumulator -= minutes * 1.5;
    state.time += minutes;

    while (state.time >= 1440) {
      state.time -= 1440;
      state.day += 1;
    }

    updateHud();
  }
}

function updatePlayerAnimation(deltaSeconds, isMoving) {
  if (!isMoving) {
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

function stopMovement() {
  state.movingLeft = false;
  state.movingRight = false;
}

function startAutoMove(direction) {
  if (state.nearbyHome) {
    state.ignoreHomeUntilFar = true;
    state.nearbyHome = false;
    state.homeNotified = false;
  }

  if (direction < 0) {
    state.movingLeft = true;
    state.movingRight = false;
  } else {
    state.movingLeft = false;
    state.movingRight = true;
  }
}

function getNearbyItem() {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const item of state.worldItems) {
    if (item.picked) continue;
    const distance = Math.abs(item.x - state.player.x);

    if (distance <= PICKUP_DISTANCE && distance < nearestDistance) {
      nearest = item;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function inventoryText() {
  const entries = Object.entries(state.inventory).filter(([, count]) => count > 0);
  if (entries.length === 0) return '持ち物はまだありません。';
  return `持ち物：${entries.map(([name, count]) => `${name}×${count}`).join('、')}`;
}

function pickUpItem(item) {
  if (!item || item.picked) return;

  item.picked = true;
  state.inventory[item.name] = (state.inventory[item.name] || 0) + 1;
  state.nearbyItemId = null;
  state.lastNotifiedItemId = null;
  messageEl.textContent = `${item.name}を拾いました。${inventoryText()}`;
  updateActionButton();
}

function findItemById(id) {
  return state.worldItems.find((item) => item.id === id) || null;
}

function updateNearbyTargets() {
  const homeDistance = Math.abs(state.player.x - HOME_DOOR_X);

  if (state.ignoreHomeUntilFar) {
    if (homeDistance > HOME_DISTANCE + 40) {
      state.ignoreHomeUntilFar = false;
    }
  } else if (homeDistance <= HOME_DISTANCE) {
    state.nearbyHome = true;
    state.nearbyItemId = null;

    if (state.movingLeft || state.movingRight) {
      stopMovement();
    }

    if (!state.homeNotified) {
      messageEl.textContent = '自宅の玄関です。「家に入る」で中へ入れます。';
      state.homeNotified = true;
    }

    return;
  } else {
    state.nearbyHome = false;
    state.homeNotified = false;
  }

  const item = getNearbyItem();
  state.nearbyItemId = item ? item.id : null;

  if (!item) {
    state.lastNotifiedItemId = null;
    return;
  }

  if (state.movingLeft || state.movingRight) {
    stopMovement();
  }

  if (state.lastNotifiedItemId !== item.id) {
    messageEl.textContent = `${item.name}を見つけました。「拾う」で持ち物に入ります。`;
    state.lastNotifiedItemId = item.id;
  }
}

function updateActionButton() {
  if (!controls.actionButton) return;

  if (state.movingLeft || state.movingRight) {
    controls.actionButton.textContent = '止まる';
    return;
  }

  if (state.nearbyItemId) {
    controls.actionButton.textContent = '拾う';
    return;
  }

  if (state.nearbyHome) {
    controls.actionButton.textContent = '家に入る';
    return;
  }

  controls.actionButton.textContent = '持ち物';
}

function update(timestamp) {
  if (!state.lastTimestamp) state.lastTimestamp = timestamp;
  const deltaSeconds = Math.min((timestamp - state.lastTimestamp) / 1000, 0.05);
  state.lastTimestamp = timestamp;

  let direction = 0;
  if (state.movingLeft) direction -= 1;
  if (state.movingRight) direction += 1;

  if (direction !== 0) {
    state.player.direction = direction;
    state.player.x += direction * state.player.speed * deltaSeconds;
    state.player.x = clamp(state.player.x, 30, state.worldWidth - 30);

    if (
      (direction < 0 && state.player.x <= 30) ||
      (direction > 0 && state.player.x >= state.worldWidth - 30)
    ) {
      stopMovement();
    }
  }

  updateNearbyTargets();

  const stillMoving = state.movingLeft || state.movingRight;
  updatePlayerAnimation(deltaSeconds, stillMoving);
  advanceTimeByMovement(deltaSeconds, stillMoving);
  updateCamera();
  updateActionButton();
  drawWorld();

  requestAnimationFrame(update);
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

  controls.leftButton = makeButton('←');
  controls.actionButton = makeButton('持ち物', 'safe');
  controls.rightButton = makeButton('→');

  controls.leftButton.addEventListener('click', () => {
    startAutoMove(-1);
    messageEl.textContent = '左へ移動中です。';
    updateActionButton();
  });

  controls.actionButton.addEventListener('click', () => {
    if (state.movingLeft || state.movingRight) {
      stopMovement();
      messageEl.textContent = '立ち止まりました。';
      updateActionButton();
      return;
    }

    const item = state.nearbyItemId ? findItemById(state.nearbyItemId) : getNearbyItem();
    if (item) {
      pickUpItem(item);
      return;
    }

    if (state.nearbyHome) {
      window.location.href = 'zombie_home.html';
      return;
    }

    messageEl.textContent = inventoryText();
  });

  controls.rightButton.addEventListener('click', () => {
    startAutoMove(1);
    messageEl.textContent = '右へ移動中です。';
    updateActionButton();
  });

  controlsEl.append(controls.leftButton, controls.actionButton, controls.rightButton);
}

function init() {
  updateHud();
  buildControls();
  messageEl.textContent = '朝。自宅前から探索を始めます。';
  resizeCanvas();
  updateCamera();
  updateNearbyTargets();
  updateActionButton();
  drawWorld();
  requestAnimationFrame(update);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  updateCamera();
  drawWorld();
});

window.addEventListener('blur', () => {
  stopMovement();
  updateActionButton();
});

init();