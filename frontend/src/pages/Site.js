import React, { useEffect, useState } from "react";
import axios from "axios";

// Configuration Axios
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? 'http://localhost/app-web/backend/api'
    : '/api',
  headers: { 'Content-Type': 'application/json' }
});

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const [typeSites, setTypeSites] = useState([]);
  const [trimestres, setTrimestres] = useState([]);
  const [localites, setLocalites] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [currentView, setCurrentView] = useState("liste");
  const [loading, setLoading] = useState(false);

  // Filtres
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDepartement, setSelectedDepartement] = useState("");
  const [selectedLocalite, setSelectedLocalite] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedTech, setSelectedTech] = useState("");

  // Formulaires
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
    alert(`❌ Une erreur est survenue : ${error.response?.data?.message || error.message}`);
  };

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
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

        setSites(sitesRes.status === 'fulfilled' ? sitesRes.value.data : []);
        setOperateurs(opRes.status === 'fulfilled' ? opRes.value.data : []);
        setTypeSites(typeRes.status === 'fulfilled' ? typeRes.value.data : []);
        setTrimestres(triRes.status === 'fulfilled' ? triRes.value.data : []);
        setLocalites(locRes.status === 'fulfilled' ? locRes.value.data : []);
        setRegions(regRes.status === 'fulfilled' ? regRes.value.data : []);
        setProvinces(provRes.status === 'fulfilled' ? provRes.value.data : []);
        setDepartements(depRes.status === 'fulfilled' ? depRes.value.data : []);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // === Fonction principale de filtrage ===
  const applyFilters = async () => {
    setLoading(true);

    // Déterminer la localisation la plus précise
    let geoFilter = {};
    if (selectedLocalite) {
      geoFilter.type = 'localite';
      geoFilter.value = selectedLocalite;
    } else if (selectedDepartement) {
      geoFilter.type = 'departement';
      geoFilter.value = selectedDepartement;
    } else if (selectedProvince) {
      geoFilter.type = 'province';
      geoFilter.value = selectedProvince;
    } else if (selectedRegion) {
      geoFilter.type = 'region';
      geoFilter.value = selectedRegion;
    }

    // Construire les paramètres
    const params = {
      ...geoFilter.value && { [`id_${geoFilter.type}`]: geoFilter.value },
      ...selectedOperator && { id_operateur: selectedOperator },
      ...selectedTech && { id_type_site: selectedTech },
    };

    try {
      const res = await api.get('getSitesByFilters.php', { params });
      setSites(res.data || []);
    } catch (error) {
      handleApiError(error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  // Écouteurs de changement
  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value);
    setSelectedProvince("");
    setSelectedDepartement("");
    setSelectedLocalite("");
  };

  const handleProvinceChange = (e) => {
    setSelectedProvince(e.target.value);
    setSelectedRegion("");
    setSelectedDepartement("");
    setSelectedLocalite("");
  };

  const handleDepartementChange = (e) => {
    setSelectedDepartement(e.target.value);
    setSelectedRegion("");
    setSelectedProvince("");
    setSelectedLocalite("");
  };

  const handleLocaliteChange = (e) => {
    setSelectedLocalite(e.target.value);
    setSelectedRegion("");
    setSelectedProvince("");
    setSelectedDepartement("");
  };

  const handleOperatorToggle = (operatorId) => {
    const newOperator = selectedOperator === operatorId ? "" : operatorId;
    setSelectedOperator(newOperator);
  };

  const handleTechToggle = (techId) => {
    const newTech = selectedTech === techId ? "" : techId;
    setSelectedTech(newTech);
  };

  const resetFilters = () => {
    setSelectedRegion("");
    setSelectedProvince("");
    setSelectedDepartement("");
    setSelectedLocalite("");
    setSelectedOperator("");
    setSelectedTech("");
    setSites([]);
  };

  // Gestion des formulaires
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("ajouter_site.php", formData);
      alert("✅ Site ajouté avec succès !");
      await applyFilters();
      setFormData({
        nom_site: "", latitude_site: "", longitude_site: "", id_localite: "",
        id_operateur: "", id_type_site: "", annee_site: "", id_trimestre: ""
      });
      setCurrentView("liste");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportChange = (e) => {
    setImportData({ ...importData, [e.target.name]: e.target.value });
  };

  const handleImportFile = (e) => setImportFile(e.target.files[0]);

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return alert("❌ Veuillez sélectionner un fichier Excel.");
    const form = new FormData();
    Object.entries(importData).forEach(([key, value]) => form.append(key, value));
    form.append("file", importFile);
    setLoading(true);
    try {
      await api.post("importer_sites.php", form, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert("✅ Importation réussie !");
      await applyFilters();
      setCurrentView("liste");
      setImportFile(null);
      setImportData({ id_operateur: "", id_type_site: "", annee_site: "", id_trimestre: "" });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // === Résumé des filtres actifs ===
  const getSummary = () => {
    const parts = [];
    if (selectedLocalite) {
      const local = localites.find(l => l.id_localite == selectedLocalite);
      if (local) parts.push(`📍 ${local.nom_localite} (Localité)`);
    } else if (selectedDepartement) {
      const dep = departements.find(d => d.id_departement == selectedDepartement);
      if (dep) parts.push(`📍 ${dep.nom_departement} (Département)`);
    } else if (selectedProvince) {
      const prov = provinces.find(p => p.id_province == selectedProvince);
      if (prov) parts.push(`📍 ${prov.nom_province} (Province)`);
    } else if (selectedRegion) {
      const reg = regions.find(r => r.id_region == selectedRegion);
      if (reg) parts.push(`📍 ${reg.nom_region} (Région)`);
    }
    if (selectedTech) {
      const tech = typeSites.find(t => t.id_type_site == selectedTech);
      if (tech) parts.push(`📶 ${tech.libelle_type}`);
    }
    if (selectedOperator) {
      const op = operateurs.find(o => o.id_operateur == selectedOperator);
      if (op) parts.push(`🔧 ${op.nom_operateur}`);
    }
    return parts.length > 0 ? parts : null;
  };

  const summary = getSummary();

  // === Analyse des résultats ===
  const getAnalysis = () => {
    if (sites.length === 0) return null;
    const opMap = {};
    const techMap = {};
    const opNames = {};
    operateurs.forEach(o => opNames[o.id_operateur] = o.nom_operateur);
    sites.forEach(s => {
      const opId = s.id_operateur;
      const techLabel = typeSites.find(t => t.id_type_site == s.id_type_site)?.libelle_type || "Inconnu";
      if (opId) opMap[opId] = true;
      techMap[techLabel] = (techMap[techLabel] || 0) + 1;
    });
    const opList = Object.keys(opMap).map(id => opNames[id]).join(", ");
    const techList = Object.entries(techMap).map(([tech, count]) => `${tech} (${count})`).join(", ");
    return { count: sites.length, operators: opList, technologies: techList };
  };

  const analysis = getAnalysis();

  // Appliquer les filtres à chaque changement
  useEffect(() => {
    const timer = setTimeout(() => applyFilters(), 150);
    return () => clearTimeout(timer);
  }, [
    selectedRegion,
    selectedProvince,
    selectedDepartement,
    selectedLocalite,
    selectedOperator,
    selectedTech
  ]);

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

      {/* === Header amélioré === */}
      <div className="mb-4">
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          overflow: "hidden"
        }}>
          {/* En-tête principal */}
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

            {/* Compteur de sites */}
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

          {/* Navigation tabs */}
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
          {/* === Filtres === */}
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

              {/* Localisation */}
              <div className="d-flex flex-wrap gap-3 mb-4 align-items-end">
                {[
                  { label: "Région", value: selectedRegion, onChange: handleRegionChange, options: regions, key: "id_region", name: "nom_region" },
                  { label: "Province", value: selectedProvince, onChange: handleProvinceChange, options: provinces, key: "id_province", name: "nom_province" },
                  { label: "Département", value: selectedDepartement, onChange: handleDepartementChange, options: departements, key: "id_departement", name: "nom_departement" },
                  { label: "Localité", value: selectedLocalite, onChange: handleLocaliteChange, options: localites, key: "id_localite", name: "nom_localite" }
                ].map((field) => (
                  <div key={field.label} style={{ minWidth: "140px" }}>
                    <label style={{
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      color: "#111827",
                      marginBottom: "6px",
                      display: "block"
                    }}>
                      {field.label}
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Toutes</option>
                      {field.options.map(opt => (
                        <option key={opt[field.key]} value={opt[field.key]}>{opt[field.name]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Technologie */}
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
                    const isActive = selectedTech === t.id_type_site;
                    return (
                      <div key={t.id_type_site} className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: "0.9rem", color: "#4b5563", minWidth: "50px" }}>{t.libelle_type}</span>
                        <button
                          onClick={() => handleTechToggle(t.id_type_site)}
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

              {/* Opérateur */}
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
                    const isActive = selectedOperator === o.id_operateur;
                    return (
                      <div key={o.id_operateur} className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: "0.9rem", color: "#4b5563", minWidth: "70px" }}>{o.nom_operateur}</span>
                        <button
                          onClick={() => handleOperatorToggle(o.id_operateur)}
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

              {/* Résumé + Analyse */}
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

              {/* Reset */}
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

          {/* Tableau */}
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
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
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
                    onChange={handleChange}
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
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  >
                    <option value="">Sélectionner</option>
                    {localites.map(l => (
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
              Format requis : <code>Nom, Latitude, Longitude, Localité</code>
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
                  onChange={handleImportFile}
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