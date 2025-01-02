import React, { useState, useEffect, useRef } from 'react';
import SankeyChart from './components/SankeyChart';
import { parseInputData } from './utils/parseInputData';
import './Sankey.css'; // Importing the CSS file for styling

const defaultChartData = `//Income USD example
Stocks	[18000]	Income
Salary	[70000]	Income
Annual Bonus	[12000]	Income
//Fixed		
Income	[30000]	Taxes
Income	[70000]	Net Income
//Expenses		
Net Income	[30000]	Mortgage
Net Income	[25000]	Home
Net Income	[4000]	School
Net Income	[10000]	Car
Net Income	[1000]	Vacations
//Details		
Mortgage	[20000]	Bank Mortage
Mortgage	[10000]	Personal Credit
//Home		
Home	[4000]	Electricity
Home	[4000]	Home Maintenance
Home	[3000]	Gas
Home	[3800]	Water
Home	[10200]	Food
//Car		
Car	[6000]	Payment
Car	[2000]	Gasoline
Car	[2000]	Insurance
//		
Debt	[15000]	Credit Cards
`;

const colorOptions = [
  ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"],
  ["#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#c49c94", "#f7b6d2", "#c7c7c7", "#dbdb8d", "#9edae5"],
  ["#393b79", "#5254a3", "#6b6ecf", "#9c9ede", "#637939", "#8ca252", "#b5cf6b", "#8c6d31", "#bd9e39", "#e7ba52"]
];

const Sankey = () => {
  const [inputText, setInputText] = useState(defaultChartData);  // Default value
  const [sankeyData, setSankeyData] = useState(null);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(700);
  const [fontSize, setFontSize] = useState(12);
  const [colorScheme, setColorScheme] = useState(0);
  const [selectedSankeyNumber, setSelectedSankeyNumber] = useState(1);
  const svgContainerRef = useRef(); // Using container ref to ensure correct referencing

  useEffect(() => {
    // Retrieve stored data from localStorage on initial load
    const storedWidth = localStorage.getItem('sankeyWidth');
    const storedHeight = localStorage.getItem('sankeyHeight');
    const storedFontSize = localStorage.getItem('sankeyFontSize');
    const storedColorScheme = localStorage.getItem('sankeyColorScheme');

    if (storedWidth) setWidth(Number(storedWidth));
    if (storedHeight) setHeight(Number(storedHeight));
    if (storedFontSize) setFontSize(Number(storedFontSize));
    if (storedColorScheme) setColorScheme(Number(storedColorScheme));

    getDataFromLocalStorage();
  }, []);


  useEffect(() => {
    handleGenerateChart(false);
  }, [inputText]);

  useEffect(() => {
    getDataFromLocalStorage();
  }, [selectedSankeyNumber]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleGenerateChartButton = () => {
    handleGenerateChart(true);
  };

  const handleGenerateChart = (saveLocally) => {
    const data = parseInputData(inputText);
    setSankeyData(data);
    if (saveLocally) {
      const dataKey = `sankeyData${selectedSankeyNumber}`;
      localStorage.setItem(dataKey, inputText);
    }
  };

  const handleDownload = () => {
    const svg = svgContainerRef.current.querySelector('svg');
    if (!svg) {
      console.error('SVG element not found');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = svg.width.baseVal.value;
      canvas.height = svg.height.baseVal.value;
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = 'sankey-diagram.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getDataFromLocalStorage = () => {
    const dataKey = `sankeyData${selectedSankeyNumber}`;
    if (selectedSankeyNumber == 1) //default button
    {
      let oldData = localStorage.getItem('sankeyData');
      if(oldData)
      {
        localStorage.removeItem('sankeyData'); // remove previous version chart
        localStorage.setItem('sankeyData1', oldData);
      }
    }

    let storedData = localStorage.getItem(dataKey);
    if(!storedData)
    {
      storedData = defaultChartData;
    }
    setInputText(storedData);
    // handleGenerateChart(false);
  };

  const handleButtonClick = (number) => {
    setSelectedSankeyNumber(number);
  };

  const handleSettingChange = () => {
    localStorage.setItem('sankeyWidth', width);
    localStorage.setItem('sankeyHeight', height);
    localStorage.setItem('sankeyFontSize', fontSize);
    localStorage.setItem('sankeyColorScheme', colorScheme);
    handleGenerateChart(false);
  };

  return (
    <div className="container">
      <div className="left-panel">
        <div className="button-group">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              className={`small-button ${selectedSankeyNumber === num ? 'selected' : ''}`}
              onClick={() => handleButtonClick(num)}
            >
              {num}
            </button>
          ))}
        </div>
        <textarea
          value={inputText}
          onChange={handleInputChange}
          rows={25}
          cols={50}
        />
        <button className='btnSankey' onClick={handleGenerateChartButton}>Save Sankey Chart</button>
        <button className='btnSankey' onClick={handleDownload}>Download as PNG</button>
        <div className="settings">
          <label>
            Width:
            <input
              type="number"
              value={width}
              onChange={(e) => {
                setWidth(Number(e.target.value));
                handleSettingChange();
              }}
            />
          </label>
          <label>
            Height:
            <input
              type="number"
              value={height}
              onChange={(e) => {
                setHeight(Number(e.target.value));
                handleSettingChange();
              }}
            />
          </label>
          <label>
            Font Size:
            <input
              type="number"
              value={fontSize}
              onChange={(e) => {
                setFontSize(Number(e.target.value))
                handleSettingChange();
              }
              }
            />
          </label>
          <label>
            Color Scheme:
            <select value={colorScheme} onChange={(e) => {
              setColorScheme(Number(e.target.value));
              handleSettingChange();
            }
            }>
              {colorOptions.map((_, index) => (
                <option value={index} key={index}>Scheme {index + 1}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="right-panel" ref={svgContainerRef}>
        {sankeyData && <SankeyChart data={sankeyData} width={width} height={height} fontSize={fontSize} colors={colorOptions[colorScheme]} />}
      </div>
    </div>
  );
};

export default Sankey;
