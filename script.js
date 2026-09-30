const screens = {
  menu: document.getElementById('menuScreen'),
  how: document.getElementById('howScreen'),
  game: document.getElementById('gameScreen'),
  result: document.getElementById('resultScreen')
};

const playBtn = document.getElementById('playBtn');
const howBtn = document.getElementById('howBtn');
const howBackBtn = document.getElementById('howBackBtn');
const menuBtn = document.getElementById('menuBtn');
const resultMenuBtn = document.getElementById('resultMenuBtn');
const switchBtn = document.getElementById('switchBtn');
const trafficState = document.getElementById('trafficState');
const vehiclesLayer = document.getElementById('vehiclesLayer');

let greenDirection = 'horizontal';
let switching = false;
let running = false;
let lastFrame = performance.now();
let spawnElapsed = 0;
let nextSpawn = 1.5;
let vehicleId = 0;
const vehicles = [];

const carColors = ['#1677ff', '#ff3b30', '#ffc928', '#20c997', '#ff8a34', '#8f6bff', '#f1f5f9'];

const lanes = {
  east:  { axis: 'x', group: 'horizontal', lane: 40.5, start: -9,  stop: 23, end: 108, sign:  1, vertical: false },
  west:  { axis: 'x', group: 'horizontal', lane: 56.0, start: 102, stop: 70, end: -10, sign: -1, vertical: false },
  south: { axis: 'y', group: 'vertical',   lane: 56.0, start: -9,  stop: 23, end: 108, sign:  1, vertical: true  },
  north: { axis: 'y', group: 'vertical',   lane: 40.5, start: 102, stop: 70, end: -10, sign: -1, vertical: true  }
};

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[name].classList.add('active');
}

function paintLights() {
  document.querySelectorAll('.horizontal-light').forEach(light => {
    light.classList.toggle('green', greenDirection === 'horizontal');
    light.classList.toggle('red', greenDirection !== 'horizontal');
  });

  document.querySelectorAll('.vertical-light').forEach(light => {
    light.classList.toggle('green', greenDirection === 'vertical');
    light.classList.toggle('red', greenDirection !== 'vertical');
  });

  trafficState.textContent =
    greenDirection === 'horizontal' ? 'Horizontal en verde' : 'Vertical en verde';
}

function allRed() {
  document.querySelectorAll('.traffic-light').forEach(light => {
    light.classList.remove('green');
    light.classList.add('red');
  });
  trafficState.textContent = 'Cambio de fase…';
}

function switchLights() {
  if (switching || !running) return;

  switching = true;
  switchBtn.disabled = true;
  allRed();

  window.setTimeout(() => {
    greenDirection = greenDirection === 'horizontal' ? 'vertical' : 'horizontal';
    paintLights();
    switching = false;
    switchBtn.disabled = false;
  }, 350);
}

function createVehicle(direction) {
  const lane = lanes[direction];
  const element = document.createElement('div');
  element.className = `vehicle${lane.vertical ? ' vertical' : ''}`;
  element.style.setProperty('--car-color', carColors[Math.floor(Math.random() * carColors.length)]);
  element.dataset.direction = direction;
  vehiclesLayer.appendChild(element);

  const vehicle = {
    id: ++vehicleId,
    direction,
    pos: lane.start,
    speed: 8.5 + Math.random() * 2.2,
    committed: false,
    element
  };

  vehicles.push(vehicle);
  renderVehicle(vehicle);
}

function renderVehicle(vehicle) {
  const lane = lanes[vehicle.direction];
  if (lane.axis === 'x') {
    vehicle.element.style.left = `${vehicle.pos}%`;
    vehicle.element.style.top = `${lane.lane}%`;
  } else {
    vehicle.element.style.left = `${lane.lane}%`;
    vehicle.element.style.top = `${vehicle.pos}%`;
  }
}

function isGreenFor(vehicle) {
  return lanes[vehicle.direction].group === greenDirection && !switching;
}

