import React, { useState, useEffect, useRef } from 'react';
import SankeyChart from './components/SankeyChart';
import { parseInputData } from './utils/parseInputData';
import { useSupabaseSync } from '../../supabase/useSupabaseSync';
import '../../supabase/SyncPanel.css';
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

const getScopedKey = (alias, key) => (alias ? `${key}:${alias}` : key);
const sanitizeChartIds = (value) => {
  if (!Array.isArray(value)) return [1];
  const clean = value
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v > 0);
  return clean.length ? [...new Set(clean)].sort((a, b) => a - b) : [1];
};

const Sankey = ({ syncAlias }) => {
  const [inputText, setInputText] = useState(defaultChartData);  // Default value
  const [sankeyData, setSankeyData] = useState(null);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(700);
  const [fontSize, setFontSize] = useState(12);
  const [colorScheme, setColorScheme] = useState(0);
  const [chartIds, setChartIds] = useState([1]);
  const [selectedSankeyNumber, setSelectedSankeyNumber] = useState(1);
  const svgContainerRef = useRef(); // Using container ref to ensure correct referencing
  const { push, pull, syncing, lastSync, error: syncError, isConfigured } = useSupabaseSync(`sankey-${selectedSankeyNumber}`, syncAlias);
  const { push: pushSettings, pull: pullSettings, isConfigured: isSettingsConfigured } = useSupabaseSync('sankey-settings', syncAlias);
  const skipNextSettingsPushRef = useRef(true);
  const settingsPushTimerRef = useRef(null);
  const inputTextRef = useRef(inputText);
  const settingsRef = useRef({ width, height, fontSize, colorScheme, chartIds, selectedSankeyNumber });

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  useEffect(() => {
    settingsRef.current = { width, height, fontSize, colorScheme, chartIds, selectedSankeyNumber };
  }, [width, height, fontSize, colorScheme, chartIds, selectedSankeyNumber]);

  useEffect(() => {
    // Retrieve stored data from localStorage on initial load
    const storedWidth = localStorage.getItem(getScopedKey(syncAlias, 'sankeyWidth'));
    const storedHeight = localStorage.getItem(getScopedKey(syncAlias, 'sankeyHeight'));
    const storedFontSize = localStorage.getItem(getScopedKey(syncAlias, 'sankeyFontSize'));
    const storedColorScheme = localStorage.getItem(getScopedKey(syncAlias, 'sankeyColorScheme'));
    const storedChartIds = localStorage.getItem(getScopedKey(syncAlias, 'sankeyChartIds'));
    const storedSelected = localStorage.getItem(getScopedKey(syncAlias, 'sankeySelectedChart'));

    if (storedWidth) setWidth(Number(storedWidth));
    if (storedHeight) setHeight(Number(storedHeight));
    if (storedFontSize) setFontSize(Number(storedFontSize));
    if (storedColorScheme) setColorScheme(Number(storedColorScheme));

    const nextChartIds = sanitizeChartIds(storedChartIds ? JSON.parse(storedChartIds) : [1]);
    setChartIds(nextChartIds);
    const nextSelected = Number(storedSelected || 1);
    setSelectedSankeyNumber(nextChartIds.includes(nextSelected) ? nextSelected : nextChartIds[0]);
  }, [syncAlias]);

  useEffect(() => {
    localStorage.setItem(getScopedKey(syncAlias, 'sankeyWidth'), width);
    localStorage.setItem(getScopedKey(syncAlias, 'sankeyHeight'), height);
    localStorage.setItem(getScopedKey(syncAlias, 'sankeyFontSize'), fontSize);
    localStorage.setItem(getScopedKey(syncAlias, 'sankeyColorScheme'), colorScheme);
    localStorage.setItem(getScopedKey(syncAlias, 'sankeyChartIds'), JSON.stringify(chartIds));
    localStorage.setItem(getScopedKey(syncAlias, 'sankeySelectedChart'), String(selectedSankeyNumber));
  }, [width, height, fontSize, colorScheme, chartIds, selectedSankeyNumber, syncAlias]);


  useEffect(() => {
    handleGenerateChart(false);
  }, [inputText]);

  useEffect(() => {
    getDataFromLocalStorage();
  }, [selectedSankeyNumber, syncAlias]);

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
      const dataKey = getScopedKey(syncAlias, `sankeyData${selectedSankeyNumber}`);
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
    const dataKey = getScopedKey(syncAlias, `sankeyData${selectedSankeyNumber}`);
    if (selectedSankeyNumber === 1) //default button
    {
      let oldData = localStorage.getItem('sankeyData');
      if (oldData)
      {
        localStorage.removeItem('sankeyData'); // remove previous version chart
        localStorage.setItem(getScopedKey(syncAlias, 'sankeyData1'), oldData);
      }
    }

    let storedData = localStorage.getItem(dataKey);
    if (!storedData)
    {
      storedData = defaultChartData;
    }
    setInputText(storedData);
    // handleGenerateChart(false);
  };

  const handleAddChart = () => {
    const next = (chartIds[chartIds.length - 1] || 0) + 1;
    const nextIds = [...chartIds, next];
    setChartIds(nextIds);
    setSelectedSankeyNumber(next);
  };

  const handleRemoveChart = (chartId) => {
    if (chartIds.length <= 1) return;
    const nextIds = chartIds.filter((id) => id !== chartId);
    localStorage.removeItem(getScopedKey(syncAlias, `sankeyData${chartId}`));
    setChartIds(nextIds);
    if (selectedSankeyNumber === chartId) {
      const idx = chartIds.indexOf(chartId);
      const fallback = nextIds[idx - 1] || nextIds[0];
      setSelectedSankeyNumber(fallback);
    }
  };

  const handleButtonClick = (number) => {
    setSelectedSankeyNumber(number);
  };

  useEffect(() => {
    if (!isConfigured) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const remote = await pull();
      if (cancelled) return;
      if (remote?.text) {
        setInputText(remote.text);
      } else {
        await push({ text: inputTextRef.current });
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isConfigured, pull, push, selectedSankeyNumber, syncAlias]);

  useEffect(() => {
    if (!isSettingsConfigured) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const remote = await pullSettings();
      if (cancelled) return;
      if (remote) {
        skipNextSettingsPushRef.current = true;
        const current = settingsRef.current;
        const remoteChartIds = sanitizeChartIds(remote.chartIds || current.chartIds);
        const remoteSelected = Number(remote.selectedSankeyNumber || current.selectedSankeyNumber || remoteChartIds[0]);
        setWidth(Number(remote.width ?? current.width));
        setHeight(Number(remote.height ?? current.height));
        setFontSize(Number(remote.fontSize ?? current.fontSize));
        setColorScheme(Number(remote.colorScheme ?? current.colorScheme));
        setChartIds(remoteChartIds);
        setSelectedSankeyNumber(remoteChartIds.includes(remoteSelected) ? remoteSelected : remoteChartIds[0]);
      } else {
        await pushSettings(settingsRef.current);
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isSettingsConfigured, pullSettings, pushSettings, syncAlias]);

  useEffect(() => {
    if (!isSettingsConfigured) return;
    if (skipNextSettingsPushRef.current) {
      skipNextSettingsPushRef.current = false;
      return;
    }
    if (settingsPushTimerRef.current) clearTimeout(settingsPushTimerRef.current);
    settingsPushTimerRef.current = setTimeout(() => {
      pushSettings({ width, height, fontSize, colorScheme, chartIds, selectedSankeyNumber });
    }, 400);
    return () => {
      if (settingsPushTimerRef.current) clearTimeout(settingsPushTimerRef.current);
    };
  }, [isSettingsConfigured, pushSettings, width, height, fontSize, colorScheme, chartIds, selectedSankeyNumber]);

  return (
    <div className="container">
      <div className="left-panel">
        <div className="chart-tabs-wrap">
          <div className="button-group">
            {chartIds.map((num) => (
              <button
                key={num}
                className={`small-button ${selectedSankeyNumber === num ? 'selected' : ''}`}
                onClick={() => handleButtonClick(num)}
              >
                <span>Chart {num}</span>
                {chartIds.length > 1 && (
                  <span
                    className="small-button-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveChart(num);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRemoveChart(num);
                      }
                    }}
                    aria-label={`Remove chart ${num}`}
                    title={`Remove chart ${num}`}
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
          </div>
          <button className="btn-add-chart" onClick={handleAddChart}>+ Add chart</button>
        </div>
        <textarea
          value={inputText}
          onChange={handleInputChange}
          rows={25}
          cols={50}
        />
        <button className='btnSankey' onClick={handleGenerateChartButton}>Save Sankey Chart</button>
        <button className='btnSankey' onClick={handleDownload}>Download as PNG</button>
        {isConfigured && (
          <div className="supabase-sync-bar" style={{ margin: '6px 0' }}>
            {syncing && <span className="sync-info">Syncing…</span>}
            {syncError && <span className="sync-error">{syncError}</span>}
            {lastSync && !syncing && <span className="sync-info">Last: {lastSync.toLocaleTimeString()}</span>}
          </div>
        )}
        <div className="settings">
          <label>
            Width:
            <input
              type="number"
              value={width}
              onChange={(e) => {
                setWidth(Number(e.target.value));
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
              }
              }
            />
          </label>
          <label>
            Color Scheme:
            <select value={colorScheme} onChange={(e) => {
              setColorScheme(Number(e.target.value));
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
