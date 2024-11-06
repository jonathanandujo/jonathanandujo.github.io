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
              <li><NavLink to="/calculator" activeClassName="active">Calculator</NavLink></li>
              <li><NavLink to="/sankey" activeClassName="active">Sankey</NavLink></li>
              <li><NavLink to="/matrix" activeClassName="active">Eisenhower Matrix</NavLink></li>
              {/* Add more menu items here */}
            </ul>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/calculator" />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/sankey" element={<Sankey />} />
            <Route path="/matrix" element={<Matrix />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;