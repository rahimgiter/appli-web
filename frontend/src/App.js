import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Accueil from './pages/Accueil';
import Login from './pages/Login';
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
    <Router>
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<Accueil />} />
        <Route path="/login" element={<Login />} />

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
      </Routes>
    </Router>
  );
}

export default App;
