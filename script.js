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
const primaryResultBtn = document.getElementById('primaryResultBtn');
const switchBtn = document.getElementById('switchBtn');
const trafficState = document.getElementById('trafficState');
const vehiclesLayer = document.getElementById('vehiclesLayer');
const gameBoard = document.getElementById('gameBoard');
const scoreDisplay = document.getElementById('scoreDisplay');
const congestionText = document.getElementById('congestionText');
const congestionBar = document.getElementById('congestionBar');
const congestionMeter = congestionBar.parentElement;
const timeDisplay = document.getElementById('timeDisplay');
const levelName = document.getElementById('levelName');
const levelSubtitle = document.getElementById('levelSubtitle');
const resultCard = document.getElementById('resultCard');
const resultIcon = document.getElementById('resultIcon');
const resultEyebrow = document.getElementById('resultEyebrow');
const resultTitle = document.getElementById('resultTitle');
const resultScore = document.getElementById('resultScore');
const resultCongestion = document.getElementById('resultCongestion');

const levels = {
  1: {
    title: 'NIVEL 1',
    subtitle: 'Tráfico normal',
    duration: 45,
    spawnMin: 1.15,
    spawnMax: 1.85,
    startingCars: ['east', 'west', 'south']
  },
  2: {
    title: 'NIVEL 2',
    subtitle: 'Hora pico',
    duration: 60,
    spawnMin: 0.58,
    spawnMax: 1.05,
    startingCars: ['east', 'west', 'south', 'north', 'east', 'south']
  }
};

