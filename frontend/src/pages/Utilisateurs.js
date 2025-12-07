import React, { useState, useEffect } from 'react';
import './Utilisateurs.css';

function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState({ show: false, success: false, message: '' });

  // État du formulaire
  const [formData, setFormData] = useState({
    nom_famille: '',
    prenom: '',
    fonction: '',
    email: '',
    mot_de_passe: '',
    role: 'observateur'
  });

  // Charger la liste des utilisateurs
  const chargerUtilisateurs = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement des utilisateurs...');
      const response = await fetch('http://localhost/app-web/backend/api/get_users.php');
      const result = await response.json();
      
      console.log('📦 Réponse reçue:', result);
      
      if (result.success) {
        setUtilisateurs(result.utilisateurs);
        console.log(`✅ ${result.utilisateurs.length} utilisateurs chargés`);
      } else {
        console.error('❌ Erreur chargement:', result.message);
        setNotification({
          show: true,
          success: false,
          message: result.message || 'Erreur lors du chargement des utilisateurs'
        });
      }
    } catch (error) {
      console.error('❌ Erreur fetch:', error);
      setNotification({
        show: true,
        success: false,
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  // Gérer les changements du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Créer un nouvel utilisateur
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔄 Création utilisateur:', formData);
      const response = await fetch('http://localhost/app-web/backend/api/create_user.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      console.log('📦 Réponse création:', result);

      if (result.success) {
        setNotification({
          show: true,
          success: true,
          message: 'Utilisateur créé avec succès !'
        });
        setFormData({
          nom_famille: '',
          prenom: '',
          fonction: '',
          email: '',
          mot_de_passe: '',
          role: 'observateur'
        });
        setShowForm(false);
        chargerUtilisateurs();
      } else {
        setNotification({
          show: true,
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('❌ Erreur création:', error);
      setNotification({
        show: true,
        success: false,
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  // Basculer l'état actif/inactif d'un utilisateur
  const basculerEtatUtilisateur = async (id_utilisateur, nomComplet, estActif) => {
    const action = estActif ? 'désactiver' : 'réactiver';
    
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action} l'utilisateur "${nomComplet}" ?`)) {
      return;
    }

    try {
      const endpoint = estActif 
        ? 'http://localhost/app-web/backend/api/desactiver_utilisateur.php'
        : 'http://localhost/app-web/backend/api/reactiver_utilisateur.php';

      console.log(`🔄 ${action} utilisateur ${id_utilisateur}`);
      console.log('📤 Endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_utilisateur })
      });

      const result = await response.json();
      console.log(`📦 Réponse ${action}:`, result);

      if (result.success) {
        setNotification({
          show: true,
          success: true,
          message: `Utilisateur "${nomComplet}" ${estActif ? 'désactivé' : 'réactivé'} avec succès`
        });
        chargerUtilisateurs();
      } else {
        setNotification({
          show: true,
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error(`❌ Erreur ${action}:`, error);
      setNotification({
        show: true,
        success: false,
        message: 'Erreur de connexion au serveur'
      });
    }
  };

  // Fermer la notification
  const fermerNotification = () => {
    setNotification({ show: false, success: false, message: '' });
  };

  // Réinitialiser le formulaire
  const reinitialiserFormulaire = () => {
    setFormData({
      nom_famille: '',
      prenom: '',
      fonction: '',
      email: '',
      mot_de_passe: '',
      role: 'observateur'
    });
    setShowForm(false);
  };

  return (
    <div className="utilisateurs-container">
      <div className="utilisateurs-header">
        <h2>Gestion des Utilisateurs</h2>
        <p>Créez et gérez les comptes utilisateurs</p>
      </div>

      {notification.show && (
        <div className={`notification ${notification.success ? 'success' : 'error'}`}>
          <span>{notification.message}</span>
          <button onClick={fermerNotification} className="notification-close">
            ×
          </button>
        </div>
      )}

      <div className="utilisateurs-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <i className="bi bi-person-plus me-2"></i>
          {showForm ? 'Annuler' : 'Nouvel Utilisateur'}
        </button>
        <button 
          className="btn btn-outline-secondary"
          onClick={chargerUtilisateurs}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Actualiser
        </button>
      </div>

      {showForm && (
        <div className="creation-form">
          <h4>Créer un nouvel utilisateur</h4>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                  placeholder="Jean"
                />
              </div>
              <div className="form-group">
                <label>Nom de famille *</label>
                <input
                  type="text"
                  name="nom_famille"
                  value={formData.nom_famille}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Fonction *</label>
              <input
                type="text"
                name="fonction"
                value={formData.fonction}
                onChange={handleInputChange}
                className="form-control"
                required
                placeholder="Chef de projet"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-control"
                required
                placeholder="jean.dupont@example.com"
              />
            </div>

            <div className="row">
              <div className="form-group">
                <label>Mot de passe *</label>
                <input
                  type="password"
                  name="mot_de_passe"
                  value={formData.mot_de_passe}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                  minLength="6"
                  placeholder="••••••"
                />
                <small className="text-muted">Minimum 6 caractères</small>
              </div>
              <div className="form-group">
                <label>Rôle *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="observateur">Observateur</option>
                  <option value="technicien">Technicien</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Créer l'utilisateur
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={reinitialiserFormulaire}
                disabled={loading}
              >
                <i className="bi bi-x-lg me-2"></i>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="utilisateurs-list">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Liste des Utilisateurs</h4>
          <div>
            <span className="badge bg-success me-2">
              <i className="bi bi-check-circle me-1"></i>
              {utilisateurs.filter(u => u.actif).length} Actifs
            </span>
            <span className="badge bg-secondary">
              <i className="bi bi-pause-circle me-1"></i>
              {utilisateurs.filter(u => !u.actif).length} Inactifs
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary"></div>
            <p>Chargement des utilisateurs...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Fonction</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      <i className="bi bi-people display-4 d-block mb-2"></i>
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  utilisateurs.map(utilisateur => (
                    <tr key={utilisateur.id_utilisateur} className={!utilisateur.actif ? 'table-secondary' : ''}>
                      <td>
                        <div>
                          <strong>{utilisateur.prenom} {utilisateur.nom_famille}</strong>
                          <br />
                          <small className="text-muted">#{utilisateur.id_utilisateur}</small>
                        </div>
                      </td>
                      <td>{utilisateur.email}</td>
                      <td>{utilisateur.fonction}</td>
                      <td>
                        <span className={`badge ${
                          utilisateur.role === 'admin' ? 'bg-danger' :
                          utilisateur.role === 'technicien' ? 'bg-warning' : 'bg-info'
                        }`}>
                          <i className={`bi ${
                            utilisateur.role === 'admin' ? 'bi-shield-check' :
                            utilisateur.role === 'technicien' ? 'bi-tools' : 'bi-eye'
                          } me-1`}></i>
                          {utilisateur.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${utilisateur.actif ? 'bg-success' : 'bg-secondary'}`}>
                          <i className={`bi ${utilisateur.actif ? 'bi-check-circle' : 'bi-pause-circle'} me-1`}></i>
                          {utilisateur.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${utilisateur.actif ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => basculerEtatUtilisateur(
                            utilisateur.id_utilisateur, 
                            `${utilisateur.prenom} ${utilisateur.nom_famille}`,
                            utilisateur.actif
                          )}
                          title={utilisateur.actif ? "Désactiver" : "Réactiver"}
                        >
                          <i className={`bi ${utilisateur.actif ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Utilisateurs;