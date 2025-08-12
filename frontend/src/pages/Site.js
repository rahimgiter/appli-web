import React, { useEffect, useState } from "react";
import axios from "axios";

// Configuration Axios globale
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost/app-web/backend/api' 
    : '/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

const Sites = () => {
  // États pour les données
  const [sites, setSites] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const [typeSites, setTypeSites] = useState([]);
  const [trimestres, setTrimestres] = useState([]);
  const [localites, setLocalites] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [departements, setDepartements] = useState([]);
  
  // États pour les vues et chargement
  const [currentView, setCurrentView] = useState("liste");
  const [loading, setLoading] = useState(false);
  
  // États pour les filtres
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDepartement, setSelectedDepartement] = useState("");
  const [selectedLocalite, setSelectedLocalite] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [showTechFilters, setShowTechFilters] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedTech, setSelectedTech] = useState("");

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

  // Gestion des erreurs API
  const handleApiError = (error) => {
    console.error("API Error:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    alert(`Erreur: ${error.message}`);
    return [];
  };

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoints = [
          'getSites.php',
          'getOperateurs.php',
          'getTypeSites.php',
          'getTrimestres.php',
          'getLocalites.php',
          'regions.php',
          'provinces.php',
          'departements.php'
        ];

        const responses = await Promise.all(
          endpoints.map(endpoint => 
            api.get(endpoint).catch(handleApiError)
          )
        );

        // Transformation des réponses en tableaux
        const data = responses.map(res => 
          Array.isArray(res?.data) ? res.data : []
        );

        setSites(data[0]);
        setOperateurs(data[1]);
        setTypeSites(data[2]);
        setTrimestres(data[3]);
        setLocalites(data[4]);
        setRegions(data[5]);
        setProvinces(data[6]);
        setDepartements(data[7]);

      } catch (error) {
        console.error("Erreur de chargement :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction générique pour les filtres
  const handleFilter = async (endpoint, paramName, value, setFilter, resetOthers) => {
    try {
      setLoading(true);
      setFilter(value);
      resetOthers();

      const params = value ? { [paramName]: value } : {};
      const res = await api.get(endpoint, { params });
      
      setSites(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      handleApiError(error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers pour les filtres
  const handleRegionFilter = (e) => handleFilter(
    'getSitesByRegion.php',
    'id_region',
    e.target.value,
    setSelectedRegion,
    () => {
      setSelectedProvince("");
      setSelectedDepartement("");
      setSelectedLocalite("");
      setSelectedOperator("");
      setSelectedTech("");
    }
  );

  const handleProvinceFilter = (e) => handleFilter(
    'getSitesByProvince.php',
    'id_province',
    e.target.value,
    setSelectedProvince,
    () => {
      setSelectedRegion("");
      setSelectedDepartement("");
      setSelectedLocalite("");
      setSelectedOperator("");
      setSelectedTech("");
    }
  );

  const handleDepartementFilter = (e) => handleFilter(
    'getSitesByDepartement.php',
    'id_departement',
    e.target.value,
    setSelectedDepartement,
    () => {
      setSelectedRegion("");
      setSelectedProvince("");
      setSelectedLocalite("");
      setSelectedOperator("");
      setSelectedTech("");
    }
  );

  const handleLocaliteFilter = (e) => handleFilter(
    'getSitesByLocalite.php',
    'id_localite',
    e.target.value,
    setSelectedLocalite,
    () => {
      setSelectedRegion("");
      setSelectedProvince("");
      setSelectedDepartement("");
      setSelectedOperator("");
      setSelectedTech("");
    }
  );

  const handleOperatorFilter = (e) => handleFilter(
    'getSitesByOperator.php',
    'id_operateur',
    e.target.value,
    setSelectedOperator,
    () => {
      setSelectedTech("");
      setSelectedRegion("");
      setSelectedProvince("");
      setSelectedDepartement("");
      setSelectedLocalite("");
    }
  );

  const handleTechFilter = (e) => handleFilter(
    'getSitesByTech.php',
    'id_type_site',
    e.target.value,
    setSelectedTech,
    () => {
      setSelectedOperator("");
      setSelectedRegion("");
      setSelectedProvince("");
      setSelectedDepartement("");
      setSelectedLocalite("");
    }
  );

  const resetAllFilters = async () => {
    try {
      setLoading(true);
      setSelectedRegion("");
      setSelectedProvince("");
      setSelectedDepartement("");
      setSelectedLocalite("");
      setSelectedOperator("");
      setSelectedTech("");
      
      const res = await api.get('getSites.php');
      setSites(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers pour le formulaire d'ajout
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("ajouter_site.php", formData);
      alert("✅ Site ajouté avec succès !");
      const res = await api.get("getSites.php");
      setSites(Array.isArray(res.data) ? res.data : []);
      setFormData({
        nom_site: "",
        latitude_site: "",
        longitude_site: "",
        id_localite: "",
        id_operateur: "",
        id_type_site: "",
        annee_site: "",
        id_trimestre: "",
      });
      setCurrentView("liste");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers pour l'import Excel
  const handleImportFile = (e) => setImportFile(e.target.files[0]);

  const handleImportChange = (e) => {
    const { name, value } = e.target;
    setImportData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert("❌ Veuillez sélectionner un fichier Excel.");
      return;
    }

    const form = new FormData();
    form.append("file", importFile);
    form.append("id_operateur", importData.id_operateur);
    form.append("id_type_site", importData.id_type_site);
    form.append("annee_site", importData.annee_site);
    form.append("id_trimestre", importData.id_trimestre);

    try {
      setLoading(true);
      await api.post("importer_sites.php", form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert("✅ Importation réussie");
      const res = await api.get("getSites.php");
      setSites(Array.isArray(res.data) ? res.data : []);
      setCurrentView("liste");
      setImportFile(null);
      setImportData({
        id_operateur: "",
        id_type_site: "",
        annee_site: "",
        id_trimestre: "",
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour déterminer la classe active des boutons
  const getButtonClass = (view) => {
    return currentView === view 
      ? `btn btn-${view === 'liste' ? 'success' : view === 'ajout' ? 'primary' : 'info'}`
      : `btn btn-outline-${view === 'liste' ? 'success' : view === 'ajout' ? 'primary' : 'info'}`;
  };

  return (
    <div className="container-fluid py-4">
      {/* Loading Indicator */}
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div className="text-center bg-white p-4 rounded shadow-lg">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <h4 className="mt-3 text-primary">Chargement en cours...</h4>
          </div>
        </div>
      )}

      {/* Header with Navigation */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-dark text-white">
          <h3 className="mb-0">Gestion des Sites</h3>
        </div>
        <div className="card-body">
          <div className="d-flex justify-content-between flex-wrap gap-2">
            <div className="btn-group" role="group">
              <button
                className={`${getButtonClass("liste")} px-4`}
                onClick={() => setCurrentView("liste")}
                disabled={loading}
              >
                <i className="bi bi-list-ul me-2"></i>Liste des sites
              </button>
              <button
                className={`${getButtonClass("ajout")} px-4`}
                onClick={() => setCurrentView("ajout")}
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-2"></i>Ajouter un site
              </button>
              <button
                className={`${getButtonClass("import")} px-4`}
                onClick={() => setCurrentView("import")}
                disabled={loading}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>Importer
              </button>
            </div>
            
            <div className="d-flex align-items-center">
              <span className="badge bg-primary rounded-pill me-2">
                {sites.length} sites
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vue Liste avec Filtres */}
      {currentView === "liste" && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-filter-square me-2"></i>Filtres
              </h5>
              <div>
                <button 
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => setShowFilters(!showFilters)}
                  disabled={loading}
                >
                  <i className={`bi ${showFilters ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                  Localisation
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowTechFilters(!showTechFilters)}
                  disabled={loading}
                >
                  <i className={`bi ${showTechFilters ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                  Technologie
                </button>
              </div>
            </div>
          </div>
          
          <div className="card-body">
            {/* Filtres de Localisation */}
            {showFilters && (
              <div className="mb-4">
                <h6 className="mb-3 text-muted">
                  <i className="bi bi-geo-alt me-2"></i>Filtres de Localisation
                </h6>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Région</label>
                    <select 
                      className="form-select"
                      onChange={handleRegionFilter}
                      value={selectedRegion}
                      disabled={loading}
                    >
                      <option value="">Toutes les régions</option>
                      {Array.isArray(regions) && regions.map(r => (
                        <option key={r.id_region} value={r.id_region}>{r.nom_region}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Province</label>
                    <select 
                      className="form-select"
                      onChange={handleProvinceFilter}
                      value={selectedProvince}
                      disabled={loading}
                    >
                      <option value="">Toutes les provinces</option>
                      {Array.isArray(provinces) && provinces.map(p => (
                        <option key={p.id_province} value={p.id_province}>{p.nom_province}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Département</label>
                    <select 
                      className="form-select"
                      onChange={handleDepartementFilter}
                      value={selectedDepartement}
                      disabled={loading}
                    >
                      <option value="">Tous les départements</option>
                      {Array.isArray(departements) && departements.map(d => (
                        <option key={d.id_departement} value={d.id_departement}>{d.nom_departement}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Localité</label>
                    <select 
                      className="form-select"
                      onChange={handleLocaliteFilter}
                      value={selectedLocalite}
                      disabled={loading}
                    >
                      <option value="">Toutes les localités</option>
                      {Array.isArray(localites) && localites.map(l => (
                        <option key={l.id_localite} value={l.id_localite}>{l.nom_localite}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <button 
                      className="btn btn-outline-danger btn-sm" 
                      onClick={resetAllFilters}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filtres Technologiques */}
            {showTechFilters && (
              <div className="mb-4">
                <h6 className="mb-3 text-muted">
                  <i className="bi bi-cpu me-2"></i>Filtres Technologiques
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Opérateur</label>
                    <select 
                      className="form-select"
                      onChange={handleOperatorFilter}
                      value={selectedOperator}
                      disabled={loading}
                    >
                      <option value="">Tous les opérateurs</option>
                      {Array.isArray(operateurs) && operateurs.map(op => (
                        <option key={op.id_operateur} value={op.id_operateur}>
                          {op.nom_operateur}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Technologie</label>
                    <select 
                      className="form-select"
                      onChange={handleTechFilter}
                      value={selectedTech}
                      disabled={loading}
                    >
                      <option value="">Toutes les technologies</option>
                      {Array.isArray(typeSites) && typeSites.map(tech => (
                        <option key={tech.id_type_site} value={tech.id_type_site}>
                          {tech.libelle_type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <button 
                      className="btn btn-outline-danger btn-sm" 
                      onClick={() => {
                        setSelectedOperator("");
                        setSelectedTech("");
                      }}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tableau des sites */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>
                  <i className="bi bi-table me-2"></i>Liste des sites
                </h5>
                <div>
                  <span className="badge bg-primary rounded-pill">
                    {sites.length} résultat(s)
                  </span>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Nom</th>
                      <th scope="col">Coordonnées</th>
                      <th scope="col">Localité</th>
                      <th scope="col">Opérateur</th>
                      <th scope="col">Type</th>
                      <th scope="col">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(sites) && sites.length > 0 ? (
                      sites.map((site) => (
                        <tr key={site.id_site || Math.random()}>
                          <td>
                            <strong>{site.nom_site || '-'}</strong>
                          </td>
                          <td>
                            <span className="d-block small text-muted">
                              <i className="bi bi-globe2 me-1"></i>Lat: {site.latitude_site || '-'}
                            </span>
                            <span className="d-block small text-muted">
                              <i className="bi bi-globe2 me-1"></i>Long: {site.longitude_site || '-'}
                            </span>
                          </td>
                          <td>{site.nom_localite || '-'}</td>
                          <td>
                            <span className="badge bg-info text-dark">
                              {site.nom_operateur || '-'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {site.libelle_type || '-'}
                            </span>
                          </td>
                          <td>
                            <span className="d-block">{site.annee_site || '-'}</span>
                            <span className="d-block small text-muted">
                              {site.libelle_trimestre || '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="text-muted">
                            <i className="bi bi-exclamation-circle fs-1"></i>
                            <p className="mt-2">
                              {loading ? 'Chargement en cours...' : 'Aucun site trouvé avec ces critères'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vue Ajout */}
      {currentView === "ajout" && (
        <div className="card shadow-lg">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="bi bi-plus-circle me-2"></i>Ajouter un nouveau site
              </h4>
              <button 
                type="button" 
                className="btn btn-light btn-sm"
                onClick={() => setCurrentView("liste")}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-1"></i>Retour
              </button>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-12">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      id="nom_site"
                      name="nom_site"
                      placeholder="Nom du site"
                      value={formData.nom_site}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <label htmlFor="nom_site">Nom du site*</label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-floating">
                    <input
                      type="number"
                      step="0.00000001"
                      className="form-control"
                      id="latitude_site"
                      name="latitude_site"
                      placeholder="Latitude"
                      value={formData.latitude_site}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <label htmlFor="latitude_site">Latitude*</label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-floating">
                    <input
                      type="number"
                      step="0.00000001"
                      className="form-control"
                      id="longitude_site"
                      name="longitude_site"
                      placeholder="Longitude"
                      value={formData.longitude_site}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <label htmlFor="longitude_site">Longitude*</label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="id_localite"
                      name="id_localite"
                      value={formData.id_localite}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value=""></option>
                      {Array.isArray(localites) && localites.map((loc) => (
                        <option key={loc.id_localite} value={loc.id_localite}>
                          {loc.nom_localite}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="id_localite">Localité*</label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="id_operateur"
                      name="id_operateur"
                      value={formData.id_operateur}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value=""></option>
                      {Array.isArray(operateurs) && operateurs.map((op) => (
                        <option key={op.id_operateur} value={op.id_operateur}>
                          {op.nom_operateur}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="id_operateur">Opérateur*</label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="id_type_site"
                      name="id_type_site"
                      value={formData.id_type_site}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value=""></option>
                      {Array.isArray(typeSites) && typeSites.map((type) => (
                        <option key={type.id_type_site} value={type.id_type_site}>
                          {type.libelle_type}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="id_type_site">Type de site*</label>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      id="annee_site"
                      name="annee_site"
                      placeholder="2024"
                      value={formData.annee_site}
                      onChange={handleChange}
                      required
                      pattern="\d{4}"
                      title="Format: 2024"
                      disabled={loading}
                    />
                    <label htmlFor="annee_site">Année*</label>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="id_trimestre"
                      name="id_trimestre"
                      value={formData.id_trimestre}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value=""></option>
                      {Array.isArray(trimestres) && trimestres.map((tri) => (
                        <option key={tri.id_trimestre} value={tri.id_trimestre}>
                          {tri.libelle_trimestre}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="id_trimestre">Trimestre*</label>
                  </div>
                </div>

                <div className="col-12">
                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setCurrentView("liste")}
                      disabled={loading}
                    >
                      <i className="bi bi-x-circle me-1"></i>Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="bi bi-check-circle me-1"></i>
                      )}
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vue Import */}
      {currentView === "import" && (
        <div className="card shadow-lg">
          <div className="card-header bg-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="bi bi-file-earmark-excel me-2"></i>Importer des sites
              </h4>
              <button 
                type="button" 
                className="btn btn-light btn-sm"
                onClick={() => setCurrentView("liste")}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-1"></i>Retour
              </button>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleImportSubmit}>
              <div className="row g-3 mb-4">
                <div className="col-md-12">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Le fichier Excel doit contenir les colonnes: <strong>Nom, Latitude, Longitude, Localité</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="import_id_operateur"
                      name="id_operateur"
                      onChange={handleImportChange}
                      value={importData.id_operateur}
                      required
                      disabled={loading}
                    >
                      <option value=""></option>
                      {Array.isArray(operateurs) && operateurs.map((op) => (
                        <option key={op.id_operateur} value={op.id_operateur}>
                          {op.nom_operateur}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="import_id_operateur">Opérateur*</label>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="import_id_type_site"
                      name="id_type_site"
                      onChange={handleImportChange}
                      value={importData.id_type_site}
                      required
                      disabled={loading}
                    >
                      <option value=""></option>
                      {Array.isArray(typeSites) && typeSites.map((type) => (
                        <option key={type.id_type_site} value={type.id_type_site}>
                          {type.libelle_type}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="import_id_type_site">Type de site*</label>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      id="import_annee_site"
                      name="annee_site"
                      placeholder="2024"
                      onChange={handleImportChange}
                      value={importData.annee_site}
                      required
                      pattern="\d{4}"
                      disabled={loading}
                    />
                    <label htmlFor="import_annee_site">Année*</label>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="form-floating">
                    <select
                      className="form-select"
                      id="import_id_trimestre"
                      name="id_trimestre"
                      onChange={handleImportChange}
                      value={importData.id_trimestre}
                      required
                      disabled={loading}
                    >
                      <option value=""></option>
                      {Array.isArray(trimestres) && trimestres.map((tri) => (
                        <option key={tri.id_trimestre} value={tri.id_trimestre}>
                          {tri.libelle_trimestre}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="import_id_trimestre">Trimestre*</label>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="form-floating">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="form-control"
                      id="import_file"
                      onChange={handleImportFile}
                      required
                      disabled={loading}
                    />
                    <label htmlFor="import_file">Fichier Excel*</label>
                  </div>
                </div>

                <div className="col-12">
                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setCurrentView("liste")}
                      disabled={loading}
                    >
                      <i className="bi bi-x-circle me-1"></i>Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-info text-white"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="bi bi-upload me-1"></i>
                      )}
                      Importer
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sites;