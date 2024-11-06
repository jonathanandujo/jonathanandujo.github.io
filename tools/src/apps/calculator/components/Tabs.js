import React, { useState } from 'react';
import '../style/Tabs.css';

import SimpleReturn from './SimpleReturn';
import MoneyDurationCalculator from './MoneyDurationCalculator'
import Ideas from './Ideas'

const Tabs = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { title: 'Simple Return', component: <SimpleReturn /> },
    { title: 'Money Duration', component: <MoneyDurationCalculator /> },
    { title: 'Ideas', component: <Ideas /> },
  ];

  return (
    <div className="tabs">
      <div className="tab-buttons">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={activeTab === index ? 'active' : ''}
            onClick={() => setActiveTab(index)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tabs[activeTab].component}
      </div>
    </div>
  );
};

export default Tabs;
