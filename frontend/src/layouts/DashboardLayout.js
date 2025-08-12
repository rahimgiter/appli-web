import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Dashboard.css';

function DashboardLayout() {
  const [newArchiveCount, setNewArchiveCount] = useState(0);
  const [tables, setTables] = useState([]);
  const [settingOpen, setSettingOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('accueil');

  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: 'bi-house-fill', label: 'Accueil', path: '/dashboard' },
    { icon: 'bi-file-earmark-plus-fill', label: 'Ajout Infos', path: '/dashboard/ajout' },
    { icon: 'bi-archive-fill', label: 'Mes archives', path: '/dashboard/archives', hasBadge: true },
    { icon: 'bi-file-earmark-text-fill', label: 'Historique connexion', path: '/dashboard/rapports' },
    { icon: 'bi-people-fill', label: 'Utilisateurs', path: '/dashboard/utilisateurs' },
    { icon: 'bi-map-fill', label: 'Exploration régionale', path: '/dashboard/exploration' },
    { icon: 'bi-hdd-rack-fill', label: 'Sites', path: '/dashboard/sites' },
  ];

  useEffect(() => {
    fetch("http://localhost/app-web/backend/api/list_tables.php")
      .then(res => res.json())
      .then(data => setTables(data.tables || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/dashboard/setting')) {
      setSelectedMenu('parametres');
      setSettingOpen(true);
    } else {
      const matchedItem = navItems.find(item => item.path === path);
      if (matchedItem) {
        setSelectedMenu(matchedItem.label.toLowerCase());
        setSettingOpen(false);
      } else {
        setSelectedMenu(null);
        setSettingOpen(false);
      }
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost/app-web/backend/logout.php", { withCredentials: true });
      navigate('/');
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err);
    }
  };

  const handleClickMenu = (item) => {
    setSelectedMenu(item.label.toLowerCase());
    setSettingOpen(false);
    navigate(item.path);
  };

  const handleClickParametres = () => {
    setSettingOpen(!settingOpen);
    setSelectedMenu('parametres');
  };

  return (
    <div className="d-flex dashboard-wrapper">
      <div className="sidebar">
        <div className="sidebar-inner d-flex flex-column h-100">

          <div className="sidebar-header d-flex align-items-center justify-content-center py-3">
            <i className="bi bi-geo-fill text-white me-2 fs-5"></i>
            <span className="fw-bold text-white fs-6">Couverture360</span>
          </div>

          <div className="sidebar-content flex-grow-1">
            {navItems.map((item) => {
              const isActive = selectedMenu === item.label.toLowerCase();
              return (
                <div
                  key={item.label}
                  className={`sidebar-item small-text ${isActive ? 'active' : ''}`}
                  onClick={() => handleClickMenu(item)}
                  style={{ position: 'relative' }}
                >
                  <i className={`bi ${item.icon} icon`}></i>
                  <span className="label-text">{item.label}</span>
                  {item.hasBadge && newArchiveCount > 0 && (
                    <span className="badge bg-danger text-white rounded-circle position-absolute top-0 end-0 translate-middle p-1 small">
                      {newArchiveCount}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Paramètres */}
            <div
              className={`sidebar-item small-text parametres-item ${selectedMenu === 'parametres' ? 'selected-parent' : ''}`}
              onClick={handleClickParametres}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <i className="bi bi-gear-fill icon"></i>
              <span className="label-text">Paramètres</span>
              <i
                className={`bi ms-auto transition-icon ${settingOpen ? 'bi-caret-down-fill' : 'bi-caret-right-fill'}`}
                style={{ fontSize: '1rem' }}
              />
            </div>

            {/* Sous-menu paramètres */}
            <div className={`submenu ${settingOpen ? 'submenu-open' : ''}`}>
              {tables.length === 0 && (
                <div className="text-muted small">Chargement...</div>
              )}
              {tables.map((t) => {
                const path = `/dashboard/setting/${t}`;
                const active = location.pathname === path;
                return (
                  <div
                    key={t}
                    className={`sidebar-item small-text submenu-item ${active ? 'active' : ''}`}
                    onClick={() => navigate(path)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-table icon"></i>
                    <span className="label-text">{t}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOOTER SUPPRIMÉ */}

        </div>
      </div>

      <div className="main-area d-flex flex-column flex-grow-1">
        <div className="topbar d-flex justify-content-between align-items-center px-4 py-2">
          <h5 className="m-0 fw-bold text-white">Bienvenu(e)</h5>
          <div className="d-flex align-items-center gap-3">
            {/* Bouton Déconnexion déplacé ici */}
            <button
              className="btn text-white position-relative"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right fs-5"></i>
            </button>

            <div className="dropdown">
              <button
                className="btn text-white dropdown-toggle d-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle fs-4"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <span className="dropdown-item" onClick={() => navigate('/dashboard/exploration')}>
                    Exploration
                  </span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <span className="dropdown-item text-danger" onClick={handleLogout}>
                    Déconnexion
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="content-wrapper p-3 bg-light flex-grow-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
