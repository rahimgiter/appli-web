import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiMapPin, FiShield, FiLock, FiKey, FiArrowLeft, FiEye, FiEyeOff, FiMail, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { Spinner } from 'react-bootstrap';

function ResetPassword() {
  const [step, setStep] = useState(1);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState({ nouveau: false, confirmation: false });
  const [hoverEffect, setHoverEffect] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const inputRefs = useRef([]);

  const showAlert = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  useEffect(() => {
    if (step === 1 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handleCodeInput = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    pasteData.split('').forEach((char, index) => { if (index < 6) newCode[index] = char; });
    setCode(newCode);
    const lastFilledIndex = Math.min(pasteData.length, 5);
    if (inputRefs.current[lastFilledIndex]) inputRefs.current[lastFilledIndex].focus();
  };

  const getFullCode = () => code.join('');

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const fullCode = getFullCode();
    if (fullCode.length !== 6) {
      showAlert('Veuillez compléter le code à 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/app-web/backend/api/verify_reset_code.php', {
        email: email, code: fullCode
      });
      if (response.data.success) {
        setUserId(response.data.user_id);
        setStep(2);
        showAlert('✅ Code validé ! Choisissez votre nouveau mot de passe', 'success');
      } else {
        showAlert(response.data.message || 'Code invalide');
        setCode(['', '', '', '', '', '']);
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || error.message || 'Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (nouveauMotDePasse.length < 6) {
      showAlert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (nouveauMotDePasse !== confirmation) {
      showAlert('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/app-web/backend/api/reset_password.php', {
        user_id: userId, code: getFullCode(), email: email, nouveau_mot_de_passe: nouveauMotDePasse
      });
      if (response.data.success) {
        showAlert('🎉 Mot de passe réinitialisé ! Redirection...', 'success');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        showAlert(response.data.message || 'Erreur de réinitialisation');
      }
    } catch (error) {
      showAlert(error.response?.data?.message || error.message || 'Erreur de réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const isStep1Valid = getFullCode().length === 6;
  const isStep2Valid = nouveauMotDePasse.length >= 6 && nouveauMotDePasse === confirmation;

  // Styles réduits et centrés
  const styles = {
    container: {
      background: 'linear-gradient(135deg, #0a66c2 0%, #0847a4 50%, #0a66c2 100%)',
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden',
      fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0.5rem', height: '100vh', width: '100vw'
    },
    mainContainer: {
      position: 'relative', zIndex: 2, width: '95vw', maxWidth: '380px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    },
    header: { textAlign: 'center', marginBottom: '0.75rem', width: '100%' },
    logoCircle: {
      width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem'
    },
    brandName: {
      fontSize: '1.5rem', fontWeight: 300, color: 'white', margin: 0
    },
    card: {
      background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(40px)', borderRadius: '14px',
      padding: '1.5rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.2)', width: '100%'
    },
    cardHeader: { textAlign: 'center', marginBottom: '1rem' },
    iconWrapper: {
      width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem'
    },
    cardTitle: { fontSize: '1.1rem', fontWeight: 400, color: 'white', margin: '0 0 0.4rem 0' },
    subtitle: { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.8rem', lineHeight: 1.3, margin: 0 },
    progress: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', margin: '0.8rem 0' },
    stepCircle: {
      width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', fontWeight: '600'
    },
    stepLabel: { fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.7)' },
    emailDisplay: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
      color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem', marginTop: '0.4rem'
    },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    codeContainer: { display: 'flex', gap: '0.4rem', justifyContent: 'center' },
    codeInput: {
      width: '36px', height: '40px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '6px', color: 'white', fontSize: '1rem'
    },
    inputGroup: { position: 'relative' },
    input: {
      width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem', background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '8px', color: 'white', fontSize: '0.85rem'
    },
    inputIcon: {
      position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
      color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem'
    },
    passwordToggle: {
      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', cursor: 'pointer'
    },
    hint: {
      display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '0.7rem', padding: '0.2rem 0'
    },
    message: { padding: '0.6rem', borderRadius: '6px', fontSize: '0.75rem', textAlign: 'center' },
    messageSuccess: { background: 'rgba(76, 175, 80, 0.2)', border: '1px solid rgba(76, 175, 80, 0.4)', color: '#c8e6c9' },
    messageError: { background: 'rgba(244, 67, 54, 0.2)', border: '1px solid rgba(244, 67, 54, 0.4)', color: '#ffcdd2' },
    strength: { marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' },
    strengthBar: { flex: 1, height: '3px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '2px', overflow: 'hidden' },
    strengthFill: { height: '100%', transition: 'all 0.3s ease', borderRadius: '2px' },
    strengthText: { fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.7)', minWidth: '35px' },
    match: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', marginTop: '0.2rem' },
    button: {
      background: 'transparent', border: '2px solid rgba(255, 255, 255, 0.8)', color: 'white',
      fontWeight: 500, padding: '0.75rem 1.25rem', borderRadius: '50px', fontSize: '0.85rem',
      transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0.4rem', width: '100%'
    },
    footer: {
      marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'center'
    },
    backLink: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
      color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', fontSize: '0.75rem',
      background: 'none', border: 'none'
    },
    security: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
      color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem'
    }
  };

  return (
    <div style={styles.container}>
      {/* Vagues animées simplifiées */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        opacity: 0.6, overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '200%', height: '100%',
          background: 'rgba(255, 255, 255, 0.1)', borderRadius: '40% 45% 40% 45%',
          animation: 'waveAnimation 20s infinite linear'
        }}></div>
      </div>

      {/* Conteneur principal centré */}
      <div style={styles.mainContainer}>
        
        {/* Header compact */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <FiMapPin style={{fontSize: '1.1rem', color: 'white'}} />
          </div>
          <h1 style={styles.brandName}>Couverture360</h1>
        </div>

        {/* Carte compacte */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrapper}>
              {step === 1 ? 
                <FiShield style={{fontSize: '1.3rem', color: 'white'}} /> : 
                <FiKey style={{fontSize: '1.3rem', color: 'white'}} />
              }
            </div>
            <h2 style={styles.cardTitle}>
              {step === 1 ? 'Code de vérification' : 'Nouveau mot de passe'}
            </h2>
            <p style={styles.subtitle}>
              {step === 1 ? 'Entrez le code à 6 chiffres' : 'Choisissez votre mot de passe'}
            </p>

            {/* Progression simplifiée */}
            <div style={styles.progress}>
              <div style={styles.progressStep}>
                <div style={{
                  ...styles.stepCircle,
                  background: step >= 1 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  color: step >= 1 ? 'white' : 'rgba(255, 255, 255, 0.5)'
                }}>1</div>
                <div style={styles.stepLabel}>Code</div>
              </div>
              <div style={styles.progressStep}>
                <div style={{
                  ...styles.stepCircle,
                  background: step >= 2 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  color: step >= 2 ? 'white' : 'rgba(255, 255, 255, 0.5)'
                }}>2</div>
                <div style={styles.stepLabel}>MDP</div>
              </div>
            </div>

            <div style={styles.emailDisplay}>
              <FiMail style={{fontSize: '0.7rem'}} />
              <span>{email}</span>
            </div>
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

          {/* Étape 1 : Code */}
          {step === 1 ? (
            <form onSubmit={handleVerifyCode} style={styles.form}>
              <div style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleCodeInput(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    maxLength="1"
                    required
                    disabled={loading}
                    style={{
                      ...styles.codeInput,
                      borderColor: digit ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)'
                    }}
                  />
                ))}
              </div>

              <div style={styles.hint}>
                <FiClock style={{fontSize: '0.65rem'}} />
                <span>Code valable 15 min</span>
              </div>

              <button 
                type="submit" 
                disabled={loading || !isStep1Valid}
                onMouseEnter={() => setHoverEffect(true)}
                onMouseLeave={() => setHoverEffect(false)}
                style={{
                  ...styles.button,
                  opacity: (loading || !isStep1Valid) ? 0.6 : 1,
                  cursor: (loading || !isStep1Valid) ? 'not-allowed' : 'pointer',
                  transform: hoverEffect && !loading ? 'translateY(-1px)' : 'none'
                }}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" style={{
                      width: '0.9rem', height: '0.9rem',
                      borderWidth: '2px', borderColor: 'rgba(255, 255, 255, 0.3)', 
                      borderRightColor: 'white'
                    }} />
                    <span>Vérification...</span>
                  </>
                ) : (
                  <>
                    <FiShield style={{fontSize: '0.8rem'}} />
                    <span>Vérifier</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Étape 2 : Mot de passe */
            <form onSubmit={handleResetPassword} style={styles.form}>
              <div style={styles.inputGroup}>
                <FiLock style={styles.inputIcon} />
                <input
                  type={showPassword.nouveau ? "text" : "password"}
                  placeholder="Nouveau mot de passe"
                  value={nouveauMotDePasse}
                  onChange={(e) => setNouveauMotDePasse(e.target.value)}
                  required
                  minLength="6"
                  disabled={loading}
                  style={styles.input}
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => togglePasswordVisibility('nouveau')}
                >
                  {showPassword.nouveau ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Force du mot de passe */}
              {nouveauMotDePasse.length > 0 && (
                <div style={styles.strength}>
                  <div style={styles.strengthBar}>
                    <div style={{
                      ...styles.strengthFill,
                      width: `${Math.min((nouveauMotDePasse.length / 8) * 100, 100)}%`,
                      background: nouveauMotDePasse.length < 6 ? '#f44336' :
                                 nouveauMotDePasse.length < 8 ? '#ff9800' : '#4caf50'
                    }}></div>
                  </div>
                  <div style={styles.strengthText}>
                    {nouveauMotDePasse.length < 6 ? 'Faible' :
                     nouveauMotDePasse.length < 8 ? 'Moyen' : 'Fort'}
                  </div>
                </div>
              )}

              <div style={styles.inputGroup}>
                <FiLock style={styles.inputIcon} />
                <input
                  type={showPassword.confirmation ? "text" : "password"}
                  placeholder="Confirmer le mot de passe"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                  disabled={loading}
                  style={styles.input}
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => togglePasswordVisibility('confirmation')}
                >
                  {showPassword.confirmation ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Correspondance */}
              {confirmation.length > 0 && (
                <div style={{
                  ...styles.match,
                  color: nouveauMotDePasse === confirmation ? '#4caf50' : '#f44336'
                }}>
                  {nouveauMotDePasse === confirmation ? <FiCheck /> : <FiX />}
                  <span>
                    {nouveauMotDePasse === confirmation ? 'Correspond' : 'Ne correspond pas'}
                  </span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !isStep2Valid}
                onMouseEnter={() => setHoverEffect(true)}
                onMouseLeave={() => setHoverEffect(false)}
                style={{
                  ...styles.button,
                  opacity: (loading || !isStep2Valid) ? 0.6 : 1,
                  cursor: (loading || !isStep2Valid) ? 'not-allowed' : 'pointer',
                  transform: hoverEffect && !loading ? 'translateY(-1px)' : 'none'
                }}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" style={{
                      width: '0.9rem', height: '0.9rem',
                      borderWidth: '2px', borderColor: 'rgba(255, 255, 255, 0.3)', 
                      borderRightColor: 'white'
                    }} />
                    <span>En cours...</span>
                  </>
                ) : (
                  <>
                    <FiKey style={{fontSize: '0.8rem'}} />
                    <span>Réinitialiser</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer compact */}
          <div style={styles.footer}>
            {step === 1 ? (
              <Link to="/forgot-password" style={styles.backLink}>
                <FiArrowLeft style={{fontSize: '0.7rem'}} />
                Changer d'email
              </Link>
            ) : (
              <button 
                type="button" 
                style={styles.backLink}
                onClick={() => setStep(1)}
              >
                <FiArrowLeft style={{fontSize: '0.7rem'}} />
                Retour au code
              </button>
            )}
            
            <div style={styles.security}>
              <FiShield style={{fontSize: '0.6rem'}} />
              <span>Sécurisé et confidentiel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Styles globaux */}
      <style>
        {`
          html, body { overflow: hidden; height: 100%; margin: 0; padding: 0; }
          * { box-sizing: border-box; }
          @keyframes waveAnimation {
            0% { transform: translateX(0) rotate(0deg); }
            50% { transform: translateX(-25%) rotate(180deg); }
            100% { transform: translateX(-50%) rotate(360deg); }
          }
          input::placeholder { color: rgba(255, 255, 255, 0.6) !important; font-size: 0.8rem; }
          input:focus { outline: none; background: rgba(255, 255, 255, 0.15) !important; border-color: rgba(255, 255, 255, 0.5) !important; }
        `}
      </style>
    </div>
  );
}

export default ResetPassword;