/* ================================================================
   Dolphin Fish Catcher – Game Engine (ES Module)
   ================================================================ */

export class DolphinGame {
  constructor(canvas, wrapperEl, callbacks) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.wrapper = wrapperEl
    this.cb = callbacks  // { onScore, onMiss, onGameOver, onCombo }

    // Constants
    this.MAX_MISSES     = 5
    this.FISH_SIZE_RATIO = 0.07
    this.DOLPHIN_RATIO   = 0.18
    this.BASE_SPEED      = 2.0
    this.SPAWN_INTERVAL  = 950
    this.MIN_SPAWN       = 350
    this.SPEED_RAMP      = 0.035

    // Fish color palettes: body, belly, fin
    this.FISH_COLORS = [
      { body: '#FF6B35', belly: '#FFD166', fin: '#E63946' },   // orange
      { body: '#06D6A0', belly: '#B5EAD7', fin: '#048A81' },   // green
      { body: '#118AB2', belly: '#83D0E4', fin: '#073B4C' },   // blue
      { body: '#EF476F', belly: '#FFC6D9', fin: '#B5173D' },   // pink
      { body: '#FFD166', belly: '#FFF3B0', fin: '#E6A800' },   // gold
      { body: '#9B5DE5', belly: '#D4BBFF', fin: '#6A1FB5' },   // purple
    ]

    // State
    this.w = 0; this.h = 0; this.scale = 1
    this.running = false
    this.score = 0; this.misses = 0; this.combo = 0
    this.dolphin = null
    this.fishes = []; this.particles = []; this.bubbles = []
    this.lastSpawn = 0; this.animFrame = null
    this.inputX = null; this.inputY = null; this.touchId = null; this.keys = {}
    this.audioCtx = null
    this.time = 0

    // Bind handlers
    this._resize       = () => this.resize()
    this._mouseMove    = (e) => this._pointerMove(e.clientX, e.clientY)
    this._mouseLeave   = () => { this.inputX = null; this.inputY = null }
    this._touchStart   = (e) => this._handleTouchStart(e)
    this._touchMove    = (e) => this._handleTouchMove(e)
    this._touchEnd     = (e) => this._handleTouchEnd(e)
    this._keyDown      = (e) => { this.keys[e.key] = true }
    this._keyUp        = (e) => { this.keys[e.key] = false }
    this._preventScroll = (e) => { if (this.running) e.preventDefault() }

