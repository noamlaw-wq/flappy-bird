'use strict';

// ─── Config ───────────────────────────────────────────────
const CANVAS_W = 400;
const CANVAS_H = 600;
const GROUND_H = 70;
const PIPE_W = 54;
const PIPE_GAP_X = 230; // frames between pipes
const BIRD_X = 90;

const DIFF = {
  easy:   { speed: 2.2, gap: 155, label: '🟢 קל',    color: '#4ade80' },
  medium: { speed: 3.2, gap: 128, label: '🟡 בינוני', color: '#fbbf24' },
  hard:   { speed: 4.6, gap: 100, label: '🔴 קשה',   color: '#f87171' },
};

// ─── State ────────────────────────────────────────────────
let canvas, ctx;
let currentDiff = 'easy';
let gameState = 'idle'; // idle | waiting | playing | paused | dead
let score = 0;
let animId = null;

let bird = {};
let pipes = [];
let pipeTimer = 0;
let groundOffset = 0;
let bgOffset = 0;
let particles = [];

// Pre-generated stars
const STARS = Array.from({ length: 80 }, () => ({
  x: Math.random() * CANVAS_W,
  y: Math.random() * (CANVAS_H - GROUND_H - 40),
  r: Math.random() * 1.8 + 0.4,
  a: Math.random() * 0.6 + 0.25,
  twinkle: Math.random() * Math.PI * 2,
}));

// Pre-generated clouds
let clouds = Array.from({ length: 4 }, (_, i) => ({
  x: 60 + i * 100,
  y: 40 + Math.random() * 80,
  w: 60 + Math.random() * 50,
  h: 22 + Math.random() * 14,
  speed: 0.3 + Math.random() * 0.2,
}));

// ─── DOM init ─────────────────────────────────────────────
function initDOM() {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Nav
  document.getElementById('go-register').addEventListener('click', e => { e.preventDefault(); showScreen('register'); });
  document.getElementById('go-login').addEventListener('click',    e => { e.preventDefault(); showScreen('login'); });
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('register-btn').addEventListener('click', handleRegister);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('play-again-btn').addEventListener('click', startGame);
  document.getElementById('menu-btn').addEventListener('click', () => showMenu());
  document.getElementById('pause-btn').addEventListener('click', togglePause);

  // Enter keys
  document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  document.getElementById('reg-confirm').addEventListener('keydown',   e => { if (e.key === 'Enter') handleRegister(); });

  // Difficulty buttons
  document.querySelectorAll('.btn-diff').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-diff').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDiff = btn.dataset.diff;
    });
  });

  // Game controls
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleFlap(); }
    if (e.code === 'Escape') { if (gameState === 'playing' || gameState === 'paused') togglePause(); }
  });
  canvas.addEventListener('click', handleFlap);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); handleFlap(); }, { passive: false });

  // Auto-login check
  const user = getCurrentUser();
  if (user) showMenu();
  else showScreen('login');
}

function resizeCanvas() {
  if (!canvas) return;
  const hud = 52;
  const avail = Math.min(window.innerWidth, 480);
  const availH = window.innerHeight - hud;
  const scale = Math.min(avail / CANVAS_W, availH / CANVAS_H);
  canvas.width  = CANVAS_W;
  canvas.height = CANVAS_H;
  canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
  canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
}

// ─── Screens ──────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

function showMenu() {
  const user = getCurrentUser();
  document.getElementById('welcome-msg').textContent = `שלום, ${user}! 👋`;
  const best = getUserHighScore(user);
  const box  = document.getElementById('personal-best-box');
  if (best > 0) {
    box.classList.remove('hidden');
    document.getElementById('personal-best-score').textContent = best;
  } else {
    box.classList.add('hidden');
  }
  renderLeaderboard();
  showScreen('menu');
}

