import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

// Configuration Axios
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? 'http://localhost/app-web/backend/api'
    : '/api',
  headers: { 'Content-Type': 'application/json' }
});

const Sites = () => {
  // États pour les données
  const [sites, setSites] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const [typeSites, setTypeSites] = useState([]);
  const [trimestres, setTrimestres] = useState([]);
  const [localite, setLocalite] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [departements, setDepartements] = useState([]);
  
  // États pour l'interface
  const [currentView, setCurrentView] = useState("liste");
  const [loading, setLoading] = useState(false);

  // États pour les filtres - CORRECTION: initialisation avec null au lieu de ""
  const [filters, setFilters] = useState({
    region: null,
    province: null,
    departement: null,
    localite: null,
    operateur: null,
    technologie: null
  });

  // États pour les formulaires
  const [formData, setFormData] = useState({
    nom_site: "",
    latitude_site: "",
    longitude_site: "",
    id_localite: "",
    id_operateur: "",
    id_type_site: "",
    annee_site: "",
    id_trimestre: "",
  });

  const [importData, setImportData] = useState({
    id_operateur: "",
    id_type_site: "",
    annee_site: "",
    id_trimestre: "",
  });

  const [importFile, setImportFile] = useState(null);

  // Gestion des erreurs
  const handleApiError = (error) => {
    console.error("Erreur API:", error);
    alert(`Une erreur est survenue : ${error.response?.data?.message || error.message}`);
  };

  // Fonctions utilitaires pour la hiérarchie géographique
  const getDepartementFromLocalite = useCallback((locId) => {
    if (!locId) return null;
    const loc = localite.find(l => l.id_localite == locId);
    return loc ? loc.id_departement : null;
  }, [localite]);

  const getProvinceFromDepartement = useCallback((depId) => {
    if (!depId) return null;
    // Relation directe : département → province (pas besoin de passer par les localités)
    const dep = departements.find(d => d.id_departement == depId);
    return dep ? dep.id_province : null;
  }, [departements]);

  const getRegionFromProvince = useCallback((provId) => {
    if (!provId) return null;
    const prov = provinces.find(p => p.id_province == provId);
    return prov ? prov.id_region : null;
  }, [provinces]);

  const getProvinceFromLocalite = useCallback((locId) => {
    const depId = getDepartementFromLocalite(locId);
    return depId ? getProvinceFromDepartement(depId) : null;
  }, [getDepartementFromLocalite, getProvinceFromDepartement]);

  const getRegionFromLocalite = useCallback((locId) => {
    const provId = getProvinceFromLocalite(locId);
    return provId ? getRegionFromProvince(provId) : null;
  }, [getProvinceFromLocalite, getRegionFromProvince]);

  const getRegionFromDepartement = useCallback((depId) => {
    if (!depId) return null;
    // Relation directe : département → province → région
    const dep = departements.find(d => d.id_departement == depId);
    if (!dep) return null;
    
    const prov = provinces.find(p => p.id_province == dep.id_province);
    return prov ? prov.id_region : null;
  }, [departements, provinces]);

  // FONCTION PRINCIPALE DE MISE À JOUR DES FILTRES
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  // === AJOUT DES FONCTIONS DE FILTRAGE ===
  const getFilteredProvinces = useCallback(() => {
    // Province doit toujours afficher toutes les provinces
    return provinces;
  }, [provinces]);

  const getFilteredDepartements = useCallback(() => {
    // Département doit toujours afficher tous les départements
    return departements;
  }, [departements]);

  const getFilteredLocalites = useCallback(() => {
    // Toujours afficher toutes les localités pour permettre la sélection libre
    return localite;
  }, [localite]);

  // Gestionnaires d'événements pour les filtres hiérarchiques
  const handleLocaliteChange = useCallback((e) => {
    const value = e.target.value || null;
    
    if (value) {
      const depId = getDepartementFromLocalite(value);
      const provId = getProvinceFromLocalite(value);
      const regId = getRegionFromLocalite(value);
      
      updateFilters({
        localite: value,
        departement: depId,
        province: provId,
        region: regId
      });
    } else {
      updateFilters({
        localite: null,
        departement: null,
        province: null,
        region: null
      });
    }
  }, [getDepartementFromLocalite, getProvinceFromLocalite, getRegionFromLocalite, updateFilters]);

  const handleDepartementChange = useCallback((e) => {
    const value = e.target.value || null;
    
    if (value) {
      const provId = getProvinceFromDepartement(value);
      const regId = getRegionFromDepartement(value);
      
      updateFilters({
        departement: value,
        province: provId,
        region: regId,
        // Ne pas réinitialiser la localité pour permettre le filtrage
        // localite: null
      });
    } else {
      updateFilters({
        departement: null,
        province: null,
        region: null,
        localite: null
      });
    }
  }, [getProvinceFromDepartement, getRegionFromDepartement, updateFilters]);

  const handleProvinceChange = useCallback((e) => {
    const value = e.target.value || null;
    
    if (value) {
      const regId = getRegionFromProvince(value);
      
      updateFilters({
        province: value,
        region: regId,
        // Ne pas réinitialiser les niveaux inférieurs pour permettre le filtrage
        // departement: null,
        // localite: null
      });
    } else {
      updateFilters({
        province: null,
        region: null,
        departement: null,
        localite: null
      });
    }
  }, [getRegionFromProvince, updateFilters]);

  const handleRegionChange = useCallback((e) => {
    const value = e.target.value || null;
    
    if (value) {
    updateFilters({
      region: value,
        // Ne pas réinitialiser les niveaux inférieurs pour permettre le filtrage
        // province: null,
        // departement: null,
        // localite: null
      });
    } else {
      updateFilters({
        region: null,
        province: null,
      departement: null,
      localite: null
    });
    }
  }, [updateFilters]);

  const handleOperateurToggle = useCallback((operatorId) => {
    updateFilters({
      operateur: filters.operateur === operatorId ? null : operatorId
    });
  }, [filters.operateur, updateFilters]);

  const handleTechnologieToggle = useCallback((techId) => {
    updateFilters({
      technologie: filters.technologie === techId ? null : techId
    });
  }, [filters.technologie, updateFilters]);

  const resetFilters = useCallback(() => {
    setFilters({
      region: null,
      province: null,
      departement: null,
      localite: null,
      operateur: null,
      technologie: null
    });
  }, []);

  // Application des filtres
  const applyFilters = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      
      // Hiérarchie géographique - un seul niveau actif
      if (filters.localite) {
        params.id_localite = parseInt(filters.localite);
      } else if (filters.departement) {
        params.id_departement = parseInt(filters.departement);
      } else if (filters.province) {
        params.id_province = parseInt(filters.province);
      } else if (filters.region) {
        params.id_region = parseInt(filters.region);
      }
      
      // Filtres additionnels
      if (filters.operateur) {
        params.id_operateur = parseInt(filters.operateur);
      }
      if (filters.technologie) {
        params.id_type_site = parseInt(filters.technologie);
      }
      
      const res = await api.get('getSitesByFilters.php', { params });
      setSites(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      handleApiError(error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Chargement initial des données
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const responses = await Promise.allSettled([
          api.get('getSites.php'),
          api.get('getOperateurs.php'),
          api.get('getTypeSites.php'),
          api.get('getTrimestres.php'),
          api.get('getLocalites.php'),
          api.get('regions.php'),
          api.get('provinces.php'),
          api.get('departements.php'),
        ]);

        const [sitesRes, opRes, typeRes, triRes, locRes, regRes, provRes, depRes] = responses;
        
        setSites(sitesRes.status === 'fulfilled' && Array.isArray(sitesRes.value.data) ? sitesRes.value.data : []);
        setOperateurs(opRes.status === 'fulfilled' ? opRes.value.data : []);
        setTypeSites(typeRes.status === 'fulfilled' ? typeRes.value.data : []);
        setTrimestres(triRes.status === 'fulfilled' ? triRes.value.data : []);
        setLocalite(locRes.status === 'fulfilled' ? locRes.value.data : []);
        setRegions(regRes.status === 'fulfilled' ? regRes.value.data : []);
        setProvinces(provRes.status === 'fulfilled' ? provRes.value.data : []);
        setDepartements(depRes.status === 'fulfilled' ? depRes.value.data : []);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Application des filtres avec debounce
  useEffect(() => {
    const hasActiveFilter = Object.values(filters).some(value => value !== null);
    
    if (hasActiveFilter) {
      const timeoutId = setTimeout(() => {
        applyFilters();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Recharger tous les sites si aucun filtre actif
      const fetchAllSites = async () => {
        setLoading(true);
        try {
          const response = await api.get('getSites.php');
          setSites(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          handleApiError(error);
          setSites([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAllSites();
    }
  }, [filters, applyFilters]);

  // Gestion des formulaires
  const handleFormChange = useCallback((e) => {
    setFormData(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("ajouter_site.php", formData);
      alert("Site ajouté avec succès !");
      
      // Reset formulaire
      setFormData({
        nom_site: "", 
        latitude_site: "", 
        longitude_site: "", 
        id_localite: "",
        id_operateur: "", 
        id_type_site: "", 
        annee_site: "", 
        id_trimestre: ""
      });
      
      setCurrentView("liste");
      
      // Recharger les sites
      const hasActiveFilter = Object.values(filters).some(value => value !== null);
      if (hasActiveFilter) {
        applyFilters();
      } else {
        const response = await api.get('getSites.php');
        setSites(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportChange = useCallback((e) => {
    setImportData(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
  }, []);

  const handleImportFileChange = useCallback((e) => {
    setImportFile(e.target.files[0]);
  }, []);

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert("Veuillez sélectionner un fichier Excel.");
      return;
    }
    
    const formData = new FormData();
    Object.entries(importData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", importFile);
    
    setLoading(true);
    try {
      await api.post("importer_sites.php", formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      alert("Importation réussie !");
      
      setCurrentView("liste");
      setImportFile(null);
      setImportData({ 
        id_operateur: "", 
        id_type_site: "", 
        annee_site: "", 
        id_trimestre: "" 
      });
      
      // Recharger les sites
      const hasActiveFilter = Object.values(filters).some(value => value !== null);
      if (hasActiveFilter) {
        applyFilters();
      } else {
        const response = await api.get('getSites.php');
        setSites(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires pour l'affichage
  const getFilterSummary = () => {
    const parts = [];
    
    if (filters.localite) {
      const local = localite.find(l => l.id_localite == filters.localite);
      if (local) parts.push(`📍 ${local.nom_localite} (Localité)`);
    } else if (filters.departement) {
      const dep = departements.find(d => d.id_departement == filters.departement);
      if (dep) parts.push(`📍 ${dep.nom_departement} (Département)`);
    } else if (filters.province) {
      const prov = provinces.find(p => p.id_province == filters.province);
      if (prov) parts.push(`📍 ${prov.nom_province} (Province)`);
    } else if (filters.region) {
      const reg = regions.find(r => r.id_region == filters.region);
      if (reg) parts.push(`📍 ${reg.nom_region} (Région)`);
    }
    
    if (filters.technologie) {
      const tech = typeSites.find(t => t.id_type_site == filters.technologie);
      if (tech) parts.push(`📶 ${tech.libelle_type}`);
    }
    
    if (filters.operateur) {
      const op = operateurs.find(o => o.id_operateur == filters.operateur);
      if (op) parts.push(`🔧 ${op.nom_operateur}`);
    }
    
    return parts.length > 0 ? parts : null;
  };

  const getAnalysis = () => {
    if (!Array.isArray(sites) || sites.length === 0) return null;
    
    const opMap = new Set();
    const techMap = {};
    
    sites.forEach(s => {
      if (s.id_operateur) opMap.add(s.id_operateur);
      
      const techLabel = typeSites.find(t => t.id_type_site === s.id_type_site)?.libelle_type || "Inconnu";
      techMap[techLabel] = (techMap[techLabel] || 0) + 1;
    });
    
    const opNames = Array.from(opMap)
      .map(id => operateurs.find(o => o.id_operateur === id)?.nom_operateur)
      .filter(Boolean)
      .join(", ");
    
    const techList = Object.entries(techMap)
      .map(([tech, count]) => `${tech} (${count})`)
      .join(", ");
    
    return { 
      count: sites.length, 
      operators: opNames || "Aucun", 
      technologies: techList || "Aucune" 
    };
  };

  const summary = getFilterSummary();
  const analysis = getAnalysis();

  return (
    <div className="sites-container p-3 p-md-4">
      {/* Overlay de chargement */}
      {loading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "20px 30px",
            borderRadius: "12px",
            textAlign: "center"
          }}>
            <div className="spinner-border text-light" role="status"></div>
            <p style={{ margin: "10px 0 0 0" }}>Chargement...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            backgroundColor: "#f9fafb"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                backgroundColor: "#4f46e5",
                color: "white",
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem"
              }}>
                <i className="bi bi-building"></i>
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#111827"
                }}>
                  Gestion des Sites
                </h2>
                <p style={{
                  margin: "4px 0 0 0",
                  fontSize: "0.875rem",
                  color: "#6b7280"
                }}>
                  Analyse et suivi des infrastructures télécom
                </p>
              </div>
            </div>
            <div style={{
              backgroundColor: "#f3f4f6",
              borderRadius: "9999px",
              padding: "8px 16px",
              fontSize: "0.9rem",
              fontWeight: "500",
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <i className="bi bi-grid" style={{ color: "#4f46e5" }}></i>
              <span>{sites.length} sites</span>
            </div>
          </div>
          
          {/* Navigation */}
          <div style={{
            display: "flex",
            padding: "0",
            backgroundColor: "white"
          }}>
            {[
              { view: "liste", icon: "list-ul", label: "Liste" },
              { view: "ajout", icon: "plus-circle", label: "Ajouter" },
              { view: "import", icon: "file-earmark-excel", label: "Importer" }
            ].map(({ view, icon, label }) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  border: "none",
                  backgroundColor: currentView === view ? "#4f46e5" : "transparent",
                  color: currentView === view ? "white" : "#4b5563",
                  fontSize: "0.95rem",
                  fontWeight: currentView === view ? "600" : "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <i className={`bi bi-${icon}`}></i>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vue Liste */}
      {currentView === "liste" && (
        <>
          {/* Section Filtres */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            marginBottom: "24px",
            overflow: "hidden"
          }}>
            <div style={{ padding: "24px" }}>
              <h5 style={{
                marginBottom: "20px",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#111827",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <i className="bi bi-funnel"></i>
                Filtres
              </h5>
              
              {/* Filtres géographiques */}
              <div className="d-flex flex-wrap gap-3 mb-4 align-items-end">
                 {/* Région - toujours toutes les régions */}
                 <div style={{ minWidth: "140px" }}>
                    <label style={{
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      color: "#111827",
                      marginBottom: "6px",
                      display: "block"
                    }}>
                     Région
                    </label>
                    <select
                      className="form-select form-select-sm"
                     value={filters.region || ""}
                     onChange={handleRegionChange}
                      disabled={loading}
                    >
                      <option value="">Toutes</option>
                     {regions.map(opt => (
                       <option key={opt.id_region} value={opt.id_region}>
                         {opt.nom_region}
                        </option>
                      ))}
                    </select>
                  </div>

                 {/* Province - filtrée par région sélectionnée */}
                 <div style={{ minWidth: "140px" }}>
                   <label style={{
                     fontWeight: "bold",
                     fontSize: "0.95rem",
                     color: "#111827",
                     marginBottom: "6px",
                     display: "block"
                   }}>
                     Province
                   </label>
                   <select
                     className="form-select form-select-sm"
                     value={filters.province || ""}
                     onChange={handleProvinceChange}
                     disabled={loading}
                   >
                     <option value="">Toutes</option>
                     {getFilteredProvinces().map(opt => (
                       <option key={opt.id_province} value={opt.id_province}>
                         {opt.nom_province}
                       </option>
                     ))}
                   </select>
                 </div>

                 {/* Département - filtré par province sélectionnée */}
                 <div style={{ minWidth: "140px" }}>
                   <label style={{
                     fontWeight: "bold",
                     fontSize: "0.95rem",
                     color: "#111827",
                     marginBottom: "6px",
                     display: "block"
                   }}>
                     Département
                   </label>
                   <select
                     className="form-select form-select-sm"
                     value={filters.departement || ""}
                     onChange={handleDepartementChange}
                     disabled={loading}
                   >
                     <option value="">Toutes</option>
                     {getFilteredDepartements().map(opt => (
                       <option key={opt.id_departement} value={opt.id_departement}>
                         {opt.nom_departement}
                       </option>
                     ))}
                   </select>
                 </div>

                 {/* Localité - filtrée par département sélectionné */}
                 <div style={{ minWidth: "140px" }}>
                   <label style={{
                     fontWeight: "bold",
                     fontSize: "0.95rem",
                     color: "#111827",
                     marginBottom: "6px",
                     display: "block"
                   }}>
                     Localité
                   </label>
                   <select
                     className="form-select form-select-sm"
                     value={filters.localite || ""}
                     onChange={handleLocaliteChange}
                     disabled={loading}
                   >
                     <option value="">Toutes</option>
                     {getFilteredLocalites().map(opt => (
                       <option key={opt.id_localite} value={opt.id_localite}>
                         {opt.nom_localite}
                       </option>
                     ))}
                   </select>
                 </div>
              </div>

              {/* Filtres technologie */}
              <div className="mb-4">
                <label style={{
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  color: "#111827",
                  display: "block",
                  marginBottom: "10px"
                }}>
                  Technologie
                </label>
                <div className="d-flex flex-wrap gap-3">
                  {typeSites.map(t => {
                    const isActive = filters.technologie == t.id_type_site;
                    return (
                      <div key={t.id_type_site} className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: "0.9rem", color: "#4b5563", minWidth: "50px" }}>
                          {t.libelle_type}
                        </span>
                        <button
                          onClick={() => handleTechnologieToggle(t.id_type_site)}
                          disabled={loading}
                          style={{
                            width: "50px",
                            height: "24px",
                            borderRadius: "12px",
                            backgroundColor: isActive ? "#10b981" : "#d1d5db",
                            border: "none",
                            position: "relative",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                          }}
                        >
                          <span style={{
                            position: "absolute",
                            top: "2px",
                            left: isActive ? "26px" : "2px",
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: "white",
                            transition: "left 0.2s",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                          }}></span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filtres opérateur */}
              <div className="mb-4">
                <label style={{
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  color: "#111827",
                  display: "block",
                  marginBottom: "10px"
                }}>
                  Opérateur
                </label>
                <div className="d-flex flex-wrap gap-3">
                  {operateurs.map(o => {
                    const isActive = filters.operateur == o.id_operateur;
                    return (
                      <div key={o.id_operateur} className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: "0.9rem", color: "#4b5563", minWidth: "70px" }}>
                          {o.nom_operateur}
                        </span>
                        <button
                          onClick={() => handleOperateurToggle(o.id_operateur)}
                          disabled={loading}
                          style={{
                            width: "50px",
                            height: "24px",
                            borderRadius: "12px",
                            backgroundColor: isActive ? "#3b82f6" : "#d1d5db",
                            border: "none",
                            position: "relative",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                          }}
                        >
                          <span style={{
                            position: "absolute",
                            top: "2px",
                            left: isActive ? "26px" : "2px",
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: "white",
                            transition: "left 0.2s",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                          }}></span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Résumé et analyse */}
              {(summary || analysis) && (
                <div style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "16px",
                  fontSize: "0.95rem",
                  color: "#1e293b",
                  marginTop: "16px"
                }}>
                  {summary && (
                    <div style={{ marginBottom: "8px" }}>
                      {summary.map((line, i) => (
                        <div key={i} style={{ marginBottom: "4px" }}>{line}</div>
                      ))}
                    </div>
                  )}
                  {analysis && (
                    <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "8px", marginTop: "8px" }}>
                      <strong>📊 {analysis.count} site{analysis.count > 1 ? "s" : ""}</strong><br />
                      <strong>🔧 Opérateurs :</strong> {analysis.operators}<br />
                      <strong>📶 Technologies :</strong> {analysis.technologies}
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn btn-outline-secondary btn-sm mt-3"
                onClick={resetFilters}
                disabled={loading}
                style={{ padding: "8px 16px" }}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>Réinitialiser
              </button>
            </div>
          </div>

          {/* Tableau des sites */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            overflow: "hidden"
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0",
                fontSize: "0.875rem"
              }}>
                <thead style={{ backgroundColor: "#f9fafb" }}>
                  <tr>
                    <th style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#4b5563",
                      borderBottom: "2px solid #e5e7eb"
                    }}>Nom</th>
                    <th style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#4b5563",
                      borderBottom: "2px solid #e5e7eb"
                    }}>Coordonnées</th>
                    <th style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#4b5563",
                      borderBottom: "2px solid #e5e7eb"
                    }}>Localité</th>
                    <th style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#4b5563",
                      borderBottom: "2px solid #e5e7eb"
                    }}>Opérateur</th>
                    <th style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#4b5563",
                      borderBottom: "2px solid #e5e7eb"
                    }}>Type</th>
                    <th style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#4b5563",
                      borderBottom: "2px solid #e5e7eb"
                    }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.length > 0 ? (
                    sites.map((s) => (
                      <tr key={s.id_site} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{
                          padding: "12px 16px",
                          fontWeight: "500",
                          color: "#111827"
                        }}>
                          <strong>{s.nom_site || 'N/A'}</strong>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#4b5563" }}>
                          <div><i className="bi bi-geo-alt text-primary me-1"></i>{s.latitude_site || '-'}</div>
                          <div><i className="bi bi-geo-alt text-primary me-1"></i>{s.longitude_site || '-'}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#4b5563" }}>{s.nom_localite || 'N/A'}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: "500"
                          }}>
                            {s.nom_operateur}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            backgroundColor: "#f3f4f6",
                            color: "#4b5563",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "0.8rem"
                          }}>
                            {s.libelle_type}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#4b5563" }}>{s.annee_site} - {s.libelle_trimestre}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{
                        textAlign: "center",
                        padding: "40px 16px",
                        color: "#9ca3af",
                        fontSize: "1rem"
                      }}>
                        <i className="bi bi-inbox" style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}></i>
                        Aucun site trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Vue Ajout */}
      {currentView === "ajout" && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          marginBottom: "24px",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "20px 24px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb"
          }}>
            <h3 style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#111827"
            }}>
              <i className="bi bi-plus-circle me-2"></i>Ajouter un site
            </h3>
          </div>
          <div style={{ padding: "24px" }}>
            <form onSubmit={handleFormSubmit} style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Nom du site *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nom_site"
                    value={formData.nom_site}
                    onChange={handleFormChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Localité *</label>
                  <select
                    className="form-select"
                    name="id_localite"
                    value={formData.id_localite}
                    onChange={handleFormChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  >
                    <option value="">Sélectionner</option>
                                         {localite.map(l => (
                      <option key={l.id_localite} value={l.id_localite}>{l.nom_localite}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Latitude *</label>
                  <input
                    type="number"
                    step="0.00000001"
                    className="form-control"
                    name="latitude_site"
                    value={formData.latitude_site}
                    onChange={handleFormChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Longitude *</label>
                  <input
                    type="number"
                    step="0.00000001"
                    className="form-control"
                    name="longitude_site"
                    value={formData.longitude_site}
                    onChange={handleFormChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Opérateur *</label>
                  <select
                    className="form-select"
                    name="id_operateur"
                    value={formData.id_operateur}
                    onChange={handleFormChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  >
                    <option value="">Sélectionner</option>
                    {operateurs.map(o => (
                      <option key={o.id_operateur} value={o.id_operateur}>{o.nom_operateur}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Type de site *</label>
                  <select
                    className="form-select"
                    name="id_type_site"
                    value={formData.id_type_site}
                    onChange={handleFormChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  >
                    <option value="">Sélectionner</option>
                    {typeSites.map(t => (
                      <option key={t.id_type_site} value={t.id_type_site}>{t.libelle_type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Année *</label>
                  <input
                    type="text"
                    pattern="\d{4}"
                    className="form-control"
                    name="annee_site"
                    value={formData.annee_site}
                    onChange={handleFormChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Trimestre *</label>
                  <select
                    className="form-select"
                    name="id_trimestre"
                    value={formData.id_trimestre}
                    onChange={handleFormChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  >
                    <option value="">Sélectionner</option>
                    {trimestres.map(t => (
                      <option key={t.id_trimestre} value={t.id_trimestre}>{t.libelle_trimestre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "end", marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentView("liste")}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "none" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading}
                  style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#10b981", border: "none", color: "white" }}
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vue Import */}
      {currentView === "import" && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          marginBottom: "24px",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "20px 24px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb"
          }}>
            <h3 style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#111827"
            }}>
              <i className="bi bi-file-earmark-excel me-2"></i>Importer des sites
            </h3>
          </div>
          <div style={{ padding: "24px" }}>
            <div style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "0.9rem",
              color: "#065f46",
              marginBottom: "20px"
            }}>
              <i className="bi bi-info-circle me-2"></i>
              Format requis : <code>Nom_localite, Nom_site, Longitude_site,Latitude_site</code>
            </div>
            <form onSubmit={handleImportSubmit} style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Opérateur *</label>
                  <select
                    className="form-select"
                    name="id_operateur"
                    value={importData.id_operateur}
                    onChange={handleImportChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  >
                    <option value="">Choisir</option>
                    {operateurs.map(o => (
                      <option key={o.id_operateur} value={o.id_operateur}>{o.nom_operateur}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Type de site *</label>
                  <select
                    className="form-select"
                    name="id_type_site"
                    value={importData.id_type_site}
                    onChange={handleImportChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  >
                    <option value="">Choisir</option>
                    {typeSites.map(t => (
                      <option key={t.id_type_site} value={t.id_type_site}>{t.libelle_type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Année *</label>
                  <input
                    type="text"
                    pattern="\d{4}"
                    className="form-control"
                    name="annee_site"
                    value={importData.annee_site}
                    onChange={handleImportChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Trimestre *</label>
                  <select
                    className="form-select"
                    name="id_trimestre"
                    value={importData.id_trimestre}
                    onChange={handleImportChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  >
                    <option value="">Choisir</option>
                    {trimestres.map(t => (
                      <option key={t.id_trimestre} value={t.id_trimestre}>{t.libelle_trimestre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#111827",
                  marginBottom: "6px"
                }}>Fichier Excel *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="form-control"
                  onChange={handleImportFileChange}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "end", marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentView("liste")}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "none" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-info text-white"
                  disabled={loading}
                  style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#007bff", border: "none" }}
                >
                  {loading ? "Import en cours..." : "Importer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sites;