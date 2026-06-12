import React, { useMemo, useRef, useState } from 'react';
import './App.css';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899',
  '#f43f5e', '#f59e0b', '#84cc16', '#10b981', '#6366f1',
];

const RADIUS = 200;
const CENTER = 220;
const SVG_SIZE = 440;

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function slicePath(index, total) {
  const sliceAngle = 360 / total;
  const start = index * sliceAngle;
  const end = start + sliceAngle;
  const p1 = polarToCartesian(CENTER, CENTER, RADIUS, start);
  const p2 = polarToCartesian(CENTER, CENTER, RADIUS, end);
  const largeArc = sliceAngle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${p1.x} ${p1.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
}

function SpinWheel() {
  const [namesText, setNamesText] = useState(
    'Alice\nBob\nCharlie\nDiana\nEve\nFrank\nGrace\nHenry'
  );
  const [seconds, setSeconds] = useState(4);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const wheelRef = useRef(null);

  const names = useMemo(
    () =>
      namesText
        .split('\n')
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    [namesText]
  );

  const total = names.length;
  const sliceAngle = total > 0 ? 360 / total : 0;

  const handleSpin = () => {
    if (spinning || total === 0 || seconds <= 0) return;

    const targetIdx = ((seconds - 1) % total + total) % total;
    const sliceCenter = (targetIdx + 0.5) * sliceAngle;
    const spins = Math.max(3, Math.floor(seconds));
    const base = rotation - (rotation % 360);
    const finalRotation = base + spins * 360 + (360 - sliceCenter);

    setWinner(null);
    setWinnerIdx(null);
    setSpinning(true);

    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${seconds}s cubic-bezier(0.17, 0.67, 0.18, 0.99)`;
    }
    requestAnimationFrame(() => setRotation(finalRotation));

    window.setTimeout(() => {
      setSpinning(false);
      setWinner(names[targetIdx]);
      setWinnerIdx(targetIdx);
    }, seconds * 1000);
  };

  return (
    <div className="spin-app">
      <h1 className="spin-title">Spin the Wheel</h1>

      <div className="spin-layout">
        <div className="spin-controls">
          <label className="spin-label">
            Names (one per line)
            <textarea
              className="spin-textarea"
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
              rows={12}
              disabled={spinning}
            />
          </label>

          <label className="spin-label">
            Spin duration (seconds)
            <input
              type="number"
              className="spin-number"
              min={1}
              max={60}
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value) || 1)}
              disabled={spinning}
            />
          </label>

          <button
            type="button"
            className="spin-button"
            onClick={handleSpin}
            disabled={spinning || total === 0}
          >
            {spinning ? 'Spinning...' : 'Spin'}
          </button>

          {/* <p className="spin-hint">
            Tip: with {seconds} second{seconds === 1 ? '' : 's'}, position{' '}
            {total > 0 ? (((seconds - 1) % total + total) % total) + 1 : '-'} wins.
          </p> */}
        </div>

        <div className="spin-stage">
          <div className="spin-pointer" aria-hidden="true" />
          <svg
            ref={wheelRef}
            className="spin-wheel"
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {total === 0 ? (
              <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#1e293b" />
            ) : (
              names.map((name, i) => {
                const isWinner = !spinning && winnerIdx === i;
                const labelAngle = (i + 0.5) * sliceAngle;
                const labelPos = polarToCartesian(
                  CENTER,
                  CENTER,
                  RADIUS * 0.62,
                  labelAngle
                );
                return (
                  <g key={`${name}-${i}`}>
                    <path
                      d={slicePath(i, total)}
                      fill={COLORS[i % COLORS.length]}
                      stroke="rgba(15,23,42,0.85)"
                      strokeWidth={2}
                      className={isWinner ? 'spin-slice winner' : 'spin-slice'}
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#fff"
                      fontSize={total > 12 ? 12 : 16}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${labelAngle} ${labelPos.x} ${labelPos.y})`}
                      style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                    >
                      {name.length > 14 ? `${name.slice(0, 13)}…` : name}
                    </text>
                  </g>
                );
              })
            )}
            <circle cx={CENTER} cy={CENTER} r={26} fill="#0f172a" stroke="#f472b6" strokeWidth={3} />
            <circle cx={CENTER} cy={CENTER} r={10} fill="#fbbf24" />
          </svg>
        </div>
      </div>

      {winner && (
        <div className="spin-winner-overlay">
          <div className="spin-winner-card">
            <div className="spin-winner-label">Winner</div>
            <div className="spin-winner-name">{winner}</div>
            <button
              type="button"
              className="spin-winner-close"
              onClick={() => {
                setWinner(null);
                setWinnerIdx(null);
              }}
            >
              Close
            </button>
          </div>
          <div className="spin-confetti">
            {Array.from({ length: 60 }).map((_, i) => (
              <span
                key={i}
                className="spin-confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  background: COLORS[i % COLORS.length],
                  animationDelay: `${Math.random() * 0.6}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SpinWheel;
