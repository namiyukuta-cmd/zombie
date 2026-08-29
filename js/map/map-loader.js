const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(window.location.search);
const mapId = params.get('id') || 'map001';

const MAPS = {
  map001: {
    id: 'map001',
    name: '探索地点001',
    screens: [
      {
        name: '入口側',
        background: null,
        message: 'まだ詳しく調べていない場所だ。',
        hotspots: [
          { id: 'shelf', label: '棚', x: 16, y: 35, width: 18, height: 20, text: '棚を調べた。今は中身のデータはまだ設定されていない。' },
          { id: 'box', label: '箱', x: 55, y: 61, width: 18, height: 14, text: '箱を開けて中を確認した。' },
          { id: 'door', label: '奥へ', x: 75, y: 31, width: 15, height: 34, text: '奥の部屋へ続いている。' }
        ]
      },
      {
        name: '奥側',
        background: null,
        message: '奥は静かだ。物音はしない。',
        hotspots: [
          { id: 'desk', label: '机', x: 18, y: 54, width: 22, height: 16, text: '机の引き出しを確認した。' },
          { id: 'cabinet', label: '収納', x: 64, y: 31, width: 20, height: 32, text: '収納を調べた。' }
        ]
      }
    ]
  }
};

const map = MAPS[mapId] || MAPS.map001;
let screenIndex = 0;

const scene = $('map-scene');
const background = $('map-background');
const hotspotLayer = $('hotspot-layer');
const mapName = $('map-name');
const roomName = $('room-name');
const message = $('message');
const previousButton = $('previous-screen');
const nextButton = $('next-screen');
const screenNumber = $('screen-number');
const interactionPanel = $('interaction-panel');
const interactionTitle = $('interaction-title');
const interactionText = $('interaction-text');
const interactionActions = $('interaction-actions');
const leaveButton = $('leave-button');
const inventoryButton = $('inventory-button');
const statusButton = $('status-button');
const inventoryPanel = $('inventory-panel');
const statusPanel = $('status-panel');
const inventoryClose = $('inventory-close');
const statusClose = $('status-close');

function closeInteraction() {
  interactionPanel.hidden = true;
}

function showInteraction(spot) {
  interactionTitle.textContent = spot.label;
  interactionText.textContent = spot.text;
  interactionActions.innerHTML = '';

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '戻る';
  close.addEventListener('click', closeInteraction);
  interactionActions.appendChild(close);
  interactionPanel.hidden = false;
}

function renderHotspots(screen) {
  hotspotLayer.innerHTML = '';

  for (const spot of screen.hotspots || []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-hotspot';
    button.textContent = spot.label;
    button.style.left = `${spot.x}%`;
    button.style.top = `${spot.y}%`;
    button.style.width = `${spot.width}%`;
    button.style.height = `${spot.height}%`;
    button.addEventListener('click', () => showInteraction(spot));
    hotspotLayer.appendChild(button);
  }
}

function renderScreen() {
  const screen = map.screens[screenIndex];
  mapName.textContent = map.name;
  roomName.textContent = screen.name;
  message.textContent = screen.message || '周囲を調べる。';
  closeInteraction();

  if (screen.background) {
    background.src = screen.background;
    background.hidden = false;
    scene.classList.remove('no-image');
  } else {
    background.removeAttribute('src');
    background.hidden = true;
    scene.classList.add('no-image');
  }

  renderHotspots(screen);

  previousButton.hidden = screenIndex <= 0;
  nextButton.hidden = screenIndex >= map.screens.length - 1;
  screenNumber.hidden = map.screens.length <= 1;
  screenNumber.textContent = `${screenIndex + 1} / ${map.screens.length}`;
}

previousButton.addEventListener('click', () => {
  if (screenIndex <= 0) return;
  screenIndex -= 1;
  renderScreen();
});

nextButton.addEventListener('click', () => {
  if (screenIndex >= map.screens.length - 1) return;
  screenIndex += 1;
  renderScreen();
});

leaveButton.addEventListener('click', () => {
  window.location.href = `zombie.html?from=${encodeURIComponent(map.id)}&to=home`;
});

inventoryButton.addEventListener('click', () => {
  inventoryPanel.hidden = false;
});

statusButton.addEventListener('click', () => {
  statusPanel.hidden = false;
});

inventoryClose.addEventListener('click', () => {
  inventoryPanel.hidden = true;
});

statusClose.addEventListener('click', () => {
  statusPanel.hidden = true;
});

renderScreen();
