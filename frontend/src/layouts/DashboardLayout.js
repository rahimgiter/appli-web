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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Pour mobile

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
      console.log("Déconnexion en cours...");
      
      // Récupérer l'ID de connexion depuis le localStorage ou la session
      const idConnexion = localStorage.getItem('id_connexion') || sessionStorage.getItem('id_connexion');
      console.log("ID connexion récupéré:", idConnexion);
      
      let url = "http://localhost/app-web/backend/logout.php";
      if (idConnexion) {
        url += `?id_connexion=${idConnexion}`;
        console.log("URL de déconnexion:", url);
      } else {
        console.log("Aucun ID connexion trouvé dans le stockage");
      }
      
      const response = await axios.get(url, { withCredentials: true });
      console.log("Réponse de déconnexion:", response.data);
      
      // Nettoyer le stockage local
      localStorage.removeItem('id_connexion');
      sessionStorage.removeItem('id_connexion');
      
      navigate('/');
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err);
      console.error("Détails de l'erreur:", err.response?.data);
    }
  };

  const handleClickMenu = (item) => {
    setSelectedMenu(item.label.toLowerCase());
    setSettingOpen(false);
    navigate(item.path);
    setSidebarOpen(false); // Fermer sidebar mobile
  };

  const handleClickParametres = () => {
    setSettingOpen(!settingOpen);
    setSelectedMenu('parametres');
  };

  // Toggle sidebar sur mobile
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <i className="bi bi-geo-fill fs-4"></i>
            <span>Couverture360</span>
          </div>

          <div className="sidebar-content">
            {navItems.map((item) => {
              const isActive = selectedMenu === item.label.toLowerCase();
              return (
                <div
                  key={item.label}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleClickMenu(item)}
                >
                  <i className={`bi ${item.icon} icon`}></i>
                  <span className="label-text">{item.label}</span>
                  {item.hasBadge && newArchiveCount > 0 && (
                    <span className="badge bg-danger text-white rounded-circle p-1 ms-auto small">
                      {newArchiveCount}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Paramètres */}
            <div
              className={`sidebar-item parametres-item ${selectedMenu === 'parametres' ? 'selected-parent' : ''}`}
              onClick={handleClickParametres}
            >
              <i className="bi bi-gear-fill icon"></i>
              <span className="label-text">Paramètres</span>
              <i className={`bi ms-auto ${settingOpen ? 'bi-caret-down-fill' : 'bi-caret-right-fill'}`} />
            </div>

            {/* Sous-menu */}
            <div className={`submenu ${settingOpen ? 'submenu-open' : ''}`}>
              {tables.length === 0 ? (
                <div className="text-muted small px-2">Chargement...</div>
              ) : (
                tables.map((t) => {
                  const path = `/dashboard/setting/${t}`;
                  const active = location.pathname === path;
                  return (
                    <div
                      key={t}
                      className={`sidebar-item submenu-item ${active ? 'active' : ''}`}
                      onClick={() => navigate(path)}
                    >
                      <i className="bi bi-table icon"></i>
                      <span className="label-text">{t}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay mobile */}
      <div
        className={`mobile-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main Area */}
      <div className="main-area">
        <div className="topbar">
          <h5>Bienvenu(e)</h5>
          <div className="d-flex align-items-center gap-2">
            {/* Hamburger pour mobile */}
            <button
              className="btn d-md-none text-primary"
              onClick={toggleSidebar}
            >
              <i className="bi bi-list fs-4"></i>
            </button>

            {/* Déconnexion */}
            <button className="btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right fs-5"></i>
            </button>

            {/* Profil */}
            <div className="dropdown">
              <button
                className="btn dropdown-toggle d-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle fs-4 text-primary"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button className="dropdown-item" onClick={() => navigate('/dashboard/exploration')}>
                    Exploration
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default DashboardLayout;