function renderLeaderboard() {
  const lb = getLeaderboard();
  const el = document.getElementById('leaderboard-list');
  if (!lb.length) {
    el.innerHTML = '<p class="empty-lb">אין תוצאות עדיין. היה הראשון! 🚀</p>';
    return;
  }
  const medals = ['🥇', '🥈', '🥉'];
  const me = getCurrentUser();
  el.innerHTML = lb.map((e, i) => `
    <div class="lb-row${e.username === me ? ' lb-me' : ''}">
      <span class="lb-rank">${medals[i] || (i + 1)}</span>
      <span class="lb-name">${esc(e.username)}</span>
      <span class="lb-score">${e.score}</span>
    </div>`).join('');
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Auth handlers ────────────────────────────────────────
async function handleLogin() {
  const un  = document.getElementById('login-username').value;
  const pw  = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = 'מתחבר...';
  const res = await login(un, pw);
  btn.disabled = false; btn.textContent = 'התחבר';
  if (res.ok) {
    err.classList.add('hidden');
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    showMenu();
  } else {
    err.textContent = res.error;
    err.classList.remove('hidden');
  }
}

async function handleRegister() {
  const un  = document.getElementById('reg-username').value;
  const pw  = document.getElementById('reg-password').value;
  const cn  = document.getElementById('reg-confirm').value;
  const err = document.getElementById('reg-error');
  const btn = document.getElementById('register-btn');
  btn.disabled = true; btn.textContent = 'נרשם...';
  const res = await register(un, pw, cn);
  btn.disabled = false; btn.textContent = 'הירשם';
  if (res.ok) {
    err.classList.add('hidden');
    ['reg-username','reg-password','reg-confirm'].forEach(id => { document.getElementById(id).value = ''; });
    showMenu();
  } else {
    err.textContent = res.error;
    err.classList.remove('hidden');
  }
}

function handleLogout() {
  logout();
  showScreen('login');
}

// ─── Game ─────────────────────────────────────────────────
function startGame() {
  const d = DIFF[currentDiff];
  document.getElementById('hud-diff').textContent   = d.label;
  document.getElementById('hud-score').textContent  = '0';

  bird = {
    x: BIRD_X, y: CANVAS_H / 2 - 50,
    vy: 0, angle: 0,
    gravity: 0.38, jump: -7.4,
    w: 36, h: 30,
    flapAnim: 0,
  };
  pipes      = [];
  pipeTimer  = 0;
  score      = 0;
  particles  = [];
  groundOffset = 0;
  bgOffset     = 0;
  gameState    = 'waiting';

  const overlay = document.getElementById('game-overlay');
  const msg     = document.getElementById('overlay-msg');
  overlay.classList.remove('hidden');
  msg.innerHTML = '🐦 לחץ / הקש לקפוץ<br><span style="font-size:14px;opacity:0.7">Space / Click / Tap</span>';

  showScreen('game');
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function handleFlap() {
  if (gameState === 'waiting') {
    gameState = 'playing';
    document.getElementById('game-overlay').classList.add('hidden');
    bird.vy = bird.jump;
    spawnParticles(bird.x + bird.w / 2, bird.y + bird.h / 2, '#fbbf24', 4);
  } else if (gameState === 'playing') {
    bird.vy = bird.jump;
    bird.flapAnim = 8;
    spawnParticles(bird.x + bird.w / 2, bird.y + bird.h / 2, '#fbbf24', 3);
  } else if (gameState === 'paused') {
    togglePause();
  }
}

function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
    document.getElementById('overlay-msg').textContent = '⏸ מושהה — לחץ להמשך';
    document.getElementById('game-overlay').classList.remove('hidden');
  } else if (gameState === 'paused') {
    gameState = 'playing';
    document.getElementById('game-overlay').classList.add('hidden');
  }
}

// ─── Loop ─────────────────────────────────────────────────
function loop() {
  update();
  draw();
  animId = requestAnimationFrame(loop);
}

