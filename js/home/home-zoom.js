import { homeDeco001 } from './deco/deco001.js';

const $ = (id) => document.getElementById(id);

const scene = $('home-scene');
const background = $('home-background');
const hotspotLayer = $('hotspot-layer');
const npcLayer = $('npc-layer');
const eventImageLayer = $('event-image-layer');
const message = $('message');

if (scene && background && hotspotLayer) {
  const spots = new Map(
    (homeDeco001.hotspots || []).map((spot) => [spot.id, spot])
  );

  const zoomTargets = [
    background,
    hotspotLayer,
    npcLayer,
    eventImageLayer
  ].filter(Boolean);

  let currentRoom = null;

  const backButton = document.createElement('button');
  backButton.id = 'home-zoom-back';
  backButton.type = 'button';
  backButton.textContent = '← 家全体';
  backButton.hidden = true;

  const roomTitle = document.createElement('div');
  roomTitle.id = 'home-zoom-title';
  roomTitle.hidden = true;

  scene.appendChild(backButton);
  scene.appendChild(roomTitle);

  function readHomeFlags() {
    try {
      const raw = localStorage.getItem('zombie-home-state-v1');
      if (!raw) return {};
      return JSON.parse(raw)?.flags || {};
    } catch {
      return {};
    }
  }

  function roomIsUnlocked(room) {
    if (!room?.requiresFlag) return true;
    return Boolean(readHomeFlags()[room.requiresFlag]);
  }

  function pointInsideRoom(x, y, room) {
    return (
      x >= room.x &&
      x <= room.x + room.width &&
      y >= room.y &&
      y <= room.y + room.height
    );
  }

  function updateHotspotVisibility() {
    const buttons = hotspotLayer.querySelectorAll('.home-hotspot');

    for (const button of buttons) {
      if (!currentRoom) {
        button.hidden = false;
        continue;
      }

      const spot = spots.get(button.dataset.hotspotId);
      if (!spot) {
        button.hidden = true;
        continue;
      }

      // 拡大中は「部屋そのもの」の大きな領域は消し、
      // その部屋の中にある家具・設備などだけを残す。
      if (spot.action?.type === 'room') {
        button.hidden = true;
        continue;
      }

      const centerX = spot.x + spot.width / 2;
      const centerY = spot.y + spot.height / 2;
      button.hidden = !pointInsideRoom(centerX, centerY, currentRoom);
    }
  }

  function updateNPCVisibility() {
    if (!npcLayer) return;

    const buttons = npcLayer.querySelectorAll('.home-npc');

    for (const button of buttons) {
      if (!currentRoom) {
        button.hidden = false;
        continue;
      }

      const left = parseFloat(button.style.left) || 0;
      const top = parseFloat(button.style.top) || 0;
      const width = parseFloat(button.style.width) || 0;
      const height = parseFloat(button.style.height) || 0;

      const centerX = left + width / 2;
      const centerY = top + height / 2;

      button.hidden = !pointInsideRoom(centerX, centerY, currentRoom);
    }
  }

  function applyTransform(room) {
    const rect = scene.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const roomWidthPx = rect.width * room.width / 100;
    const roomHeightPx = rect.height * room.height / 100;
    const roomCenterX = rect.width * (room.x + room.width / 2) / 100;
    const roomCenterY = rect.height * (room.y + room.height / 2) / 100;

    const padding = 0.08;
    const usableWidth = rect.width * (1 - padding * 2);
    const usableHeight = rect.height * (1 - padding * 2);

    let scale = Math.min(
      usableWidth / roomWidthPx,
      usableHeight / roomHeightPx
    );

    scale = Math.max(1.15, Math.min(scale, 4.6));

    const translateX = rect.width / 2 - roomCenterX * scale;
    const translateY = rect.height / 2 - roomCenterY * scale;
    const transform = `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;

    for (const target of zoomTargets) {
      target.style.transformOrigin = '0 0';
      target.style.transform = transform;
    }
  }

  function zoomToRoom(room) {
    if (!room || !roomIsUnlocked(room)) return;

    currentRoom = room;
    scene.classList.add('room-zoomed');
    backButton.hidden = false;
    roomTitle.hidden = false;
    roomTitle.textContent = room.label || '';

    updateHotspotVisibility();
    updateNPCVisibility();
    applyTransform(room);

    if (message) {
      message.textContent = `${room.label || '部屋'}を拡大表示中。光っている場所をタップできます。`;
    }
  }

  function resetZoom() {
    currentRoom = null;
    scene.classList.remove('room-zoomed');
    backButton.hidden = true;
    roomTitle.hidden = true;
    roomTitle.textContent = '';

    for (const target of zoomTargets) {
      target.style.transform = '';
      target.style.transformOrigin = '';
    }

    updateHotspotVisibility();
    updateNPCVisibility();

    if (message) {
      message.textContent = '家全体を表示しています。部屋をタップすると拡大できます。';
    }
  }

  // captureで先に受ける。
  // 部屋タップだけは従来の「ここを調べる」処理を止めて拡大へ回す。
  hotspotLayer.addEventListener('click', (event) => {
    const button = event.target.closest('.home-hotspot');
    if (!button) return;

    const spot = spots.get(button.dataset.hotspotId);
    if (!spot || spot.action?.type !== 'room') return;

    // ロック中は従来処理に渡し、lockedMessageを表示させる。
    if (!roomIsUnlocked(spot)) return;

    event.preventDefault();
    event.stopPropagation();
    zoomToRoom(spot);
  }, true);

  backButton.addEventListener('click', resetZoom);

  const observer = new MutationObserver(() => {
    if (!currentRoom) return;
    updateHotspotVisibility();
    updateNPCVisibility();
  });

  observer.observe(hotspotLayer, { childList: true });
  if (npcLayer) observer.observe(npcLayer, { childList: true });

  window.addEventListener('resize', () => {
    if (currentRoom) applyTransform(currentRoom);
  });
}
