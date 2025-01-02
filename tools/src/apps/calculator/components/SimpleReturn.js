import React, { useState, useEffect } from 'react';
import '../style/SimpleReturn.css'; // Import the CSS file

const SimpleReturn = () => {
  const [amount, setAmount] = useState(100);
  const [percentage, setPercentage] = useState(15);
  const [interest, setInterest] = useState(0);
  const [period, setPeriod] = useState('daily');

  const formatCurrency = (value) => {
    return `$${value.toLocaleString()}`;
  };

  const handleMoneyChange = (setter) => (e) => {
    const value = Number(e.target.value.replace(/[^0-9.-]+/g, ""));
    setter(value);
  };

  useEffect(() => {
    let calculatedInterest = 0;
    switch (period) {
      case 'daily':
        calculatedInterest = (amount * (percentage / 100)) / 365;
        break;
      case 'weekly':
        calculatedInterest = (amount * (percentage / 100)) / 52;
        break;
      case 'monthly':
        calculatedInterest = (amount * (percentage / 100)) / 12;
        break;
      case 'yearly':
      default:
        calculatedInterest = (amount * percentage) / 100;
        break;
    }
    setInterest(calculatedInterest);
  }, [amount, percentage, period]);

  return (
    <div className="simple-return-container">
      <div className="sidebar">
        <h3>Where to invest?</h3>
        <table className="styled-table">
          <thead>
            <tr>
              <th>App</th>
              <th>Yearly Rate</th>
              <th>Limit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mercado Pago</td>
              <td>15%</td>
              <td>$25,000</td>
            </tr>
            <tr>
              <td>Stori</td>
              <td>13.9%</td>
              <td></td>
            </tr>
            <tr>
              <td>Uala</td>
              <td>13%</td>
              <td>$50,000</td>
            </tr>
            <tr>
              <td>Nu</td>
              <td>12.25%</td>
              <td>$200,000*</td>
            </tr>
            <tr>
              <td>Finsus</td>
              <td>13.59%</td>
              <td>$200,000*</td>
            </tr>
          </tbody>
        </table>
        *Prosofipo
      </div>
      <div className="simple-return">
        <h2>Simple Interest Calculator Return Investment</h2>
        <div className="input-group">
          <label>
            Amount:
            <input
              type="text"
              value={formatCurrency(amount)}
              onChange={handleMoneyChange(setAmount)}
            />
          </label>
        </div>
        <div className="input-group">
          <label>
            Percentage:
            <input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="input-group">
          <label>Calculation Period:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="daily"
                checked={period === 'daily'}
                onChange={(e) => setPeriod(e.target.value)}
              />
              Daily
            </label>
            <label>
              <input
                type="radio"
                value="weekly"
                checked={period === 'weekly'}
                onChange={(e) => setPeriod(e.target.value)}
              />
              Weekly
            </label>
            <label>
              <input
                type="radio"
                value="monthly"
                checked={period === 'monthly'}
                onChange={(e) => setPeriod(e.target.value)}
              />
              Monthly
            </label>
            <label>
              <input
                type="radio"
                value="yearly"
                checked={period === 'yearly'}
                onChange={(e) => setPeriod(e.target.value)}
              />
              Yearly
            </label>
          </div>
        </div>
        <div className="input-group">
          <label>
            Interest Amount:
            <input type="text" value={formatCurrency(interest)} readOnly />
          </label>
        </div>
      </div>
    </div>
  );
};

export default SimpleReturn;
