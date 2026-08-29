const DESTINATIONS = [
  {
    id: 'map001',
    name: '探索地点001',
    info: '拠点の外にある、まだ詳しく調べていない場所。',
    x: 72,
    y: 34,
    unlocked: true
  }
];

const $ = (id) => document.getElementById(id);

const markerLayer = $('map-marker-layer');
const destinationName = $('destination-name');
const destinationInfo = $('destination-info');
const travelButton = $('travel-button');
const homeButton = $('home-button');
const inventoryButton = $('inventory-button');
const statusButton = $('status-button');
const inventoryPanel = $('inventory-panel');
const statusPanel = $('status-panel');
const inventoryClose = $('inventory-close');
const statusClose = $('status-close');

let selected = null;

function renderDestinations() {
  markerLayer.innerHTML = '';

  for (const destination of DESTINATIONS) {
    if (!destination.unlocked) continue;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-marker';
    button.textContent = destination.id === 'map001' ? '01' : '●';
    button.style.left = `${destination.x}%`;
    button.style.top = `${destination.y}%`;
    button.setAttribute('aria-label', destination.name);

    button.addEventListener('click', () => {
      selected = destination;
      document.querySelectorAll('.map-marker').forEach((el) => el.classList.remove('selected'));
      button.classList.add('selected');
      destinationName.textContent = destination.name;
      destinationInfo.textContent = destination.info;
      travelButton.disabled = false;
    });

    markerLayer.appendChild(button);
  }
}

travelButton.addEventListener('click', () => {
  if (!selected) return;
  window.location.href = `zombie.html?from=home&to=${encodeURIComponent(selected.id)}`;
});

homeButton.addEventListener('click', () => {
  window.location.href = 'home.html';
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

renderDestinations();
