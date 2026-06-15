import React, { useState, useEffect, useCallback } from 'react';
import {
  municipalityService,
  MunicipalitySettings,
} from '../services/municipalityService';
import './MunicipalitySettings.css';

export const MunicipalitySettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<MunicipalitySettings | null>(null);
  const [formData, setFormData] = useState({
    municipality_name: '',
    tagline: '',
    air_quality_station_name: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await municipalityService.getSettings();
      setSettings(response.data);
      setFormData({
        municipality_name: response.data.municipality_name,
        tagline: response.data.tagline,
        air_quality_station_name: response.data.air_quality_station_name,
      });
    } catch (err) {
      setError('Nie udało się załadować ustawień gminy');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await municipalityService.updateSettings({
        municipality_name: formData.municipality_name.trim(),
        tagline: formData.tagline.trim(),
        air_quality_station_name: formData.air_quality_station_name.trim(),
      });
      setSettings(response.data);
      setSuccess('Zapisano ustawienia gminy');
    } catch (err) {
      setError('Błąd przy zapisywaniu ustawień');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="municipality-settings" role="status">
        Ładowanie ustawień...
      </div>
    );
  }

  return (
    <div className="municipality-settings">
      <header className="municipality-settings-header">
        <h1>⚙️ Konfiguracja gminy</h1>
        <p>Personalizacja panelu publicznego i opisów systemu</p>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {success && <div className="success-banner" role="status">{success}</div>}

      <form className="municipality-settings-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="ms-name">Nazwa gminy / jednostki</label>
          <input
            id="ms-name"
            type="text"
            value={formData.municipality_name}
            onChange={(e) =>
              setFormData({ ...formData, municipality_name: e.target.value })
            }
            required
            minLength={2}
          />
        </div>

        <div className="form-row">
          <label htmlFor="ms-tagline">Opis na panelu publicznym</label>
          <input
            id="ms-tagline"
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            placeholder="Monitoring energii i jakości środowiska"
          />
        </div>

        <div className="form-row">
          <label htmlFor="ms-station">Nazwa stacji jakości powietrza</label>
          <input
            id="ms-station"
            type="text"
            value={formData.air_quality_station_name}
            onChange={(e) =>
              setFormData({ ...formData, air_quality_station_name: e.target.value })
            }
            required
          />
        </div>

        <p className="form-hint">
          Status: {settings?.is_configured ? 'skonfigurowana' : 'wymaga uzupełnienia'}
        </p>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </button>
      </form>
    </div>
  );
};
