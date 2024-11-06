import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink, Navigate } from 'react-router-dom';
import Calculator from './apps/calculator/App';
import Sankey from './apps/sankey/App';
import Matrix from './apps/matrix/App';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav>
            <ul>
              <li><NavLink to="/tools/calculator" activeClassName="active">Calculator</NavLink></li>
              <li><NavLink to="/tools/sankey" activeClassName="active">Sankey</NavLink></li>
              <li><NavLink to="/tools/matrix" activeClassName="active">Eisenhower Matrix</NavLink></li>
              {/* Add more menu items here */}
            </ul>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/tools" element={<Navigate to="/tools/calculator" />} />
            <Route path="/" element={<Navigate to="/tools/calculator" />} />
            <Route path="/tools/calculator" element={<Calculator />} />
            <Route path="/tools/sankey" element={<Sankey />} />
            <Route path="/tools/matrix" element={<Matrix />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;