import React, { useState } from 'react';
import { ConsumptionMonitor } from './components/ConsumptionMonitor';
import { OZEDashboard } from './components/OZEDashboard';
import { ESGReports } from './components/ESGReports';
import './App.css';

type Page = 'consumption' | 'oze' | 'esg';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('consumption');

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-container">
          <h1 className="navbar-title">EnergyCity</h1>
          <div className="navbar-menu">
            <button
              className={`nav-btn ${currentPage === 'consumption' ? 'active' : ''}`}
              onClick={() => setCurrentPage('consumption')}
            >
              📊 Monitor Zużycia
            </button>
            <button
              className={`nav-btn ${currentPage === 'oze' ? 'active' : ''}`}
              onClick={() => setCurrentPage('oze')}
            >
              ☀️ Dashboard OZE
            </button>
            <button
              className={`nav-btn ${currentPage === 'esg' ? 'active' : ''}`}
              onClick={() => setCurrentPage('esg')}
            >
              📊 Raporty ESG
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'consumption' && <ConsumptionMonitor />}
        {currentPage === 'oze' && <OZEDashboard />}
        {currentPage === 'esg' && <ESGReports />}
      </main>
    </div>
  );
}

export default App;
