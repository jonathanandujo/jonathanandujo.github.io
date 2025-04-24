import React from 'react';
import { HashRouter as Router, Route, Routes, NavLink, Navigate } from 'react-router-dom';
import Calculator from './apps/calculator/App';
import Sankey from './apps/sankey/App';
import Matrix from './apps/matrix/App';
import Event from './apps/event/App';
// import Minesweeper from './apps/minesweeper/Minesweeper';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav>
            <ul>
              <li><NavLink to="/calculator" >Calculator</NavLink></li>
              <li><NavLink to="/sankey" >Sankey</NavLink></li>
              <li><NavLink to="/matrix" >Eisenhower Matrix</NavLink></li>
              {/* <li><NavLink to="/minesweeper" >Minesweeper</NavLink></li> */}
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
            <Route path="/event/:id" element={<Event />} />
            {/* <Route path="/minesweeper" element={<Minesweeper />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;