function update() {
  const d = DIFF[currentDiff];

  // Scroll bg & ground always
  if (gameState === 'playing') {
    groundOffset = (groundOffset + d.speed) % 30;
    bgOffset = (bgOffset + d.speed * 0.3) % CANVAS_W;
  }

  if (gameState !== 'playing') return;

  // Bird physics
  bird.vy += bird.gravity;
  bird.vy  = Math.min(bird.vy, 12);
  bird.y  += bird.vy;
  bird.angle = Math.min(Math.max(bird.vy * 4, -30), 80);
  if (bird.flapAnim > 0) bird.flapAnim--;

  // Ceiling
  if (bird.y < 0) { bird.y = 0; bird.vy = 0; }

  // Ground
  if (bird.y + bird.h >= CANVAS_H - GROUND_H) {
    bird.y = CANVAS_H - GROUND_H - bird.h;
    triggerDeath(); return;
  }

  // Pipes
  pipeTimer++;
  if (pipeTimer >= PIPE_GAP_X) {
    pipeTimer = 0;
    const minTop = 55;
    const maxTop = CANVAS_H - GROUND_H - d.gap - 55;
    const topH   = minTop + Math.random() * (maxTop - minTop);
    pipes.push({ x: CANVAS_W + 10, topH, gap: d.gap, scored: false });
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].x -= d.speed;

    if (!pipes[i].scored && pipes[i].x + PIPE_W < bird.x) {
      pipes[i].scored = true;
      score++;
      document.getElementById('hud-score').textContent = score;
      spawnParticles(bird.x, bird.y, '#a855f7', 6);
    }

    if (pipes[i].x + PIPE_W < 0) { pipes.splice(i, 1); continue; }

    if (hitPipe(pipes[i])) { triggerDeath(); return; }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.15;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function hitPipe(pipe) {
  const m  = 5;
  const bx = bird.x + m, by = bird.y + m;
  const bw = bird.w - m * 2, bh = bird.h - m * 2;
  const px = pipe.x, pw = PIPE_W;
  if (bx + bw < px || bx > px + pw) return false;
  if (by < pipe.topH) return true;
  if (by + bh > pipe.topH + pipe.gap) return true;
  return false;
}

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1.5 + Math.random() * 3;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, color, r: 3 + Math.random() * 3, life: 25 + Math.random() * 15 | 0 });
  }
}

function triggerDeath() {
  gameState = 'dead';
  cancelAnimationFrame(animId);

  spawnParticles(bird.x + bird.w / 2, bird.y + bird.h / 2, '#f87171', 20);
  // draw one last frame showing particles
  draw();

  const user    = getCurrentUser();
  const isNew   = updateHighScore(user, score);
  const best    = getUserHighScore(user);

  setTimeout(() => {
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-best').textContent  = best;
    const badge = document.getElementById('new-record-badge');
    if (isNew && score > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
    showScreen('gameover');
  }, 700);
}

// ─── Draw ─────────────────────────────────────────────────
function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawSky();
  drawStars();
  drawClouds();
  drawPipes();
  drawGround();
  drawBird();
  drawParticles();
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0,   '#0f0c29');
  g.addColorStop(0.45,'#302b63');
  g.addColorStop(1,   '#24243e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawStars() {
  const t = Date.now() / 1000;
  STARS.forEach(s => {
    const a = s.a * (0.7 + 0.3 * Math.sin(t * 1.5 + s.twinkle));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fill();
  });
}

function drawClouds() {
  if (gameState === 'playing') {
    clouds.forEach(c => { c.x -= c.speed; if (c.x + c.w < 0) c.x = CANVAS_W + c.w; });
  }
  clouds.forEach(c => {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = 'white';
    drawCloudShape(c.x, c.y, c.w, c.h);
    ctx.restore();
  });
}

