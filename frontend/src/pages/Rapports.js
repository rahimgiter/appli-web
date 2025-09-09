// src/pages/Rapport.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const Rapport = ({ currentUser }) => {
  const [logs, setLogs] = useState([]);

  const fetchLogs = () => {
    axios.get("http://localhost/app-web/backend/api/rapports.php")
      .then(res => {
        console.log("Logs reçus :", res.data);
        if (Array.isArray(res.data)) {
          setLogs(res.data);
        } else {
          setLogs([]);
        }
      })
      .catch(err => setLogs([]));
  };

  useEffect(() => {
    fetchLogs();

    if (currentUser?.id_utilisateur) {
      axios.post("http://localhost/app-web/backend/api/rapport_connexion.php", { userId: currentUser.id_utilisateur })
        .then(() => fetchLogs())
        .catch(err => console.error(err));
    }

    const handleUnload = () => {
      if (currentUser?.id_utilisateur) {
        navigator.sendBeacon(
          "http://localhost/app-web/backend/api/rapport_deconnexion.php",
          JSON.stringify({ userId: currentUser.id_utilisateur })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [currentUser]);

  return (
    <div className="container mt-4">
      <h4 className="fw-bold text-primary mb-4">
        <i className="bi bi-file-earmark-text-fill me-2"></i> Journal de Connexion
      </h4>

      {logs.length === 0 ? (
        <p className="text-muted">Aucune donnée à afficher pour le moment.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-primary">
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Fonction</th>
                <th>Rôle</th>
                <th>Connexion</th>
                <th>Déconnexion</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={log.id}>
                  <td>{index + 1}</td>
                  <td>{log.nom_famille}</td>
                  <td>{log.prenom}</td>
                  <td>{log.fonction}</td>
                  <td>{log.role}</td>
                  <td>{log.heure_connexion}</td>
                  <td>{log.heure_deconnexion || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Rapport;
