import { PenguinGame } from '../game-engine.js'

export default {
  name: 'GameView',
  template: `
    <div class="game-view" ref="wrapper">
      <!-- HUD -->
      <div v-show="gameState === 'playing'" class="game-hud">
        <div class="game-score">⭐ {{ score }}</div>
        <div class="game-lives">
          <div v-for="i in maxMisses" :key="i" class="life-icon"
            :class="{ lost: i > maxMisses - misses }"></div>
        </div>
      </div>

      <!-- Canvas -->
      <canvas ref="canvas" class="game-canvas"></canvas>

      <!-- Combo popups -->
      <div v-for="c in combos" :key="c.id" class="combo-popup"
        :style="{ left: c.x + 'px', top: c.y + 'px' }">{{ c.text }}</div>

      <!-- Start Screen -->
      <div v-if="gameState === 'start'" class="game-overlay">
        <div class="penguin-title">🐧</div>
        <h1>Penguin<br>Ice Catcher</h1>
        <p>¡Ayuda al pingüino a atrapar cubos de hielo! Si se caen 5, se acabó el juego. ¡Atrapa {{ discountThreshold }} para ganar un 5% de descuento!</p>
        <button class="game-btn" @click="startGame">¡Jugar!</button>
        <router-link to="/" class="game-home-link">← Volver a Hielo Fuji</router-link>
      </div>

      <!-- Game Over Screen -->
      <div v-if="gameState === 'gameover'" class="game-overlay">
        <div class="penguin-title">{{ score >= discountThreshold ? '🎉' : '😵' }}</div>
        <h1>{{ score >= discountThreshold ? '¡Increíble!' : '¡Juego terminado!' }}</h1>
        <div class="game-final-score">{{ score }}</div>
        <p>cubos de hielo atrapados</p>
        <div v-if="score >= discountThreshold" class="discount-banner">
          🎉 ¡Felicidades! Tienes un <strong>5% de descuento</strong><br>
          Tu código: <strong style="font-size:1.2rem;letter-spacing:2px">{{ discountCode }}</strong><br>
          <small>Muéstralo al hacer tu pedido</small>
        </div>
        <button class="game-btn" @click="startGame">Jugar de nuevo</button>
        <router-link to="/" class="game-home-link">← Volver a Hielo Fuji</router-link>
      </div>
    </div>
  `,

  data() {
    return {
      gameState: 'start',  // 'start' | 'playing' | 'gameover'
      score: 0,
      misses: 0,
      maxMisses: 5,
      discountThreshold: 50,
      discountCode: '',
      combos: [],
      comboId: 0,
      engine: null
    }
  },

  mounted() {
    document.body.style.overflow = 'hidden'

    this.engine = new PenguinGame(this.$refs.canvas, this.$refs.wrapper, {
      onScore: (score) => { this.score = score },
      onMiss: (misses) => { this.misses = misses },
      onGameOver: (finalScore) => {
        this.score = finalScore
        this.gameState = 'gameover'
        if (finalScore >= this.discountThreshold) {
          this.discountCode = this.generateCode()
        }
        document.body.style.overflow = 'hidden'
      },
      onCombo: (x, y, text) => { this.showCombo(x, y, text) }
    })
  },

  beforeUnmount() {
    document.body.style.overflow = ''
    if (this.engine) {
      this.engine.destroy()
      this.engine = null
    }
  },

  methods: {
    startGame() {
      this.score = 0
      this.misses = 0
      this.gameState = 'playing'
      this.$nextTick(() => {
        this.engine.start()
      })
    },

    showCombo(x, y, text) {
      const id = ++this.comboId
      this.combos.push({ id, x, y, text })
      setTimeout(() => {
        this.combos = this.combos.filter(c => c.id !== id)
      }, 850)
    },

    generateCode() {
      var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      var code = ''
      for (var i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return 'HF-' + code
    }
  }
}
