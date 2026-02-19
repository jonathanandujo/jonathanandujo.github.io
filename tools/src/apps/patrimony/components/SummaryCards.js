import React from 'react';

const formatMoney = (n) => {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
};

const SummaryCards = ({ data, categories }) => {
  const totalAssets = categories
    .filter((c) => c.type === 'asset')
    .reduce((sum, c) => sum + (data[c.key] || []).reduce((s, i) => s + Number(i.value || 0), 0), 0);

  const totalLiabilities = categories
    .filter((c) => c.type === 'liability')
    .reduce((sum, c) => sum + (data[c.key] || []).reduce((s, i) => s + Number(i.value || 0), 0), 0);

  const netWorth = totalAssets - totalLiabilities;

  const assetPct = totalAssets + totalLiabilities > 0
    ? (totalAssets / (totalAssets + totalLiabilities)) * 100
    : 50;

  return (
    <div className="summary-stack">
      <div className="summary-row">
        <div className="summary-item">
          <span className="summary-label">Assets</span>
          <span className="summary-val positive">{formatMoney(totalAssets)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Liabilities</span>
          <span className="summary-val negative">{formatMoney(totalLiabilities)}</span>
        </div>
      </div>
      <div className="net-worth-bar">
        <div className="assets-part" style={{ width: `${assetPct}%` }} />
        <div className="liabilities-part" style={{ width: `${100 - assetPct}%` }} />
      </div>
      <div className="summary-net">
        <span className="summary-label">Net Worth</span>
        <span className={`summary-net-val ${netWorth >= 0 ? 'positive' : 'negative'}`}>
          {formatMoney(netWorth)}
        </span>
      </div>
    </div>
  );
};

export default SummaryCards;
