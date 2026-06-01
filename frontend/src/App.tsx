import React, { useState, useEffect } from 'react';
import { ConsumptionMonitor } from './components/ConsumptionMonitor';
import { OZEDashboard } from './components/OZEDashboard';
import { ESGReports } from './components/ESGReports';
import { Login } from './components/Login';
import './App.css';

type Page = 'consumption' | 'oze' | 'esg';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('consumption');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (token: string, role: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setUserRole('');
  };

  if (loading) return <div className="loading">Ładowanie...</div>;

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <nav className="navbar" role="navigation" aria-label="Główna nawigacja">
        <div className="navbar-container">
          <h1 className="navbar-title">
            EnergyCity
            <span className="navbar-role" aria-label={`Zalogowany jako: ${userRole}`}>
              ({userRole})
            </span>
          </h1>
          <div className="navbar-menu">
            <button
              className={`nav-btn ${currentPage === 'consumption' ? 'active' : ''}`}
              onClick={() => setCurrentPage('consumption')}
              aria-current={currentPage === 'consumption' ? 'page' : undefined}
            >
              📊 Monitor Zużycia
            </button>
            <button
              className={`nav-btn ${currentPage === 'oze' ? 'active' : ''}`}
              onClick={() => setCurrentPage('oze')}
              aria-current={currentPage === 'oze' ? 'page' : undefined}
            >
              ☀️ Dashboard OZE
            </button>
            <button
              className={`nav-btn ${currentPage === 'esg' ? 'active' : ''}`}
              onClick={() => setCurrentPage('esg')}
              aria-current={currentPage === 'esg' ? 'page' : undefined}
            >
              📊 Raporty ESG
            </button>
            <button className="nav-btn btn-logout" onClick={handleLogout} aria-label="Wyloguj się">
              🚪 Wyloguj
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content" role="main">
        {currentPage === 'consumption' && <ConsumptionMonitor />}
        {currentPage === 'oze' && <OZEDashboard />}
        {currentPage === 'esg' && <ESGReports />}
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>
          &copy; 2026 EnergyCity - System monitoringu energii i OZE. Dostępny dla roli: {userRole}
        </p>
      </footer>
    </div>
  );
}

export default App;
