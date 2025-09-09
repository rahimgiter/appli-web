// src/pages/AjoutInfos.js
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AjoutInfos.css';

const AjoutInfos = ({ onAdded = () => {} }) => {
  const [villages, setVillages] = useState([]);
  const [villageId, setVillageId] = useState('');
  const [villageNom, setVillageNom] = useState(''); // ✅ Nouveau : pour stocker le nom du village
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState({});
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    site_2g: '', appel_possible: '', operateurs_appel: [], raison_pas_appel: '',
    qualite_2g: '', antenne: '', raison_pas_antenne: '', site_3g: '',
    internet: '', operateurs_internet: [], qualite_internet: '', commentaire: ''
  });

  // Charger les villages
  useEffect(() => {
    axios.get('http://localhost/app-web/backend/api/villages.php')
      .then(res => setVillages(res.data))
      .catch(() => toast.error('Impossible de charger la liste des villages.'));
  }, []);

  // Charger les détails du village
  useEffect(() => {
    if (!villageId) return setDetails({});
    axios.get(`http://localhost/app-web/backend/api/village-details.php?id=${villageId}`)
      .then(res => setDetails(res.data || {}))
      .catch(() => toast.error('Impossible de charger les détails du village.'));
  }, [villageId]);

  // Filtrage village
  const filteredVillages = useMemo(() => {
    if (!search) return [];
    return villages.filter(v => v.nom_village?.toLowerCase().includes(search.toLowerCase()));
  }, [search, villages]);

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

    if (!villageId) return toast.warn('⚠️ Veuillez sélectionner un village.');
    if (!formData.site_2g || !formData.qualite_2g || !formData.internet || !formData.antenne)
      return toast.warn('⚠️ Veuillez remplir tous les champs obligatoires.');
    if (formData.site_2g === 'oui' && formData.appel_possible === 'oui' && formData.operateurs_appel.length === 0)
      return toast.warn('⚠️ Sélectionnez au moins un opérateur pour les appels.');
    if (formData.internet === 'oui' && formData.operateurs_internet.length === 0)
      return toast.warn('⚠️ Sélectionnez au moins un opérateur pour Internet.');

    setLoading(true);
    try {
      const res = await axios.post('http://localhost/app-web/backend/api/ajout_infos.php', {
        id_village: villageId,
        ...formData
      });
      if (res.data.status === 'success') {
        toast.success('✅ Informations enregistrées !');
        resetForm();
        onAdded(); // Rafraîchir Archives
      } else {
        toast.error(`❌ ${res.data.message}`);
      }
    } catch {
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
    setVillageId('');
    setVillageNom(''); // ✅ reset aussi le nom
    setSearch('');
    setDetails({});
  };

  return (
    <div className="container mt-5">
      <h4 className="fw-bold mb-4 text-primary text-center">
        {villageNom ? `COUVERTURE RESEAU DE  : ${villageNom}` : "COUVERTURE RESEAU"}
      </h4>

      <form onSubmit={handleSubmit} className="shadow p-4 bg-white rounded-4">
        {/* Recherche village */}
        <div className="mb-4 position-relative">
          <label htmlFor="search-village" className="form-label fw-semibold">Rechercher un village</label>
          <input
            id="search-village"
            type="text"
            className="form-control"
            value={search}
            placeholder="Tapez pour rechercher..."
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
          {filteredVillages.length > 0 && (
            <ul className="list-group position-absolute w-100" style={{ maxHeight: 200, overflowY: 'auto', zIndex: 1000 }}>
              {filteredVillages.map(v => (
                <li key={v.id_village} className="list-group-item list-group-item-action" style={{ cursor: 'pointer' }}
                  onClick={() => { 
                    setVillageId(v.id_village); 
                    setVillageNom(v.nom_village); // ✅ stocke le nom sélectionné
                    setSearch(''); 
                  }}>
                  {v.nom_village}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Détails village */}
        {villageId && (
          <div className="village-details mb-4 p-3 bg-light rounded">
            <div className="row">
              <div className="col-md-4"><strong>Commune :</strong> {details.nom_commune || 'N/A'}</div>
              <div className="col-md-4"><strong>Province :</strong> {details.nom_province || 'N/A'}</div>
              <div className="col-md-4"><strong>Région :</strong> {details.nom_region || 'N/A'}</div>
              <div className="col-md-4 mt-2"><strong>Population :</strong> {details.pop_total || 0}</div>
              <div className="col-md-4 mt-2"><strong>Hommes :</strong> {details.hommes || 0}</div>
              <div className="col-md-4 mt-2"><strong>Femmes :</strong> {details.femmes || 0}</div>
            </div>
          </div>
        )}

        {/* Formulaire complet */}
        {villageId && (
          <>
            {/* 2G */}
            <div className="mb-3">
              <label className="form-label">Site couvert par la 2G ?</label>
              <select name="site_2g" value={formData.site_2g} onChange={handleChange} className="form-select" required>
                <option value="">-- Choisir --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>

            {formData.site_2g === 'oui' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Appel téléphonique possible ?</label>
                  <select name="appel_possible" value={formData.appel_possible} onChange={handleChange} className="form-select" required>
                    <option value="">-- Choisir --</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>

                {formData.appel_possible === 'oui' && (
                  <div className="mb-3">
                    <label className="form-label">Opérateurs disponibles</label>
                    {['Orange', 'Onatel', 'Telecel'].map(op => (
                      <div className="form-check" key={op}>
                        <input type="checkbox" name="operateurs_appel" value={op} className="form-check-input"
                          checked={formData.operateurs_appel.includes(op)} onChange={handleChange} id={`appel-${op}`} />
                        <label className="form-check-label" htmlFor={`appel-${op}`}>{op}</label>
                      </div>
                    ))}
                  </div>
                )}

                {formData.appel_possible === 'non' && (
                  <div className="mb-3">
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
              <div className="mb-3">
                <label className="form-label">Qualité 2G</label>
                <select name="qualite_2g" value={formData.qualite_2g} onChange={handleChange} className="form-select" required>
                  <option value="">-- Choisir --</option>
                  <option value="bonne">Bonne</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="mauvaise">Mauvaise</option>
                </select>
              </div>
            )}

            {/* Antenne */}
            <div className="mb-3">
              <label className="form-label">Antenne disponible ?</label>
              <select name="antenne" value={formData.antenne} onChange={handleChange} className="form-select" required>
                <option value="">-- Choisir --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>

            {formData.antenne === 'non' && (
              <div className="mb-3">
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
            <div className="mb-3">
              <label className="form-label">Site couvert par la 3G ?</label>
              <select name="site_3g" value={formData.site_3g} onChange={handleChange} className="form-select">
                <option value="">-- Choisir --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>

            {/* Internet */}
            <div className="mb-3">
              <label className="form-label">Internet disponible ?</label>
              <select name="internet" value={formData.internet} onChange={handleChange} className="form-select" required>
                <option value="">-- Choisir --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>

            {formData.internet === 'oui' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Opérateurs Internet</label>
                  {['Orange', 'Onatel', 'Telecel'].map(op => (
                    <div className="form-check" key={op}>
                      <input type="checkbox" name="operateurs_internet" value={op} className="form-check-input"
                        checked={formData.operateurs_internet.includes(op)} onChange={handleChange} id={`internet-${op}`} />
                      <label className="form-check-label" htmlFor={`internet-${op}`}>{op}</label>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
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
            <div className="mb-3">
              <label className="form-label">Commentaire (max 25 mots)</label>
              <textarea name="commentaire" value={formData.commentaire} onChange={handleChange} className="form-control" rows={3} />
              <small className="text-muted">{wordCount}/25 mots</small>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        )}
      </form>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default AjoutInfos;