function drawCloudShape(x, y, w, h) {
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.6, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.3, y + h * 0.5, w * 0.3, h * 0.35, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.7, y + h * 0.5, w * 0.28, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipes() {
  pipes.forEach(pipe => {
    const botY = pipe.topH + pipe.gap;
    const botH = CANVAS_H - GROUND_H - botY;

    // Gradient
    const g = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
    g.addColorStop(0,   '#16a34a');
    g.addColorStop(0.35,'#4ade80');
    g.addColorStop(0.65,'#22c55e');
    g.addColorStop(1,   '#15803d');

    ctx.fillStyle = g;

    // Top pipe body
    roundRect(ctx, pipe.x + 3, 0, PIPE_W - 6, pipe.topH - 14, [0, 0, 4, 4]);
    ctx.fill();
    // Top cap
    roundRect(ctx, pipe.x - 4, pipe.topH - 14, PIPE_W + 8, 14, [0, 0, 6, 6]);
    ctx.fill();

    // Bottom pipe body
    roundRect(ctx, pipe.x + 3, botY + 14, PIPE_W - 6, botH, [4, 4, 0, 0]);
    ctx.fill();
    // Bottom cap
    roundRect(ctx, pipe.x - 4, botY, PIPE_W + 8, 14, [6, 6, 0, 0]);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(pipe.x + 7, 0, 7, pipe.topH - 14);
    ctx.fillRect(pipe.x + 7, botY + 14, 7, botH);

    // Dark edge
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(pipe.x + PIPE_W - 8, 0, 5, pipe.topH - 14);
    ctx.fillRect(pipe.x + PIPE_W - 8, botY + 14, 5, botH);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  if (!Array.isArray(r)) r = [r, r, r, r];
  const [tl, tr, br, bl] = r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function drawGround() {
  // Ground base
  const g = ctx.createLinearGradient(0, CANVAS_H - GROUND_H, 0, CANVAS_H);
  g.addColorStop(0,   '#92400e');
  g.addColorStop(0.25,'#78350f');
  g.addColorStop(1,   '#3b1a00');
  ctx.fillStyle = g;
  ctx.fillRect(0, CANVAS_H - GROUND_H, CANVAS_W, GROUND_H);

  // Grass strip
  const gg = ctx.createLinearGradient(0, CANVAS_H - GROUND_H, 0, CANVAS_H - GROUND_H + 10);
  gg.addColorStop(0, '#4ade80');
  gg.addColorStop(1, '#16a34a');
  ctx.fillStyle = gg;
  ctx.fillRect(0, CANVAS_H - GROUND_H, CANVAS_W, 10);

  // Scrolling dirt lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let x = -groundOffset; x < CANVAS_W; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, CANVAS_H - GROUND_H + 12);
    ctx.lineTo(x + 20, CANVAS_H - GROUND_H + 12);
    ctx.stroke();
  }
}

function drawBird() {
  const cx = bird.x + bird.w / 2;
  const cy = bird.y + bird.h / 2;
  const angleRad = (bird.angle * Math.PI) / 180;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleRad);

  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(2, 4, bird.w / 2, bird.h / 2 * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body
  const bodyGrad = ctx.createRadialGradient(-4, -5, 2, 0, 0, bird.w / 2);
  bodyGrad.addColorStop(0, '#fde68a');
  bodyGrad.addColorStop(0.6,'#fbbf24');
  bodyGrad.addColorStop(1,  '#d97706');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, bird.w / 2, bird.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(-3, -4, 9, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye white
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(8, -5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(9.5, -5, 3, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(10.5, -6.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(14, -2);
  ctx.lineTo(22, 0.5);
  ctx.lineTo(14, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(14, 0.5);
  ctx.lineTo(22, 0.5);
  ctx.lineTo(14, 1.5);
  ctx.closePath();
  ctx.fill();

  // Wing (animated flap)
  const flapOffset = bird.flapAnim > 0 ? -Math.sin((8 - bird.flapAnim) / 8 * Math.PI) * 8 : 0;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(-4, 3 + flapOffset, 11, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.ellipse(-5, 2 + flapOffset, 7, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / 40);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (p.life / 40), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initDOM);
