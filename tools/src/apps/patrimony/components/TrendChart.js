import React, { useMemo, useState } from 'react';

const formatMoney = (n) => {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
};

/**
 * Simple SVG line chart of net worth (and assets/liabilities) over time.
 * Expects history as an array of { date: 'YYYY-MM-DD', assets, liabilities, net }
 * sorted ascending by date.
 */
const TrendChart = ({ history }) => {
  const [hover, setHover] = useState(null); // { i, x, y }

  const width = 600;
  const height = 180;
  const padding = { top: 12, right: 12, bottom: 22, left: 48 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (!history || history.length === 0) return null;
    const values = history.flatMap((h) => [h.net, h.assets, -h.liabilities]);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;
    const n = history.length;
    const xFor = (i) => padding.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
    const yFor = (v) => padding.top + plotH - ((v - min) / range) * plotH;
    return {
      min,
      max,
      net: history.map((h, i) => ({ x: xFor(i), y: yFor(h.net), v: h.net, date: h.date })),
      assets: history.map((h, i) => ({ x: xFor(i), y: yFor(h.assets), v: h.assets, date: h.date })),
      liabilities: history.map((h, i) => ({ x: xFor(i), y: yFor(-h.liabilities), v: h.liabilities, date: h.date })),
    };
  }, [history]);

  if (!points) {
    return (
      <div className="trend-empty">
        <p>No history yet. Snapshots are saved automatically as you edit.</p>
      </div>
    );
  }

  const toPath = (arr) => arr.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0;
    let bestDist = Infinity;
    points.net.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setHover({ i: best });
  };

  const hovered = hover ? history[hover.i] : null;

  return (
    <div className="trend-chart">
      <div className="trend-legend">
        <span><span className="legend-dot" style={{ background: '#2563eb' }} /> Net</span>
        <span><span className="legend-dot" style={{ background: '#16a34a' }} /> Assets</span>
        <span><span className="legend-dot" style={{ background: '#ef4444' }} /> Liabilities</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="trend-svg"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* y-axis ticks */}
        {[0, 0.5, 1].map((t) => {
          const v = points.min + (points.max - points.min) * (1 - t);
          const y = padding.top + plotH * t;
          return (
            <g key={t}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#f3f4f6" />
              <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
                {formatMoney(v)}
              </text>
            </g>
          );
        })}

        <path d={toPath(points.assets)} fill="none" stroke="#16a34a" strokeWidth="1.5" opacity="0.85" />
        <path d={toPath(points.liabilities)} fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.85" />
        <path d={toPath(points.net)} fill="none" stroke="#2563eb" strokeWidth="2" />

        {/* first / last date labels */}
        <text x={padding.left} y={height - 6} fontSize="9" fill="#9ca3af">
          {history[0].date}
        </text>
        <text x={width - padding.right} y={height - 6} fontSize="9" fill="#9ca3af" textAnchor="end">
          {history[history.length - 1].date}
        </text>

        {hover && (
          <g>
            <line
              x1={points.net[hover.i].x}
              x2={points.net[hover.i].x}
              y1={padding.top}
              y2={padding.top + plotH}
              stroke="#9ca3af"
              strokeDasharray="3 3"
            />
            <circle cx={points.net[hover.i].x} cy={points.net[hover.i].y} r="3" fill="#2563eb" />
          </g>
        )}
      </svg>
      {hovered && (
        <div className="trend-tooltip">
          <strong>{hovered.date}</strong>
          {' · Net '}<span className={hovered.net >= 0 ? 'positive' : 'negative'}>{formatMoney(hovered.net)}</span>
          {' · A '}<span className="positive">{formatMoney(hovered.assets)}</span>
          {' · L '}<span className="negative">{formatMoney(hovered.liabilities)}</span>
        </div>
      )}
    </div>
  );
};

export default TrendChart;
