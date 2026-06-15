import React, { useState } from 'react';
import {
  municipalityService,
  InitialSetupResult,
} from '../services/municipalityService';
import './SetupWizard.css';

interface SetupWizardProps {
  onComplete: (result: InitialSetupResult) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [municipalityName, setMunicipalityName] = useState('');
  const [tagline, setTagline] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<InitialSetupResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (adminPassword !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    setSubmitting(true);
    try {
      const response = await municipalityService.initialSetup({
        municipality_name: municipalityName.trim(),
        tagline: tagline.trim() || undefined,
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
      });
      setApiKey(response.data.api_key);
      setCompletedResult(response.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Nie udało się ukończyć konfiguracji';
      setError(typeof message === 'string' ? message : 'Nie udało się ukończyć konfiguracji');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="setup-wizard-page">
      <div className="setup-wizard-card">
        <header className="setup-wizard-header">
          <h1>EnergyCity</h1>
          <p>Pierwsza konfiguracja — spersonalizuj aplikację pod swoją gminę</p>
        </header>

        <p className="setup-intro">
          Aplikacja startuje jako czysta karta. Podaj nazwę jednostki i utwórz konto
          administratora. Dane pomiarowe dostarczysz później przez API integracyjne
          (np. symulator testowy).
        </p>

        {error && (
          <div className="setup-error" role="alert">
            {error}
          </div>
        )}

        {apiKey ? (
          <div className="setup-api-key" role="status">
            <p>
              <strong>Konfiguracja zakończona.</strong> Zapisz klucz integracji API —
              nie będzie ponownie widoczny:
            </p>
            <code>{apiKey}</code>
            <p className="setup-hint">
              Użyj go w symulatorze gminy (np. <em>Symulator Gminy Biskupice</em>) do
              wysyłania danych testowych.
            </p>
            {completedResult && (
              <button
                type="button"
                className="btn-setup"
                onClick={() => onComplete(completedResult)}
              >
                Wejdź do panelu administratora
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="setup-form">
            <div className="form-row">
              <label htmlFor="municipality-name">Nazwa gminy / jednostki</label>
              <input
                id="municipality-name"
                type="text"
                value={municipalityName}
                onChange={(e) => setMunicipalityName(e.target.value)}
                placeholder="np. Gmina Biskupice"
                required
                minLength={2}
              />
            </div>

            <div className="form-row">
              <label htmlFor="tagline">Opis na panelu publicznym (opcjonalnie)</label>
              <input
                id="tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Monitoring energii i jakości środowiska"
              />
            </div>

            <div className="form-row">
              <label htmlFor="admin-email">E-mail administratora</label>
              <input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="admin-password">Hasło administratora</label>
              <input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-row">
              <label htmlFor="admin-password-confirm">Powtórz hasło</label>
              <input
                id="admin-password-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-setup" disabled={submitting}>
              {submitting ? 'Konfigurowanie...' : 'Zakończ konfigurację'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
