import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Accueil.css';

function Accueil() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
  }, []);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/login");
    }, 1000); // 1 secondes
  };

  return (
    <div className="accueil-bg d-flex flex-column justify-content-center align-items-center vh-100 text-white text-center">
      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-light" role="status" style={{ width: '4rem', height: '4rem' }} />
          <p className="mt-3">Chargement...</p>
        </div>
      ) : (
        <div className={`accueil-content ${showContent ? 'fade-in' : ''}`}>
          <div className="geo-icon mb-3">
            <i className="bi bi-geo-fill"></i>
          </div>

          <h6 className="fw-bold text-uppercase text-light opacity-75 mb-2">Couverture360</h6>
          <h1 className="display-4 mb-3 animate-title">Bienvenue</h1>
          <p className="lead mb-4">Suivez la couverture réseau à travers le pays</p>
          <button onClick={handleStart} className="btn btn-outline-light px-5 py-2 rounded-pill fw-semibold start-btn">
            Démarrer
          </button>
        </div>
      )}
    </div>
  );
}

export default Accueil;
