import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './pages/AuthContext';

import Accueil from './pages/Accueil';
import Login from './pages/Login';
import Inscription from './pages/Inscription';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import AjoutInfos from './pages/AjoutInfos';
import Archives from './pages/Archives';
import Utilisateurs from './pages/Utilisateurs';
import Exploration from './pages/Exploration';
import Setting from './pages/Settings';
import Rapports from './pages/Rapports';
import TableCrud from './pages/TableCrud';
import Site from './pages/Site';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={<Accueil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Pages privées (dashboard) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="ajout" element={<AjoutInfos />} />
            <Route path="archives" element={<Archives />} />
            <Route path="exploration" element={<Exploration />} />
            <Route path="setting">
              <Route index element={<Setting />} />
              <Route path=":table" element={<Setting />} />
            </Route>
            <Route path="tableCrud" element={<TableCrud />} />
            <Route path="utilisateurs" element={<Utilisateurs />} />
            <Route path="rapports" element={<Rapports />} />
            <Route path="sites" element={<Site />} />
          </Route>

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;