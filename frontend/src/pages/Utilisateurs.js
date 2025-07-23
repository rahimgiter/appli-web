// src/pages/Utilisateurs.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Utilisateurs.css';

const Utilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [form, setForm] = useState({
    id_utilisateur: null,
    nom_famille: '',
    prenom: '',
    fonction: '',
    identifiant: '',
    mot_de_passe: '',
    role: 'utilisateur',
  });
  const [editMode, setEditMode] = useState(false);
  const [afficherMDP, setAfficherMDP] = useState(false);

  useEffect(() => {
    fetchUtilisateurs();
  }, []);

  const fetchUtilisateurs = () => {
    axios.get('http://localhost/app-web/backend/api/get_utilisateurs.php')
      .then(res => setUtilisateurs(res.data))
      .catch(err => console.error(err));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editMode
      ? 'http://localhost/app-web/backend/api/update_utilisateur.php'
      : 'http://localhost/app-web/backend/api/add_utilisateur.php';

    axios.post(url, form)
      .then(res => {
        if (res.data.success) {
          fetchUtilisateurs();
          resetForm();
        } else {
          alert("Erreur : " + res.data.message);
        }
      })
      .catch(err => console.error(err));
  };

  const handleEdit = (utilisateur) => {
    setForm(utilisateur);
    setAfficherMDP(false);
    setEditMode(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Confirmer la suppression de cet utilisateur ?")) {
      axios.post('http://localhost/app-web/backend/api/delete_utilisateur.php', {
        id_utilisateur: id
      })
        .then(res => {
          if (res.data.success) {
            fetchUtilisateurs();
          } else {
            alert("Erreur : " + res.data.message);
          }
        })
        .catch(err => console.error(err));
    }
  };

  const resetForm = () => {
    setForm({
      id_utilisateur: null,
      nom_famille: '',
      prenom: '',
      fonction: '',
      identifiant: '',
      mot_de_passe: '',
      role: 'utilisateur',
    });
    setAfficherMDP(false);
    setEditMode(false);
  };

  return (
    <div className="container mt-4">
      <h4 className="fw-bold text-primary mb-4">
        <i className="bi bi-people-fill me-2"></i> Gestion des utilisateurs
      </h4>

      <form onSubmit={handleSubmit} className="mb-4 shadow-sm p-4 bg-white rounded">
        <div className="row">
          <div className="col-md-4 mb-3">
            <label>Nom</label>
            <input type="text" name="nom_famille" value={form.nom_famille} onChange={handleChange} className="form-control" required />
          </div>
          <div className="col-md-4 mb-3">
            <label>Prénom</label>
            <input type="text" name="prenom" value={form.prenom} onChange={handleChange} className="form-control" required />
          </div>
          <div className="col-md-4 mb-3">
            <label>Fonction</label>
            <input type="text" name="fonction" value={form.fonction} onChange={handleChange} className="form-control" required />
          </div>
        </div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label>Identifiant</label>
            <input type="text" name="identifiant" value={form.identifiant} onChange={handleChange} className="form-control" required />
          </div>

          <div className="col-md-4 mb-3">
            <label>Mot de passe</label>
            <div className="input-group">
              <input
                type={afficherMDP ? 'text' : 'password'}
                name="mot_de_passe"
                value={form.mot_de_passe}
                onChange={handleChange}
                className="form-control"
                required
              />
              <span className="input-group-text" onClick={() => setAfficherMDP(!afficherMDP)} style={{ cursor: 'pointer' }}>
                <i className={`bi ${afficherMDP ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
              </span>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <label>Rôle</label>
            <select name="role" value={form.role} onChange={handleChange} className="form-select">
              <option value="utilisateur">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
        </div>

        <div className="text-end">
          <button type="submit" className="btn btn-primary">
            {editMode ? 'Modifier' : 'Créer'}
          </button>
          {editMode && <button type="button" className="btn btn-secondary ms-2" onClick={resetForm}>Annuler</button>}
        </div>
      </form>

      <table className="table table-bordered table-hover bg-white shadow-sm">
        <thead className="table-primary">
          <tr>
            <th>#</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Fonction</th>
            <th>Identifiant</th>
            <th>Rôle</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs.map((u, i) => (
            <tr key={u.id_utilisateur}>
              <td>{i + 1}</td>
              <td>{u.nom_famille}</td>
              <td>{u.prenom}</td>
              <td>{u.fonction}</td>
              <td>{u.identifiant}</td>
              <td>{u.role}</td>
              <td>
                <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(u)}>
                  <i className="bi bi-pencil-square"></i>
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id_utilisateur)}>
                  <i className="bi bi-trash-fill"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Utilisateurs;