let currentLevel = 1;
let greenDirection = 'horizontal';
let switching = false;
let running = false;
let lastFrame = performance.now();
let spawnElapsed = 0;
let nextSpawn = 1.5;
let vehicleId = 0;
let score = 0;
let congestion = 0;
let maxCongestion = 0;
let overloadTime = 0;
let remainingTime = levels[1].duration;
let resultAction = null;
let gameToken = 0;
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

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
  const token = gameToken;

  window.setTimeout(() => {
    if (!running || token !== gameToken) return;

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

  const levelSpeedBoost = currentLevel === 2 ? 1.12 : 1;
  const vehicle = {
    id: ++vehicleId,
    direction,
    pos: lane.start,
    previousPos: lane.start,
    speed: (8.5 + Math.random() * 2.2) * levelSpeedBoost,
    committed: false,
    waiting: false,
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
  const sameLane = vehicles.filter(vehicle => vehicle.direction === direction);

  sameLane.sort((a, b) => lane.sign > 0 ? b.pos - a.pos : a.pos - b.pos);

  for (let index = 1; index < sameLane.length; index += 1) {
    const ahead = sameLane[index - 1];
    const behind = sameLane[index];
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
    vehicle.previousPos = vehicle.pos;
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
      if (
        (lane.sign > 0 && vehicle.pos > lane.stop + 2) ||
        (lane.sign < 0 && vehicle.pos < lane.stop - 2)
      ) {
        vehicle.committed = true;
      }
    }
  }

  Object.keys(lanes).forEach(applyQueueSpacing);

  for (let index = vehicles.length - 1; index >= 0; index -= 1) {
    const vehicle = vehicles[index];
    const lane = lanes[vehicle.direction];

    vehicle.waiting =
      !vehicle.committed &&
      Math.abs(vehicle.pos - vehicle.previousPos) < 0.025;

    vehicle.element.classList.toggle('waiting', vehicle.waiting);
    renderVehicle(vehicle);

    const finished =
      lane.sign > 0 ? vehicle.pos > lane.end : vehicle.pos < lane.end;

    if (finished) {
      vehicle.element.remove();
      vehicles.splice(index, 1);
      score += 10;
      scoreDisplay.textContent = score;
      scoreDisplay.classList.remove('score-pop');
      void scoreDisplay.offsetWidth;
      scoreDisplay.classList.add('score-pop');
    }
  }
}

function updateCongestion(delta) {
  const waitingCars = vehicles.filter(vehicle => vehicle.waiting).length;
  const freeTrafficLimit = currentLevel === 2 ? 9 : 8;
  const extraTraffic = Math.max(0, vehicles.length - freeTrafficLimit);
  const target = Math.min(100, waitingCars * 12.5 + extraTraffic * 3);

  const rate = target > congestion ? 42 : 24;
  const difference = target - congestion;

  if (Math.abs(difference) > 0.01) {
    congestion +=
      Math.sign(difference) * Math.min(Math.abs(difference), rate * delta);
  }

  congestion = Math.max(0, Math.min(100, congestion));
  maxCongestion = Math.max(maxCongestion, congestion);

  const rounded = Math.round(congestion);
  congestionText.textContent = `${rounded}%`;
  congestionBar.style.width = `${rounded}%`;
  congestionMeter.setAttribute('aria-valuenow', String(rounded));
  congestionBar.classList.toggle('warning', rounded >= 55 && rounded < 80);
  congestionBar.classList.toggle('danger', rounded >= 80);
  gameBoard.classList.toggle('critical', rounded >= 80);

  if (congestion >= 99.5) {
    overloadTime += delta;
    if (overloadTime >= 0.8) endGame('lose');
  } else {
    overloadTime = Math.max(0, overloadTime - delta * 2);
  }
}

function updateTimer(delta) {
  remainingTime -= delta;
  timeDisplay.textContent = formatTime(remainingTime);
  timeDisplay.classList.toggle('urgent', remainingTime <= 10);

  if (remainingTime <= 0) {
    remainingTime = 0;
    timeDisplay.textContent = '00:00';
    endGame('win');
  }
}

function scheduleNextSpawn() {
  const config = levels[currentLevel];
  nextSpawn =
    config.spawnMin + Math.random() * (config.spawnMax - config.spawnMin);
}

function spawnVehicle() {
  const directions = Object.keys(lanes);
  const direction = directions[Math.floor(Math.random() * directions.length)];
  const sameDirection = vehicles.filter(
    vehicle => vehicle.direction === direction
  );
  const lane = lanes[direction];

  const blockedAtSpawn = sameDirection.some(vehicle =>
    lane.sign > 0
      ? vehicle.pos < lane.start + 10
      : vehicle.pos > lane.start - 10
  );

  if (!blockedAtSpawn) createVehicle(direction);
}

function clearVehicles() {
  vehicles.splice(0).forEach(vehicle => vehicle.element.remove());
}

function resetStats() {
  score = 0;
  congestion = 0;
  maxCongestion = 0;
  overloadTime = 0;

  scoreDisplay.textContent = '0';
  scoreDisplay.classList.remove('score-pop');
  congestionText.textContent = '0%';
  congestionBar.style.width = '0%';
  congestionBar.classList.remove('warning', 'danger');
  congestionMeter.setAttribute('aria-valuenow', '0');
  timeDisplay.classList.remove('urgent');
  gameBoard.classList.remove('critical');
}

function startLevel(levelNumber) {
  gameToken += 1;
  const token = gameToken;
  currentLevel = levelNumber;
  const config = levels[currentLevel];

  clearVehicles();
  resetStats();

  levelName.textContent = config.title;
  levelSubtitle.textContent = config.subtitle;
  remainingTime = config.duration;
  timeDisplay.textContent = formatTime(remainingTime);
  gameBoard.classList.toggle('rush-hour', currentLevel === 2);

  greenDirection = 'horizontal';
  switching = false;
  switchBtn.disabled = false;
  paintLights();
  showScreen('game');

  running = true;
  spawnElapsed = 0;
  scheduleNextSpawn();
  lastFrame = performance.now();

  config.startingCars.forEach((direction, index) => {
    window.setTimeout(() => {
      if (running && token === gameToken) createVehicle(direction);
    }, index * 280);
  });
}

function stopGame() {
  gameToken += 1;
  running = false;
  switching = false;
  switchBtn.disabled = false;
  clearVehicles();
  gameBoard.classList.remove('critical', 'rush-hour');
  timeDisplay.classList.remove('urgent');
  showScreen('menu');
}

function endGame(type) {
  if (!running) return;

  gameToken += 1;
  running = false;
  switching = false;
  switchBtn.disabled = true;

  resultScore.textContent = score;
  resultCongestion.textContent = `${Math.round(maxCongestion)}%`;
  resultCard.classList.remove('win', 'lose');

  if (type === 'lose') {
    resultCard.classList.add('lose');
    resultIcon.textContent = '⚠️';
    resultEyebrow.textContent = `Nivel ${currentLevel} · Congestión crítica`;
    resultTitle.textContent = 'GAME OVER';
    primaryResultBtn.textContent = 'REINTENTAR';
    resultAction = () => startLevel(currentLevel);
  } else {
    resultCard.classList.add('win');
    resultIcon.textContent = '🏆';

    if (currentLevel === 1) {
      resultEyebrow.textContent = 'Nivel 1 superado';
      resultTitle.textContent = '¡NIVEL COMPLETADO!';
      primaryResultBtn.textContent = 'SIGUIENTE NIVEL';
      resultAction = () => startLevel(2);
    } else {
      resultEyebrow.textContent = 'Hora pico superada';
      resultTitle.textContent = '¡TRÁFICO CONTROLADO!';
      primaryResultBtn.textContent = 'JUGAR DE NUEVO';
      resultAction = () => startLevel(1);
    }
  }

  showScreen('result');
}

function gameLoop(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;

  if (running) {
    spawnElapsed += delta;

    if (spawnElapsed >= nextSpawn) {
      spawnElapsed = 0;
      spawnVehicle();
      scheduleNextSpawn();
    }

    updateVehicles(delta);
    updateCongestion(delta);

    if (running) updateTimer(delta);
  }

  requestAnimationFrame(gameLoop);
}

playBtn.addEventListener('click', () => startLevel(1));
howBtn.addEventListener('click', () => showScreen('how'));
howBackBtn.addEventListener('click', () => showScreen('menu'));
menuBtn.addEventListener('click', stopGame);
resultMenuBtn.addEventListener('click', stopGame);
primaryResultBtn.addEventListener('click', () => {
  if (resultAction) resultAction();
});
switchBtn.addEventListener('click', switchLights);

window.addEventListener('keydown', event => {
  if (
    event.code === 'Space' &&
    screens.game.classList.contains('active') &&
    !event.repeat
  ) {
    event.preventDefault();
    switchLights();
  }
});

document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now();
});

paintLights();
requestAnimationFrame(gameLoop);
