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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer l'ID utilisateur depuis le localStorage
  const getUserId = () => {
    return localStorage.getItem('user_id');
  };

  // Récupérer le rôle de l'utilisateur
  const fetchUserRole = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      
      if (!userId) {
        console.error('❌ Aucun ID utilisateur trouvé dans le localStorage');
        navigate('/login');
        return;
      }

      console.log('🔄 Vérification du rôle pour l\'utilisateur ID:', userId);
      
      const response = await fetch(`http://localhost/app-web/backend/api/get_user_role.php?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 Réponse rôle:', result);

      if (result.success) {
        setUserRole(result.role);
        setUserInfo(result.user_info);
        console.log(`✅ Rôle chargé: ${result.role}`);
      } else {
        console.error('❌ Erreur chargement rôle:', result.message);
        // Rediriger vers le login si erreur
        localStorage.removeItem('user_id');
        navigate('/login');
      }
    } catch (error) {
      console.error('❌ Erreur fetch rôle:', error);
      localStorage.removeItem('user_id');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // Tous les menus disponibles
  const allNavItems = [
    { icon: 'bi-house-fill', label: 'Accueil', path: '/dashboard' },
    { icon: 'bi-file-earmark-plus-fill', label: 'Ajout Infos', path: '/dashboard/ajout' },
    { icon: 'bi-archive-fill', label: 'Mes archives', path: '/dashboard/archives', hasBadge: true },
    { icon: 'bi-file-earmark-text-fill', label: 'Historique connexion', path: '/dashboard/rapports' },
    { icon: 'bi-people-fill', label: 'Utilisateurs', path: '/dashboard/utilisateurs' },
    { icon: 'bi-map-fill', label: 'Exploration régionale', path: '/dashboard/exploration' },
    { icon: 'bi-hdd-rack-fill', label: 'Sites', path: '/dashboard/sites' },
  ];

  // Filtrer les menus selon le rôle
  const getNavItemsByRole = () => {
    if (!userRole) return [];

    switch (userRole) {
      case 'admin':
        return allNavItems;
      
      case 'technicien':
        return allNavItems.filter(item => 
          !['Utilisateurs', 'Historique connexion'].includes(item.label)
        );
      
      case 'observateur':
        return allNavItems.filter(item => 
          ['Accueil', 'Exploration régionale', 'Sites'].includes(item.label)
        );
      
      default:
        return allNavItems.filter(item => 
          ['Accueil', 'Exploration régionale', 'Sites'].includes(item.label)
        );
    }
  };

  const navItems = getNavItemsByRole();

  // Vérifier si l'utilisateur a accès aux paramètres
  const hasSettingsAccess = userRole === 'admin';

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole === 'admin') {
      fetch("http://localhost/app-web/backend/api/list_tables.php")
        .then(res => res.json())
        .then(data => setTables(data.tables || []))
        .catch(console.error);
    }
  }, [userRole]);

  useEffect(() => {
    if (!userRole) return;

    const path = location.pathname;
    if (path.startsWith('/dashboard/setting')) {
      setSelectedMenu('parametres');
      setSettingOpen(true);
    } else {
      const matchedItem = navItems.find(item => item.path === path);
      if (matchedItem) {
        setSelectedMenu(matchedItem.label.toLowerCase());
        setSettingOpen(false);
      } else if (path === '/dashboard') {
        setSelectedMenu('accueil');
        setSettingOpen(false);
      } else {
        setSelectedMenu(null);
        setSettingOpen(false);
      }
    }
  }, [location.pathname, navItems, userRole]);

  // Rediriger si l'utilisateur n'a pas accès à la page actuelle
  useEffect(() => {
    if (!userRole) return;

    const currentPath = location.pathname;
    
    // Vérifier l'accès à la page actuelle
    const hasAccess = navItems.some(item => item.path === currentPath) || 
                     (currentPath.startsWith('/dashboard/setting') && hasSettingsAccess);
    
    if (!hasAccess && currentPath !== '/dashboard') {
      console.warn(`🚫 Accès refusé à ${currentPath} pour le rôle ${userRole}`);
      navigate('/dashboard');
    }
  }, [location.pathname, navItems, hasSettingsAccess, navigate, userRole]);

  const handleLogout = async () => {
    try {
      console.log("Déconnexion en cours...");
      
      // Nettoyer le localStorage
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      
      setUserRole(null);
      setUserInfo(null);
      navigate('/login');
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err);
      // Nettoyer quand même et rediriger
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      setUserRole(null);
      navigate('/login');
    }
  };

  const handleClickMenu = (item) => {
    setSelectedMenu(item.label.toLowerCase());
    setSettingOpen(false);
    navigate(item.path);
    setSidebarOpen(false);
  };

  const handleClickParametres = () => {
    if (hasSettingsAccess) {
      // Toggle simple : si ouvert → fermer, si fermé → ouvrir
      setSettingOpen(!settingOpen);
      setSelectedMenu('parametres');
      setSidebarOpen(false);
      
      // Si on ouvre le sous-menu et qu'on n'est pas déjà sur une page de paramètres, 
      // naviguer vers la première table
      if (!settingOpen && !location.pathname.startsWith('/dashboard/setting') && tables.length > 0) {
        navigate(`/dashboard/setting/${tables[0]}`);
      }
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Déterminer le titre de la page en fonction de l'URL
  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    if (currentItem) {
      return currentItem.label;
    }
    if (location.pathname.startsWith('/dashboard/setting') && hasSettingsAccess) {
      return 'Paramètres';
    }
    return 'Tableau de Bord';
  };

  // Obtenir le badge de rôle pour l'affichage
  const getRoleBadge = () => {
    if (!userRole) return null;

    switch (userRole) {
      case 'admin':
        return <span className="badge bg-danger ms-2">Admin</span>;
      case 'technicien':
        return <span className="badge bg-warning ms-2">Technicien</span>;
      case 'observateur':
        return <span className="badge bg-info ms-2">Observateur</span>;
      default:
        return null;
    }
  };

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3"></div>
          <p>Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Si pas de rôle après chargement, rediriger
  if (!userRole) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-warning mb-3"></div>
          <p>Redirection vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Premium */}
      <div className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <i className="bi bi-geo-fill"></i>
            <span>Couverture360 {getRoleBadge()}</span>
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
                    <span className="badge bg-danger rounded-circle p-1 ms-auto">
                      {newArchiveCount}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Paramètres - seulement pour admin */}
            {hasSettingsAccess && (
              <>
                <div
                  className={`sidebar-item ${selectedMenu === 'parametres' ? 'active' : ''}`}
                  onClick={handleClickParametres}
                >
                  <i className="bi bi-gear-fill icon"></i>
                  <span className="label-text">Paramètres</span>
                  <i className={`bi ms-auto transition-transform ${settingOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                </div>

                {/* Sous-menu animé */}
                <div className={`submenu ${settingOpen ? 'submenu-open' : ''}`}>
                  {tables.length === 0 ? (
                    <div className="sidebar-item text-muted small">
                      <i className="bi bi-hourglass-split icon"></i>
                      <span className="label-text">Chargement...</span>
                    </div>
                  ) : (
                    tables.map((t) => {
                      const path = `/dashboard/setting/${t}`;
                      const active = location.pathname === path;
                      return (
                        <div
                          key={t}
                          className={`sidebar-item submenu-item ${active ? 'active' : ''}`}
                          onClick={() => {
                            navigate(path);
                            setSidebarOpen(false);
                          }}
                        >
                          <i className="bi bi-table icon"></i>
                          <span className="label-text">{t}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlay mobile */}
      <div
        className={`mobile-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Zone Principale */}
      <div className="main-area">
        {/* Topbar Premium */}
        <div className="topbar">
          <div className="topbar-content">
            <div className="page-title-section">
              <h5 className="page-title">{getPageTitle()}</h5>
              {location.pathname === '/dashboard' && (
                <p className="page-subtitle">
                  {userRole === 'admin' && 'Analyse complète du réseau et des déploiements'}
                  {userRole === 'technicien' && 'Interface technique - Gestion des opérations'}
                  {userRole === 'observateur' && 'Consultation des données réseau - Accès limité'}
                </p>
              )}
            </div>
            <div className="topbar-actions">
              {/* Bouton menu mobile */}
              <button
                className="btn btn-outline-premium d-md-none mobile-menu-btn"
                onClick={toggleSidebar}
              >
                <i className="bi bi-list"></i>
              </button>

              {/* Affichage du rôle et infos utilisateur */}
              {userInfo && (
                <div className="role-indicator me-3">
                  <span className="text-muted small">
                    {userInfo.prenom} {userInfo.nom_famille} - 
                  </span>
                  <strong className={`ms-1 text-${userRole === 'admin' ? 'danger' : userRole === 'technicien' ? 'warning' : 'info'}`}>
                    {userRole}
                  </strong>
                </div>
              )}

              {/* Bouton déconnexion */}
              <button 
                className="btn-premium logout-btn"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Déconnexion</span>
              </button>

              {/* Menu profil */}
              <div className="dropdown profile-dropdown">
                <button
                  className="btn dropdown-toggle profile-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <div className="icon-wrapper">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <span className="profile-text">Profil</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <div className="dropdown-header">
                      <small>Connecté en tant que <strong>{userRole}</strong></small>
                      {userInfo && (
                        <div>
                          <small>{userInfo.prenom} {userInfo.nom_famille}</small>
                          <br />
                          <small className="text-muted">{userInfo.email}</small>
                        </div>
                      )}
                    </div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={() => {
                      navigate('/dashboard/exploration');
                      setSidebarOpen(false);
                    }}>
                      <i className="bi bi-compass me-2"></i>
                      Exploration
                    </button>
                  </li>
                  {hasSettingsAccess && (
                    <li>
                      <button className="dropdown-item" onClick={() => {
                        navigate('/dashboard/setting');
                        setSettingOpen(true);
                        setSidebarOpen(false);
                      }}>
                        <i className="bi bi-gear me-2"></i>
                        Paramètres
                      </button>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;