function applyQueueSpacing(direction) {
  const lane = lanes[direction];
  const sameLane = vehicles.filter(v => v.direction === direction);

  sameLane.sort((a, b) => lane.sign > 0 ? b.pos - a.pos : a.pos - b.pos);

  for (let i = 1; i < sameLane.length; i += 1) {
    const ahead = sameLane[i - 1];
    const behind = sameLane[i];
    const gap = 8.2;

    if (lane.sign > 0 && behind.pos > ahead.pos - gap) {
      behind.pos = ahead.pos - gap;
    }
    if (lane.sign < 0 && behind.pos < ahead.pos + gap) {
      behind.pos = ahead.pos + gap;
    }
  }
}

function updateVehicles(delta) {
  for (const vehicle of vehicles) {
    const lane = lanes[vehicle.direction];
    const step = vehicle.speed * delta * lane.sign;

    if (!vehicle.committed && !isGreenFor(vehicle)) {
      if (lane.sign > 0) {
        vehicle.pos = Math.min(vehicle.pos + step, lane.stop);
      } else {
        vehicle.pos = Math.max(vehicle.pos + step, lane.stop);
      }
    } else {
      vehicle.pos += step;
    }

    if (!vehicle.committed) {
      if ((lane.sign > 0 && vehicle.pos > lane.stop + 2) ||
          (lane.sign < 0 && vehicle.pos < lane.stop - 2)) {
        vehicle.committed = true;
      }
    }
  }

  Object.keys(lanes).forEach(applyQueueSpacing);

  for (let i = vehicles.length - 1; i >= 0; i -= 1) {
    const vehicle = vehicles[i];
    const lane = lanes[vehicle.direction];

    renderVehicle(vehicle);

    const finished = lane.sign > 0 ? vehicle.pos > lane.end : vehicle.pos < lane.end;
    if (finished) {
      vehicle.element.remove();
      vehicles.splice(i, 1);
    }
  }
}

function spawnVehicle() {
  const directions = Object.keys(lanes);
  const direction = directions[Math.floor(Math.random() * directions.length)];

  const sameDirection = vehicles.filter(v => v.direction === direction);
  const lane = lanes[direction];
  const blockedAtSpawn = sameDirection.some(v =>
    lane.sign > 0 ? v.pos < lane.start + 10 : v.pos > lane.start - 10
  );

  if (!blockedAtSpawn) createVehicle(direction);
}

function clearVehicles() {
  vehicles.splice(0).forEach(vehicle => vehicle.element.remove());
}

function startGame() {
  clearVehicles();
  greenDirection = 'horizontal';
  switching = false;
  switchBtn.disabled = false;
  paintLights();
  showScreen('game');

  running = true;
  spawnElapsed = 0;
  nextSpawn = .8;
  lastFrame = performance.now();

  createVehicle('east');
  createVehicle('west');
  createVehicle('south');
}

function stopGame() {
  running = false;
  switching = false;
  clearVehicles();
  showScreen('menu');
}

function gameLoop(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;

  if (running) {
    spawnElapsed += delta;
    if (spawnElapsed >= nextSpawn) {
      spawnElapsed = 0;
      nextSpawn = 1.2 + Math.random() * 1.4;
      spawnVehicle();
    }

    updateVehicles(delta);
  }

  requestAnimationFrame(gameLoop);
}

playBtn.addEventListener('click', startGame);
howBtn.addEventListener('click', () => showScreen('how'));
howBackBtn.addEventListener('click', () => showScreen('menu'));
menuBtn.addEventListener('click', stopGame);
resultMenuBtn.addEventListener('click', stopGame);
switchBtn.addEventListener('click', switchLights);

window.addEventListener('keydown', event => {
  if (event.code === 'Space' && screens.game.classList.contains('active')) {
    event.preventDefault();
    switchLights();
  }
});

paintLights();
requestAnimationFrame(gameLoop);
