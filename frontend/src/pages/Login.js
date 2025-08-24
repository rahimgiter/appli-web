import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Login.css';

function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [notification, setNotification] = useState({ show: false, success: false, message: "" });
  const [chargement, setChargement] = useState(false);
  const [secouer, setSecouer] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);

    try {
      const response = await axios.post("http://localhost/app-web/backend/login.php", {
        identifiant: identifiant.trim(),
        mot_de_passe: motDePasse.trim()
      });

      if (response.data.success) {
        setNotification({ show: true, success: true, message: "Connexion réussie !" });
        localStorage.setItem("utilisateur", JSON.stringify(response.data.utilisateur));
        localStorage.setItem("id_connexion", response.data.id_connexion);
        console.log("ID connexion stocké:", response.data.id_connexion);
        console.log("Réponse complète:", response.data);
        setTimeout(() => {
          setNotification({ show: false, success: false, message: "" });
          navigate("/dashboard");
        }, 1500);
      } else {
        setNotification({ show: true, success: false, message: response.data.message || "Identifiants incorrects" });
        setSecouer(true);
        setTimeout(() => {
          setSecouer(false);
          setNotification({ show: false, success: false, message: "" });
        }, 2000);
      }
    } catch (error) {
      setNotification({ show: true, success: false, message: "Erreur serveur" });
      setSecouer(true);
      setTimeout(() => {
        setSecouer(false);
        setNotification({ show: false, success: false, message: "" });
      }, 2000);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light position-relative">
      {notification.show && (
        <div className={`popup-notif ${notification.success ? 'success' : 'error'}`}>
          <i className={`bi ${notification.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
          <span className="ms-2">{notification.message}</span>
        </div>
      )}

      <div className={`shadow-lg p-5 bg-white rounded-4 form-box ${secouer ? 'shake' : ''}`} style={{ width: '100%', maxWidth: 400 }}>
        <div className="text-center mb-4">
          <h3 className="fw-bold">Connexion</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label className="form-label">Identifiant</label>
            <div className="input-group rounded">
              <span className="input-group-text bg-white">
                <i className="bi bi-person-fill text-primary"></i>
              </span>
              <input
                type="text"
                className="form-control rounded-end"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                placeholder="Votre identifiant"
                required
              />
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Mot de passe</label>
            <div className="input-group rounded">
              <span className="input-group-text bg-white">
                <i className="bi bi-lock-fill text-primary"></i>
              </span>
              <input
                type={afficherMotDePasse ? "text" : "password"}
                className="form-control"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="Votre mot de passe"
                required
              />
              <span
                className="input-group-text bg-white"
                style={{ cursor: "pointer" }}
                onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
              >
                <i className={`bi ${afficherMotDePasse ? "bi-eye-slash-fill" : "bi-eye-fill"} text-primary`}></i>
              </span>
            </div>
          </div>

          <button type="submit" disabled={chargement} className="btn btn-primary w-100 py-2 rounded-pill">
            {chargement ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Connexion...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i> Se connecter
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <small className="text-muted">
            <i className="bi bi-question-circle me-1"></i>
            Mot de passe oublié ? Contactez l’administrateur.
          </small>
        </div>
      </div>
    </div>
  );
}

export default Login;
