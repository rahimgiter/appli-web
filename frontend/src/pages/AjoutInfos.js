// src/pages/AjoutInfos.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AjoutInfos.css';

const AjoutInfos = () => {
  const [villages, setVillages] = useState([]);
  const [villageId, setVillageId] = useState('');
  const [search, setSearch] = useState('');
  const [filteredVillages, setFilteredVillages] = useState([]);
  const [details, setDetails] = useState({});
  const [wordCount, setWordCount] = useState(0);

  const [formData, setFormData] = useState({
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
    commentaire: ''
  });

  // 🔄 Chargement des villages
  useEffect(() => {
    axios.get('http://localhost/app-web/backend/api/villages.php')
      .then(res => setVillages(res.data))
      .catch(err => console.error(err));
  }, []);

  // 🔍 Filtrage dynamique
  useEffect(() => {
    if (search.length > 0) {
      const results = villages.filter(v =>
        v.nom_village.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredVillages(results);
    } else {
      setFilteredVillages([]);
    }
  }, [search, villages]);

  // ℹ️ Chargement des détails du village sélectionné
  useEffect(() => {
    if (villageId) {
      axios.get(`http://localhost/app-web/backend/api/village-details.php?id=${villageId}`)
        .then(res => setDetails(res.data))
        .catch(err => console.error(err));
    }
  }, [villageId]);

  // 🔁 Gestion des champs
  const handleChange = e => {
    const { name, value, type } = e.target;

    if (name === 'commentaire') {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length <= 25) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setWordCount(words.length);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => {
        const updated = prev[name].includes(value)
          ? prev[name].filter(val => val !== value)
          : [...prev[name], value];
        return { ...prev, [name]: updated };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Soumission du formulaire
  const handleSubmit = async e => {
    e.preventDefault();

    if (!villageId) {
      toast.error("Veuillez sélectionner un village avant d’enregistrer.");
      return;
    }

    const payload = {
      id_village: villageId,
      ...formData
    };

    try {
      const response = await axios.post('http://localhost/app-web/backend/api/ajout_infos.php', payload);

      if (response.data.status === "error") {
        toast.error("❌ " + response.data.message);
        return;
      }

      toast.success("✅ Informations enregistrées avec succès !");
      resetForm();
    } catch (error) {
      toast.error("Erreur réseau ou serveur !");
      console.error(error);
    }
  };

  // ♻️ Réinitialisation du formulaire
  const resetForm = () => {
    setFormData({
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
      commentaire: ''
    });
    setWordCount(0);
    setSearch('');
    setVillageId('');
    setDetails({});
  };

  return (
    <div className="container mt-5">
      <h4 className="fw-bold mb-4 text-primary text-center">Ajouter une couverture réseau</h4>

      <form onSubmit={handleSubmit} className="shadow p-4 bg-white rounded-4">

        {/* 🔍 Champ recherche village */}
        <div className="mb-4 position-relative">
          <label className="form-label fw-semibold">Rechercher un village</label>
          <input
            type="text"
            className="form-control"
            value={search}
            placeholder="Commencez à taper..."
            onChange={(e) => setSearch(e.target.value)}
          />
          {filteredVillages.length > 0 && (
            <ul className="list-group position-absolute w-100 zindex-dropdown" style={{ maxHeight: 200, overflowY: 'auto' }}>
              {filteredVillages.map(v => (
                <li
                  key={v.id_village}
                  className="list-group-item list-group-item-action"
                  onClick={() => {
                    setVillageId(v.id_village);
                    setSearch(v.nom_village);
                    setFilteredVillages([]);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {v.nom_village}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ℹ️ Détails auto-affichés */}
        {villageId && (
          <>
            <div className="row mb-3">
              <div className="col-md-4"><strong>Commune :</strong> {details.nom_commune}</div>
              <div className="col-md-4"><strong>Province :</strong> {details.nom_province}</div>
              <div className="col-md-4"><strong>Région :</strong> {details.nom_region}</div>
            </div>
            <div className="row mb-4">
              <div className="col-md-4"><strong>Population Totale :</strong> {details.pop_total || 0}</div>
              <div className="col-md-4"><strong>Hommes :</strong> {details.hommes || 0}</div>
              <div className="col-md-4"><strong>Femmes :</strong> {details.femmes || 0}</div>
            </div>

            {/* 📋 Questions dynamique 2G */}
            <div className="mb-3">
              <label className="form-label">Site couvert par la 2G ?</label>
              <select name="site_2g" value={formData.site_2g} onChange={handleChange} className="form-select">
                <option value="">-- Choisir --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>

            {formData.site_2g === 'oui' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Appel téléphonique possible ?</label>
                  <select name="appel_possible" value={formData.appel_possible} onChange={handleChange} className="form-select">
                    <option value="">-- Choisir --</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>

                {formData.appel_possible === 'oui' && (
                  <div className="mb-3">
                    <label className="form-label">Compagnies disponibles</label>
                    {['Orange', 'Onatel', 'Telecel'].map(op => (
                      <div className="form-check" key={op}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="operateurs_appel"
                          value={op}
                          checked={formData.operateurs_appel.includes(op)}
                          onChange={handleChange}
                        />
                        <label className="form-check-label">{op}</label>
                      </div>
                    ))}
                  </div>
                )}

                {formData.appel_possible === 'non' && (
                  <div className="mb-3">
                    <label className="form-label">Pourquoi ?</label>
                    <select name="raison_pas_appel" value={formData.raison_pas_appel} onChange={handleChange} className="form-select">
                      <option value="">-- Sélectionner --</option>
                      <option value="incident">Incident</option>
                      <option value="jamais eu d'antenne">Jamais eu d'antenne</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="mb-3">
              <label className="form-label">Qualité 2G</label>
              <select name="qualite_2g" value={formData.qualite_2g} onChange={handleChange} className="form-select">
                <option value="">-- Choisir --</option>
                <option value="bonne">Bonne</option>
                <option value="moyenne">Moyenne</option>
                <option value="mauvaise">Mauvaise</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Antenne disponible ?</label>
              <select name="antenne" value={formData.antenne} onChange={handleChange} className="form-select">
                <option value="">-- Choisir --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>

            {formData.antenne === 'non' && (
              <div className="mb-3">
                <label className="form-label">Pourquoi ?</label>
                <select name="raison_pas_antenne" value={formData.raison_pas_antenne} onChange={handleChange} className="form-select">
                  <option value="">-- Sélectionner --</option>
                  <option value="incident">Incident</option>
                  <option value="jamais eu d'antenne">Jamais eu d'antenne</option>
                </select>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Site couvert par la 3G ?</label>
              <select name="site_3g" value={formData.site_3g} onChange={handleChange} className="form-select">
                <option value="">-- Choisir --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Internet disponible ?</label>
              <select name="internet" value={formData.internet} onChange={handleChange} className="form-select">
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
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="operateurs_internet"
                        value={op}
                        checked={formData.operateurs_internet.includes(op)}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">{op}</label>
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

            <div className="mb-3">
              <label className="form-label">Commentaire</label>
              <textarea
                name="commentaire"
                className="form-control"
                rows="3"
                value={formData.commentaire}
                onChange={handleChange}
                placeholder="Votre commentaire (25 mots max)"
              ></textarea>
              <div className="form-text text-danger">
                Nb: Ne pas dépasser 25 mots. ({wordCount}/25)
              </div>
            </div>

            <button className="btn btn-primary w-100 btn-hover">Enregistrer</button>
          </>
        )}
      </form>

      <ToastContainer position="top-right" autoClose={4000} />
    </div>
  );
};

export default AjoutInfos;
