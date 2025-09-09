import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './DashboardHome.css';

const DashboardHome = () => {
  const [barData, setBarData] = useState(null);
  const [pieData, setPieData] = useState(null);
  const [lineData, setLineData] = useState(null);
  const [horizontalBarData, setHorizontalBarData] = useState(null);

  const fetchData = async () => {
    try {
      // 1. Sites par technologie
      const resTypes = await fetch('http://localhost/app-web/backend/api/stats-types.php');
      const types = await resTypes.json();
      setBarData({
        labels: types.map(t => t.libelle_type),
        datasets: [{
          label: 'Nombre de sites',
          data: types.map(t => t.total),
          backgroundColor: '#007bff'
        }]
      });

      // 2. Par opérateur
      const resOperateur = await fetch('http://localhost/app-web/backend/api/par-operateur.php');
      const operateurs = await resOperateur.json();
      setPieData({
        labels: operateurs.map(o => o.nom_operateur),
        datasets: [{
          data: operateurs.map(o => o.total),
          backgroundColor: ['#ffc107', '#28a745', '#17a2b8']
        }]
      });

      // 3. Évolution
      const resEvolution = await fetch('http://localhost/app-web/backend/api/evolution.php');
      const evolution = await resEvolution.json();
      const labels = evolution.map(e => `${e.libelle_trimestre} ${e.annee_site}`);
      setLineData({
        labels,
        datasets: [{
          label: 'Nouveaux sites',
          data: evolution.map(e => e.total),
          borderColor: '#6f42c1',
          tension: 0.3,
          fill: false
        }]
      });

      // 4. Top départements
      const resDept = await fetch('http://localhost/app-web/backend/api/par-departement.php');
      const depts = await resDept.json();
      setHorizontalBarData({
        labels: depts.map(d => d.nom_departement),
        datasets: [{
          data: depts.map(d => d.total_sites),
          backgroundColor: '#198754'
        }]
      });

    } catch (err) {
      console.error("Erreur de chargement des données", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!barData || !pieData || !lineData || !horizontalBarData) {
    return <div className="p-4 text-center">Chargement des données...</div>;
  }

  return (
    <div className="p-4">
      <h4 className="fw-bold mb-4">Tableau de bord Couverture360</h4>

      <div className="row mt-4">
        {/* 1. Répartition par technologie */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 card-chart">
            <h6>Répartition par technologie</h6>
            <div className="chart-wrapper">
              <Bar data={barData} />
            </div>
          </div>
        </div>

        {/* 2. Répartition par opérateur */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 card-chart">
            <h6>Répartition par opérateur</h6>
            <div className="chart-wrapper">
              <Pie data={pieData} />
            </div>
          </div>
        </div>

        {/* 3. Évolution des déploiements */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 card-chart">
            <h6>Évolution des déploiements</h6>
            <div className="chart-wrapper">
              <Line data={lineData} />
            </div>
          </div>
        </div>

        {/* 4. Top 10 départements */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 card-chart">
            <h6>Top 10 des départements</h6>
            <div className="chart-wrapper">
              <Bar
                data={horizontalBarData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { x: { beginAtZero: true } },
                  plugins: { legend: { display: false } }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;