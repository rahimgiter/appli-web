import React, { useEffect, useState } from "react";
import axios from "axios";

const AjouterSite = () => {
  const [localites, setLocalites] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const [typeSites, setTypeSites] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [sites, setSites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState({
    id_operateur: "",
    id_type_site: "",
    annee_site: "",
    id_semestre: "",
  });

  const [formData, setFormData] = useState({
    nom_site: "",
    latitude_site: "",
    longitude_site: "",
    id_localite: "",
    id_operateur: "",
    id_type_site: "",
    annee_site: "",
    id_semestre: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          resLocalites,
          resOperateurs,
          resTypeSites,
          resSemestres,
        ] = await Promise.all([
          axios.get("http://localhost/app-web/backend/api/getLocalites.php"),
          axios.get("http://localhost/app-web/backend/api/getOperateurs.php"),
          axios.get("http://localhost/app-web/backend/api/getTypeSites.php"),
          axios.get("http://localhost/app-web/backend/api/getSemestres.php"),
        ]);

        setLocalites(resLocalites.data);
        setOperateurs(resOperateurs.data);
        setTypeSites(resTypeSites.data);
        setSemestres(resSemestres.data);
      } catch (error) {
        console.error("Erreur chargement des données :", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = [
      "nom_site",
      "latitude_site",
      "longitude_site",
      "id_localite",
      "id_operateur",
      "id_type_site",
      "annee_site",
      "id_semestre",
    ];

    const isEmpty = requiredFields.some((f) => !formData[f]);
    if (isEmpty) return alert("❌ Veuillez remplir tous les champs !");

    axios
      .post("http://localhost/app-web/backend/api/ajouter_site.php", formData)
      .then(() => {
        alert("✅ Site ajouté avec succès !");
        setFormData({
          nom_site: "",
          latitude_site: "",
          longitude_site: "",
          id_localite: "",
          id_operateur: "",
          id_type_site: "",
          annee_site: "",
          id_semestre: "",
        });
      })
      .catch((err) => {
        console.error(err);
        alert("❌ Erreur lors de l'enregistrement");
      });
  };

  const openModal = () => {
    axios
      .get("http://localhost/app-web/backend/api/getSites.php")
      .then((res) => {
        setSites(res.data);
        setShowModal(true);
      })
      .catch((err) => {
        console.error("Erreur chargement des sites :", err);
      });
  };

  const closeModal = () => setShowModal(false);

  const handleImportFile = (e) => setImportFile(e.target.files[0]);
  const handleImportChange = (e) => {
    const { name, value } = e.target;
    setImportData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importFile) return alert("Veuillez sélectionner un fichier Excel.");

    const form = new FormData();
    form.append("file", importFile);
    form.append("id_operateur", importData.id_operateur);
    form.append("id_type_site", importData.id_type_site);
    form.append("annee_site", importData.annee_site);
    form.append("id_semestre", importData.id_semestre);

    axios
      .post("http://localhost/app-web/backend/api/importer_sites.php", form)
      .then((res) => {
        alert("✅ Importation réussie");
        setShowImportForm(false);
        setImportFile(null);
      })
      .catch((err) => {
        console.error(err);
        alert("❌ Erreur lors de l'importation");
      });
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="mb-3 text-end">
        <button className="btn btn-outline-primary me-2" onClick={openModal}>
          📋 Voir tous les sites enregistrés
        </button>
        <button
          className="btn btn-outline-success"
          onClick={() => setShowImportForm(!showImportForm)}
        >
          📥 Importer des sites via Excel
        </button>
      </div>

      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">📍 Liste des sites enregistrés</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
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
                        <th>Année</th>
                        <th>Semestre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((site) => (
                        <tr key={site.id_site}>
                          <td>{site.nom_site}</td>
                          <td>{site.latitude_site}</td>
                          <td>{site.longitude_site}</td>
                          <td>{site.nom_localite}</td>
                          <td>{site.nom_operateur}</td>
                          <td>{site.libelle_type}</td>
                          <td>{site.annee_site}</td>
                          <td>{site.libelle_semestre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Aucun site enregistré.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportForm && (
        <div className="card border-primary mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">📥 Importer des sites via un fichier Excel</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleImportSubmit}>
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label">Opérateur</label>
                  <select
                    name="id_operateur"
                    className="form-select"
                    onChange={handleImportChange}
                    required
                  >
                    <option value="">-- Choisir --</option>
                    {operateurs.map((op) => (
                      <option key={op.id_operateur} value={op.id_operateur}>
                        {op.nom_operateur}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Type de site</label>
                  <select
                    name="id_type_site"
                    className="form-select"
                    onChange={handleImportChange}
                    required
                  >
                    <option value="">-- Choisir --</option>
                    {typeSites.map((type) => (
                      <option key={type.id_type_site} value={type.id_type_site}>
                        {type.libelle_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label">Année</label>
                  <input
                    type="text"
                    className="form-control"
                    name="annee_site"
                    onChange={handleImportChange}
                    required
                    pattern="\d{4}"
                    placeholder="Ex : 2024"
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Semestre</label>
                  <select
                    name="id_semestre"
                    className="form-select"
                    onChange={handleImportChange}
                    required
                  >
                    <option value="">-- Choisir --</option>
                    {semestres.map((s) => (
                      <option key={s.id_semestre} value={s.id_semestre}>
                        {s.libelle_semestre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label">Fichier Excel</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="form-control"
                    onChange={handleImportFile}
                    required
                  />
                </div>
              </div>
              <button className="btn btn-primary" type="submit">
                🚀 Importer maintenant
              </button>
            </form>
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
                {localites.map((loc) => (
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
                {operateurs.map((op) => (
                  <option key={op.id_operateur} value={op.id_operateur}>
                    {op.nom_operateur}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Type de site</label>
              <select
                className="form-select"
                name="id_type_site"
                value={formData.id_type_site}
                onChange={handleChange}
                required
              >
                <option value="">-- Choisissez un type --</option>
                {typeSites.map((type) => (
                  <option key={type.id_type_site} value={type.id_type_site}>
                    {type.libelle_type}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Année</label>
              <input
                type="text"
                className="form-control"
                name="annee_site"
                placeholder="Exemple : 2024"
                value={formData.annee_site}
                onChange={handleChange}
                required
                pattern="\d{4}"
                title="Veuillez entrer une année valide sur 4 chiffres, ex: 2024"
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Semestre</label>
              <select
                className="form-select"
                name="id_semestre"
                value={formData.id_semestre}
                onChange={handleChange}
                required
              >
                <option value="">-- Choisissez un semestre --</option>
                {semestres.map((sem) => (
                  <option key={sem.id_semestre} value={sem.id_semestre}>
                    {sem.libelle_semestre}
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
