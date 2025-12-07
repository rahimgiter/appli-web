import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { Modal } from 'bootstrap';
import FormulaireInfos from '../components/FormulaireInfos';
import toast, { Toaster } from 'react-hot-toast';
import './ExplorationRegionale.css';

const ExplorationRegionale = () => {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [localites, setLocalites] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDepartement, setSelectedDepartement] = useState('');

  const [titre, setTitre] = useState('Toutes les localités');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedLocalite, setSelectedLocalite] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isExisting, setIsExisting] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRegions, resProvinces, resDepartements, resLocalites] = await Promise.all([
        axios.get('http://localhost/app-web/backend/api/regions.php'),
        axios.get('http://localhost/app-web/backend/api/provinces.php'),
        axios.get('http://localhost/app-web/backend/api/departements.php'),
        axios.get('http://localhost/app-web/backend/api/getLocalites.php'),
      ]);

      setRegions(resRegions.data);
      setProvinces(resProvinces.data);
      setDepartements(resDepartements.data);
      setLocalites(resLocalites.data);
    } catch (err) {
      console.error('Erreur de chargement des données initiales :', err);
      toast.error('❌ Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fonction pour actualiser les données
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    toast.success('✅ Données actualisées');
  };

  // Fonctions utilitaires pour la hiérarchie géographique
  const getProvinceFromDepartement = useCallback((depId) => {
    if (!depId) return null;
    const dep = departements.find(d => d.id_departement === depId);
    return dep ? dep.id_province : null;
  }, [departements]);

  const getRegionFromProvince = useCallback((provId) => {
    if (!provId) return null;
    const prov = provinces.find(p => p.id_province === provId);
    return prov ? prov.id_region : null;
  }, [provinces]);

  const getRegionFromDepartement = useCallback((depId) => {
    if (!depId) return null;
    const dep = departements.find(d => d.id_departement === depId);
    if (!dep) return null;

    const prov = provinces.find(p => p.id_province === dep.id_province);
    return prov ? prov.id_region : null;
  }, [departements, provinces]);

  // Gestionnaires d'événements pour les filtres hiérarchiques
  const handleDepartementChange = useCallback((e) => {
    const value = e.target.value || '';
    setSelectedDepartement(value);

    if (value) {
      const provId = getProvinceFromDepartement(value);
      const regId = getRegionFromDepartement(value);
      setSelectedProvince(provId ? provId.toString() : '');
      setSelectedRegion(regId ? regId.toString() : '');
    } else {
      setSelectedProvince('');
      setSelectedRegion('');
    }
  }, [getProvinceFromDepartement, getRegionFromDepartement]);

  const handleProvinceChange = useCallback((e) => {
    const value = e.target.value || '';
    setSelectedProvince(value);

    if (value) {
      const regId = getRegionFromProvince(value);
      setSelectedRegion(regId ? regId.toString() : '');
      setSelectedDepartement('');
    } else {
      setSelectedRegion('');
      setSelectedDepartement('');
    }
  }, [getRegionFromProvince]);

  const handleRegionChange = useCallback((e) => {
    const value = e.target.value || '';
    setSelectedRegion(value);
    setSelectedProvince('');
    setSelectedDepartement('');
  }, []);

  // Fonction pour effacer tous les filtres
  const clearAllFilters = () => {
    setSelectedRegion('');
    setSelectedProvince('');
    setSelectedDepartement('');
    setSearch('');
  };

  // Mise à jour du titre
  useEffect(() => {
    if (selectedDepartement) {
      const departement = departements.find(d => String(d.id_departement) === selectedDepartement);
      setTitre(`Localités du département : ${departement?.nom_departement || ''}`);
    } else if (selectedProvince) {
      const province = provinces.find(p => String(p.id_province) === selectedProvince);
      setTitre(`Localités de la province : ${province?.nom_province || ''}`);
    } else if (selectedRegion) {
      const region = regions.find(r => String(r.id_region) === selectedRegion);
      setTitre(`Localités de la région : ${region?.nom_region || ''}`);
    } else {
      setTitre('Toutes les localités');
    }
  }, [selectedRegion, selectedProvince, selectedDepartement, departements, provinces, regions]);

  // Filtrage des localités
  const getFilteredLocalites = useCallback(() => {
  // Convertir toutes les valeurs en nombres pour éviter les problèmes de type
  const regionId = parseInt(selectedRegion);
  const provinceId = parseInt(selectedProvince);
  const departementId = parseInt(selectedDepartement);
  
  if (departementId) {
    return localites.filter(l => parseInt(l.id_departement) === departementId);
  } else if (provinceId) {
    const depsInProvince = departements.filter(d => parseInt(d.id_province) === provinceId);
    const depIds = depsInProvince.map(d => parseInt(d.id_departement));
    return localites.filter(l => depIds.includes(parseInt(l.id_departement)));
  } else if (regionId) {
    const provsInRegion = provinces.filter(p => parseInt(p.id_region) === regionId);
    const provIds = provsInRegion.map(p => parseInt(p.id_province));
    
    const depsInRegion = departements.filter(d => provIds.includes(parseInt(d.id_province)));
    const depIds = depsInRegion.map(d => parseInt(d.id_departement));
    
    return localites.filter(l => depIds.includes(parseInt(l.id_departement)));
  }
  
  return localites;
}, [localites, selectedDepartement, selectedProvince, selectedRegion, departements, provinces]);

  // ✅ Gestion clic sur localité
  const handleLocaliteClick = async (localite) => {
    setSelectedLocalite(localite);
    try {
      const res = await axios.get(`http://localhost/app-web/backend/api/village-details.php?id=${localite.id_localite}`);

      if (res.data?.id) {
        // Localité déjà renseignée → Modifier ou Supprimer
        const choix = window.confirm(
          '✅ Cette localité est déjà renseignée.\n\nCliquez sur OK pour MODIFIER.\nCliquez sur ANNULER pour SUPPRIMER.'
        );

        if (choix) {
          // Modifier
          setIsExisting(true);
          setFormData({
            ...res.data,
            operateurs_appel: res.data.operateurs_appel?.split(',') || [],
            operateurs_internet: res.data.operateurs_internet?.split(',') || [],
          });
          setWordCount(res.data.commentaire?.split(/\s+/).length || 0);

          setTimeout(() => {
            const modal = new Modal(document.getElementById('localiteModal'));
            modal.show();
          }, 100);
        } else {
          // Supprimer
          if (window.confirm('⚠️ Voulez-vous vraiment supprimer cette fiche ?')) {
            try {
              await axios.post('http://localhost/app-web/backend/api/archives_delete.php', {
                id_village: localite.id_localite,
              });
              toast.success('🗑️ Localité supprimée avec succès');
              fetchData(); // recharger les données
            } catch (err) {
              console.error('Erreur lors de la suppression :', err);
              toast.error('❌ Erreur lors de la suppression');
            }
          }
        }
      } else {
        // Localité non renseignée → Renseigner
        if (window.confirm('❌ Localité pas encore renseignée.\nVoulez-vous la renseigner ?')) {
          setIsExisting(false);
          setFormData({
            id_village: localite.id_localite,
            site_2g: '',
            appel_possible: '',
            operateurs_appel: [],
            raison_pas_appel: '',
            qualite_2g: '',
            antenne: '',
            raison_pas_antenne: '',
            site_3g: '',
            internet: '',
            operateurs_internet: [],
            qualite_internet: '',
            commentaire: '',
          });
          setWordCount(0);

          setTimeout(() => {
            const modal = new Modal(document.getElementById('localiteModal'));
            modal.show();
          }, 100);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des infos :', err);
      toast.error('❌ Impossible de charger les informations de la localité');
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (!formData) return;

    if (name === 'commentaire') {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length <= 25) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setWordCount(words.length);
      }
    } else if (type === 'checkbox') {
      setFormData((prev) => {
        const updated = prev[name]?.includes(value)
          ? prev[name].filter((v) => v !== value)
          : [...(prev[name] || []), value];
        return { ...prev, [name]: updated };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (!formData) return;

    const url = isExisting
      ? 'http://localhost/app-web/backend/api/archives_update.php'
      : 'http://localhost/app-web/backend/api/archives_create.php';

    const dataToSend = {
      ...formData,
      operateurs_appel: formData.operateurs_appel.join(','),
      operateurs_internet: formData.operateurs_internet.join(','),
    };

    axios
      .post(url, dataToSend)
      .then(() => {
        toast.success('✅ Formulaire sauvegardé !');
        Modal.getInstance(document.getElementById('localiteModal')).hide();
        fetchData();
      })
      .catch((err) => {
        console.error('Erreur lors de la sauvegarde :', err);
        toast.error('❌ Erreur lors de la sauvegarde');
      });
  };

  const filteredLocalites = getFilteredLocalites().filter((l) =>
    l.nom_localite?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { 
            background: '#363636', 
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500'
          },
          success: { 
            duration: 4000, 
            style: { 
              background: '#10b981',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
            } 
          },
          error: { 
            duration: 4000, 
            style: { 
              background: '#ef4444',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
            } 
          },
        }}
      />
      
      <div className="exploration-container">
        {/* En-tête */}
        <div className="exploration-header">
          <div className="header-content">
            <i className="bi bi-compass-fill icon-large"></i>
            <div>
              <h1 className="page-title">Exploration Régionale</h1>
              <p className="page-subtitle">Explorez et gérez les données de couverture réseau par région</p>
            </div>
          </div>
          {/* Bouton Actualiser */}
          <div className="header-actions">
            <button 
              className="btn-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <div className="spinner-small me-2"></div>
                  Actualisation...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Actualiser
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="exploration-content">
          {/* Filtres - Alternative 1 */}
          <div className="filters-section">
            <div className="filters-header">
              <h3 className="section-title">
                <i className="bi bi-funnel me-2"></i>
                Filtres Géographiques
              </h3>
              <div className="filters-actions">
                <button 
                  className="btn-clear-filters"
                  onClick={clearAllFilters}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Effacer
                </button>
              </div>
            </div>
            
            <div className="inline-filters">
              <div className="filter-chip">
                <label>Région</label>
                <div className="chip-select">
                  <i className="bi bi-geo-alt"></i>
                  <select value={selectedRegion} onChange={handleRegionChange}>
                    <option value="">Toutes</option>
                    {regions.map((r) => (
                      <option key={r.id_region} value={String(r.id_region)}>
                        {r.nom_region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="filter-chip">
                <label>Province</label>
                <div className="chip-select">
                  <i className="bi bi-map"></i>
                  <select value={selectedProvince} onChange={handleProvinceChange}>
                    <option value="">Toutes</option>
                    {provinces.map((p) => (
                      <option key={p.id_province} value={String(p.id_province)}>
                        {p.nom_province}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="filter-chip">
                <label>Département</label>
                <div className="chip-select">
                  <i className="bi bi-pin-map"></i>
                  <select value={selectedDepartement} onChange={handleDepartementChange}>
                    <option value="">Tous</option>
                    {departements.map((d) => (
                      <option key={d.id_departement} value={String(d.id_departement)}>
                        {d.nom_departement}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Titre et recherche */}
          <div className="search-section">
            <div className="title-section">
              <h3 className="current-title">{titre}</h3>
              <div className="results-count">
                {filteredLocalites.length} localité{filteredLocalites.length !== 1 ? 's' : ''} trouvée{filteredLocalites.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                className="search-input"
                placeholder="Rechercher une localité..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Tableau des localités */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <h3>Chargement des données...</h3>
              <p>Récupération des informations géographiques</p>
            </div>
          ) : (
            <div className="table-container">
              <div className="table-responsive">
                <table className="localites-table">
                  <thead>
                    <tr>
                      <th className="table-header">Nom de la localité</th>
                      <th className="table-header">Latitude</th>
                      <th className="table-header">Longitude</th>
                      <th className="table-header">Hommes</th>
                      <th className="table-header">Femmes</th>
                      <th className="table-header">Population Total</th>
                      <th className="table-header">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocalites.length > 0 ? (
                      filteredLocalites.map((l) => (
                        <tr key={l.id_localite} onClick={() => handleLocaliteClick(l)} className="table-row">
                          <td className="localite-name">
                            <i className="bi bi-geo-alt-fill me-2"></i>
                            {l.nom_localite}
                          </td>
                          <td className="text-center">{l.latitude || 'N/A'}</td>
                          <td className="text-center">{l.longitude || 'N/A'}</td>
                          <td className="text-center">{l.hommes || 'N/A'}</td>
                          <td className="text-center">{l.femmes || 'N/A'}</td>
                          <td className="text-center population-total">
                            {l.pop_total || 'N/A'}
                          </td>
                          <td className="text-center">
                            <span className="status-badge">
                              <i className="bi bi-circle-fill me-1"></i>
                              Non renseigné
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-data">
                          <div className="empty-state">
                            <i className="bi bi-inbox"></i>
                            <p>Aucune localité trouvée</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        <div className="modal fade" id="localiteModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content exploration-modal-content">
              {selectedLocalite && (
                <>
                  <div className="modal-header exploration-modal-header">
                    <div className="modal-title-section">
                      <i className="bi bi-file-earmark-text modal-icon"></i>
                      <div>
                        <h5 className="modal-title">{selectedLocalite.nom_localite}</h5>
                        <p className="modal-subtitle">
                          {isExisting ? 'Modification du formulaire existant' : 'Nouveau formulaire de couverture'}
                        </p>
                      </div>
                    </div>
                    <button type="button" className="btn-close-modal" data-bs-dismiss="modal">
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  
                  <div className="modal-body exploration-modal-body">
                    {formData && (
                      <FormulaireInfos
                        formData={formData}
                        handleChange={handleChange}
                        wordCount={wordCount}
                        editMode={true}
                      />
                    )}
                  </div>
                  
                  <div className="modal-footer exploration-modal-footer">
                    <button className="btn-save" onClick={handleSave}>
                      <i className="bi bi-save me-2"></i>
                      Enregistrer
                    </button>
                    <button className="btn-cancel" data-bs-dismiss="modal">
                      <i className="bi bi-x-circle me-2"></i>
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExplorationRegionale;