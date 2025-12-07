import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FiMapPin, FiMail, FiArrowLeft, FiSend, FiShield, FiInfo } from 'react-icons/fi';
import { Spinner } from 'react-bootstrap';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [hoverEffect, setHoverEffect] = useState(false);
  const navigate = useNavigate();

  const showMessage = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      showMessage('Veuillez entrer votre adresse email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showMessage('Format d\'email invalide');
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await axios.post('http://localhost/app-web/backend/api/request_password_reset.php', {
        email: email.trim().toLowerCase()
      });

      if (response.data.success) {
        showMessage('✅ Code envoyé ! Vérifiez vos emails.', 'success');
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { email: email.trim().toLowerCase() } 
          });
        }, 2000);
        
        if (response.data.debug_code) {
          console.log('Code de debug:', response.data.debug_code);
        }
      } else {
        showMessage(response.data.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Erreur de connexion au serveur';
      showMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Styles inline
  const styles = {
    container: {
      background: 'linear-gradient(135deg, #0a66c2 0%, #0847a4 50%, #0a66c2 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      height: '100vh',
      width: '100vw'
    },
    waves: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.6,
      overflow: 'hidden'
    },
    wave: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '200%',
      height: '100%',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '40% 45% 40% 45%',
      animation: 'waveAnimation 15s infinite linear'
    },
    mainContainer: {
      position: 'relative',
      zIndex: 2,
      width: '95vw',
      maxWidth: '420px',
      height: '95vh',
      maxHeight: '520px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    header: {
      textAlign: 'center',
      marginBottom: '1.5rem',
      width: '100%'
    },
    logoCircle: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 0.5rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.3s ease'
    },
    brandName: {
      fontSize: '1.75rem',
      fontWeight: 300,
      color: 'white',
      letterSpacing: '-0.02em',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      margin: 0
    },
    card: {
      background: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(40px)',
      borderRadius: '16px',
      padding: '2rem 1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 15px 30px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      width: '100%',
      transition: 'all 0.3s ease'
    },
    cardHeader: {
      textAlign: 'center',
      marginBottom: '1.5rem'
    },
    iconWrapper: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 0.75rem',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    cardTitle: {
      fontSize: '1.3rem',
      fontWeight: 400,
      color: 'white',
      margin: '0 0 0.5rem 0',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '0.9rem',
      lineHeight: 1.4,
      margin: 0
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    },
    inputGroup: {
      position: 'relative'
    },
    input: {
      width: '100%',
      padding: '0.875rem 0.875rem 0.875rem 2.75rem',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '10px',
      color: 'white',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)'
    },
    inputIcon: {
      position: 'absolute',
      left: '0.875rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '1.1rem'
    },
    hint: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '0.8rem',
      padding: '0.25rem 0'
    },
    message: {
      padding: '0.875rem',
      borderRadius: '8px',
      fontSize: '0.85rem',
      textAlign: 'center'
    },
    messageSuccess: {
      background: 'rgba(76, 175, 80, 0.2)',
      border: '1px solid rgba(76, 175, 80, 0.4)',
      color: '#c8e6c9'
    },
    messageError: {
      background: 'rgba(244, 67, 54, 0.2)',
      border: '1px solid rgba(244, 67, 54, 0.4)',
      color: '#ffcdd2'
    },
    button: {
      background: 'transparent',
      border: '2px solid rgba(255, 255, 255, 0.8)',
      color: 'white',
      fontWeight: 500,
      padding: '0.875rem 1.5rem',
      borderRadius: '50px',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      width: '100%'
    },
    footer: {
      marginTop: '1.5rem',
      paddingTop: '1.25rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      textAlign: 'center'
    },
    backLink: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      color: 'rgba(255, 255, 255, 0.8)',
      textDecoration: 'none',
      fontSize: '0.85rem',
      transition: 'color 0.3s ease'
    },
    security: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '0.75rem'
    }
  };

  return (
    <div style={styles.container}>
      {/* Vagues animées */}
      <div style={styles.waves}>
        <div style={{...styles.wave, animationDuration: '20s', background: 'rgba(255, 255, 255, 0.08)', bottom: '-10%'}}></div>
        <div style={{...styles.wave, animationDuration: '15s', background: 'rgba(255, 255, 255, 0.05)', bottom: '-5%', animationDelay: '-5s'}}></div>
        <div style={{...styles.wave, animationDuration: '25s', background: 'rgba(255, 255, 255, 0.03)', bottom: 0, animationDelay: '-2s'}}></div>
      </div>

      {/* Conteneur principal */}
      <div style={styles.mainContainer}>
        
        {/* Header avec logo */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <FiMapPin style={{fontSize: '1.25rem', color: 'white'}} />
          </div>
          <h1 style={styles.brandName}>Couverture360</h1>
        </div>

        {/* Carte de contenu */}
        <div style={styles.card}>
          {/* Header de la carte */}
          <div style={styles.cardHeader}>
            <div style={styles.iconWrapper}>
              <FiShield style={{fontSize: '1.5rem', color: 'white'}} />
            </div>
            <h2 style={styles.cardTitle}>Mot de passe oublié ?</h2>
            <p style={styles.subtitle}>
              Entrez votre email pour recevoir un code de réinitialisation
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <FiMail style={styles.inputIcon} />
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                autoFocus
                style={styles.input}
              />
            </div>

            {/* Indication */}
            <div style={styles.hint}>
              <FiInfo style={{fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)'}} />
              <span>Code à 6 chiffres envoyé par email</span>
            </div>

            {/* Message d'alerte */}
            {message.text && (
              <div style={{
                ...styles.message,
                ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
              }}>
                {message.text}
              </div>
            )}

            {/* Bouton d'action */}
            <button 
              type="submit" 
              disabled={loading || !email}
              onMouseEnter={() => setHoverEffect(true)}
              onMouseLeave={() => setHoverEffect(false)}
              style={{
                ...styles.button,
                opacity: (loading || !email) ? 0.6 : 1,
                cursor: (loading || !email) ? 'not-allowed' : 'pointer',
                transform: hoverEffect && !loading ? 'translateY(-2px)' : 'none',
                boxShadow: hoverEffect && !loading ? '0 6px 15px rgba(255, 255, 255, 0.2)' : 'none'
              }}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" style={{borderWidth: '2px', borderColor: 'rgba(255, 255, 255, 0.3)', borderRightColor: 'white'}} />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <FiSend style={{fontSize: '0.9rem', color: 'white'}} />
                  <span>Envoyer le code</span>
                  <FiArrowLeft style={{
                    fontSize: '0.9rem',
                    color: 'white',
                    transition: 'transform 0.3s ease',
                    transform: hoverEffect ? 'translateX(2px)' : 'none'
                  }} />
                </>
              )}
            </button>
          </form>

          {/* Footer avec liens */}
          <div style={styles.footer}>
            <Link 
              to="/login" 
              style={styles.backLink}
              onMouseEnter={() => setHoverEffect(true)}
              onMouseLeave={() => setHoverEffect(false)}
            >
              <FiArrowLeft style={{
                fontSize: '0.8rem',
                transition: 'transform 0.3s ease',
                transform: hoverEffect ? 'translateX(-2px)' : 'none'
              }} />
              Retour à la connexion
            </Link>
            
            <div style={styles.security}>
              <FiShield style={{fontSize: '0.7rem'}} />
              <span>Données sécurisées et confidentielles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Styles globaux */}
      <style>
        {`
          html, body {
            overflow: hidden;
            height: 100%;
            margin: 0;
            padding: 0;
          }
          
          * {
            box-sizing: border-box;
          }
          
          @keyframes waveAnimation {
            0% {
              transform: translateX(0) rotate(0deg);
            }
            50% {
              transform: translateX(-25%) rotate(180deg);
            }
            100% {
              transform: translateX(-50%) rotate(360deg);
            }
          }
          
          input::placeholder {
            color: rgba(255, 255, 255, 0.6) !important;
            font-size: 0.85rem;
          }
          
          input:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.15) !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
          }
          
          .btn:focus {
            box-shadow: none !important;
          }
        `}
      </style>
    </div>
  );
}

export default ForgotPassword;