    this._addListeners()
    this.resize()
  }

  /* ── Audio ── */
  _initAudio() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }

  _tone(freq, dur, type, vol) {
    if (!this.audioCtx) return
    const o = this.audioCtx.createOscillator()
    const g = this.audioCtx.createGain()
    o.type = type || 'sine'
    o.frequency.value = freq
    g.gain.value = vol || 0.12
    g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur)
    o.connect(g).connect(this.audioCtx.destination)
    o.start(); o.stop(this.audioCtx.currentTime + dur)
  }

  _sfxCatch()    { this._tone(660,0.1,'sine',0.14); setTimeout(()=>this._tone(990,0.08,'sine',0.1),50) }
  _sfxMiss()     { this._tone(180,0.3,'triangle',0.12) }
  _sfxCombo()    { this._tone(1100,0.12,'sine',0.16); setTimeout(()=>this._tone(1400,0.1,'sine',0.12),70) }
  _sfxGameOver() { this._tone(280,0.35,'sawtooth',0.1); setTimeout(()=>this._tone(180,0.4,'sawtooth',0.08),220) }

  /* ── Events ── */
  _addListeners() {
    window.addEventListener('resize', this._resize)
    this.canvas.addEventListener('mousemove', this._mouseMove)
    this.canvas.addEventListener('mouseleave', this._mouseLeave)
    this.canvas.addEventListener('touchstart', this._touchStart, { passive: false })
    this.canvas.addEventListener('touchmove', this._touchMove, { passive: false })
    this.canvas.addEventListener('touchend', this._touchEnd)
    window.addEventListener('keydown', this._keyDown)
    window.addEventListener('keyup', this._keyUp)
    document.addEventListener('touchmove', this._preventScroll, { passive: false })
  }

  _removeListeners() {
    window.removeEventListener('resize', this._resize)
    this.canvas.removeEventListener('mousemove', this._mouseMove)
    this.canvas.removeEventListener('mouseleave', this._mouseLeave)
    this.canvas.removeEventListener('touchstart', this._touchStart)
    this.canvas.removeEventListener('touchmove', this._touchMove)
    this.canvas.removeEventListener('touchend', this._touchEnd)
    window.removeEventListener('keydown', this._keyDown)
    window.removeEventListener('keyup', this._keyUp)
    document.removeEventListener('touchmove', this._preventScroll)
  }

  _pointerMove(clientX, clientY) {
    if (!this.running) return
    const rect = this.canvas.getBoundingClientRect()
    this.inputX = clientX - rect.left
    this.inputY = clientY - rect.top
  }

  _handleTouchStart(e) {
    e.preventDefault()
    this._initAudio()
    const t = e.changedTouches[0]
    this.touchId = t.identifier
    this._pointerMove(t.clientX, t.clientY)
  }

  _handleTouchMove(e) {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === this.touchId) this._pointerMove(t.clientX, t.clientY)
    }
  }

  _handleTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this.touchId) this.touchId = null
    }
  }

  /* ── Resize ── */
  resize() {
    const newW = this.wrapper.clientWidth
    const newH = this.wrapper.clientHeight
    // Ignore small height-only changes (mobile address bar show/hide)
    if (this.running && newW === this.w && Math.abs(newH - this.h) < 100) return
    this.w = newW
    this.h = newH
    this.canvas.width  = this.w * devicePixelRatio
    this.canvas.height = this.h * devicePixelRatio
    this.canvas.style.width  = this.w + 'px'
    this.canvas.style.height = this.h + 'px'
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    this.scale = this.w / 400
    if (this.dolphin) {
      this.dolphin.w = this.w * this.DOLPHIN_RATIO
      this.dolphin.h = this.dolphin.w * 0.55
      // Keep dolphin in bounds
      this.dolphin.x = Math.min(Math.max(this.dolphin.x, 0), this.w - this.dolphin.w)
      this.dolphin.y = Math.min(Math.max(this.dolphin.y, 0), this.h - this.dolphin.h)
    }
    this._buildBubbles()
  }

  _buildBubbles() {
    this.bubbles = []
    for (let i = 0; i < 30; i++) {
      this.bubbles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: Math.random() * 4 + 1.5,
        speed: Math.random() * 0.4 + 0.15,
        wobble: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        a: Math.random() * 0.25 + 0.05
      })
    }
  }

  /* ── Start / Destroy ── */
  start() {
    this._initAudio()
    this.score = 0; this.misses = 0; this.combo = 0
    this.fishes = []; this.particles = []; this.lastSpawn = 0

    this.dolphin = {
      x: this.w / 2 - (this.w * this.DOLPHIN_RATIO) / 2,
      y: 0,
      w: this.w * this.DOLPHIN_RATIO,
      h: this.w * this.DOLPHIN_RATIO * 0.55
    }
    this.dolphin.y = this.h * 0.65

    this.running = true
    this.animFrame = requestAnimationFrame((t) => this._loop(t))
  }

  destroy() {
    this.running = false
    if (this.animFrame) cancelAnimationFrame(this.animFrame)
    this._removeListeners()
  }

  /* ── Game Loop ── */
  _loop(time) {
    if (!this.running) return
    this.time = time
    this.animFrame = requestAnimationFrame((t) => this._loop(t))
    this._update(time)
    this._draw(time)
  }

  _update(time) {
    const w = this.w, h = this.h, d = this.dolphin

    // Dolphin movement – free 2D swimming
    const moveSpeed = 7 * this.scale
    if (this.inputX !== null && this.inputY !== null) {
      const targetX = this.inputX - d.w / 2
      const targetY = this.inputY - d.h / 2
      d.x += (targetX - d.x) * 0.22
      d.y += (targetY - d.y) * 0.18
    }
    if (this.keys['ArrowLeft']  || this.keys['a']) d.x -= moveSpeed
    if (this.keys['ArrowRight'] || this.keys['d']) d.x += moveSpeed
    if (this.keys['ArrowUp']    || this.keys['w']) d.y -= moveSpeed
    if (this.keys['ArrowDown']  || this.keys['s']) d.y += moveSpeed
    d.x = Math.max(0, Math.min(w - d.w, d.x))
    d.y = Math.max(0, Math.min(h - d.h, d.y))

    // Spawn fish
    const interval = Math.max(this.MIN_SPAWN, this.SPAWN_INTERVAL - this.score * 8)
    if (!this.lastSpawn || time - this.lastSpawn > interval) {
      this._spawnFish()
      this.lastSpawn = time
    }

    // Update fishes
    for (let i = this.fishes.length - 1; i >= 0; i--) {
      const f = this.fishes[i]
      f.y += f.speed
      f.swimPhase += f.swimSpeed

      // Horizontal swimming with bounce off walls
      f.x += f.vx + Math.sin(f.swimPhase) * f.swimAmplitude
      if (f.x <= 0) {
        f.x = 0
        f.vx = Math.abs(f.vx)
        f.facingRight = true
      } else if (f.x + f.w >= w) {
        f.x = w - f.w
        f.vx = -Math.abs(f.vx)
        f.facingRight = false
      }

      const cx = f.x + f.w / 2
      const cy = f.y + f.h / 2

      // Catch detection
      if (cx > d.x && cx < d.x + d.w && cy + f.h / 2 > d.y && cy < d.y + d.h * 0.7) {
        this.score++
        this.combo++
        this._sfxCatch()
        this._spawnCatchParticles(cx, cy)

        if (this.combo >= 5 && this.combo % 5 === 0) {
          const text = this.combo >= 15 ? '🌊 x' + this.combo + '!' : '🐟 x' + this.combo + '!'
          if (this.cb.onCombo) this.cb.onCombo(cx, cy - 30, text)
          this._sfxCombo()
          this.score += Math.floor(this.combo / 5)
        }

        this.fishes.splice(i, 1)
        if (this.cb.onScore) this.cb.onScore(this.score)
        continue
      }

      // Missed
      if (f.y > h) {
        this.misses++
        this.combo = 0
        this._sfxMiss()
        this._spawnMissParticles(cx, h - 5)
        this.fishes.splice(i, 1)
        if (this.cb.onMiss) this.cb.onMiss(this.misses)

        if (this.misses >= this.MAX_MISSES) {
          this._gameOver()
          return
        }
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i]
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.06; pt.life -= pt.decay
      if (pt.life <= 0) this.particles.splice(i, 1)
    }

    // Ambient bubbles
    for (const b of this.bubbles) {
      b.y -= b.speed
      b.x += Math.sin(time * 0.001 * b.wobble + b.phase) * 0.3
      if (b.y < -b.r * 2) {
        b.y = this.h + b.r * 2
        b.x = Math.random() * this.w
      }
    }
  }

  _gameOver() {
    this.running = false
    cancelAnimationFrame(this.animFrame)
    this._sfxGameOver()
    if (this.cb.onGameOver) this.cb.onGameOver(this.score)
  }

  /* ── Spawn ── */
  _spawnFish() {
    const w = this.w * this.FISH_SIZE_RATIO * (0.9 + Math.random() * 0.4)
    const h = w * 0.6
    const colors = this.FISH_COLORS[Math.floor(Math.random() * this.FISH_COLORS.length)]
    this.fishes.push({
      x: Math.random() * (this.w - w),
      y: -h,
      w, h,
      speed: (this.BASE_SPEED + this.score * this.SPEED_RAMP) * this.scale * (0.8 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 2.5 * this.scale,   // horizontal swim velocity
      swimPhase: Math.random() * Math.PI * 2,
      swimSpeed: Math.random() * 0.04 + 0.02,
      swimAmplitude: Math.random() * 1.2 + 0.4,
      facingRight: Math.random() > 0.5,
      colors
    })
  }

  /* ── Particles ── */
  _spawnCatchParticles(x, y) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 3.5 + 1.5
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1, decay: Math.random() * 0.03 + 0.02,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#54d9f7' : '#06D6A0'
      })
    }
    // Extra splash bubbles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + Math.random() * 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2 - 1,
        life: 1, decay: 0.02,
        size: Math.random() * 3 + 2,
        color: 'rgba(255,255,255,0.6)'
      })
    }
  }

  _spawnMissParticles(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2
      const speed = Math.random() * 2 + 1
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, decay: 0.03,
        size: Math.random() * 3 + 1.5,
        color: '#ff6b6b'
      })
    }
  }

  /* ── Drawing ── */
  _draw(time) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    this._drawOceanBg(time)
    this._drawBubbles()
    this._drawSeaFloor()
    for (const f of this.fishes) this._drawFish(f)
    this._drawDolphin(this.dolphin, time)
    this._drawParticles()
  }

  _drawOceanBg(time) {
    const ctx = this.ctx
    const grad = ctx.createLinearGradient(0, 0, 0, this.h)
    grad.addColorStop(0, '#0a2463')
    grad.addColorStop(0.3, '#1e6091')
    grad.addColorStop(0.7, '#168aad')
    grad.addColorStop(1, '#1a936f')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, this.w, this.h)

    // Light rays from top
    ctx.save()
    ctx.globalAlpha = 0.04
    for (let i = 0; i < 5; i++) {
      const rx = this.w * (0.15 + i * 0.18) + Math.sin(time * 0.0003 + i) * 20
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(rx - 8, 0)
      ctx.lineTo(rx + 8, 0)
      ctx.lineTo(rx + 40 + i * 10, this.h * 0.7)
      ctx.lineTo(rx - 40 - i * 10, this.h * 0.7)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  _drawBubbles() {
    const ctx = this.ctx
    for (const b of this.bubbles) {
      ctx.strokeStyle = `rgba(200,240,255,${b.a})`
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.stroke()
      // Tiny highlight
      ctx.fillStyle = `rgba(255,255,255,${b.a * 0.6})`
      ctx.beginPath()
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  _drawSeaFloor() {
    const ctx = this.ctx
    const floorY = this.h - 14

    // Sandy bottom
    ctx.fillStyle = 'rgba(194,178,128,0.15)'
    ctx.fillRect(0, floorY, this.w, 14)

    // Seaweed tufts
    ctx.fillStyle = 'rgba(34,139,34,0.2)'
    for (let x = 20; x < this.w; x += 70) {
      const sway = Math.sin(this.time * 0.002 + x * 0.05) * 4
      ctx.beginPath()
      ctx.moveTo(x, this.h)
      ctx.quadraticCurveTo(x + sway, floorY - 15, x + 3, floorY - 25)
      ctx.quadraticCurveTo(x + sway + 2, floorY - 15, x + 6, this.h)
      ctx.fill()
    }
  }

  _drawFish(fish) {
    const ctx = this.ctx
    const { x, y, w, h, facingRight, colors } = fish
    const cx = x + w / 2
    const cy = y + h / 2

    ctx.save()
    ctx.translate(cx, cy)
    if (!facingRight) ctx.scale(-1, 1)

    // Body
    ctx.fillStyle = colors.body
    ctx.beginPath()
    ctx.ellipse(0, 0, w * 0.48, h * 0.48, 0, 0, Math.PI * 2)
    ctx.fill()

    // Belly
    ctx.fillStyle = colors.belly
    ctx.beginPath()
    ctx.ellipse(w * 0.02, h * 0.1, w * 0.32, h * 0.25, 0, 0, Math.PI * 2)
    ctx.fill()

    // Tail fin
    ctx.fillStyle = colors.fin
    ctx.beginPath()
    ctx.moveTo(-w * 0.38, 0)
    ctx.lineTo(-w * 0.6, -h * 0.35)
    ctx.lineTo(-w * 0.48, 0)
    ctx.lineTo(-w * 0.6, h * 0.35)
    ctx.closePath()
    ctx.fill()

    // Top fin
    ctx.fillStyle = colors.fin
    ctx.beginPath()
    ctx.moveTo(-w * 0.05, -h * 0.4)
    ctx.lineTo(w * 0.1, -h * 0.55)
    ctx.lineTo(w * 0.2, -h * 0.35)
    ctx.closePath()
    ctx.fill()

    // Eye
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(w * 0.2, -h * 0.08, w * 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.arc(w * 0.22, -h * 0.07, w * 0.04, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  _drawDolphin(d, time) {
    const ctx = this.ctx
    const cx = d.x + d.w / 2
    const cy = d.y + d.h * 0.5
    const dw = d.w
    const dh = d.h

    // Gentle bob animation
    const bob = Math.sin(time * 0.003) * 3

    ctx.save()
    ctx.translate(cx, cy + bob)

    // ── Sleek body (elongated, tapered at both ends) ──
    ctx.fillStyle = '#4a8db7'
    ctx.beginPath()
    // Start from tail, draw top curve to snout, then bottom curve back
    ctx.moveTo(-dw * 0.48, 0)
    // Top line: tail → back hump → head → snout tip
    ctx.bezierCurveTo(-dw * 0.35, -dh * 0.38, -dw * 0.1, -dh * 0.42, dw * 0.12, -dh * 0.3)
    ctx.bezierCurveTo(dw * 0.28, -dh * 0.22, dw * 0.42, -dh * 0.15, dw * 0.55, -dh * 0.08)
    // Snout tip
    ctx.bezierCurveTo(dw * 0.58, -dh * 0.04, dw * 0.58, dh * 0.06, dw * 0.54, dh * 0.1)
    // Bottom line: snout → belly → tail
    ctx.bezierCurveTo(dw * 0.4, dh * 0.2, dw * 0.2, dh * 0.35, dw * 0.0, dh * 0.32)
    ctx.bezierCurveTo(-dw * 0.2, dh * 0.28, -dw * 0.38, dh * 0.18, -dw * 0.48, 0)
    ctx.closePath()
    ctx.fill()

    // ── Belly (lighter underside) ──
    ctx.fillStyle = '#c8dfe8'
    ctx.beginPath()
    ctx.moveTo(dw * 0.54, dh * 0.1)
    ctx.bezierCurveTo(dw * 0.4, dh * 0.2, dw * 0.2, dh * 0.32, dw * 0.0, dh * 0.28)
    ctx.bezierCurveTo(-dw * 0.18, dh * 0.24, -dw * 0.32, dh * 0.14, -dw * 0.4, 0)
    ctx.bezierCurveTo(-dw * 0.28, dh * 0.05, -dw * 0.05, dh * 0.12, dw * 0.15, dh * 0.08)
    ctx.bezierCurveTo(dw * 0.32, dh * 0.04, dw * 0.48, dh * 0.04, dw * 0.54, dh * 0.1)
    ctx.closePath()
    ctx.fill()

    // ── Dorsal fin (tall, curved back like a real dolphin) ──
    ctx.fillStyle = '#3d7a9e'
    ctx.beginPath()
    ctx.moveTo(-dw * 0.04, -dh * 0.38)
    ctx.bezierCurveTo(-dw * 0.02, -dh * 0.85, dw * 0.12, -dh * 0.75, dw * 0.14, -dh * 0.38)
    ctx.closePath()
    ctx.fill()

    // ── Tail fluke (horizontal, two-lobed like a real dolphin) ──
    ctx.fillStyle = '#3d7a9e'
    // Upper lobe
    ctx.beginPath()
    ctx.moveTo(-dw * 0.47, 0)
    ctx.bezierCurveTo(-dw * 0.52, -dh * 0.08, -dw * 0.62, -dh * 0.35, -dw * 0.56, -dh * 0.42)
    ctx.bezierCurveTo(-dw * 0.52, -dh * 0.3, -dw * 0.48, -dh * 0.12, -dw * 0.47, 0)
    ctx.fill()
    // Lower lobe
    ctx.beginPath()
    ctx.moveTo(-dw * 0.47, 0)
    ctx.bezierCurveTo(-dw * 0.52, dh * 0.08, -dw * 0.62, dh * 0.35, -dw * 0.56, dh * 0.42)
    ctx.bezierCurveTo(-dw * 0.52, dh * 0.3, -dw * 0.48, dh * 0.12, -dw * 0.47, 0)
    ctx.fill()

    // ── Pectoral fin (side flipper) ──
    ctx.fillStyle = '#3d7a9e'
    ctx.beginPath()
    ctx.moveTo(dw * 0.08, dh * 0.1)
    ctx.bezierCurveTo(dw * 0.06, dh * 0.28, dw * 0.0, dh * 0.45, -dw * 0.06, dh * 0.4)
    ctx.bezierCurveTo(-dw * 0.04, dh * 0.3, dw * 0.02, dh * 0.18, dw * 0.08, dh * 0.1)
    ctx.fill()

    // ── Melon (forehead bump) ──
    ctx.fillStyle = '#4a8db7'
    ctx.beginPath()
    ctx.ellipse(dw * 0.3, -dh * 0.2, dw * 0.1, dh * 0.12, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // ── Eye ──
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.ellipse(dw * 0.3, -dh * 0.12, dw * 0.035, dh * 0.06, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath()
    ctx.arc(dw * 0.31, -dh * 0.11, dw * 0.018, 0, Math.PI * 2)
    ctx.fill()
    // Eye glint
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(dw * 0.305, -dh * 0.13, dw * 0.007, 0, Math.PI * 2)
    ctx.fill()

    // ── Mouth line (long beak smile) ──
    ctx.strokeStyle = '#2d6a88'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(dw * 0.35, -dh * 0.02)
    ctx.bezierCurveTo(dw * 0.42, 0, dw * 0.5, dh * 0.02, dw * 0.55, dh * 0.01)
    ctx.stroke()

    ctx.restore()
  }

  _drawParticles() {
    const ctx = this.ctx
    for (const pt of this.particles) {
      ctx.globalAlpha = pt.life
      ctx.fillStyle = pt.color
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}
