import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const userData = localStorage.getItem('utilisateur');
    const userId = localStorage.getItem('user_id');
    
    if (userData && userId) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, mot_de_passe) => {
    try {
      const response = await axios.post("http://localhost/app-web/backend/login.php", {
        email: email,
        mot_de_passe: mot_de_passe
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        const { utilisateur, id_connexion } = response.data;
        
        // Stocker les infos utilisateur dans le localStorage
        localStorage.setItem("user_id", utilisateur.id_utilisateur);
        localStorage.setItem("utilisateur", JSON.stringify(utilisateur));
        localStorage.setItem("id_connexion", id_connexion);
        
        setUser(utilisateur);
        
        console.log("✅ Utilisateur connecté via AuthContext:", utilisateur);
        console.log("🔑 ID utilisateur stocké:", utilisateur.id_utilisateur);
        
        return { 
          success: true, 
          message: `Bienvenue ${utilisateur.prenom} !` 
        };
      } else {
        return { 
          success: false, 
          message: response.data.message || "Email ou mot de passe incorrect" 
        };
      }
    } catch (error) {
      console.error("❌ Erreur de connexion:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Erreur de connexion au serveur" 
      };
    }
  };

  const logout = async () => {
    try {
      // Appeler le endpoint de déconnexion si vous en avez un
      await axios.post('http://localhost/app-web/backend/logout.php', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Nettoyer le localStorage
      localStorage.removeItem('user_id');
      localStorage.removeItem('utilisateur');
      localStorage.removeItem('id_connexion');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};