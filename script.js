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

let greenDirection = 'horizontal';
let switching = false;

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
  if (switching) return;

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

playBtn.addEventListener('click', () => showScreen('game'));
howBtn.addEventListener('click', () => showScreen('how'));
howBackBtn.addEventListener('click', () => showScreen('menu'));
menuBtn.addEventListener('click', () => showScreen('menu'));
resultMenuBtn.addEventListener('click', () => showScreen('menu'));
switchBtn.addEventListener('click', switchLights);

window.addEventListener('keydown', event => {
  if (event.code === 'Space' && screens.game.classList.contains('active')) {
    event.preventDefault();
    switchLights();
  }
});

paintLights();
