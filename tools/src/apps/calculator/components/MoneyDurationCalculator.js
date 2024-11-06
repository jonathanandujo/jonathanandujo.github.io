import React, { useState, useEffect } from 'react';
import '../style/MoneyDurationCalculator.css'; // Import the CSS file

const MoneyDurationCalculator = () => {
  const [currentMoney, setCurrentMoney] = useState(3000000);
  const [yearlyInterest, setYearlyInterest] = useState(12);
  const [inflation, setInflation] = useState(7);
  const [monthlySpending, setMonthlySpending] = useState(40000);
  const [months, setMonths] = useState(0);
  const [years, setYears] = useState(0);

  useEffect(() => {
    if (currentMoney > 0 && yearlyInterest >= 0 && inflation >= 0 && monthlySpending > 0) {
      const monthlyInterestRate = (yearlyInterest / 100) / 12;
      const monthlyInflationRate = (inflation / 100) / 12;
      let remainingMoney = currentMoney;
      let monthCount = 0;

      while (remainingMoney > 0) {
        remainingMoney = remainingMoney * (1 + monthlyInterestRate) - monthlySpending;
        remainingMoney = remainingMoney / (1 + monthlyInflationRate);
        monthCount++;

        // Break the loop if the remaining money is less than the monthly spending
        if (remainingMoney <= 0) {
          break;
        }
      }

      setMonths(monthCount);
      setYears((monthCount / 12).toFixed(2)); // Convert months to years and format to 2 decimal places
    }
  }, [currentMoney, yearlyInterest, inflation, monthlySpending]);

  const formatCurrency = (value) => {
    return `$${value.toLocaleString()}`;
  };

  const handleMoneyChange = (setter) => (e) => {
    const value = Number(e.target.value.replace(/[^0-9.-]+/g, ""));
    setter(value);
  };

  return (
    <div className="money-duration-calculator">
      <h2>Money Duration Calculator</h2>
      <div className="input-group">
        <label>
          Current Money:
          <input
            type="text"
            value={formatCurrency(currentMoney)}
            onChange={handleMoneyChange(setCurrentMoney)}
          />
        </label>
      </div>
      <div className="input-group">
        <label>
          Yearly Interest (%):
          <input
            type="number"
            value={yearlyInterest}
            onChange={(e) => setYearlyInterest(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="input-group">
        <label>
          Inflation (%):
          <input
            type="number"
            value={inflation}
            onChange={(e) => setInflation(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="input-group">
        <label>
          Monthly Spending:
          <input
            type="text"
            value={formatCurrency(monthlySpending)}
            onChange={handleMoneyChange(setMonthlySpending)}
          />
        </label>
      </div>
      <div className="input-group">
        <label>
          Months Your Money Will Last:
          <input type="text" value={months.toLocaleString()} readOnly />
        </label>
      </div>
      <div className="input-group">
        <label>
          Years Your Money Will Last:
          <input type="text" value={years} readOnly />
        </label>
      </div>
    </div>
  );
};

export default MoneyDurationCalculator;
