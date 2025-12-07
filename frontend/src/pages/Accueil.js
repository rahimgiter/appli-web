import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col, Spinner } from 'react-bootstrap';
import { FiMapPin, FiArrowRight } from 'react-icons/fi';
import './Accueil.css';

function Accueil() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoverEffect, setHoverEffect] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="accueil-blue">
      {/* Vagues animées */}
      <div className="waves">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>
      
      {/* CONTENEUR FORCÉ AU CENTRE ABSOLU */}
      <div className="forced-center-container">
        <div className="forced-center-content">
          {loading ? (
            <div className="loading-center">
              <div className="spinner-center">
                <Spinner 
                  animation="border" 
                  variant="light"
                  className="spinner-white"
                />
              </div>
              <p className="text-white-50 mb-0">Connexion...</p>
            </div>
          ) : (
            <div className={`content-center ${showContent ? 'fade-in-up' : 'opacity-0'}`}>
              
              {/* Logo */}
              <div className="brand-center">
                <div className="logo-center">
                  <div className="logo-circle-white">
                    <FiMapPin className="logo-icon-white" />
                  </div>
                </div>
                <h1 className="brand-name-center">Couverture360</h1>
              </div>

              {/* Contenu */}
              <div className="text-center">
                <h2 className="slogan-center">
                  La couverture réseau national en un seul clic !
                </h2>
                
                <p className="description-center">
                  Découvrez la couverture réseau mobile à l'échelle nationale avec Couverture360.
                </p>

                {/* Bouton */}
                <div className="button-center">
                  <Button
                    onClick={handleStart}
                    onMouseEnter={() => setHoverEffect(true)}
                    onMouseLeave={() => setHoverEffect(false)}
                    size="lg"
                    className="cta-button-white px-4 py-2 rounded-pill"
                    disabled={loading}
                  >
                    <span className="button-content d-flex align-items-center justify-content-center gap-2">
                      {loading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <>
                          Se connecter
                          <FiArrowRight className={`arrow-icon-white ${hoverEffect ? 'slide' : ''}`} />
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Accueil;