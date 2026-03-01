/* ================================================================
   Penguin Ice Catcher – Game Engine (ES Module)
   ================================================================ */

export class PenguinGame {
  constructor(canvas, wrapperEl, callbacks) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.wrapper = wrapperEl
    this.cb = callbacks  // { onScore, onMiss, onGameOver, onCombo }

    // Constants
    this.MAX_MISSES    = 5
    this.ICE_SIZE_RATIO = 0.065
    this.PENGUIN_RATIO  = 0.16
    this.BASE_SPEED     = 2.2
    this.SPAWN_INTERVAL = 900
    this.MIN_SPAWN      = 350
    this.SPEED_RAMP     = 0.04

    // State
    this.w = 0; this.h = 0; this.scale = 1
    this.running = false
    this.score = 0; this.misses = 0; this.combo = 0
    this.penguin = null
    this.iceCubes = []; this.particles = []; this.starField = []
    this.lastSpawn = 0; this.animFrame = null
    this.inputX = null; this.touchId = null; this.keys = {}
    this.audioCtx = null

    // Bind handlers
    this._resize      = () => this.resize()
    this._mouseMove    = (e) => this._pointerMove(e.clientX)
    this._mouseLeave   = () => { this.inputX = null }
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

  _sfxCatch()    { this._tone(880,0.12,'sine',0.15); setTimeout(()=>this._tone(1100,0.1,'sine',0.1),60) }
  _sfxMiss()     { this._tone(220,0.25,'triangle',0.15) }
  _sfxCombo()    { this._tone(1200,0.15,'sine',0.18); setTimeout(()=>this._tone(1500,0.12,'sine',0.14),80) }
  _sfxGameOver() { this._tone(330,0.3,'sawtooth',0.1); setTimeout(()=>this._tone(220,0.4,'sawtooth',0.1),200) }

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

  _pointerMove(clientX) {
    if (!this.running) return
    const rect = this.canvas.getBoundingClientRect()
    this.inputX = clientX - rect.left
  }

  _handleTouchStart(e) {
    e.preventDefault()
    this._initAudio()
    const t = e.changedTouches[0]
    this.touchId = t.identifier
    this._pointerMove(t.clientX)
  }

