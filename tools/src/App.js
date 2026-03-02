import React, { useState } from 'react';
import { HashRouter as Router, Route, Routes, NavLink, Navigate } from 'react-router-dom';
import Calculator from './apps/calculator/App';
import Sankey from './apps/sankey/App';
import Matrix from './apps/matrix/App';
import Event from './apps/event/App';
import Patrimony from './apps/patrimony/App';
import MinigamesHub from './apps/minigames/MinigamesHub';
import PenguinGame from './apps/minigames/penguin/PenguinGame';
import DolphinGame from './apps/minigames/dolphin/DolphinGame';
import SyncPanel from './supabase/SyncPanel';
import { getSyncAlias } from './supabase/supabaseClient';
// import Minesweeper from './apps/minesweeper/Minesweeper';
import './App.css';

function App() {
  const [menuCollapsed, setMenuCollapsed] = useState(() => window.innerWidth < 768);
  const [syncAlias, setSyncAlias] = useState(getSyncAlias());

  return (
    <Router>
      <div className="app-shell">
        <header className={`App-header ${menuCollapsed ? 'collapsed' : ''}`}>
          <button
            className="menu-toggle"
            onClick={() => setMenuCollapsed((v) => !v)}
            title={menuCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {menuCollapsed ? '▶' : '◀'}
          </button>
          <nav>
            <ul>
              <li><NavLink to="/calculator" title="Calculator"><span className="nav-icon">🧮</span><span className="nav-label">Calculator</span></NavLink></li>
              <li><NavLink to="/sankey" title="Sankey"><span className="nav-icon">📊</span><span className="nav-label">Sankey</span></NavLink></li>
              <li><NavLink to="/matrix" title="Eisenhower Matrix"><span className="nav-icon">📋</span><span className="nav-label">Eisenhower Matrix</span></NavLink></li>
              <li><NavLink to="/patrimony" title="Patrimony"><span className="nav-icon">💰</span><span className="nav-label">Patrimony</span></NavLink></li>
              <li><NavLink to="/minigames" title="Minigames"><span className="nav-icon">🎮</span><span className="nav-label">Minigames</span></NavLink></li>
              {/* <li><NavLink to="/minesweeper" title="Minesweeper"><span className="nav-icon">💣</span><span className="nav-label">Minesweeper</span></NavLink></li> */}
            </ul>
          </nav>
          <SyncPanel collapsed={menuCollapsed} onAliasChange={setSyncAlias} />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/calculator" />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/sankey" element={<Sankey syncAlias={syncAlias} />} />
            <Route path="/matrix" element={<Matrix />} />
            <Route path="/patrimony" element={<Patrimony syncAlias={syncAlias} />} />
            <Route path="/minigames" element={<MinigamesHub />} />
            <Route path="/minigames/penguin" element={<PenguinGame syncAlias={syncAlias} />} />
            <Route path="/minigames/dolphin" element={<DolphinGame syncAlias={syncAlias} />} />
            <Route path="/event/:id" element={<Event />} />
            {/* <Route path="/minesweeper" element={<Minesweeper />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;