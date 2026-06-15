import React, { useState, useEffect, useCallback } from 'react';
import {
  userService,
  UserListItem,
  UserRole,
} from '../services/userService';
import { buildingService, Building } from '../services/buildingService';
import { getRoleLabel, getBuildingTypeLabel } from '../utils/roleLabels';
import './UserManagement.css';

const ASSIGNABLE_ROLES: UserRole[] = ['dyrektor', 'mieszkaniec'];

const roleBadgeClass = (role: string): string => {
  const map: Record<string, string> = {
    urzednik: 'role-badge-urzednik',
    dyrektor: 'role-badge-dyrektor',
    mieszkaniec: 'role-badge-mieszkaniec',
    gosc: 'role-badge-gosc',
  };
  return `role-badge ${map[role] ?? 'role-badge-gosc'}`;
};

const supportsAdminBuildingAssignment = (role: string): boolean => role === 'dyrektor';

interface BuildingCheckboxListProps {
  buildings: Building[];
  selectedIds: string[];
  onChange: (updater: (prev: string[]) => string[]) => void;
  idPrefix: string;
}

const BuildingCheckboxList: React.FC<BuildingCheckboxListProps> = ({
  buildings,
  selectedIds,
  onChange,
  idPrefix,
}) => {
  if (buildings.length === 0) {
    return <p className="form-hint">Brak budynków w systemie.</p>;
  }

  return (
    <div className="building-checkboxes" role="group" aria-label="Wybór budynków">
      {buildings.map((building) => {
        const inputId = `${idPrefix}-${building.id}`;
        const isChecked = selectedIds.includes(building.id);

        return (
          <label key={building.id} className="building-checkbox-label">
            <input
              type="checkbox"
              id={inputId}
              checked={isChecked}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange((prev) => {
                  if (checked) {
                    return prev.includes(building.id)
                      ? prev
                      : [...prev, building.id];
                  }
                  return prev.filter((id) => id !== building.id);
                });
              }}
            />
            <span className="building-checkbox-text">
              <strong>{building.name}</strong>
              <span>
                {getBuildingTypeLabel(building.type)} — {building.address}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
};

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editBuildingIds, setEditBuildingIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'dyrektor' as UserRole,
    building_ids: [] as string[],
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
      const [usersRes, buildingsRes] = await Promise.all([
        userService.getAllUsers(),
        buildingService.getAllBuildings(),
      ]);
      setUsers(usersRes.data);
      setBuildings(buildingsRes.data);
    } catch (err) {
      setError('Nie udało się załadować danych użytkowników');
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
      email: '',
      password: '',
      role: 'dyrektor',
      building_ids: [],
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (supportsAdminBuildingAssignment(formData.role) && formData.building_ids.length === 0) {
        setError('Wybierz co najmniej jeden budynek dla wybranej roli');
        return;
      }

      await userService.createUser({
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        building_ids: supportsAdminBuildingAssignment(formData.role)
          ? formData.building_ids
          : undefined,
      });

      setSuccess(`Utworzono konto: ${formData.email}`);
      resetForm();
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Błąd przy tworzeniu użytkownika';
      setError(typeof message === 'string' ? message : 'Błąd przy tworzeniu użytkownika');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingBuildings = (user: UserListItem) => {
    setEditingUserId(user.id);
    setEditBuildingIds([...user.building_ids]);
    setError(null);
    setSuccess(null);
  };

  const cancelEditingBuildings = () => {
    setEditingUserId(null);
    setEditBuildingIds([]);
  };

  const handleDeleteUser = async (user: UserListItem) => {
    if (user.role === 'urzednik') return;
    if (!window.confirm(`Usunąć konto ${user.email}?`)) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await userService.deleteUser(user.id);
      setSuccess(`Usunięto konto: ${user.email}`);
      if (editingUserId === user.id) cancelEditingBuildings();
      await loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Błąd przy usuwaniu użytkownika';
      setError(typeof message === 'string' ? message : 'Błąd przy usuwaniu użytkownika');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBuildings = async (userId: string) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editBuildingIds.length === 0) {
        setError('Wybierz co najmniej jeden budynek');
        return;
      }

      await userService.updateUserBuildings(userId, editBuildingIds);
      setSuccess('Zaktualizowano przypisanie budynków');
      setEditingUserId(null);
      setEditBuildingIds([]);
      await loadData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Błąd przy aktualizacji budynków';
      setError(typeof message === 'string' ? message : 'Błąd przy aktualizacji budynków');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="user-management" role="status" aria-live="polite">
        <div className="loading">Ładowanie panelu administracyjnego...</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <header className="user-management-header">
        <h1>👥 Zarządzanie użytkownikami</h1>
        <p>Tworzenie kont i przypisywanie dostępu do budynków</p>
        <p className="user-management-role-info">
          Zalogowano jako: <strong>{getRoleLabel('urzednik')}</strong>
        </p>
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

      <div className="access-scope-banner" role="status">
        Jako urzędnik gminy tworzysz konta dyrektorów (z przypisaniem budynków) i mieszkańców
        (samodzielnie wybierają ulubione budynki). Możesz edytować przypisania dyrektorów i usuwać konta.
      </div>

      <div className="user-management-actions">
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
          {showForm ? '✕ Anuluj' : '+ Nowy użytkownik'}
        </button>
      </div>

      {showForm && (
        <section className="user-form-card" aria-labelledby="create-user-heading">
          <h2 id="create-user-heading">Nowe konto użytkownika</h2>
          <form onSubmit={handleCreateUser}>
            <div className="form-row">
              <label htmlFor="user-email">Adres e-mail</label>
              <input
                id="user-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="off"
                aria-required="true"
              />
            </div>

            <div className="form-row">
              <label htmlFor="user-password">Hasło</label>
              <input
                id="user-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
                aria-required="true"
              />
              <p className="form-hint">Minimum 6 znaków</p>
            </div>

            <div className="form-row">
              <label htmlFor="user-role">Rola</label>
              <select
                id="user-role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as UserRole,
                    building_ids: [],
                  })
                }
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role)}
                  </option>
                ))}
              </select>
              {formData.role === 'mieszkaniec' && (
                <p className="form-hint">
                  Mieszkaniec sam wybiera budynki do obserwacji w zakładce „Moje budynki”.
                </p>
              )}
            </div>

            {supportsAdminBuildingAssignment(formData.role) && (
              <div className="form-row">
                <label>Przypisane budynki</label>
                <BuildingCheckboxList
                  buildings={buildings}
                  selectedIds={formData.building_ids}
                  onChange={(updater) =>
                    setFormData((prev) => ({
                      ...prev,
                      building_ids: updater(prev.building_ids),
                    }))
                  }
                  idPrefix="create"
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Tworzenie...' : 'Utwórz konto'}
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

      <section className="users-table-card" aria-labelledby="users-list-heading">
        <h2 id="users-list-heading">Lista użytkowników ({users.length})</h2>

        {users.length === 0 ? (
          <div className="empty-state">Brak użytkowników w systemie.</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th scope="col">E-mail</th>
                <th scope="col">Rola</th>
                <th scope="col">Przypisane budynki</th>
                <th scope="col">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <span className={roleBadgeClass(user.role)}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    {user.building_ids.length > 0 ? (
                      <div className="building-tags">
                        {user.building_ids.map((id) => (
                          <span key={id} className="building-tag">
                            {buildingNameMap(id)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-buildings">Brak przypisania</span>
                    )}

                    {editingUserId === user.id && (
                      <div className="edit-buildings-panel">
                        <h3>Edytuj budynki — {user.email}</h3>
                        <BuildingCheckboxList
                          buildings={buildings}
                          selectedIds={editBuildingIds}
                          onChange={(updater) => setEditBuildingIds(updater)}
                          idPrefix={`edit-${user.id}`}
                        />
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={submitting}
                            onClick={() => handleSaveBuildings(user.id)}
                          >
                            {submitting ? 'Zapisywanie...' : 'Zapisz'}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={cancelEditingBuildings}
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {supportsAdminBuildingAssignment(user.role) && editingUserId !== user.id && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => startEditingBuildings(user)}
                      >
                        Edytuj budynki
                      </button>
                    )}
                    {user.role !== 'urzednik' && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleDeleteUser(user)}
                        style={{ marginLeft: 8, color: '#c62828', borderColor: '#ef9a9a' }}
                      >
                        Usuń
                      </button>
                    )}
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
