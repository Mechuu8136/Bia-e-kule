import React, { useState, useEffect, useCallback } from 'react';
import {
  announcementService,
  Announcement,
} from '../services/announcementService';
import './AnnouncementManagement.css';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const AnnouncementManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    is_published: true,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await announcementService.getAll();
      setAnnouncements(response.data);
    } catch (err) {
      setError('Nie udało się załadować aktualności');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({ title: '', body: '', is_published: true });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await announcementService.create({
        title: formData.title.trim(),
        body: formData.body.trim(),
        is_published: formData.is_published,
      });
      setSuccess(
        formData.is_published
          ? 'Opublikowano aktualność na panelu gościa'
          : 'Zapisano szkic aktualności (niewidoczny publicznie)',
      );
      resetForm();
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Błąd przy tworzeniu aktualności';
      setError(typeof message === 'string' ? message : 'Błąd przy tworzeniu aktualności');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: Announcement) => {
    if (!window.confirm(`Usunąć aktualność „${item.title}"?`)) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await announcementService.delete(item.id);
      setSuccess('Usunięto aktualność');
      await loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Błąd przy usuwaniu aktualności';
      setError(typeof message === 'string' ? message : 'Błąd przy usuwaniu aktualności');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="announcement-management" role="status" aria-live="polite">
        <div className="loading">Ładowanie aktualności...</div>
      </div>
    );
  }

  return (
    <div className="announcement-management">
      <header className="announcement-management-header">
        <h1>📢 Zarządzanie aktualnościami</h1>
        <p>Publikuj ogłoszenia widoczne na panelu gościa gminy</p>
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

      <div className="info-banner" role="status">
        Opublikowane aktualności pojawiają się na stronie startowej dla niezalogowanych
        użytkowników. Szkice są widoczne tylko w tym panelu.
      </div>

      <div className="announcement-management-actions">
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
          {showForm ? '✕ Anuluj' : '+ Nowa aktualność'}
        </button>
      </div>

      {showForm && (
        <section className="announcement-form-card" aria-labelledby="create-announcement-heading">
          <h2 id="create-announcement-heading">Nowa aktualność</h2>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <label htmlFor="announcement-title">Tytuł</label>
              <input
                id="announcement-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={200}
                aria-required="true"
              />
            </div>

            <div className="form-row">
              <label htmlFor="announcement-body">Treść</label>
              <textarea
                id="announcement-body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                required
                rows={5}
                aria-required="true"
              />
            </div>

            <div className="form-row form-row-checkbox">
              <label htmlFor="announcement-published">
                <input
                  id="announcement-published"
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) =>
                    setFormData({ ...formData, is_published: e.target.checked })
                  }
                />
                Opublikuj na panelu gościa
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Zapisywanie...' : 'Zapisz aktualność'}
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

      <section className="announcements-table-card" aria-labelledby="announcements-list-heading">
        <h2 id="announcements-list-heading">Lista aktualności ({announcements.length})</h2>

        {announcements.length === 0 ? (
          <div className="empty-state">Brak aktualności w systemie.</div>
        ) : (
          <div className="announcements-admin-list">
            {announcements.map((item) => (
              <article key={item.id} className="announcement-admin-card">
                <div className="announcement-admin-card-header">
                  <h3>{item.title}</h3>
                  <span
                    className={`status-badge ${item.is_published ? 'status-published' : 'status-draft'}`}
                  >
                    {item.is_published ? 'Opublikowana' : 'Szkic'}
                  </span>
                </div>
                <time className="announcement-admin-date" dateTime={item.published_at}>
                  {formatDate(item.published_at)}
                </time>
                <p className="announcement-admin-body">{item.body}</p>
                <div className="announcement-admin-actions">
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={submitting}
                    onClick={() => handleDelete(item)}
                  >
                    Usuń
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
