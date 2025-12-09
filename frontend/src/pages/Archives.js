import React, { useEffect, useState, useRef } from 'react';
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

  // refs pour modal bootstrap
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

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

  // initialisation du modal (une seule fois)
  useEffect(() => {
    if (modalRef.current && !bsModalRef.current) {
      bsModalRef.current = new bootstrap.Modal(modalRef.current, { 
        backdrop: false,
        keyboard: true 
      });
    }
    return () => {
      if (bsModalRef.current) {
        try { bsModalRef.current.hide(); bsModalRef.current.dispose(); } catch (e) { /* ignore */ }
        bsModalRef.current = null;
      }
    };
  }, []);

  const handleCardClick = async (form) => {
    // Préparer l'état du formulaire (array pour checkboxes)
    const prepared = {
      ...form,
      operateurs_appel: form.operateurs_appel ? form.operateurs_appel.split(',') : [],
      operateurs_internet: form.operateurs_internet ? form.operateurs_internet.split(',') : []
    };

    setSelectedForm(form);
    setFormData(prepared);
    setWordCount(form.commentaire ? form.commentaire.trim().split(/\s+/).filter(Boolean).length : 0);
    setEditMode(false);

    // Charger détails localité (ne bloque pas l'ouverture)
    try {
      const res = await axios.get(`http://localhost/app-web/backend/api/village-details.php?id=${form.id_localite}`);
      setDetails(res.data || {});
    } catch (e) {
      console.error("Erreur détails localité", e);
      setDetails({});
    }

    // Afficher le modal
    if (bsModalRef.current) {
      bsModalRef.current.show();
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'commentaire') {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length <= 25) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setWordCount(words.length);
      } else {
        // on peut prévenir l'utilisateur si on veut
        return;
      }
    } else if (type === 'checkbox') {
      setFormData(prev => {
        const current = Array.isArray(prev[name]) ? prev[name] : [];
        const updated = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value];
        return { ...prev, [name]: updated };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async () => {
    if (!selectedForm) {
      toast.error("Aucun formulaire sélectionné.");
      return;
    }
    try {
      const updatedData = {
        ...formData,
        operateurs_appel: Array.isArray(formData.operateurs_appel) ? formData.operateurs_appel.join(',') : (formData.operateurs_appel || ''),
        operateurs_internet: Array.isArray(formData.operateurs_internet) ? formData.operateurs_internet.join(',') : (formData.operateurs_internet || ''),
        id: selectedForm.id,
        id_utilisateur: user?.id_utilisateur
      };

      const res = await axios.post('http://localhost/app-web/backend/api/archives_update.php', updatedData);

      if (res.data && res.data.success) {
        await fetchArchives();
        bsModalRef.current?.hide();
        toast.success('✅ Formulaire mis à jour avec succès !');
        setEditMode(false);
      } else {
        const msg = res.data?.message || 'Erreur inconnue';
        toast.error("❌ Erreur lors de l'enregistrement : " + msg);
      }
    } catch (err) {
      console.error("Erreur update", err);
      toast.error('❌ Erreur lors de la mise à jour.');
    }
  };

  const handleDelete = async () => {
    if (!selectedForm) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce formulaire ? Cette action est irréversible.")) return;

    try {
      const res = await axios.post('http://localhost/app-web/backend/api/archives_delete.php', {
        id: selectedForm.id,
        id_utilisateur: user?.id_utilisateur
      });

      if (res.data && res.data.success) {
        setArchives(prev => prev.filter(a => a.id !== selectedForm.id));
        bsModalRef.current?.hide();
        toast.success('✅ Formulaire supprimé avec succès !');
      } else {
        toast.error("❌ Erreur lors de la suppression : " + (res.data?.message || 'Erreur inconnue'));
      }
    } catch (err) {
      console.error("Erreur suppression", err);
      toast.error('❌ Erreur lors de la suppression.');
    }
  };

  const handleCancelEdit = () => {
    if (!selectedForm) return;
    setEditMode(false);
    setFormData({
      ...selectedForm,
      operateurs_appel: selectedForm.operateurs_appel ? selectedForm.operateurs_appel.split(',') : [],
      operateurs_internet: selectedForm.operateurs_internet ? selectedForm.operateurs_internet.split(',') : []
    });
    setWordCount(selectedForm.commentaire ? selectedForm.commentaire.trim().split(/\s+/).filter(Boolean).length : 0);
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

        {/* Modal - avec backdrop semi-transparent cliquable */}
        <div className="modal fade" id="archiveModal" ref={modalRef} tabIndex="-1" aria-labelledby="archiveModalLabel" aria-hidden="true" data-bs-backdrop="false" data-bs-keyboard="true">
          <div className="modal-backdrop-custom show"></div>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content archive-modal-content">
              {selectedForm && (
                <>
                  <div className="modal-header archive-modal-header">
                    <div className="modal-title-section">
                      <i className="bi bi-file-earmark-text modal-icon"></i>
                      <div>
                        <h5 className="modal-title" id="archiveModalLabel">Formulaire - {selectedForm.nom_localite || '—'}</h5>
                        <p className="modal-subtitle">Détails du formulaire de couverture réseau</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                      onClick={() => bsModalRef.current?.hide()}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>

                  <div className="modal-body archive-modal-body">
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