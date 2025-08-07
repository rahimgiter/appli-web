import React, { useEffect, useState } from "react";
import axios from "axios";

const Sites = () => {
  const [localites, setLocalites] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const [typeSites, setTypeSites] = useState([]);
  const [trimestres, setTrimestres] = useState([]);
  const [sites, setSites] = useState([]);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);

  const [importData, setImportData] = useState({
    id_operateur: "",
    id_type_site: "",
    annee_site: "",
    id_trimestre: "",
  });

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          resLocalites,
          resOperateurs,
          resTypeSites,
          resTrimestres,
          resSites,
        ] = await Promise.all([
          axios.get("http://localhost/app-web/backend/api/getLocalites.php"),
          axios.get("http://localhost/app-web/backend/api/getOperateurs.php"),
          axios.get("http://localhost/app-web/backend/api/getTypeSites.php"),
          axios.get("http://localhost/app-web/backend/api/getTrimestres.php"),
          axios.get("http://localhost/app-web/backend/api/getSites.php"),
        ]);

        setLocalites(resLocalites.data);
        setOperateurs(resOperateurs.data);
        setTypeSites(resTypeSites.data);
        setTrimestres(resTrimestres.data);
        setSites(resSites.data);
      } catch (error) {
        console.error("Erreur de chargement :", error);
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
    const requiredFields = Object.keys(formData);
    const isEmpty = requiredFields.some((field) => !formData[field]);
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
          id_trimestre: "",
        });
        axios
          .get("http://localhost/app-web/backend/api/getSites.php")
          .then((res) => setSites(res.data));
        setAfficherFormulaire(false);
      })
      .catch((err) => {
        console.error(err);
        alert("❌ Erreur lors de l'enregistrement");
      });
  };

  const handleImportFile = (e) => setImportFile(e.target.files[0]);

  const handleImportChange = (e) => {
    const { name, value } = e.target;
    setImportData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importFile) return alert("❌ Veuillez sélectionner un fichier Excel.");

    const form = new FormData();
    form.append("file", importFile);
    form.append("id_operateur", importData.id_operateur);
    form.append("id_type_site", importData.id_type_site);
    form.append("annee_site", importData.annee_site);
    form.append("id_trimestre", importData.id_trimestre);

    axios
      .post("http://localhost/app-web/backend/api/importer_sites.php", form)
      .then(() => {
        alert("✅ Importation réussie");
        setShowImportForm(false);
        setImportFile(null);
        axios
          .get("http://localhost/app-web/backend/api/getSites.php")
          .then((res) => setSites(res.data));
      })
      .catch((err) => {
        console.error(err);
        alert("❌ Erreur lors de l'importation");
      });
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-end gap-2 mb-4">
        <button
          className="btn btn-outline-success"
          onClick={() => {
            setAfficherFormulaire(true);
            setShowImportForm(false);
          }}
        >
          ➕ Ajouter un site
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => {
            setShowImportForm(true);
            setAfficherFormulaire(false);
          }}
        >
          📥 Importer depuis Excel
        </button>
      </div>

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
                    name="annee_site"
                    className="form-control"
                    onChange={handleImportChange}
                    required
                    pattern="\d{4}"
                    placeholder="Ex : 2024"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Trimestre</label>
                  <select
                    name="id_trimestre"
                    className="form-select"
                    onChange={handleImportChange}
                    required
                  >
                    <option value="">-- Choisir --</option>
                    {trimestres.map((tri) => (
                      <option key={tri.id_trimestre} value={tri.id_trimestre}>
                        {tri.libelle_trimestre}
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

      {afficherFormulaire && (
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
                <label className="form-label">Opérateur</label>
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
                  title="Veuillez entrer une année valide ex: 2024"
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Trimestre</label>
                <select
                  className="form-select"
                  name="id_trimestre"
                  value={formData.id_trimestre}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Choisissez un trimestre --</option>
                  {trimestres.map((tri) => (
                    <option key={tri.id_trimestre} value={tri.id_trimestre}>
                      {tri.libelle_trimestre}
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
      )}

      {!afficherFormulaire && !showImportForm && (
        <div className="table-responsive">
          <h5 className="mb-3">📍 Liste des sites enregistrés</h5>
          <table className="table table-bordered table-hover table-striped">
            <thead className="table-dark">
              <tr>
                <th>Nom</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Localité</th>
                <th>Opérateur</th>
                <th>Type</th>
                <th>Année</th>
                <th>Trimestre</th>
              </tr>
            </thead>
            <tbody>
              {sites.length > 0 ? (
                sites.map((site) => (
                  <tr key={site.id_site}>
                    <td>{site.nom_site}</td>
                    <td>{site.latitude_site}</td>
                    <td>{site.longitude_site}</td>
                    <td>{site.nom_localite}</td>
                    <td>{site.nom_operateur}</td>
                    <td>{site.libelle_type}</td>
                    <td>{site.annee_site}</td>
                    <td>{site.libelle_trimestre}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    Aucun site enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Sites;