  _handleTouchMove(e) {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === this.touchId) this._pointerMove(t.clientX)
    }
  }

  _handleTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this.touchId) this.touchId = null
    }
  }

  /* ── Resize ── */
  resize() {
    this.w = this.wrapper.clientWidth
    this.h = this.wrapper.clientHeight
    this.canvas.width  = this.w * devicePixelRatio
    this.canvas.height = this.h * devicePixelRatio
    this.canvas.style.width  = this.w + 'px'
    this.canvas.style.height = this.h + 'px'
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    this.scale = this.w / 400
    if (this.penguin) {
      this.penguin.w = this.w * this.PENGUIN_RATIO
      this.penguin.h = this.penguin.w * 1.15
      this.penguin.y = this.h - this.penguin.h - 10
      this.penguin.x = Math.min(Math.max(this.penguin.x, 0), this.w - this.penguin.w)
    }
    this._buildStarField()
  }

  _buildStarField() {
    this.starField = []
    for (let i = 0; i < 50; i++) {
      this.starField.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.55,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2
      })
    }
  }

  /* ── Start / Destroy ── */
  start() {
    this._initAudio()
    this.score = 0; this.misses = 0; this.combo = 0
    this.iceCubes = []; this.particles = []; this.lastSpawn = 0

    this.penguin = {
      x: this.w / 2 - (this.w * this.PENGUIN_RATIO) / 2,
      y: 0,
      w: this.w * this.PENGUIN_RATIO,
      h: this.w * this.PENGUIN_RATIO * 1.15
    }
    this.penguin.y = this.h - this.penguin.h - 10

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
    this.animFrame = requestAnimationFrame((t) => this._loop(t))
    this._update(time)
    this._draw(time)
  }

  _update(time) {
    const w = this.w, h = this.h, p = this.penguin

    // Penguin movement
    const moveSpeed = 7 * this.scale
    if (this.inputX !== null) {
      const target = this.inputX - p.w / 2
      p.x += (target - p.x) * 0.25
    }
    if (this.keys['ArrowLeft'] || this.keys['a']) p.x -= moveSpeed
    if (this.keys['ArrowRight'] || this.keys['d']) p.x += moveSpeed
    p.x = Math.max(0, Math.min(w - p.w, p.x))

    // Spawn
    const interval = Math.max(this.MIN_SPAWN, this.SPAWN_INTERVAL - this.score * 8)
    if (!this.lastSpawn || time - this.lastSpawn > interval) {
      this._spawnIce()
      this.lastSpawn = time
    }

    // Update ice cubes
    for (let i = this.iceCubes.length - 1; i >= 0; i--) {
      const c = this.iceCubes[i]
      c.y += c.speed
      c.rotation += c.rotSpeed
      c.wobblePhase += c.wobbleSpeed

      const cx = c.x + c.size / 2
      const cy = c.y + c.size / 2

      // Catch detection
      if (cx > p.x && cx < p.x + p.w && cy + c.size / 2 > p.y && cy < p.y + p.h * 0.6) {
        this.score++
        this.combo++
        this._sfxCatch()
        this._spawnCatchParticles(cx, cy)

        if (this.combo >= 5 && this.combo % 5 === 0) {
          const text = this.combo >= 15 ? '🔥 x' + this.combo + '!' : '⚡ x' + this.combo + '!'
          if (this.cb.onCombo) this.cb.onCombo(cx, cy - 30, text)
          this._sfxCombo()
          this.score += Math.floor(this.combo / 5)
        }

        this.iceCubes.splice(i, 1)
        if (this.cb.onScore) this.cb.onScore(this.score)
        continue
      }

      // Missed
      if (c.y > h) {
        this.misses++
        this.combo = 0
        this._sfxMiss()
        this._spawnMissParticles(cx, h - 5)
        this.iceCubes.splice(i, 1)
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
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.08; pt.life -= pt.decay
      if (pt.life <= 0) this.particles.splice(i, 1)
    }
  }

  _gameOver() {
    this.running = false
    cancelAnimationFrame(this.animFrame)
    this._sfxGameOver()
    if (this.cb.onGameOver) this.cb.onGameOver(this.score)
  }

  /* ── Spawn ── */
  _spawnIce() {
    const size = this.w * this.ICE_SIZE_RATIO * (0.85 + Math.random() * 0.3)
    this.iceCubes.push({
      x: Math.random() * (this.w - size),
      y: -size, size,
      speed: (this.BASE_SPEED + this.score * this.SPEED_RAMP) * this.scale * (0.8 + Math.random() * 0.4),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.015
    })
  }

  /* ── Particles ── */
  _spawnCatchParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 3 + 1.5
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1, decay: Math.random() * 0.03 + 0.02,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#88d8f7' : '#ffffff'
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
    this._drawStars(time)
    this._drawGround()
    for (const c of this.iceCubes) this._drawIceCube(c)
    this._drawPenguin(this.penguin)
    this._drawParticles()
  }

  _drawStars(time) {
    const ctx = this.ctx
    for (const s of this.starField) {
      const alpha = s.a + Math.sin(time * s.twinkleSpeed + s.phase) * 0.2
      ctx.fillStyle = `rgba(200,230,255,${Math.max(0, alpha)})`
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  _drawGround() {
    const ctx = this.ctx, groundY = this.h - 12
    ctx.fillStyle = 'rgba(200,230,255,0.08)'
    ctx.fillRect(0, groundY, this.w, 12)
    ctx.fillStyle = 'rgba(200,230,255,0.12)'
    for (let x = 0; x < this.w; x += 60) {
      ctx.beginPath()
      ctx.arc(x + 30, groundY + 2, 20, Math.PI, 0)
      ctx.fill()
    }
  }

  _drawPenguin(p) {
    const ctx = this.ctx
    const cx = p.x + p.w / 2, cy = p.y, pw = p.w, ph = p.h

    ctx.save()
    ctx.translate(cx, cy)

    // Body
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath(); ctx.ellipse(0, ph*0.45, pw*0.46, ph*0.5, 0, 0, Math.PI*2); ctx.fill()

    // Belly
    ctx.fillStyle = '#f0f4ff'
    ctx.beginPath(); ctx.ellipse(0, ph*0.5, pw*0.3, ph*0.38, 0, 0, Math.PI*2); ctx.fill()

    // Head
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath(); ctx.arc(0, ph*0.08, pw*0.3, 0, Math.PI*2); ctx.fill()

    // Eyes
    const eyeOff = pw * 0.11
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(-eyeOff, ph*0.04, pw*0.08, 0, Math.PI*2)
    ctx.arc( eyeOff, ph*0.04, pw*0.08, 0, Math.PI*2)
    ctx.fill()
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.arc(-eyeOff+1, ph*0.045, pw*0.04, 0, Math.PI*2)
    ctx.arc( eyeOff+1, ph*0.045, pw*0.04, 0, Math.PI*2)
    ctx.fill()

    // Beak
    ctx.fillStyle = '#FF9500'
    ctx.beginPath()
    ctx.moveTo(-pw*0.06, ph*0.1)
    ctx.lineTo( pw*0.06, ph*0.1)
    ctx.lineTo(0, ph*0.17)
    ctx.closePath(); ctx.fill()

    // Flippers
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath(); ctx.ellipse(-pw*0.42, ph*0.42, pw*0.1, ph*0.25, -0.2, 0, Math.PI*2); ctx.fill()
    ctx.beginPath(); ctx.ellipse( pw*0.42, ph*0.42, pw*0.1, ph*0.25,  0.2, 0, Math.PI*2); ctx.fill()

    // Feet
    ctx.fillStyle = '#FF9500'
    ctx.beginPath(); ctx.ellipse(-pw*0.16, ph*0.93, pw*0.12, ph*0.045, -0.15, 0, Math.PI*2); ctx.fill()
    ctx.beginPath(); ctx.ellipse( pw*0.16, ph*0.93, pw*0.12, ph*0.045,  0.15, 0, Math.PI*2); ctx.fill()

    ctx.restore()
  }

  _drawIceCube(cube) {
    const ctx = this.ctx, s = cube.size

    ctx.save()
    ctx.translate(cube.x + s/2, cube.y + s/2)
    ctx.rotate(cube.rotation)

    // Shadow
    ctx.fillStyle = 'rgba(0,180,255,0.12)'
    ctx.fillRect(-s/2+2, -s/2+2, s, s)

    // Body
    const grad = ctx.createLinearGradient(-s/2, -s/2, s/2, s/2)
    grad.addColorStop(0, 'rgba(200,235,255,0.92)')
    grad.addColorStop(0.5, 'rgba(140,210,245,0.85)')
    grad.addColorStop(1, 'rgba(90,185,220,0.78)')
    ctx.fillStyle = grad
    this._roundRect(ctx, -s/2, -s/2, s, s, s*0.15); ctx.fill()

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    this._roundRect(ctx, -s/2+s*0.12, -s/2+s*0.1, s*0.35, s*0.25, s*0.08); ctx.fill()

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.beginPath(); ctx.arc(-s*0.05, s*0.05, s*0.15, 0, Math.PI*2); ctx.fill()

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.2
    this._roundRect(ctx, -s/2, -s/2, s, s, s*0.15); ctx.stroke()

    ctx.restore()
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x+r, y)
    ctx.lineTo(x+w-r, y)
    ctx.quadraticCurveTo(x+w, y, x+w, y+r)
    ctx.lineTo(x+w, y+h-r)
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h)
    ctx.lineTo(x+r, y+h)
    ctx.quadraticCurveTo(x, y+h, x, y+h-r)
    ctx.lineTo(x, y+r)
    ctx.quadraticCurveTo(x, y, x+r, y)
    ctx.closePath()
  }

  _drawParticles() {
    const ctx = this.ctx
    for (const pt of this.particles) {
      ctx.globalAlpha = pt.life
      ctx.fillStyle = pt.color
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}
