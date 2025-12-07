// src/pages/Rapport.js (version sans colonne Statut)
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Rapport.css';

const Rapport = ({ currentUser }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    admins: 0
  });

  const fetchLogs = () => {
    setLoading(true);
    axios.get("http://localhost/app-web/backend/api/rapports.php")
      .then(res => {
        console.log("Logs reçus :", res.data);
        if (Array.isArray(res.data)) {
          setLogs(res.data);
          calculateStats(res.data);
        } else {
          setLogs([]);
          setStats({ total: 0, actifs: 0, admins: 0 });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLogs([]);
        setLoading(false);
      });
  };

  const calculateStats = (logsData) => {
    const total = logsData.length;
    const actifs = logsData.filter(log => !log.heure_deconnexion).length;
    const admins = logsData.filter(log => log.role === 'admin').length;

    setStats({ total, actifs, admins });
  };

  useEffect(() => {
    fetchLogs();

    if (currentUser?.id_utilisateur) {
      axios.post("http://localhost/app-web/backend/api/rapport_connexion.php", { userId: currentUser.id_utilisateur })
        .then(() => fetchLogs())
        .catch(err => console.error(err));
    }

    const handleUnload = () => {
      if (currentUser?.id_utilisateur) {
        navigator.sendBeacon(
          "http://localhost/app-web/backend/api/rapport_deconnexion.php",
          JSON.stringify({ userId: currentUser.id_utilisateur })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [currentUser]);

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { class: 'role-admin', icon: 'bi-shield-check', label: 'Admin' },
      user: { class: 'role-user', icon: 'bi-person', label: 'Utilisateur' },
      viewer: { class: 'role-viewer', icon: 'bi-eye', label: 'Observateur' }
    };

    const config = roleConfig[role] || roleConfig.user;

    return (
      <span className={`role-badge ${config.class}`}>
        <i className={`bi ${config.icon}`}></i>
        {config.label}
      </span>
    );
  };

  return (
    <div className="rapport-container">
      {/* Header */}
      <div className="rapport-header">
        <div className="rapport-header-top">
          <div className="rapport-title-container">
            <div className="rapport-title-icon">
              <i className="bi bi-file-earmark-text-fill"></i>
            </div>
            <div className="rapport-title-text">
              <h2>Journal des Connexions</h2>
              <p>Historique des activités des utilisateurs</p>
            </div>
          </div>
          <div className="rapport-actions">
            <button 
              className="btn-refresh"
              onClick={fetchLogs}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Connexions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon online">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.actifs}</div>
            <div className="stat-label">Utilisateurs Actifs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon admins">
            <i className="bi bi-shield-check"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-label">Administrateurs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon duration">
            <i className="bi bi-clock-history"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{logs.length > 0 ? '24h' : '0'}</div>
            <div className="stat-label">Période</div>
          </div>
        </div>
      </div>

      {/* Tableau des logs */}
      <div className="rapport-card">
        <div className="rapport-card-header">
          <h3>
            <i className="bi bi-list-ul"></i>
            Historique des Connexions ({logs.length})
          </h3>
          <div className="rapport-filters">
            <span className="filter-info">
              <i className="bi bi-info-circle"></i>
              Dernières 24 heures
            </span>
          </div>
        </div>

        <div className="rapport-card-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement des données...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-file-earmark-x"></i>
              </div>
              <h3>Aucune donnée disponible</h3>
              <p>Aucune activité de connexion n'a été enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="rapport-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Utilisateur</th>
                    <th>Fonction</th>
                    <th>Rôle</th>
                    <th>Connexion</th>
                    <th>Déconnexion</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id} className={!log.heure_deconnexion ? 'row-active' : ''}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {log.prenom.charAt(0)}{log.nom_famille.charAt(0)}
                          </div>
                          <div className="user-details">
                            <strong>{log.prenom} {log.nom_famille}</strong>
                            <span className="user-email">{log.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{log.fonction}</td>
                      <td>{getRoleBadge(log.role)}</td>
                      <td>
                        <div className="datetime-cell">
                          <i className="bi bi-box-arrow-in-right me-1"></i>
                          {formatDateTime(log.heure_connexion)}
                        </div>
                      </td>
                      <td>
                        <div className="datetime-cell">
                          <i className="bi bi-box-arrow-right me-1"></i>
                          {log.heure_deconnexion ? formatDateTime(log.heure_deconnexion) : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="rapport-footer">
        <div className="rapport-info">
          <i className="bi bi-info-circle"></i>
          <span>Les données sont mises à jour automatiquement toutes les 5 minutes</span>
        </div>
      </div>
    </div>
  );
};

export default Rapport;