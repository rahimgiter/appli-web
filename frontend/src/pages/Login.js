import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiMapPin, FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiArrowRight } from 'react-icons/fi';
import './Login.css';

function Login() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [hoverEffect, setHoverEffect] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !motDePasse) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Format d\'email invalide');
      return;
    }

    setChargement(true);

    try {
      const result = await login(email.trim().toLowerCase(), motDePasse);
      
      if (result.success) {
        toast.success('Connexion réussie');
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        toast.error('Identifiants incorrects');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="login-no-scroll">
      {/* Vagues animées */}
      <div className="waves">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      {/* Conteneur principal SANS scroll */}
      <div className="login-compact-container">
        
        {/* Header compact */}
        <div className="login-compact-header">
          <div className="logo-compact">
            <div className="logo-circle-white">
              <FiMapPin className="logo-icon-white" />
            </div>
          </div>
          <h1 className="brand-name-compact">Couverture360</h1>
        </div>

        {/* Grille ultra compacte */}
        <div className="login-compact-grid">
          
          {/* Carte connexion compacte */}
          <div className="login-compact-card">
            <div className="login-card-compact-header">
              <FiMail className="card-icon-white" />
              <h2>Connexion</h2>
              <p>Accédez à votre compte</p>
            </div>

            <form onSubmit={handleSubmit} className="login-compact-form">
              <div className="input-compact-group">
                <FiMail className="input-icon-white" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={chargement}
                />
              </div>

              <div className="input-compact-group">
                <FiLock className="input-icon-white" />
                <input
                  type={afficherMotDePasse ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  disabled={chargement}
                />
                <div 
                  className="password-compact-toggle"
                  onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                >
                  {afficherMotDePasse ? <FiEyeOff /> : <FiEye />}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={chargement} 
                className="cta-button-white login-compact-btn"
                onMouseEnter={() => setHoverEffect(true)}
                onMouseLeave={() => setHoverEffect(false)}
              >
                {chargement ? (
                  <div className="login-spinner"></div>
                ) : (
                  <>
                    Se connecter
                    <FiArrowRight className={`arrow-icon-white ${hoverEffect ? 'slide' : ''}`} />
                  </>
                )}
              </button>
            </form>

            <div className="login-compact-footer">
              <Link to="/forgot-password" className="login-link-compact">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          {/* Séparateur vertical compact */}
          <div className="login-compact-separator">
            <div className="separator-dot-compact"></div>
            <span>OU</span>
            <div className="separator-dot-compact"></div>
          </div>

          {/* Carte inscription compacte */}
          <div className="login-compact-card">
            <div className="login-card-compact-header">
              <FiUser className="card-icon-white" />
              <h2>Nouveau compte</h2>
              <p>Commencez gratuitement</p>
            </div>

            <div className="login-card-compact-content">
              <p>Accédez à toutes les fonctionnalités premium</p>
              
              <Link 
                to="/inscription" 
                className="cta-button-white secondary-compact-btn"
                onMouseEnter={() => setHoverEffect(true)}
                onMouseLeave={() => setHoverEffect(false)}
              >
                <FiUser className="btn-icon-white" />
                Créer un compte
                <FiArrowRight className={`arrow-icon-white ${hoverEffect ? 'slide' : ''}`} />
              </Link>
            </div>

            <div className="login-compact-footer">
              <span>Copyright l Genious</span>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        theme="light"
      />
    </div>
  );
}

export default Login;