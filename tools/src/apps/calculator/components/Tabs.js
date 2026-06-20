import React, { useState } from 'react';
import '../style/Tabs.css';

import SimpleReturn from './SimpleReturn';
import MoneyDurationCalculator from './MoneyDurationCalculator'
// import Ideas from './Ideas'

const Tabs = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { title: 'Money Duration', component: <MoneyDurationCalculator /> },
    { title: 'Simple Return', component: <SimpleReturn /> }
    
  ];

  return (
    <div className="tabs calculator-tabs">
      <div className="tabs-header">
        <h1>Investment Calculators</h1>
        <p>Switch between tools to model duration and periodic returns.</p>
      </div>
      <div className="tab-buttons" role="tablist" aria-label="Calculator tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`calculator-tab-panel-${index}`}
            id={`calculator-tab-${index}`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div
        className="tab-content"
        role="tabpanel"
        id={`calculator-tab-panel-${activeTab}`}
        aria-labelledby={`calculator-tab-${activeTab}`}
      >
        {tabs[activeTab].component}
      </div>
    </div>
  );
};

export default Tabs;
