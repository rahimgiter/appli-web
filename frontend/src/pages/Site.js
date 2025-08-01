import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AjouterSite = () => {
  const [localites, setLocalites] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const [typeSites, setTypeSites] = useState([]);
  const [sites, setSites] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    nom_site: '',
    latitude_site: '',
    longitude_site: '',
    id_localite: '',
    id_operateur: '',
    id_type_site: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resLocalites, resOperateurs, resTypeSites] = await Promise.all([
          axios.get('http://localhost/app-web/backend/api/getLocalites.php'),
          axios.get('http://localhost/app-web/backend/api/getOperateurs.php'),
          axios.get('http://localhost/app-web/backend/api/getTypeSites.php'),
        ]);
        setLocalites(resLocalites.data);
        setOperateurs(resOperateurs.data);
        setTypeSites(resTypeSites.data);
      } catch (error) {
        console.error('Erreur chargement des données :', error);
      }
    };

    fetchData();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    axios.post('http://localhost/app-web/backend/api/ajouter_site.php', formData)
      .then(() => {
        alert('✅ Site ajouté avec succès !');
        setFormData({
          nom_site: '',
          latitude_site: '',
          longitude_site: '',
          id_localite: '',
          id_operateur: '',
          id_type_site: ''
        });
      })
      .catch(err => {
        console.error(err);
        alert("❌ Erreur lors de l'enregistrement");
      });
  };

  const openModal = () => {
    axios.get('http://localhost/app-web/backend/api/getSites.php')
      .then(res => {
        setSites(res.data);
        setShowModal(true);
      })
      .catch(err => {
        console.error('Erreur chargement des sites :', err);
      });
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="container mt-5 mb-5">

      {/* Bouton afficher tous les sites */}
      <div className="mb-3 text-end">
        <button className="btn btn-outline-primary" onClick={openModal}>
          📋 Voir tous les sites enregistrés
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">📍 Liste des sites enregistrés</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                {sites.length > 0 ? (
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>Nom du site</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Localité</th>
                        <th>Opérateur</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map(site => (
                        <tr key={site.id_site}>
                          <td>{site.nom_site}</td>
                          <td>{site.latitude_site}</td>
                          <td>{site.longitude_site}</td>
                          <td>{site.nom_localite}</td>
                          <td>{site.nom_operateur}</td>
                          <td>{site.type_site}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Aucun site enregistré.</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="card shadow-lg border-0">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">📡 Ajouter un nouveau site</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>

            <div className="mb-3">
              <label className="form-label">Nom du site</label>
              <input
                type="text"
                className="form-control"
                name="nom_site"
                value={formData.nom_site}
                onChange={handleChange}
                required
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="0.00000001"
                  className="form-control"
                  name="latitude_site"
                  value={formData.latitude_site}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  step="0.00000001"
                  className="form-control"
                  name="longitude_site"
                  value={formData.longitude_site}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Localité</label>
              <select
                className="form-select"
                name="id_localite"
                value={formData.id_localite}
                onChange={handleChange}
                required
              >
                <option value="">-- Sélectionnez une localité --</option>
                {localites.map(loc => (
                  <option key={loc.id_localite} value={loc.id_localite}>
                    {loc.nom_localite}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Opérateur propriétaire</label>
              <select
                className="form-select"
                name="id_operateur"
                value={formData.id_operateur}
                onChange={handleChange}
                required
              >
                <option value="">-- Sélectionnez un opérateur --</option>
                {operateurs.map(op => (
                  <option key={op.id_operateur} value={op.id_operateur}>
                    {op.nom_operateur}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label">Type de site</label>
              <select
                className="form-select"
                name="id_type_site"
                value={formData.id_type_site}
                onChange={handleChange}
                required
              >
                <option value="">-- Choisissez un type --</option>
                {typeSites.map(type => (
                  <option key={type.id_type_site} value={type.id_type_site}>
                    {type.libelle_type}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-success w-100">
              💾 Enregistrer le site
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AjouterSite;
