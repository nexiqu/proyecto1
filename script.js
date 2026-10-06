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

const levelInputs = [...document.querySelectorAll('input[name="level"]')];

const switchA = document.getElementById('switchA');
const switchB = document.getElementById('switchB');
const stateA = document.getElementById('stateA');
const stateB = document.getElementById('stateB');

const gameScreen = document.getElementById('gameScreen');
const gameBoard = document.getElementById('gameBoard');
const vehiclesLayer = document.getElementById('vehiclesLayer');
const crashFlash = document.getElementById('crashFlash');

const levelName = document.getElementById('levelName');
const levelSubtitle = document.getElementById('levelSubtitle');
const timeDisplay = document.getElementById('timeDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const bestScoreLevel1 = document.getElementById('bestScoreLevel1');
const bestScoreLevel2 = document.getElementById('bestScoreLevel2');
const trafficState = document.getElementById('trafficState');
const carsCount = document.getElementById('carsCount');

const congestionText = document.getElementById('congestionText');
const congestionBar = document.getElementById('congestionBar');
const congestionMeter = congestionBar.parentElement;

const resultCard = document.getElementById('resultCard');
const resultIcon = document.getElementById('resultIcon');
const resultEyebrow = document.getElementById('resultEyebrow');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultScore = document.getElementById('resultScore');
const resultBestScore = document.getElementById('resultBestScore');
const resultCongestion = document.getElementById('resultCongestion');

const levels = {
  1: {
    title: 'NIVEL 1',
    subtitle: 'Intersección central',
    duration: 45,
    spawnMin: 0.95,
    spawnMax: 1.7,
    waveChance: 0.32,
    maxTrafficBeforePenalty: 10
  },
  2: {
    title: 'NIVEL 2',
    subtitle: 'Dos cruces · Hora pico',
    duration: 60,
    spawnMin: 0.62,
    spawnMax: 1.08,
    waveChance: 0.46,
    maxTrafficBeforePenalty: 17
  }
};

const vehicleColors = [
  '#1d86ff', '#ff493d', '#ffd23d', '#2bd384',
  '#ff8d3a', '#966cff', '#e8edf2', '#28b9cc',
  '#f05fa7', '#5cc85c'
];

let currentLevel = 1;
let routes = {};
let running = false;
let crashPending = false;
let lastFrame = performance.now();
let remainingTime = levels[1].duration;
let score = 0;
let congestion = 0;
let maxCongestion = 0;
let overloadTime = 0;
let spawnElapsed = 0;
let nextSpawn = 1;
let waveRemaining = 0;
let waveAxis = 'horizontal';
let vehicleId = 0;
let gameToken = 0;
let resultAction = null;

// Mejores puntuaciones de la sesión actual.
const bestScores = { 1: 0, 2: 0 };

function renderBestScores() {
  bestScoreLevel1.textContent = bestScores[1];
  bestScoreLevel2.textContent = bestScores[2];
}

function saveBestScore() {
  if (score > bestScores[currentLevel]) {
    bestScores[currentLevel] = score;
  }
  renderBestScores();
}

const vehicles = [];

const signalStates = {
  A: 'horizontal',
  B: 'horizontal'
};

const signalSwitching = {
  A: false,
  B: false
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

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

function makeRoutes(level) {
  if (level === 1) {
    return {
      E: {
        key: 'E', axis: 'x', orientation: 'horizontal', sign: 1,
        fixed: 45.2, start: -8, end: 108,
        checkpoints: [{ id: 'A', stop: 34 }]
      },
      W: {
        key: 'W', axis: 'x', orientation: 'horizontal', sign: -1,
        fixed: 52.4, start: 108, end: -8,
        checkpoints: [{ id: 'A', stop: 66 }]
      },
      S: {
        key: 'S', axis: 'y', orientation: 'vertical', sign: 1,
        fixed: 52.2, start: -8, end: 108,
        checkpoints: [{ id: 'A', stop: 34 }]
      },
      N: {
        key: 'N', axis: 'y', orientation: 'vertical', sign: -1,
        fixed: 45.3, start: 108, end: -8,
        checkpoints: [{ id: 'A', stop: 66 }]
      }
    };
  }

  return {
    E: {
      key: 'E', axis: 'x', orientation: 'horizontal', sign: 1,
      fixed: 45.2, start: -8, end: 108,
      checkpoints: [
        { id: 'A', stop: 22.5 },
        { id: 'B', stop: 58.5 }
      ]
    },
    W: {
      key: 'W', axis: 'x', orientation: 'horizontal', sign: -1,
      fixed: 52.5, start: 108, end: -8,
      checkpoints: [
        { id: 'B', stop: 77.5 },
        { id: 'A', stop: 41.5 }
      ]
    },
    AS: {
      key: 'AS', axis: 'y', orientation: 'vertical', sign: 1,
      fixed: 34.3, start: -8, end: 108,
      checkpoints: [{ id: 'A', stop: 37.5 }]
    },
    AN: {
      key: 'AN', axis: 'y', orientation: 'vertical', sign: -1,
      fixed: 28.5, start: 108, end: -8,
      checkpoints: [{ id: 'A', stop: 62.5 }]
    },
    BS: {
      key: 'BS', axis: 'y', orientation: 'vertical', sign: 1,
      fixed: 70.3, start: -8, end: 108,
      checkpoints: [{ id: 'B', stop: 37.5 }]
    },
    BN: {
      key: 'BN', axis: 'y', orientation: 'vertical', sign: -1,
      fixed: 64.5, start: 108, end: -8,
      checkpoints: [{ id: 'B', stop: 62.5 }]
    }
  };
}

function paintSignals() {
  document.querySelectorAll('.signal-pair').forEach(signal => {
    const id = signal.dataset.intersection;
    const group = signal.dataset.group;
    const isGreen = !signalSwitching[id] && signalStates[id] === group;

    signal.classList.toggle('green', isGreen);
    signal.classList.toggle('red', !isGreen);
  });

  updateControlState('A', switchA, stateA);
  updateControlState('B', switchB, stateB);
}

function updateControlState(id, button, label) {
  if (signalSwitching[id]) {
    button.classList.add('switching');
    button.disabled = true;
    label.textContent = 'Cambio de fase…';
    return;
  }

  button.classList.remove('switching');
  button.disabled = !running;
  label.textContent =
    signalStates[id] === 'horizontal' ? 'Horizontal verde' : 'Vertical verde';
}

function switchIntersection(id) {
  if (!running || signalSwitching[id]) return;
  if (id === 'B' && currentLevel !== 2) return;

  signalSwitching[id] = true;
  paintSignals();
  const token = gameToken;

  window.setTimeout(() => {
    if (!running || token !== gameToken) return;

    signalStates[id] =
      signalStates[id] === 'horizontal' ? 'vertical' : 'horizontal';

    signalSwitching[id] = false;
    paintSignals();
  }, 240);
}

function isSignalGreen(checkpoint, vehicle) {
  return (
    !signalSwitching[checkpoint.id] &&
    signalStates[checkpoint.id] === vehicle.route.orientation
  );
}

function createVehicle(routeKey) {
  const route = routes[routeKey];
  if (!route) return false;

  const tooCloseToSpawn = vehicles.some(vehicle => {
    if (vehicle.route.key !== routeKey) return false;
    const distance = route.sign * (vehicle.pos - route.start);
    return distance >= -1 && distance < 10;
  });

  if (tooCloseToSpawn) return false;

  const element = document.createElement('div');
  const bodyTypes = ['compact', 'sedan', 'suv', 'taxi'];
  const bodyType = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
  element.className = `vehicle ${bodyType}${route.orientation === 'vertical' ? ' vertical' : ''}`;
  element.style.setProperty(
    '--car-color',
    vehicleColors[Math.floor(Math.random() * vehicleColors.length)]
  );
  element.innerHTML = `
    <span class="car-cabin"></span>
    <span class="car-wheel wheel-front"></span>
    <span class="car-wheel wheel-back"></span>
    <span class="car-light headlight"></span>
    <span class="car-light taillight"></span>
  `;
  vehiclesLayer.appendChild(element);

  const levelBoost = currentLevel === 2 ? 1.06 : 1;
  const cruiseSpeed = randomBetween(8.4, 11.8) * levelBoost;

  const vehicle = {
    id: ++vehicleId,
    route,
    pos: route.start,
    previousPos: route.start,
    speed: randomBetween(1.2, 3.5),
    cruiseSpeed,
    acceleration: randomBetween(3.0, 4.7),
    braking: randomBetween(8.5, 12.5),
    length: 5.9,
    waiting: false,
    targetSpeed: cruiseSpeed,
    element
  };

  vehicles.push(vehicle);
  renderVehicle(vehicle);
  return true;
}

function renderVehicle(vehicle) {
  if (vehicle.route.axis === 'x') {
    vehicle.element.style.left = `${vehicle.pos}%`;
    vehicle.element.style.top = `${vehicle.route.fixed}%`;
  } else {
    vehicle.element.style.left = `${vehicle.route.fixed}%`;
    vehicle.element.style.top = `${vehicle.pos}%`;
  }
}

function distanceToNextRed(vehicle) {
  let nearest = Infinity;

  for (const checkpoint of vehicle.route.checkpoints) {
    const distance = vehicle.route.sign * (checkpoint.stop - vehicle.pos);

    if (distance < -0.5) continue;
    if (isSignalGreen(checkpoint, vehicle)) continue;

    nearest = Math.min(nearest, Math.max(0, distance));
  }

  return nearest;
}

function vehicleAhead(vehicle) {
  let nearestVehicle = null;
  let nearestGap = Infinity;

  for (const other of vehicles) {
    if (other.id === vehicle.id) continue;
    if (other.route.key !== vehicle.route.key) continue;

    const rawDistance =
      vehicle.route.sign * (other.pos - vehicle.pos);

    if (rawDistance <= 0) continue;

    const gap = rawDistance - vehicle.length;

    if (gap < nearestGap) {
      nearestGap = gap;
      nearestVehicle = other;
    }
  }

  return { vehicle: nearestVehicle, gap: nearestGap };
}

function computeTargetSpeed(vehicle) {
  let target = vehicle.cruiseSpeed;

  const redDistance = distanceToNextRed(vehicle);

  if (redDistance < 24) {
    const signalFactor = clamp((redDistance - 1.2) / 20, 0, 1);
    target = Math.min(target, vehicle.cruiseSpeed * signalFactor);
  }

  const ahead = vehicleAhead(vehicle);

  if (ahead.vehicle && ahead.gap < 15) {
    const gapFactor = clamp((ahead.gap - 1.4) / 11, 0, 1);
    const followSpeed =
      ahead.vehicle.speed * gapFactor +
      vehicle.cruiseSpeed * Math.max(0, gapFactor - 0.72);

    target = Math.min(target, Math.max(0, followSpeed));
  }

  return clamp(target, 0, vehicle.cruiseSpeed);
}

function emergencySpacing() {
  const routeKeys = Object.keys(routes);

  for (const routeKey of routeKeys) {
    const route = routes[routeKey];
    const sameLane = vehicles
      .filter(vehicle => vehicle.route.key === routeKey)
      .sort((a, b) => route.sign > 0 ? b.pos - a.pos : a.pos - b.pos);

    for (let index = 1; index < sameLane.length; index += 1) {
      const ahead = sameLane[index - 1];
      const behind = sameLane[index];
      const minimumGap = 6.6;

      const gap = route.sign * (ahead.pos - behind.pos);

      if (gap < minimumGap) {
        behind.pos = ahead.pos - route.sign * minimumGap;
        behind.speed = Math.min(behind.speed, ahead.speed);
      }
    }
  }
}

function updateVehicles(delta) {
  for (const vehicle of vehicles) {
    vehicle.previousPos = vehicle.pos;
    vehicle.targetSpeed = computeTargetSpeed(vehicle);

    const slowing = vehicle.targetSpeed < vehicle.speed;

    if (slowing) {
      vehicle.speed = Math.max(
        vehicle.targetSpeed,
        vehicle.speed - vehicle.braking * delta
      );
    } else {
      vehicle.speed = Math.min(
        vehicle.targetSpeed,
        vehicle.speed + vehicle.acceleration * delta
      );
    }

    vehicle.pos += vehicle.route.sign * vehicle.speed * delta;
    vehicle.waiting = vehicle.speed < 0.55;

    vehicle.element.classList.toggle('braking', slowing && vehicle.speed > 0.5);
    vehicle.element.classList.toggle('waiting', vehicle.waiting);
  }

  emergencySpacing();

  for (let index = vehicles.length - 1; index >= 0; index -= 1) {
    const vehicle = vehicles[index];
    renderVehicle(vehicle);

    const finished =
      vehicle.route.sign > 0
        ? vehicle.pos > vehicle.route.end
        : vehicle.pos < vehicle.route.end;

    if (finished) {
      vehicle.element.remove();
      vehicles.splice(index, 1);
      score += currentLevel === 2 ? 12 : 10;
      scoreDisplay.textContent = score;
      scoreDisplay.classList.remove('score-pop');
      void scoreDisplay.offsetWidth;
      scoreDisplay.classList.add('score-pop');
    }
  }

  carsCount.textContent =
    `${vehicles.length} vehículo${vehicles.length === 1 ? '' : 's'}`;
}

function getVehicleCenter(vehicle) {
  if (vehicle.route.axis === 'x') {
    return {
      x: vehicle.pos + 2.9,
      y: vehicle.route.fixed + 1.6
    };
  }

  return {
    x: vehicle.route.fixed + 1.6,
    y: vehicle.pos + 2.9
  };
}

function detectCollision() {
  for (let i = 0; i < vehicles.length; i += 1) {
    for (let j = i + 1; j < vehicles.length; j += 1) {
      const a = vehicles[i];
      const b = vehicles[j];

      if (a.route.orientation === b.route.orientation) continue;
      if (a.speed < 0.35 && b.speed < 0.35) continue;

      const centerA = getVehicleCenter(a);
      const centerB = getVehicleCenter(b);

      const closeX = Math.abs(centerA.x - centerB.x) < 4.1;
      const closeY = Math.abs(centerA.y - centerB.y) < 4.1;

      if (closeX && closeY) {
        triggerCrash(a, b);
        return true;
      }
    }
  }

  return false;
}

function triggerCrash(a, b) {
  if (!running || crashPending) return;

  crashPending = true;
  running = false;
  gameToken += 1;

  a.element.classList.add('crashed');
  b.element.classList.add('crashed');
  crashFlash.classList.add('active');
  gameBoard.classList.add('crash-state');

  switchA.disabled = true;
  switchB.disabled = true;

  window.setTimeout(() => {
    crashFlash.classList.remove('active');
    showResult('crash');
  }, 650);
}

function updateCongestion(delta) {
  const waitingCars = vehicles.filter(vehicle => vehicle.waiting).length;
  const slowCars = vehicles.filter(
    vehicle => vehicle.speed >= 0.55 && vehicle.speed < 2.2
  ).length;

  const config = levels[currentLevel];
  const extraTraffic = Math.max(
    0,
    vehicles.length - config.maxTrafficBeforePenalty
  );

  const target = clamp(
    waitingCars * (currentLevel === 2 ? 7.2 : 9.5) +
    slowCars * 1.6 +
    extraTraffic * 2.4,
    0,
    100
  );

  const changeRate = target > congestion ? 19 : 20;
  const difference = target - congestion;

  if (Math.abs(difference) > 0.02) {
    congestion +=
      Math.sign(difference) *
      Math.min(Math.abs(difference), changeRate * delta);
  }

  congestion = clamp(congestion, 0, 100);
  maxCongestion = Math.max(maxCongestion, congestion);

  const rounded = Math.round(congestion);
  congestionText.textContent = `${rounded}%`;
  congestionBar.style.width = `${rounded}%`;
  congestionMeter.setAttribute('aria-valuenow', String(rounded));

  congestionBar.classList.toggle(
    'warning',
    rounded >= 55 && rounded < 80
  );
  congestionBar.classList.toggle('danger', rounded >= 80);
  gameBoard.classList.toggle('critical', rounded >= 80);

  if (rounded < 40) {
    trafficState.textContent = 'Flujo estable';
  } else if (rounded < 70) {
    trafficState.textContent = 'Tráfico intenso';
  } else {
    trafficState.textContent = 'Congestión alta';
  }

  if (congestion >= 99.5) {
    overloadTime += delta;

    if (overloadTime >= 1.0) {
      running = false;
      showResult('congestion');
    }
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
    running = false;
    showResult('win');
  }
}

function chooseRouteKey() {
  const horizontalRoutes = ['E', 'W'];
  const verticalRoutes =
    currentLevel === 1
      ? ['S', 'N']
      : ['AS', 'AN', 'BS', 'BN'];

  let axis = waveAxis;

  if (waveRemaining <= 0) {
    const horizontalChance = currentLevel === 2 ? 0.58 : 0.52;
    axis = Math.random() < horizontalChance ? 'horizontal' : 'vertical';
  }

  const pool = axis === 'horizontal' ? horizontalRoutes : verticalRoutes;
  return pool[Math.floor(Math.random() * pool.length)];
}

function scheduleNextSpawn() {
  const config = levels[currentLevel];

  if (waveRemaining > 0) {
    nextSpawn = randomBetween(
      currentLevel === 2 ? 0.48 : 0.62,
      currentLevel === 2 ? 0.78 : 0.92
    );
    waveRemaining -= 1;
    return;
  }

  nextSpawn = randomBetween(config.spawnMin, config.spawnMax);

  if (Math.random() < config.waveChance) {
    waveAxis = Math.random() < (currentLevel === 2 ? 0.6 : 0.52)
      ? 'horizontal'
      : 'vertical';

    waveRemaining =
      currentLevel === 2
        ? Math.floor(randomBetween(2, 5))
        : Math.floor(randomBetween(2, 4));
  }
}

function spawnTraffic() {
  const firstChoice = chooseRouteKey();

  if (createVehicle(firstChoice)) return;

  const fallback = Object.keys(routes)
    .sort(() => Math.random() - 0.5)
    .find(routeKey => createVehicle(routeKey));

  return Boolean(fallback);
}

function resetSignals() {
  signalStates.A = 'horizontal';
  signalStates.B = 'horizontal';
  signalSwitching.A = false;
  signalSwitching.B = false;
  paintSignals();
}

function clearVehicles() {
  vehicles.splice(0).forEach(vehicle => vehicle.element.remove());
  carsCount.textContent = '0 vehículos';
}

function resetStats() {
  score = 0;
  congestion = 0;
  maxCongestion = 0;
  overloadTime = 0;
  crashPending = false;

  scoreDisplay.textContent = '0';
  congestionText.textContent = '0%';
  congestionBar.style.width = '0%';
  congestionBar.classList.remove('warning', 'danger');
  congestionMeter.setAttribute('aria-valuenow', '0');
  timeDisplay.classList.remove('urgent');
  gameBoard.classList.remove('critical', 'crash-state');
  crashFlash.classList.remove('active');
  trafficState.textContent = 'Flujo estable';
}

function startLevel(levelNumber) {
  gameToken += 1;
  const token = gameToken;

  currentLevel = levelNumber;
  routes = makeRoutes(currentLevel);

  clearVehicles();
  resetStats();
  resetSignals();

  const config = levels[currentLevel];

  levelName.textContent = config.title;
  levelSubtitle.textContent = config.subtitle;
  remainingTime = config.duration;
  timeDisplay.textContent = formatTime(remainingTime);

  gameBoard.classList.toggle('level-two', currentLevel === 2);
  gameBoard.classList.toggle('level-one', currentLevel === 1);
  gameBoard.classList.toggle('rush-hour', currentLevel === 2);
  gameScreen.classList.toggle('level-two-ui', currentLevel === 2);

  running = true;
  switchA.disabled = false;
  switchB.disabled = currentLevel !== 2;

  spawnElapsed = 0;
  waveRemaining = 0;
  waveAxis = 'horizontal';
  scheduleNextSpawn();
  lastFrame = performance.now();
  paintSignals();
  showScreen('game');

  const starterRoutes =
    currentLevel === 1
      ? ['E', 'W', 'S']
      : ['E', 'W', 'AS', 'BN', 'E'];

  starterRoutes.forEach((routeKey, index) => {
    window.setTimeout(() => {
      if (running && token === gameToken) createVehicle(routeKey);
    }, index * 360);
  });
}

function stopGame() {
  gameToken += 1;
  running = false;
  crashPending = false;
  signalSwitching.A = false;
  signalSwitching.B = false;

  clearVehicles();
  resetStats();

  gameBoard.classList.remove('level-two', 'rush-hour');
  gameScreen.classList.remove('level-two-ui');

  showScreen('menu');
}

function showResult(type) {
  gameToken += 1;
  saveBestScore();
  running = false;
  signalSwitching.A = false;
  signalSwitching.B = false;

  resultScore.textContent = score;
  resultBestScore.textContent = bestScores[currentLevel];
  resultCongestion.textContent = `${Math.round(maxCongestion)}%`;

  resultCard.classList.remove('win', 'lose', 'crash');

  if (type === 'win') {
    resultCard.classList.add('win');
    resultIcon.textContent = '🏆';

    if (currentLevel === 1) {
      resultEyebrow.textContent = 'Nivel 1 superado';
      resultTitle.textContent = '¡INTERSECCIÓN CONTROLADA!';
      resultMessage.textContent =
        'Buen trabajo. Ahora tendrás que coordinar dos cruces al mismo tiempo.';
      primaryResultBtn.textContent = 'IR AL NIVEL 2';
      resultAction = () => startLevel(2);
    } else {
      resultEyebrow.textContent = 'Hora pico superada';
      resultTitle.textContent = '¡CIUDAD EN MOVIMIENTO!';
      resultMessage.textContent =
        'Lograste mantener el flujo en las dos intersecciones.';
      primaryResultBtn.textContent = 'JUGAR DE NUEVO';
      resultAction = () => startLevel(1);
    }
  }

  if (type === 'congestion') {
    resultCard.classList.add('lose');
    resultIcon.textContent = '🚧';
    resultEyebrow.textContent = `Nivel ${currentLevel} · Congestión crítica`;
    resultTitle.textContent = 'TRÁFICO COLAPSADO';
    resultMessage.textContent =
      'Demasiados vehículos quedaron detenidos. Alterna los semáforos antes de que las filas crezcan.';
    primaryResultBtn.textContent = 'REINTENTAR';
    resultAction = () => startLevel(currentLevel);
  }

  if (type === 'crash') {
    resultCard.classList.add('crash');
    resultIcon.textContent = '💥';
    resultEyebrow.textContent = `Nivel ${currentLevel} · Accidente`;
    resultTitle.textContent = '¡COLISIÓN!';
    resultMessage.textContent =
      'Dos vehículos coincidieron dentro de la intersección. Espera a que el cruce se despeje antes de abrir la otra vía.';
    primaryResultBtn.textContent = 'REINTENTAR';
    resultAction = () => startLevel(currentLevel);
  }

  showScreen('result');
}

function gameLoop(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.045);
  lastFrame = now;

  if (running) {
    spawnElapsed += delta;

    if (spawnElapsed >= nextSpawn) {
      spawnElapsed = 0;
      spawnTraffic();
      scheduleNextSpawn();
    }

    updateVehicles(delta);

    if (!detectCollision() && running) {
      updateCongestion(delta);
    }

    if (running) {
      updateTimer(delta);
    }
  }

  requestAnimationFrame(gameLoop);
}

function getSelectedLevel() {
  const checked = document.querySelector('input[name="level"]:checked');
  return checked ? Number(checked.value) : 1;
}

function setSelectedLevel(level) {
  const value = String(level);
  const input = document.querySelector(`input[name="level"][value="${value}"]`);

  if (!input) return;

  input.checked = true;
  playBtn.dataset.level = value;
  playBtn.textContent = `▶ JUGAR NIVEL ${value}`;
}

function refreshLevelPicker() {
  setSelectedLevel(getSelectedLevel());
}

document.querySelectorAll('.level-option').forEach(option => {
  option.addEventListener('click', () => {
    setSelectedLevel(Number(option.dataset.level));
  });
});

levelInputs.forEach(input => {
  input.addEventListener('input', () => {
    setSelectedLevel(Number(input.value));
  });

  input.addEventListener('change', () => {
    setSelectedLevel(Number(input.value));
  });
});

playBtn.addEventListener('click', () => {
  const level = Number(playBtn.dataset.level || getSelectedLevel());
  startLevel(level);
});
howBtn.addEventListener('click', () => showScreen('how'));
howBackBtn.addEventListener('click', () => showScreen('menu'));
menuBtn.addEventListener('click', stopGame);
resultMenuBtn.addEventListener('click', stopGame);

primaryResultBtn.addEventListener('click', () => {
  if (resultAction) resultAction();
});

switchA.addEventListener('click', () => switchIntersection('A'));
switchB.addEventListener('click', () => switchIntersection('B'));

window.addEventListener('keydown', event => {
  if (!screens.game.classList.contains('active') || event.repeat) return;

  if (event.code === 'Space') {
    event.preventDefault();
    switchIntersection('A');
  }

  if (event.code === 'KeyB' && currentLevel === 2) {
    event.preventDefault();
    switchIntersection('B');
  }
});

document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now();
});

routes = makeRoutes(1);
resetSignals();
setSelectedLevel(getSelectedLevel());
renderBestScores();
requestAnimationFrame(gameLoop);
