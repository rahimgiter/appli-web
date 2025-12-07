import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AjoutInfos.css';
import { useAuth } from './AuthContext';

const AjoutInfos = ({ onAdded = () => {} }) => {
  const { user, isAuthenticated } = useAuth();
  const [localites, setLocalites] = useState([]);
  const [localiteId, setLocaliteId] = useState('');
  const [localiteNom, setLocaliteNom] = useState('');
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState({});
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    site_2g: '', appel_possible: '', operateurs_appel: [], raison_pas_appel: '',
    qualite_2g: '', antenne: '', raison_pas_antenne: '', site_3g: '',
    internet: '', operateurs_internet: [], qualite_internet: '', commentaire: ''
  });

  // Charger les localités
  useEffect(() => {
    axios.get('http://localhost/app-web/backend/api/villages.php')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setLocalites(data);
      })
      .catch(() => toast.error('Impossible de charger la liste des localités.'));
  }, []);

  // Charger les détails de la localité
  useEffect(() => {
    if (!localiteId) return setDetails({});
    axios.get(`http://localhost/app-web/backend/api/village-details.php?id=${localiteId}`)
      .then(res => setDetails(res.data || {}))
      .catch(() => toast.error('Impossible de charger les détails de la localité.'));
  }, [localiteId]);

  // Filtrage localité
  const filteredLocalites = useMemo(() => {
    if (!search || !Array.isArray(localites)) return [];
    return localites.filter(v => v.nom_localite?.toLowerCase().includes(search.toLowerCase()));
  }, [search, localites]);

  // Changement formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'commentaire') {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length <= 25) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setWordCount(words.length);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked ? [...prev[name], value] : prev[name].filter(v => v !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Soumission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      return toast.error('⚠️ Veuillez vous connecter pour enregistrer des données');
    }

    if (!localiteId) return toast.warn('⚠️ Veuillez sélectionner une localité.');
    if (!formData.site_2g || !formData.qualite_2g || !formData.internet || !formData.antenne)
      return toast.warn('⚠️ Veuillez remplir tous les champs obligatoires.');
    if (formData.site_2g === 'oui' && formData.appel_possible === 'oui' && formData.operateurs_appel.length === 0)
      return toast.warn('⚠️ Sélectionnez au moins un opérateur pour les appels.');
    if (formData.internet === 'oui' && formData.operateurs_internet.length === 0)
      return toast.warn('⚠️ Sélectionnez au moins un opérateur pour Internet.');

    setLoading(true);
    try {
      const res = await axios.post('http://localhost/app-web/backend/api/ajout_infos.php', {
        id_localite: localiteId,
        id_utilisateur: user.id_utilisateur,
        ...formData
      });
      
      if (res.data.status === 'success') {
        toast.success('✅ Informations enregistrées !');
        resetForm();
        onAdded();
      } else {
        toast.error(`❌ ${res.data.message}`);
      }
    } catch (error) {
      console.error('Erreur enregistrement:', error);
      toast.error('❌ Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      site_2g: '', appel_possible: '', operateurs_appel: [], raison_pas_appel: '',
      qualite_2g: '', antenne: '', raison_pas_antenne: '', site_3g: '',
      internet: '', operateurs_internet: [], qualite_internet: '', commentaire: ''
    });
    setWordCount(0);
    setLocaliteId('');
    setLocaliteNom('');
    setSearch('');
    setDetails({});
  };

  return (
    <div className="ajout-infos-container">
      <div className="ajout-infos-header">
        <div className="header-content">
          <i className="bi bi-wifi icon-large"></i>
          <div>
            <h1 className="page-title">
              {localiteNom ? `Couverture Réseau : ${localiteNom}` : "Couverture Réseau"}
            </h1>
            <p className="page-subtitle">
              {isAuthenticated 
                ? `Connecté en tant que ${user?.prenom} ${user?.nom_famille}`
                : "Veuillez vous connecter pour ajouter des informations"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Afficher un message si non connecté */}
      {!isAuthenticated && (
        <div className="alert-warning">
          <i className="bi bi-exclamation-triangle"></i>
          <span>Vous devez être connecté pour ajouter des informations de couverture réseau.</span>
        </div>
      )}

      <div className="ajout-infos-content">
        <form onSubmit={handleSubmit} className="ajout-infos-form">
          {/* Recherche localité */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="bi bi-search me-2"></i>
              Sélection de la Localité
            </h3>
            
            <div className={`search-container ${filteredLocalites.length > 0 ? 'has-results' : ''}`}>
              <label htmlFor="search-localite" className="form-label">Rechercher une localité</label>
              <div className="search-input-wrapper">
                <i className="bi bi-search search-icon"></i>
                <input
                  id="search-localite"
                  type="text"
                  className="search-input"
                  value={search}
                  placeholder="Tapez le nom d'une localité..."
                  onChange={e => setSearch(e.target.value)}
                  autoComplete="off"
                  disabled={!isAuthenticated}
                />
              </div>
              
              {filteredLocalites.length > 0 && (
                <div className="search-results">
                  {filteredLocalites.map(v => (
                    <div 
                      key={v.id_localite} 
                      className="search-result-item"
                      onClick={() => { 
                        if (isAuthenticated) {
                          setLocaliteId(v.id_localite); 
                          setLocaliteNom(v.nom_localite);
                          setSearch(''); 
                        }
                      }}
                    >
                      <i className="bi bi-geo-alt me-2"></i>
                      {v.nom_localite}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Détails localité */}
          {localiteId && isAuthenticated && (
            <div className="form-section">
              <h3 className="section-title">
                <i className="bi bi-info-circle me-2"></i>
                Informations de la Localité
              </h3>
              
              <div className="village-details-card">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Département</span>
                    <span className="detail-value">{details.nom_departement || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Province</span>
                    <span className="detail-value">{details.nom_province || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Région</span>
                    <span className="detail-value">{details.nom_region || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Population Totale</span>
                    <span className="detail-value highlight">{details.pop_total || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hommes</span>
                    <span className="detail-value">{details.hommes || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Femmes</span>
                    <span className="detail-value">{details.femmes || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire de couverture réseau */}
          {localiteId && isAuthenticated && (
            <div className="form-section">
              <h3 className="section-title">
                <i className="bi bi-clipboard-data me-2"></i>
                Informations de Couverture Réseau
              </h3>

              <div className="form-grid">
                {/* 2G */}
                <div className="form-group">
                  <label className="form-label">Site couvert par la 2G ?</label>
                  <select name="site_2g" value={formData.site_2g} onChange={handleChange} className="form-select" required>
                    <option value="">-- Choisir --</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>

                {formData.site_2g === 'oui' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Appel téléphonique possible ?</label>
                      <select name="appel_possible" value={formData.appel_possible} onChange={handleChange} className="form-select" required>
                        <option value="">-- Choisir --</option>
                        <option value="oui">Oui</option>
                        <option value="non">Non</option>
                      </select>
                    </div>

                    {formData.appel_possible === 'oui' && (
                      <div className="form-group full-width">
                        <label className="form-label">Opérateurs disponibles pour les appels</label>
                        <div className="checkbox-group">
                          {['Orange', 'Onatel', 'Telecel'].map(op => (
                            <label className="checkbox-label" key={op}>
                              <input 
                                type="checkbox" 
                                name="operateurs_appel" 
                                value={op} 
                                className="checkbox-input"
                                checked={formData.operateurs_appel.includes(op)} 
                                onChange={handleChange} 
                              />
                              <span className="checkbox-custom"></span>
                              <span className="checkbox-text">{op}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.appel_possible === 'non' && (
                      <div className="form-group">
                        <label className="form-label">Pourquoi pas d'appel ?</label>
                        <select name="raison_pas_appel" value={formData.raison_pas_appel} onChange={handleChange} className="form-select">
                          <option value="">-- Choisir --</option>
                          <option value="incident">Incident</option>
                          <option value="jamais eu d'antenne">Jamais eu d'antenne</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Qualité 2G */}
                {formData.site_2g === 'oui' && (
                  <div className="form-group">
                    <label className="form-label">Qualité du signal 2G</label>
                    <select name="qualite_2g" value={formData.qualite_2g} onChange={handleChange} className="form-select" required>
                      <option value="">-- Choisir --</option>
                      <option value="bonne">Bonne</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="mauvaise">Mauvaise</option>
                    </select>
                  </div>
                )}

                {/* Antenne */}
                <div className="form-group">
                  <label className="form-label">Antenne disponible ?</label>
                  <select name="antenne" value={formData.antenne} onChange={handleChange} className="form-select" required>
                    <option value="">-- Choisir --</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>

                {formData.antenne === 'non' && (
                  <div className="form-group">
                    <label className="form-label">Pourquoi pas d'antenne ?</label>
                    <select name="raison_pas_antenne" value={formData.raison_pas_antenne} onChange={handleChange} className="form-select">
                      <option value="">-- Choisir --</option>
                      <option value="incident">Incident</option>
                      <option value="jamais eu d'antenne">Jamais eu d'antenne</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                )}

                {/* 3G */}
                <div className="form-group">
                  <label className="form-label">Site couvert par la 3G ?</label>
                  <select name="site_3g" value={formData.site_3g} onChange={handleChange} className="form-select">
                    <option value="">-- Choisir --</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>

                {/* Internet */}
                <div className="form-group">
                  <label className="form-label">Internet disponible ?</label>
                  <select name="internet" value={formData.internet} onChange={handleChange} className="form-select" required>
                    <option value="">-- Choisir --</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>

                {formData.internet === 'oui' && (
                  <>
                    <div className="form-group full-width">
                      <label className="form-label">Opérateurs Internet disponibles</label>
                      <div className="checkbox-group">
                        {['Orange', 'Onatel', 'Telecel'].map(op => (
                          <label className="checkbox-label" key={op}>
                            <input 
                              type="checkbox" 
                              name="operateurs_internet" 
                              value={op} 
                              className="checkbox-input"
                              checked={formData.operateurs_internet.includes(op)} 
                              onChange={handleChange} 
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-text">{op}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Qualité Internet</label>
                      <select name="qualite_internet" value={formData.qualite_internet} onChange={handleChange} className="form-select">
                        <option value="">-- Choisir --</option>
                        <option value="bonne">Bonne</option>
                        <option value="moyenne">Moyenne</option>
                        <option value="mauvaise">Mauvaise</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Commentaire */}
                <div className="form-group full-width">
                  <label className="form-label">
                    Commentaire 
                    <span className="word-count">({wordCount}/25 mots)</span>
                  </label>
                  <textarea 
                    name="commentaire" 
                    value={formData.commentaire} 
                    onChange={handleChange} 
                    className="form-textarea" 
                    rows={3}
                    placeholder="Ajoutez un commentaire sur la couverture réseau..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Réinitialiser
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner-small me-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Enregistrer les Informations
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        theme="colored"
      />
    </div>
  );
};

export default AjoutInfos;