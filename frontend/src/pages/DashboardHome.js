import React from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './DashboardHome.css';

const DashboardHome = () => {
  // Données fictives des graphiques
  const barData = {
    labels: ['Jan', 'Fév', 'Mars', 'Avr', 'Mai'],
    datasets: [{
      label: 'Zones couvertes',
      data: [15, 20, 12, 18, 25],
      backgroundColor: '#007bff'
    }]
  };

  const pieData = {
    labels: ['2G', '3G', '4G'],
    datasets: [{
      data: [30, 45, 25],
      backgroundColor: ['#ffc107', '#28a745', '#17a2b8']
    }]
  };

  const lineData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
    datasets: [{
      label: 'Ajouts',
      data: [3, 5, 2, 6, 4],
      borderColor: '#6f42c1',
      tension: 0.3
    }]
  };

  const doughnutData = {
    labels: ['Couvertes', 'Non couvertes'],
    datasets: [{
      data: [70, 30],
      backgroundColor: ['#198754', '#dc3545']
    }]
  };

  return (
    <div className="p-4">
      <h4 className="fw-bold mb-4">Tableau de bord Couverture360</h4>

      {/* Graphiques */}
      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 card-chart">
            <h6 className="text-center">Zones couvertes par mois</h6>
            <div className="chart-wrapper">
              <Bar data={barData} />
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 card-chart">
            <h6 className="text-center">Répartition des réseaux</h6>
            <div className="chart-wrapper">
              <Pie data={pieData} />
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 card-chart">
            <h6 className="text-center">Ajouts par jour</h6>
            <div className="chart-wrapper">
              <Line data={lineData} />
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 card-chart">
            <h6 className="text-center">Taux de couverture</h6>
            <div className="chart-wrapper">
              <Doughnut data={doughnutData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
