import React from 'react';

const COLORS_ASSETS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];
const COLORS_LIABILITIES = ['#ef4444', '#f87171', '#fca5a5'];

const formatMoney = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(1)}K`;
  return `$${abs.toFixed(0)}`;
};

const DonutChart = ({ data, categories, size = 200 }) => {
  const slices = categories
    .map((cat, i) => {
      const total = (data[cat.key] || []).reduce((s, item) => s + Number(item.value || 0), 0);
      const isLiability = cat.type === 'liability';
      const assetCats = categories.filter((c) => c.type === 'asset');
      const liabCats = categories.filter((c) => c.type === 'liability');
      const colorIdx = isLiability
        ? liabCats.indexOf(cat) % COLORS_LIABILITIES.length
        : assetCats.indexOf(cat) % COLORS_ASSETS.length;
      return {
        key: cat.key,
        label: cat.label,
        icon: cat.icon,
        value: total,
        color: isLiability ? COLORS_LIABILITIES[colorIdx] : COLORS_ASSETS[colorIdx],
        type: cat.type,
      };
    })
    .filter((s) => s.value > 0);

  const grandTotal = slices.reduce((s, sl) => s + sl.value, 0);

  if (grandTotal === 0) {
    return (
      <div className="donut-empty">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2}
            r={size / 2 - 10}
            fill="none" stroke="#e5e7eb" strokeWidth="24"
          />
        </svg>
        <p className="donut-empty-text">Add items to see the chart</p>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 14;
  const strokeWidth = 28;

  // Build arcs
  let cumAngle = -90; // start at top
  const arcs = slices.map((sl) => {
    const angle = (sl.value / grandTotal) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { ...sl, startAngle, angle };
  });

  const polarToCartesian = (cxp, cyp, r, deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cxp + r * Math.cos(rad), y: cyp + r * Math.sin(rad) };
  };

  const arcPath = (cxp, cyp, r, startDeg, sweepDeg) => {
    if (sweepDeg >= 359.99) {
      // full circle – draw two half-arcs
      const p1 = polarToCartesian(cxp, cyp, r, startDeg);
      const p2 = polarToCartesian(cxp, cyp, r, startDeg + 180);
      return [
        `M ${p1.x} ${p1.y}`,
        `A ${r} ${r} 0 1 1 ${p2.x} ${p2.y}`,
        `A ${r} ${r} 0 1 1 ${p1.x} ${p1.y}`,
      ].join(' ');
    }
    const start = polarToCartesian(cxp, cyp, r, startDeg);
    const end = polarToCartesian(cxp, cyp, r, startDeg + sweepDeg);
    const large = sweepDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  // Net worth for center label
  const totalAssets = slices.filter((s) => s.type === 'asset').reduce((s, sl) => s + sl.value, 0);
  const totalLiab = slices.filter((s) => s.type === 'liability').reduce((s, sl) => s + sl.value, 0);
  const netWorth = totalAssets - totalLiab;

  return (
    <div className="donut-wrapper">
      <svg className="donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) => (
          <path
            key={arc.key}
            d={arcPath(cx, cy, radius, arc.startAngle, arc.angle)}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="#9ca3af">
          Net Worth
        </text>
        <text
          x={cx} y={cy + 11}
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill={netWorth >= 0 ? '#16a34a' : '#ef4444'}
        >
          {formatMoney(netWorth)}
        </text>
      </svg>

      <div className="donut-legend">
        {arcs.map((arc) => (
          <div className="legend-row" key={arc.key}>
            <span className="legend-dot" style={{ background: arc.color }} />
            <span className="legend-label">{arc.icon} {arc.label}</span>
            <span className="legend-value">{formatMoney(arc.value)}</span>
            <span className="legend-pct">{((arc.value / grandTotal) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
