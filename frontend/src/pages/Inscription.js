import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FiMapPin, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';
import { Spinner } from 'react-bootstrap';

function Inscription() {
  const [formData, setFormData] = useState({
    nom_famille: '', prenom: '', email: '', mot_de_passe: '', confirmation_mot_de_passe: ''
  });
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState('');
  const [afficherMotDePasse, setAfficherMotDePasse] = useState({ mot_de_passe: false, confirmation: false });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePasswordVisibility = (field) => {
    setAfficherMotDePasse(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom_famille || !formData.prenom || !formData.email) {
      setMessage('Tous les champs sont obligatoires');
      return;
    }

    if (formData.mot_de_passe.length < 6) {
      setMessage('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.mot_de_passe !== formData.confirmation_mot_de_passe) {
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }

    setChargement(true);
    try {
      const response = await axios.post('http://localhost/app-web/backend/api/register.php', {
        nom_famille: formData.nom_famille.trim(),
        prenom: formData.prenom.trim(),
        fonction: 'Observateur',
        email: formData.email.trim().toLowerCase(),
        mot_de_passe: formData.mot_de_passe,
        role: 'observateur'
      });

      if (response.data.success) {
        setMessage('✅ Compte créé ! Redirection...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(response.data.message || 'Erreur de création');
      }
    } catch (error) {
      setMessage('Erreur de création du compte');
    } finally {
      setChargement(false);
    }
  };

  const isFormValid = 
    formData.nom_famille && 
    formData.prenom && 
    formData.email && 
    formData.mot_de_passe.length >= 6 && 
    formData.mot_de_passe === formData.confirmation_mot_de_passe;

  // Styles épurés
  const styles = {
    container: {
      background: 'linear-gradient(135deg, #0a66c2 0%, #0847a4 50%, #0a66c2 100%)',
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    },
    mainContainer: {
      width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center'
    },
    header: { textAlign: 'center', marginBottom: '1rem' },
    logoCircle: {
      width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem'
    },
    brandName: { fontSize: '1.5rem', fontWeight: 300, color: 'white', margin: 0 },
    card: {
      background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.2)', width: '100%'
    },
    cardTitle: { fontSize: '1.2rem', color: 'white', textAlign: 'center', margin: '0 0 1rem 0' },
    form: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
    row: { display: 'flex', gap: '0.5rem' },
    inputGroup: { flex: 1 },
    inputContainer: { position: 'relative' },
    input: {
      width: '100%', padding: '0.7rem 2.5rem', background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '8px', color: 'white', fontSize: '0.85rem'
    },
    inputIcon: {
      position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)',
      color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem'
    },
    passwordToggle: {
      position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer'
    },
    match: { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', marginTop: '0.2rem' },
    button: {
      background: 'transparent', border: '2px solid rgba(255, 255, 255, 0.8)', color: 'white',
      padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', marginTop: '0.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%'
    },
    message: { 
      textAlign: 'center', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '6px',
      background: 'rgba(255, 255, 255, 0.1)', color: 'white', marginBottom: '0.5rem'
    },
    footer: { 
      marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)'
    },
    loginLink: { color: 'white', textDecoration: 'none', fontWeight: 500 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainContainer}>
        
        {/* Header simple */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <FiMapPin style={{fontSize: '1.2rem', color: 'white'}} />
          </div>
          <h1 style={styles.brandName}>Couverture360</h1>
        </div>

        {/* Carte épurée */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Créer un compte</h2>

          {message && (
            <div style={styles.message}>{message}</div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Nom + Prénom */}
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <div style={styles.inputContainer}>
                  <FiUser style={styles.inputIcon} />
                  <input
                    type="text"
                    name="nom_famille"
                    value={formData.nom_famille}
                    onChange={handleChange}
                    placeholder="Nom"
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <div style={styles.inputContainer}>
                  <FiUser style={styles.inputIcon} />
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    placeholder="Prénom"
                    required
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={styles.inputContainer}>
              <FiMail style={styles.inputIcon} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                style={styles.input}
              />
            </div>

            {/* Mot de passe */}
            <div style={styles.inputContainer}>
              <FiLock style={styles.inputIcon} />
              <input
                type={afficherMotDePasse.mot_de_passe ? "text" : "password"}
                name="mot_de_passe"
                value={formData.mot_de_passe}
                onChange={handleChange}
                placeholder="Mot de passe"
                required
                style={styles.input}
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => togglePasswordVisibility('mot_de_passe')}
              >
                {afficherMotDePasse.mot_de_passe ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Confirmation */}
            <div style={styles.inputContainer}>
              <FiLock style={styles.inputIcon} />
              <input
                type={afficherMotDePasse.confirmation ? "text" : "password"}
                name="confirmation_mot_de_passe"
                value={formData.confirmation_mot_de_passe}
                onChange={handleChange}
                placeholder="Confirmer le mot de passe"
                required
                style={styles.input}
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => togglePasswordVisibility('confirmation')}
              >
                {afficherMotDePasse.confirmation ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Correspondance */}
            {formData.confirmation_mot_de_passe.length > 0 && (
              <div style={{
                ...styles.match,
                color: formData.mot_de_passe === formData.confirmation_mot_de_passe ? '#4caf50' : '#f44336'
              }}>
                {formData.mot_de_passe === formData.confirmation_mot_de_passe ? <FiCheck /> : <FiX />}
                <span>
                  {formData.mot_de_passe === formData.confirmation_mot_de_passe ? 'Correspond' : 'Ne correspond pas'}
                </span>
              </div>
            )}

            {/* Bouton */}
            <button 
              type="submit" 
              disabled={chargement || !isFormValid}
              style={{
                ...styles.button,
                opacity: (chargement || !isFormValid) ? 0.6 : 1,
                cursor: (chargement || !isFormValid) ? 'not-allowed' : 'pointer'
              }}
            >
              {chargement ? (
                <>
                  <Spinner animation="border" size="sm" style={{
                    width: '0.9rem', height: '0.9rem',
                    borderWidth: '2px', borderColor: 'rgba(255, 255, 255, 0.3)', 
                    borderRightColor: 'white'
                  }} />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <FiUser style={{fontSize: '0.9rem'}} />
                  <span>Créer mon compte</span>
                </>
              )}
            </button>
          </form>

          {/* Footer simple */}
          <div style={styles.footer}>
            Déjà un compte ?{' '}
            <Link to="/login" style={styles.loginLink}>
              Se connecter
            </Link>
          </div>
        </div>
      </div>

      {/* Styles globaux */}
      <style>
        {`
          html, body { overflow: hidden; height: 100%; margin: 0; padding: 0; }
          * { box-sizing: border-box; }
          input::placeholder { color: rgba(255, 255, 255, 0.6) !important; }
          input:focus { 
            outline: none; 
            background: rgba(255, 255, 255, 0.15) !important; 
            border-color: rgba(255, 255, 255, 0.5) !important; 
          }
        `}
      </style>
    </div>
  );
}

export default Inscription;