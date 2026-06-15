import React, { useState, useEffect } from 'react';
import { ConsumptionMonitor } from './components/ConsumptionMonitor';
import { OZEDashboard } from './components/OZEDashboard';
import { ESGReports } from './components/ESGReports';
import { UserManagement } from './components/UserManagement';
import { AnnouncementManagement } from './components/AnnouncementManagement';
import { ApiKeyManagement } from './components/ApiKeyManagement';
import { MyBuildingsDirector } from './components/MyBuildingsDirector';
import { MyBuildingsResident } from './components/MyBuildingsResident';
import { GuestPanel } from './components/GuestPanel';
import { Login } from './components/Login';
import { SetupWizard } from './components/SetupWizard';
import { MunicipalitySettingsPanel } from './components/MunicipalitySettingsPanel';
import { municipalityService } from './services/municipalityService';
import { getRoleLabel } from './utils/roleLabels';
import './App.css';

type Page = 'my-buildings' | 'consumption' | 'oze' | 'esg' | 'users' | 'announcements' | 'api-keys' | 'settings';

const defaultPageForRole = (role: string): Page => {
  if (role === 'mieszkaniec' || role === 'dyrektor') return 'my-buildings';
  return 'consumption';
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('consumption');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const setupRes = await municipalityService.getSetupStatus();
        setNeedsSetup(setupRes.data.needs_setup);
      } catch {
        setNeedsSetup(false);
      }

      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      if (token) {
        setIsLoggedIn(true);
        if (role) {
          setUserRole(role);
          setCurrentPage(defaultPageForRole(role));
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSetupComplete = (result: {
    access_token: string;
    role: string;
  }) => {
    localStorage.setItem('token', result.access_token);
    localStorage.setItem('role', result.role);
    setNeedsSetup(false);
    setIsLoggedIn(true);
    setUserRole(result.role);
    setCurrentPage('settings');
  };

  const handleLoginSuccess = (_token: string, role: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentPage(defaultPageForRole(role));
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setUserRole('');
    setShowLogin(false);
  };

  if (loading) return <div className="loading">Ładowanie...</div>;

  if (needsSetup) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  if (!isLoggedIn) {
    return (
      <>
        <GuestPanel onLoginClick={() => setShowLogin(true)} />
        {showLogin && (
          <Login
            asModal
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </>
    );
  }

  const isUrzędnik = userRole === 'urzednik';
  const isDyrektor = userRole === 'dyrektor';
  const isMieszkaniec = userRole === 'mieszkaniec';
  const technicalMode = isDyrektor || isUrzędnik;

  const navButton = (page: Page, label: string) => (
    <button
      key={page}
      className={`nav-btn ${currentPage === page ? 'active' : ''}`}
      onClick={() => setCurrentPage(page)}
      aria-current={currentPage === page ? 'page' : undefined}
    >
      {label}
    </button>
  );

  return (
    <div className="App">
      <nav className="navbar" role="navigation" aria-label="Główna nawigacja">
        <div className="navbar-container">
          <h1 className="navbar-title">
            EnergyCity
            <span className="navbar-role" aria-label={`Zalogowany jako: ${getRoleLabel(userRole)}`}>
              ({getRoleLabel(userRole)})
            </span>
          </h1>
          <div className="navbar-menu">
            {(isDyrektor || isMieszkaniec) && navButton('my-buildings', '🏢 Moje budynki')}
            {(isUrzędnik || isDyrektor) && navButton('consumption', '📊 Monitor Zużycia')}
            {(isUrzędnik || isDyrektor) && navButton('oze', '☀️ Dashboard OZE')}
            {(isUrzędnik || isDyrektor || isMieszkaniec) && navButton('esg', '📊 Raporty ESG')}
            {isUrzędnik && navButton('users', '👥 Użytkownicy')}
            {isUrzędnik && navButton('announcements', '📢 Aktualności')}
            {isUrzędnik && navButton('api-keys', '🔑 Klucze API')}
            {isUrzędnik && navButton('settings', '⚙️ Konfiguracja')}
            <button className="nav-btn btn-logout" onClick={handleLogout} aria-label="Wyloguj się">
              🚪 Wyloguj
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content" role="main">
        {currentPage === 'my-buildings' && isDyrektor && <MyBuildingsDirector />}
        {currentPage === 'my-buildings' && isMieszkaniec && <MyBuildingsResident />}
        {currentPage === 'consumption' && (isUrzędnik || isDyrektor) && (
          <ConsumptionMonitor userRole={userRole} technicalMode={technicalMode} />
        )}
        {currentPage === 'oze' && (isUrzędnik || isDyrektor) && (
          <OZEDashboard userRole={userRole} />
        )}
        {currentPage === 'esg' && <ESGReports userRole={userRole} />}
        {currentPage === 'users' && isUrzędnik && <UserManagement />}
        {currentPage === 'announcements' && isUrzędnik && <AnnouncementManagement />}
        {currentPage === 'api-keys' && isUrzędnik && <ApiKeyManagement />}
        {currentPage === 'settings' && isUrzędnik && <MunicipalitySettingsPanel />}
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>
          &copy; 2026 EnergyCity — {getRoleLabel(userRole)}
        </p>
      </footer>
    </div>
  );
}

export default App;
