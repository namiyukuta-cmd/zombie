const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(window.location.search);
const from = params.get('from') || 'home';
const to = params.get('to') || 'map001';

const NAMES = {
  home: 'HOME',
  map001: '探索地点001'
};

const fromEl = $('travel-from');
const toEl = $('travel-to');
const player = $('travel-player');
const message = $('message');
const progressBar = $('progress-bar');
const moveButton = $('move-button');
const backButton = $('back-button');

const frames = [
  'assets/player/player_walk_01.png',
  'assets/player/player_walk_02.png',
  'assets/player/player_walk_03.png',
  'assets/player/player_walk_04.png'
];

let progress = 0;
let frameIndex = 0;

fromEl.textContent = NAMES[from] || from;
toEl.textContent = NAMES[to] || to;

function destinationUrl() {
  if (to === 'home') return 'home.html';
  return `map.html?id=${encodeURIComponent(to)}`;
}

function previousUrl() {
  if (from === 'home') return 'home.html';
  return `map.html?id=${encodeURIComponent(from)}`;
}

function render() {
  progressBar.style.width = `${progress}%`;
  player.style.left = `${8 + progress * 0.84}%`;
  player.src = frames[frameIndex % frames.length];

  if (progress >= 100) {
    message.textContent = `${NAMES[to] || to}に到着した。`;
    moveButton.textContent = '入る';
  } else if (progress >= 75) {
    message.textContent = '目的地が近い。周囲を警戒して進む。';
  } else if (progress >= 50) {
    message.textContent = '道の半分ほどまで来た。';
  } else if (progress >= 25) {
    message.textContent = '物音に注意しながら進む。';
  } else {
    message.textContent = '周囲を警戒しながら進む。';
  }
}

moveButton.addEventListener('click', () => {
  if (progress >= 100) {
    window.location.href = destinationUrl();
    return;
  }

  progress = Math.min(100, progress + 25);
  frameIndex += 1;
  render();
});

backButton.addEventListener('click', () => {
  window.location.href = previousUrl();
});

render();
