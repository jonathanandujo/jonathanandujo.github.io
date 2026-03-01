import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PenguinGame } from './game-engine.js';
import { useSupabaseSync } from '../../../supabase/useSupabaseSync';
import './PenguinGame.css';

const LOCAL_HIGH_SCORE_KEY = 'penguin_high_score';

export default function PenguinGameView({ syncAlias }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const engineRef = useRef(null);

  const [gameState, setGameState] = useState('start'); // 'start' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem(LOCAL_HIGH_SCORE_KEY) || '0', 10);
  });
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [combos, setCombos] = useState([]);
  const comboIdRef = useRef(0);

  const maxMisses = 5;

  const { push, pull } = useSupabaseSync('penguin-highscore', syncAlias);

  // Load high score from Supabase on mount
  useEffect(() => {
    (async () => {
      const remote = await pull();
      if (remote && typeof remote.highScore === 'number') {
        const local = parseInt(localStorage.getItem(LOCAL_HIGH_SCORE_KEY) || '0', 10);
        const best = Math.max(local, remote.highScore);
        setHighScore(best);
        localStorage.setItem(LOCAL_HIGH_SCORE_KEY, String(best));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncAlias]);

  const showCombo = useCallback((x, y, text) => {
    const id = ++comboIdRef.current;
    setCombos((prev) => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setCombos((prev) => prev.filter((c) => c.id !== id));
    }, 850);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    engineRef.current = new PenguinGame(canvasRef.current, wrapperRef.current, {
      onScore: (s) => setScore(s),
      onMiss: (m) => setMisses(m),
      onGameOver: (finalScore) => {
        setScore(finalScore);
        setGameState('gameover');
        document.body.style.overflow = 'hidden';

        // Check and update high score
        const currentHigh = parseInt(localStorage.getItem(LOCAL_HIGH_SCORE_KEY) || '0', 10);
        if (finalScore > currentHigh) {
          setHighScore(finalScore);
          setIsNewRecord(true);
          localStorage.setItem(LOCAL_HIGH_SCORE_KEY, String(finalScore));
          push({ highScore: finalScore });
        } else {
          setIsNewRecord(false);
        }
      },
      onCombo: (x, y, text) => showCombo(x, y, text),
    });

    return () => {
      document.body.style.overflow = '';
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [showCombo]);

  const startGame = () => {
    setScore(0);
    setMisses(0);
    setIsNewRecord(false);
    setGameState('playing');
    setTimeout(() => {
      if (engineRef.current) engineRef.current.start();
    }, 0);
  };

  return (
    <div className="penguin-game-view" ref={wrapperRef}>
      {/* HUD */}
      {gameState === 'playing' && (
        <div className="game-hud">
          <div className="game-score">⭐ {score}</div>
          <div className="game-high-score">🏆 {highScore}</div>
          <div className="game-lives">
            {Array.from({ length: maxMisses }, (_, i) => (
              <div
                key={i}
                className={`life-icon ${i >= maxMisses - misses ? 'lost' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Combo popups */}
      {combos.map((c) => (
        <div
          key={c.id}
          className="combo-popup"
          style={{ left: c.x + 'px', top: c.y + 'px' }}
        >
          {c.text}
        </div>
      ))}

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="game-overlay">
          <div className="penguin-title-icon">🐧</div>
          <h1>
            Penguin
            <br />
            Ice Catcher
          </h1>
          <p>
            Help the penguin catch ice cubes! If 5 fall, it's game over!
          </p>
          <button className="game-btn" onClick={startGame}>
            Play!
          </button>
          <Link to="/minigames" className="game-home-link">
            ← Back to Minigames
          </Link>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="game-overlay">
          <div className="penguin-title-icon">{isNewRecord ? '🏆' : '😵'}</div>
          <h1>{isNewRecord ? 'New Record!' : 'Game Over!'}</h1>
          <div className="game-final-score">{score}</div>
          <p>ice cubes caught</p>
          <div className="game-high-score-display">
            Best: {highScore}
          </div>
          <button className="game-btn" onClick={startGame}>
            Play Again
          </button>
          <Link to="/minigames" className="game-home-link">
            ← Back to Minigames
          </Link>
        </div>
      )}
    </div>
  );
}
