import React, { useState, useEffect, useRef } from 'react';
import SankeyChart from './components/SankeyChart';
import { parseInputData } from './utils/parseInputData';
import './Sankey.css'; // Importing the CSS file for styling

const defaultChartData = `
// This is an example of how to use it
// Source [AMOUNT] Target

Salary [2500] Income
Bonus [2000] Income

Income [1000] Taxes
Income [420] Housing
// You can set a custom color
Income [400] Food #e5a

// You can set a Node's color:
:Income #548755
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
  const svgContainerRef = useRef(); // Using container ref to ensure correct referencing

  useEffect(() => {
    // Retrieve stored data from localStorage on initial load
    const storedData = localStorage.getItem('sankeyData');
    const storedWidth = localStorage.getItem('sankeyWidth');
    const storedHeight = localStorage.getItem('sankeyHeight');
    const storedFontSize = localStorage.getItem('sankeyFontSize');
    const storedColorScheme = localStorage.getItem('sankeyColorScheme');

    if (storedData) {
      setInputText(storedData);
      const data = parseInputData(storedData);
      setSankeyData(data);
    } else {
      // Use default data if no data is stored in localStorage
      const data = parseInputData(defaultChartData);
      setSankeyData(data);
    }

    if (storedWidth) setWidth(Number(storedWidth));
    if (storedHeight) setHeight(Number(storedHeight));
    if (storedFontSize) setFontSize(Number(storedFontSize));
    if (storedColorScheme) setColorScheme(Number(storedColorScheme));

  }, []);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleGenerateChart = () => {
    localStorage.setItem('sankeyData', inputText); // Save data to localStorage
    const data = parseInputData(inputText);
    setSankeyData(data);
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

  const handleSettingChange = () => {
    localStorage.setItem('sankeyWidth', width);
    localStorage.setItem('sankeyHeight', height);
    localStorage.setItem('sankeyFontSize', fontSize);
    localStorage.setItem('sankeyColorScheme', colorScheme);
    handleGenerateChart();
  };

  return (
    <div className="container">
      <div className="left-panel">
        <textarea
          value={inputText}
          onChange={handleInputChange}
          rows={25}
          cols={50}
        />
        <button className='btnSankey' onClick={handleGenerateChart}>Generate Sankey Chart</button>
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
