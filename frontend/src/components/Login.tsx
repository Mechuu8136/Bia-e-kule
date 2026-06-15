import React, { useState } from 'react';
import apiClient from '../services/api';
import './Login.css';

interface LoginProps {
  onLoginSuccess: (token: string, role: string) => void;
  asModal?: boolean;
  onClose?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, asModal = false, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const response = await apiClient.post<{ access_token: string; role: string }>(
        '/auth/login',
        { email, password }
      );

      const { access_token, role } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      onLoginSuccess(access_token, role);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd logowania');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className={`login-card ${asModal ? 'login-card-modal' : ''}`}>
      {asModal && (
        <button
          type="button"
          className="login-close-btn"
          onClick={onClose}
          aria-label="Zamknij okno logowania"
        >
          ✕
        </button>
      )}
      <h1 id={asModal ? 'login-dialog-title' : undefined}>EnergyCity</h1>
      <p>System monitoringu energii i OZE</p>

      <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-message" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj@email.com"
              required
              disabled={loading}
              aria-required="true"
              aria-describedby={error ? 'error-message' : undefined}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              aria-required="true"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-login" aria-busy={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <p className="login-footer">
          <small>
            Skonfiguruj gminę przy pierwszym uruchomieniu lub zaloguj się kontem
            administratora.
          </small>
        </p>
      </div>
  );

  if (asModal) {
    return (
      <div
        className="login-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-dialog-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div className="login-container login-container-modal">{formContent}</div>
      </div>
    );
  }

  return <div className="login-container">{formContent}</div>;
};
