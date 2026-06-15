import React, { useState, useEffect, useCallback } from 'react';
import {
  apiKeyService,
  ApiKeyListItem,
  ApiKeyScope,
} from '../services/apiKeyService';
import { buildingService, Building } from '../services/buildingService';
import './ApiKeyManagement.css';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const scopeLabel = (scope: ApiKeyScope): string =>
  scope === 'organization' ? 'Cała gmina' : 'Pojedynczy budynek';

export const ApiKeyManagement: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyListItem[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    scope: 'organization' as ApiKeyScope,
    building_id: '',
    rate_limit_per_minute: 100,
  });

  const buildingNameMap = useCallback(
    (buildingId: string) => {
      const building = buildings.find((b) => b.id === buildingId);
      return building ? building.name : buildingId;
    },
    [buildings],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [keysRes, buildingsRes] = await Promise.all([
        apiKeyService.getAll(),
        buildingService.getAllBuildings(),
      ]);
      setKeys(keysRes.data);
      setBuildings(buildingsRes.data);
    } catch (err) {
      setError('Nie udało się załadować kluczy API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      name: '',
      scope: 'organization',
      building_id: '',
      rate_limit_per_minute: 100,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setNewRawKey(null);

    try {
      if (formData.scope === 'building' && !formData.building_id) {
        setError('Wybierz budynek dla klucza o zakresie budynku');
        return;
      }

      const response = await apiKeyService.create({
        name: formData.name.trim(),
        scope: formData.scope,
        building_id:
          formData.scope === 'building' ? formData.building_id : undefined,
        rate_limit_per_minute: formData.rate_limit_per_minute,
      });

      setNewRawKey(response.data.raw_key);
      setSuccess('Utworzono klucz API — skopiuj go teraz, nie będzie ponownie widoczny');
      resetForm();
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Błąd przy tworzeniu klucza API';
      setError(typeof message === 'string' ? message : 'Błąd przy tworzeniu klucza API');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyKey = async () => {
    if (!newRawKey) return;
    try {
      await navigator.clipboard.writeText(newRawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Nie udało się skopiować klucza — skopiuj ręcznie');
    }
  };

  const handleDelete = async (key: ApiKeyListItem) => {
    if (!window.confirm(`Usunąć klucz „${key.name}" (${key.key_prefix}…)?`)) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiKeyService.delete(key.id);
      setSuccess('Usunięto klucz API');
      await loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Błąd przy usuwaniu klucza';
      setError(typeof message === 'string' ? message : 'Błąd przy usuwaniu klucza');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="api-key-management" role="status" aria-live="polite">
        <div className="loading">Ładowanie kluczy API...</div>
      </div>
    );
  }

  return (
    <div className="api-key-management">
      <header className="api-key-management-header">
        <h1>🔑 Klucze API</h1>
        <p>Zarządzanie dostępem systemów zewnętrznych do ingestion API</p>
      </header>

      {error && (
        <div className="error-banner" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {success && (
        <div className="success-banner" role="status" aria-live="polite">
          {success}
        </div>
      )}

      {newRawKey && (
        <div className="raw-key-banner" role="alert">
          <p>
            <strong>Nowy klucz API — zapisz go w bezpiecznym miejscu:</strong>
          </p>
          <code className="raw-key-value" aria-label="Wartość klucza API">
            {newRawKey}
          </code>
          <div className="raw-key-actions">
            <button type="button" className="btn-primary" onClick={handleCopyKey}>
              {copied ? 'Skopiowano!' : 'Kopiuj klucz'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setNewRawKey(null)}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      <div className="info-banner" role="status">
        Klucze służą do wysyłania odczytów liczników i produkcji OZE przez nagłówek{' '}
        <code>X-API-KEY</code>. Endpointy: <code>/api/external/meter-readings</code> i{' '}
        <code>/api/external/solar-production</code>.
      </div>

      <div className="api-key-management-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setError(null);
            setSuccess(null);
          }}
          aria-expanded={showForm}
        >
          {showForm ? '✕ Anuluj' : '+ Nowy klucz API'}
        </button>
      </div>

      {showForm && (
        <section className="api-key-form-card" aria-labelledby="create-api-key-heading">
          <h2 id="create-api-key-heading">Nowy klucz API</h2>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <label htmlFor="api-key-name">Nazwa (np. system miejski)</label>
              <input
                id="api-key-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                minLength={2}
                aria-required="true"
              />
            </div>

            <div className="form-row">
              <label htmlFor="api-key-scope">Zakres dostępu</label>
              <select
                id="api-key-scope"
                value={formData.scope}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scope: e.target.value as ApiKeyScope,
                    building_id: '',
                  })
                }
              >
                <option value="organization">Cała gmina (organization)</option>
                <option value="building">Pojedynczy budynek (building)</option>
              </select>
            </div>

            {formData.scope === 'building' && (
              <div className="form-row">
                <label htmlFor="api-key-building">Budynek</label>
                <select
                  id="api-key-building"
                  value={formData.building_id}
                  onChange={(e) =>
                    setFormData({ ...formData, building_id: e.target.value })
                  }
                  required
                  aria-required="true"
                >
                  <option value="">— wybierz budynek —</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-row">
              <label htmlFor="api-key-rate">Limit zapytań / min</label>
              <input
                id="api-key-rate"
                type="number"
                min={1}
                max={1000}
                value={formData.rate_limit_per_minute}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rate_limit_per_minute: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Tworzenie...' : 'Wygeneruj klucz'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Anuluj
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="api-keys-table-card" aria-labelledby="api-keys-list-heading">
        <h2 id="api-keys-list-heading">Aktywne klucze ({keys.length})</h2>

        {keys.length === 0 ? (
          <div className="empty-state">Brak kluczy API w systemie.</div>
        ) : (
          <table className="api-keys-table">
            <thead>
              <tr>
                <th scope="col">Nazwa</th>
                <th scope="col">Prefiks</th>
                <th scope="col">Zakres</th>
                <th scope="col">Limit/min</th>
                <th scope="col">Ostatnie użycie</th>
                <th scope="col">Utworzono</th>
                <th scope="col">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td>
                    <code>{key.key_prefix}…</code>
                  </td>
                  <td>
                    {scopeLabel(key.scope)}
                    {key.building_id && (
                      <span className="building-hint">
                        {' '}
                        — {buildingNameMap(key.building_id)}
                      </span>
                    )}
                  </td>
                  <td>{key.rate_limit_per_minute}</td>
                  <td>
                    {key.last_used_at ? formatDate(key.last_used_at) : 'Nigdy'}
                  </td>
                  <td>{formatDate(key.created_at)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-danger"
                      disabled={submitting}
                      onClick={() => handleDelete(key)}
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
