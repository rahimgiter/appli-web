// src/pages/Archives.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Archives.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import toast, { Toaster } from 'react-hot-toast';
import * as bootstrap from 'bootstrap';
import FormulaireInfos from '../components/FormulaireInfos';

const Archives = ({ onRead = () => {} }) => {
  const [archives, setArchives] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [wordCount, setWordCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [details, setDetails] = useState({});

  const fetchArchives = async () => {
    try {
      const res = await axios.get('http://localhost/app-web/backend/api/archives.php');
      setArchives(res.data);
      onRead();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleCardClick = async (form) => {
    setSelectedForm(form);
    setWordCount(form.commentaire?.split(/\s+/).length || 0);
    setEditMode(false);
    setFormData({
      ...form,
      operateurs_appel: form.operateurs_appel?.split(',') || [],
      operateurs_internet: form.operateurs_internet?.split(',') || []
    });

    try {
      const res = await axios.get(`http://localhost/app-web/backend/api/village-details.php?id=${form.id_village}`);
      setDetails(res.data);
    } catch (e) {
      console.error("Erreur détails village", e);
    }

    const modal = new bootstrap.Modal(document.getElementById('archiveModal'));
    modal.show();
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

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

  const handleUpdate = () => {
    const updatedData = {
      ...formData,
      operateurs_appel: formData.operateurs_appel.join(','),
      operateurs_internet: formData.operateurs_internet.join(','),
      id: selectedForm.id
    };

    axios.post('http://localhost/app-web/backend/api/archives_update.php', updatedData)
      .then((res) => {
        if (res.data.success) {
          fetchArchives();
          bootstrap.Modal.getInstance(document.getElementById('archiveModal')).hide();
        } else {
          toast.error("Erreur lors de l'enregistrement : " + res.data.message);
        }
      })
      .catch(err => console.error("Erreur update", err));
  };

  const handleDelete = () => {
    if (window.confirm("Voulez-vous supprimer ce formulaire ?")) {
      axios.post('http://localhost/app-web/backend/api/archives_delete.php', { id: selectedForm.id })
        .then((res) => {
          if (res.data.success) {
            setArchives(prev => prev.filter(a => a.id !== selectedForm.id));
            bootstrap.Modal.getInstance(document.getElementById('archiveModal')).hide();
          } else {
            toast.error("Erreur suppression : " + res.data.message);
          }
        })
        .catch(err => console.error("Erreur suppression", err));
    }
  };

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <div className="container mt-4">
      <h4 className="fw-bold text-primary mb-4">
        <i className="bi bi-archive-fill me-2"></i>
        Fichiers enregistrés
      </h4>

      <div className="row">
        {archives.length > 0 ? (
          archives.map((form) => (
            <div className="col-md-4 mb-4" key={form.id}>
              <div className="card archive-card shadow-sm" onClick={() => handleCardClick(form)} style={{ cursor: 'pointer' }}>
                <div className="card-body text-center">
                  <i className="bi bi-file-earmark-text-fill fs-1 text-primary"></i>
                  <h6 className="mt-2 fw-bold">Fichier - {form.nom_village}</h6>
                  <p className="text-muted small mb-0">{form.created_at}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">Aucun fichier trouvé.</p>
        )}
      </div>

      {/* 🔽 Modal Bootstrap */}
      <div className="modal fade" id="archiveModal" tabIndex="-1" aria-labelledby="archiveModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            {selectedForm && (
              <>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Formulaire - {selectedForm.nom_village}
                  </h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <strong>Commune :</strong> {details.nom_commune} <br />
                    <strong>Province :</strong> {details.nom_province} <br />
                    <strong>Région :</strong> {details.nom_region} <br />
                    <strong>Auteur :</strong> {selectedForm.auteur || '—'} <br />
                    <strong>Date :</strong> {selectedForm.created_at}
                  </div>

                  <FormulaireInfos
                    formData={formData}
                    handleChange={handleChange}
                    wordCount={wordCount}
                    editMode={editMode}
                  />
                </div>

                <div className="modal-footer">
                  {editMode ? (
                    <>
                      <button className="btn btn-success" onClick={handleUpdate}>
                        <i className="bi bi-save me-1"></i>Enregistrer
                      </button>
                      <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                        <i className="bi bi-x-circle me-1"></i>Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-warning" onClick={() => setEditMode(true)}>
                        <i className="bi bi-pencil-square me-1"></i>Modifier
                      </button>
                      <button className="btn btn-danger" onClick={handleDelete}>
                        <i className="bi bi-trash3 me-1"></i>Supprimer
                      </button>
                      <button className="btn btn-secondary" data-bs-dismiss="modal">
                        <i className="bi bi-x-lg me-1"></i>Fermer
                      </button>
                    </>
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
