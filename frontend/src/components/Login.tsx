import React, { useState } from 'react';
import apiClient from '../services/api';
import './Login.css';

interface LoginProps {
  onLoginSuccess: (token: string, role: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
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

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>EnergyCity</h1>
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
            Do celów testowych użyj:
            <br />
            Admin: admin@example.com / password
            <br />
            Dyrektor: dyrektor@example.com / password
          </small>
        </p>
      </div>
    </div>
  );
};
