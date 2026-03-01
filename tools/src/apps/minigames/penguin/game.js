/* ================================================================
   Penguin Ice Catcher – Hielo Fuji Mini-Game
   ================================================================ */

(function () {
  'use strict';

  // ── DOM refs ──
  const canvas    = document.getElementById('game-canvas');
  const ctx       = canvas.getContext('2d');
  const hud       = document.getElementById('hud');
  const scoreEl   = document.getElementById('score-value');
  const livesEl   = document.getElementById('lives-container');
  const startScr  = document.getElementById('start-screen');
  const overScr   = document.getElementById('gameover-screen');
  const finalEl   = document.getElementById('final-score');
  const btnStart  = document.getElementById('btn-start');
  const btnAgain  = document.getElementById('btn-restart');
  const wrapper   = document.getElementById('game-wrapper');

  // ── Constants ──
  const MAX_MISSES      = 5;
  const ICE_SIZE_RATIO  = 0.065;   // ice cube size relative to canvas width
  const PENGUIN_RATIO   = 0.16;    // penguin width relative to canvas width
  const BASE_SPEED      = 2.2;     // base fall speed factor (scaled)
  const SPAWN_INTERVAL  = 900;     // ms between spawns at start
  const MIN_SPAWN       = 350;     // fastest spawn rate
  const SPEED_RAMP      = 0.04;    // speed increase per caught cube

  // ── State ──
  let w, h, scale;
  let running = false;
  let score, misses, combo;
  let penguin, iceCubes;
  let spawnTimer, lastSpawn;
  let particles;
  let starField;
  let animFrame;

  // ── Audio (tiny synthesized bleeps via Web Audio) ──
  let audioCtx;
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, dur, type, vol) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.value = vol || 0.12;
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  }
  function sfxCatch()  { playTone(880, 0.12, 'sine', 0.15); setTimeout(() => playTone(1100, 0.1, 'sine', 0.1), 60); }
  function sfxMiss()   { playTone(220, 0.25, 'triangle', 0.15); }
  function sfxCombo()  { playTone(1200, 0.15, 'sine', 0.18); setTimeout(() => playTone(1500, 0.12, 'sine', 0.14), 80); }
  function sfxGameOver() { playTone(330, 0.3, 'sawtooth', 0.1); setTimeout(() => playTone(220, 0.4, 'sawtooth', 0.1), 200); }

  // ── Resize ──
  function resize() {
    w = wrapper.clientWidth;
    h = wrapper.clientHeight;
    canvas.width  = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    scale = w / 400;  // reference width 400
    if (penguin) {
      penguin.w = w * PENGUIN_RATIO;
      penguin.h = penguin.w * 1.15;
      penguin.y = h - penguin.h - 10;
      penguin.x = Math.min(Math.max(penguin.x, 0), w - penguin.w);
    }
    buildStarField();
  }

  function buildStarField() {
    starField = [];
    for (let i = 0; i < 50; i++) {
      starField.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.55,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // ── Penguin drawing ──
  function drawPenguin(p) {
    const cx = p.x + p.w / 2;
    const cy = p.y;
    const pw = p.w;
    const ph = p.h;

    ctx.save();
    ctx.translate(cx, cy);

    // Body (dark)
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(0, ph * 0.45, pw * 0.46, ph * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly (white)
    ctx.fillStyle = '#f0f4ff';
    ctx.beginPath();
    ctx.ellipse(0, ph * 0.5, pw * 0.3, ph * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(0, ph * 0.08, pw * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeOff = pw * 0.11;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-eyeOff, ph * 0.04, pw * 0.08, 0, Math.PI * 2);
    ctx.arc( eyeOff, ph * 0.04, pw * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-eyeOff + 1, ph * 0.045, pw * 0.04, 0, Math.PI * 2);
    ctx.arc( eyeOff + 1, ph * 0.045, pw * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF9500';
    ctx.beginPath();
    ctx.moveTo(-pw * 0.06, ph * 0.1);
    ctx.lineTo( pw * 0.06, ph * 0.1);
    ctx.lineTo(0, ph * 0.17);
    ctx.closePath();
    ctx.fill();

    // Flippers
    ctx.fillStyle = '#1a1a2e';
    // left
    ctx.beginPath();
    ctx.ellipse(-pw * 0.42, ph * 0.42, pw * 0.1, ph * 0.25, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // right
    ctx.beginPath();
    ctx.ellipse( pw * 0.42, ph * 0.42, pw * 0.1, ph * 0.25,  0.2, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#FF9500';
    ctx.beginPath();
    ctx.ellipse(-pw * 0.16, ph * 0.93, pw * 0.12, ph * 0.045, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse( pw * 0.16, ph * 0.93, pw * 0.12, ph * 0.045,  0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── Ice cube drawing ──
  function drawIceCube(cube) {
    const s = cube.size;
    const x = cube.x;
    const y = cube.y;
    const wobble = Math.sin(cube.wobblePhase) * 3;

    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    ctx.rotate(cube.rotation);

    // Shadow
    ctx.fillStyle = 'rgba(0,180,255,0.12)';
    ctx.fillRect(-s / 2 + 2, -s / 2 + 2, s, s);

    // Main cube body
    const grad = ctx.createLinearGradient(-s/2, -s/2, s/2, s/2);
    grad.addColorStop(0, 'rgba(200,235,255,0.92)');
    grad.addColorStop(0.5, 'rgba(140,210,245,0.85)');
    grad.addColorStop(1, 'rgba(90,185,220,0.78)');
    ctx.fillStyle = grad;
    roundRect(ctx, -s/2, -s/2, s, s, s*0.15);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    roundRect(ctx, -s/2 + s*0.12, -s/2 + s*0.1, s*0.35, s*0.25, s*0.08);
    ctx.fill();

    // Inner shine
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(-s*0.05, s*0.05, s*0.15, 0, Math.PI*2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, -s/2, -s/2, s, s, s*0.15);
    ctx.stroke();

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── Particles ──
  function spawnCatchParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#88d8f7' : '#ffffff'
      });
    }
  }

  function spawnMissParticles(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.03,
        size: Math.random() * 3 + 1.5,
        color: '#ff6b6b'
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── Combo popup ──
  function showCombo(x, y, text) {
    const el = document.createElement('div');
    el.className = 'combo-popup';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    wrapper.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  // ── HUD ──
  function updateHUD() {
    scoreEl.textContent = score;
    livesEl.innerHTML = '';
    for (let i = 0; i < MAX_MISSES; i++) {
      const icon = document.createElement('div');
      icon.className = 'life-icon' + (i < MAX_MISSES - misses ? '' : ' lost');
      livesEl.appendChild(icon);
    }
  }

  // ── Snow ground decoration ──
  function drawGround() {
    const groundY = h - 12;
    ctx.fillStyle = 'rgba(200,230,255,0.08)';
    ctx.fillRect(0, groundY, w, 12);
    // little snow mounds
    ctx.fillStyle = 'rgba(200,230,255,0.12)';
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.arc(x + 30, groundY + 2, 20, Math.PI, 0);
      ctx.fill();
    }
  }

  // ── Stars ──
  function drawStars(time) {
    for (const s of starField) {
      const alpha = s.a + Math.sin(time * s.twinkleSpeed + s.phase) * 0.2;
      ctx.fillStyle = `rgba(200,230,255,${Math.max(0, alpha)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Spawn ice ──
  function spawnIce() {
    const size = w * ICE_SIZE_RATIO * (0.85 + Math.random() * 0.3);
    iceCubes.push({
      x: Math.random() * (w - size),
      y: -size,
      size,
      speed: (BASE_SPEED + score * SPEED_RAMP) * scale * (0.8 + Math.random() * 0.4),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.015
    });
  }

  // ── Input handling ──
  let inputX = null;       // null means no input
  let touchId = null;

  function pointerMove(clientX) {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    inputX = clientX - rect.left;
  }

  // Mouse
  canvas.addEventListener('mousemove', e => pointerMove(e.clientX));
  canvas.addEventListener('mouseleave', () => { inputX = null; });

  // Touch
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    initAudio();
    const t = e.changedTouches[0];
    touchId = t.identifier;
    pointerMove(t.clientX);
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) pointerMove(t.clientX);
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) { touchId = null; }
    }
  });

  // Keyboard
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup',   e => { keys[e.key] = false; });

  // ── Game loop ──
  function gameLoop(time) {
    if (!running) return;
    animFrame = requestAnimationFrame(gameLoop);
    update(time);
    draw(time);
  }

  function update(time) {
    // Penguin movement
    const moveSpeed = 7 * scale;
    if (inputX !== null) {
      const target = inputX - penguin.w / 2;
      penguin.x += (target - penguin.x) * 0.25;
    }
    if (keys['ArrowLeft'] || keys['a'])  penguin.x -= moveSpeed;
    if (keys['ArrowRight'] || keys['d']) penguin.x += moveSpeed;
    penguin.x = Math.max(0, Math.min(w - penguin.w, penguin.x));

    // Spawn
    const interval = Math.max(MIN_SPAWN, SPAWN_INTERVAL - score * 8);
    if (!lastSpawn || time - lastSpawn > interval) {
      spawnIce();
      lastSpawn = time;
    }

    // Update ice cubes
    for (let i = iceCubes.length - 1; i >= 0; i--) {
      const c = iceCubes[i];
      c.y += c.speed;
      c.rotation += c.rotSpeed;
      c.wobblePhase += c.wobbleSpeed;

      // Catch detection
      const cx = c.x + c.size / 2;
      const cy = c.y + c.size / 2;
      const px = penguin.x;
      const py = penguin.y;
      const pw = penguin.w;
      const ph = penguin.h;

      if (cx > px && cx < px + pw && cy + c.size / 2 > py && cy < py + ph * 0.6) {
        // Caught!
        score++;
        combo++;
        sfxCatch();
        spawnCatchParticles(cx, cy);

        if (combo >= 5 && combo % 5 === 0) {
          const bonusText = combo >= 15 ? '🔥 x' + combo + '!' : '⚡ x' + combo + '!';
          showCombo(cx, cy - 30, bonusText);
          sfxCombo();
          score += Math.floor(combo / 5); // bonus points
        }

        iceCubes.splice(i, 1);
        updateHUD();
        continue;
      }

      // Missed (hit floor)
      if (c.y > h) {
        misses++;
        combo = 0;
        sfxMiss();
        spawnMissParticles(cx, h - 5);
        iceCubes.splice(i, 1);
        updateHUD();

        if (misses >= MAX_MISSES) {
          gameOver();
          return;
        }
      }
    }

    updateParticles();
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);

    // Background gradient already from CSS, but draw stars
    drawStars(time);
    drawGround();

    // Ice cubes
    for (const c of iceCubes) drawIceCube(c);

    // Penguin
    drawPenguin(penguin);

    // Particles
    drawParticles();
  }

  // ── Game state ──
  function startGame() {
    initAudio();
    score = 0;
    misses = 0;
    combo = 0;
    iceCubes = [];
    particles = [];
    lastSpawn = 0;

    penguin = {
      x: w / 2 - (w * PENGUIN_RATIO) / 2,
      y: 0,
      w: w * PENGUIN_RATIO,
      h: w * PENGUIN_RATIO * 1.15
    };
    penguin.y = h - penguin.h - 10;

    startScr.classList.add('hidden');
    overScr.classList.add('hidden');
    hud.classList.remove('hidden');
    updateHUD();

    running = true;
    animFrame = requestAnimationFrame(gameLoop);
  }

  function gameOver() {
    running = false;
    cancelAnimationFrame(animFrame);
    sfxGameOver();
    finalEl.textContent = score;
    hud.classList.add('hidden');
    overScr.classList.remove('hidden');
  }

  // ── Buttons ──
  btnStart.addEventListener('click', () => { initAudio(); startGame(); });
  btnAgain.addEventListener('click', () => { startGame(); });

  // ── Init ──
  window.addEventListener('resize', resize);
  resize();

  // prevent scroll on mobile
  document.addEventListener('touchmove', e => {
    if (running) e.preventDefault();
  }, { passive: false });
})();
