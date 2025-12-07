import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Archives.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import toast, { Toaster } from 'react-hot-toast';
import * as bootstrap from 'bootstrap';
import FormulaireInfos from '../components/FormulaireInfos';
import { useAuth } from './AuthContext';

const Archives = ({ refreshKey = 0 }) => {
  const { user, isAuthenticated } = useAuth();
  const [archives, setArchives] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [wordCount, setWordCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost/app-web/backend/api/archives.php');
      const data = Array.isArray(res.data) ? res.data : [];
      setArchives(data);
    } catch (err) {
      console.error(err);
      setArchives([]);
      toast.error('Impossible de charger les archives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchArchives();
    }
  }, [refreshKey, isAuthenticated]);

  const handleCardClick = async (form) => {
    setSelectedForm(form);
    setWordCount(form.commentaire?.split(/\s+/).length || 0);
    setEditMode(false);
    setFormData({
      ...form,
      operateurs_appel: form.operateurs_appel?.split(',') || [],
      operateurs_internet: form.operateurs_internet?.split(',') || []
    });

    // Charger détails localité
    try {
      const res = await axios.get(`http://localhost/app-web/backend/api/village-details.php?id=${form.id_localite}`);
      setDetails(res.data || {});
    } catch (e) {
      console.error("Erreur détails localité", e);
      setDetails({});
    }

    const modal = new bootstrap.Modal(document.getElementById('archiveModal'));
    modal.show();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'commentaire') {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length <= 25) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setWordCount(words.length);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => {
        const updated = prev[name]?.includes(value)
          ? prev[name].filter(v => v !== value)
          : [...(prev[name] || []), value];
        return { ...prev, [name]: updated };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async () => {
    try {
      const updatedData = {
        ...formData,
        operateurs_appel: formData.operateurs_appel.join(','),
        operateurs_internet: formData.operateurs_internet.join(','),
        id: selectedForm.id,
        id_utilisateur: user?.id_utilisateur
      };

      const res = await axios.post('http://localhost/app-web/backend/api/archives_update.php', updatedData);
      
      if (res.data.success) {
        fetchArchives();
        bootstrap.Modal.getInstance(document.getElementById('archiveModal')).hide();
        toast.success('✅ Formulaire mis à jour avec succès !');
        setEditMode(false);
      } else {
        toast.error("❌ Erreur lors de l'enregistrement : " + res.data.message);
      }
    } catch (err) {
      console.error("Erreur update", err);
      toast.error('❌ Erreur lors de la mise à jour.');
    }
  };

  const handleDelete = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce formulaire ? Cette action est irréversible.")) {
      axios.post('http://localhost/app-web/backend/api/archives_delete.php', { 
        id: selectedForm.id,
        id_utilisateur: user?.id_utilisateur
      })
        .then(res => {
          if (res.data.success) {
            setArchives(prev => prev.filter(a => a.id !== selectedForm.id));
            bootstrap.Modal.getInstance(document.getElementById('archiveModal')).hide();
            toast.success('✅ Formulaire supprimé avec succès !');
          } else {
            toast.error("❌ Erreur lors de la suppression : " + res.data.message);
          }
        })
        .catch(err => {
          console.error("Erreur suppression", err);
          toast.error('❌ Erreur lors de la suppression.');
        });
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData({
      ...selectedForm,
      operateurs_appel: selectedForm.operateurs_appel?.split(',') || [],
      operateurs_internet: selectedForm.operateurs_internet?.split(',') || []
    });
    setWordCount(selectedForm.commentaire?.split(/\s+/).length || 0);
  };

  if (!isAuthenticated) {
    return (
      <div className="archives-container">
        <div className="archives-header">
          <div className="header-content">
            <i className="bi bi-archive-fill icon-large"></i>
            <div>
              <h1 className="page-title">Mes Archives</h1>
              <p className="page-subtitle">Consultez et gérez tous vos formulaires enregistrés</p>
            </div>
          </div>
        </div>
        <div className="alert-warning">
          <i className="bi bi-exclamation-triangle"></i>
          <span>Vous devez être connecté pour accéder à vos archives.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { 
          background: '#363636', 
          color: '#fff',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500'
        },
        success: { 
          style: { 
            background: '#10b981',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
          } 
        },
        error: { 
          style: { 
            background: '#ef4444',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
          } 
        },
      }} />

      <div className="archives-container">
        {/* En-tête */}
        <div className="archives-header">
          <div className="header-content">
            <i className="bi bi-archive-fill icon-large"></i>
            <div>
              <h1 className="page-title">Mes Archives</h1>
              <p className="page-subtitle">
                {isAuthenticated && `Connecté en tant que ${user?.prenom} ${user?.nom_famille}`}
              </p>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="archives-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <h3>Chargement des archives...</h3>
              <p>Récupération de vos formulaires enregistrés</p>
            </div>
          ) : archives.length > 0 ? (
            <div className="archives-grid">
              {archives.map(form => (
                <div className="archive-card" key={form.id} onClick={() => handleCardClick(form)}>
                  <div className="card-icon">
                    <i className="bi bi-file-earmark-text-fill"></i>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{form.nom_localite || 'Localité sans nom'}</h3>
                    <p className="card-subtitle">{form.nom_departement || 'Département non spécifié'}</p>
                    <div className="card-meta">
                      <div className="meta-item">
                        <i className="bi bi-calendar"></i>
                        <span>{form.created_at || 'Date inconnue'}</span>
                      </div>
                      <div className="meta-item">
                        <i className="bi bi-person"></i>
                        <span>{form.auteur || 'Utilisateur'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-badge">
                    <i className="bi bi-chevron-right"></i>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-archive"></i>
              </div>
              <h3>Aucun formulaire trouvé</h3>
              <p>Vous n'avez pas encore enregistré de formulaires.</p>
            </div>
          )}
        </div>

        {/* Modal */}
        <div className="modal fade" id="archiveModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content archive-modal-content">
              {selectedForm && (
                <>
                  <div className="modal-header archive-modal-header">
                    <div className="modal-title-section">
                      <i className="bi bi-file-earmark-text modal-icon"></i>
                      <div>
                        <h5 className="modal-title">Formulaire - {selectedForm.nom_localite || '—'}</h5>
                        <p className="modal-subtitle">Détails du formulaire de couverture réseau</p>
                      </div>
                    </div>
                    <button type="button" className="btn-close-modal" data-bs-dismiss="modal">
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  
                  <div className="modal-body archive-modal-body">
                    {/* Informations de la localité */}
                    <div className="village-info-section">
                      <h6 className="section-title">
                        <i className="bi bi-info-circle me-2"></i>
                        Informations Générales
                      </h6>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Département</span>
                          <span className="info-value">{selectedForm.nom_departement || '—'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Province</span>
                          <span className="info-value">{selectedForm.nom_province || '—'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Région</span>
                          <span className="info-value">{selectedForm.nom_region || '—'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Auteur</span>
                          <span className="info-value highlight">{selectedForm.auteur || 'Utilisateur'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Date de création</span>
                          <span className="info-value">{selectedForm.created_at || '—'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Dernière modification</span>
                          <span className="info-value">{selectedForm.updated_at || selectedForm.created_at || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Formulaire */}
                    <div className="form-section">
                      <h6 className="section-title">
                        <i className="bi bi-clipboard-data me-2"></i>
                        Données de Couverture Réseau
                      </h6>
                      <FormulaireInfos
                        formData={formData}
                        handleChange={handleChange}
                        wordCount={wordCount}
                        editMode={editMode}
                      />
                    </div>
                  </div>
                  
                  <div className="modal-footer archive-modal-footer">
                    {editMode ? (
                      <div className="edit-actions">
                        <button className="btn-save" onClick={handleUpdate}>
                          <i className="bi bi-save me-2"></i>
                          Enregistrer les modifications
                        </button>
                        <button className="btn-cancel" onClick={handleCancelEdit}>
                          <i className="bi bi-x-circle me-2"></i>
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="view-actions">
                        <button className="btn-edit" onClick={() => setEditMode(true)}>
                          <i className="bi bi-pencil-square me-2"></i>
                          Modifier le formulaire
                        </button>
                        <button className="btn-delete" onClick={handleDelete}>
                          <i className="bi bi-trash3 me-2"></i>
                          Supprimer
                        </button>
                        <button className="btn-close" data-bs-dismiss="modal">
                          <i className="bi bi-x-lg me-2"></i>
                          Fermer
                        </button>
                      </div>
                    )}
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

export default Archives;