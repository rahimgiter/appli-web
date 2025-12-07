import React, { useState, useEffect, useRef } from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './DashboardHome.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardHome = () => {
  const [charts, setCharts] = useState({
    coverage: null,
    operators: null,
    evolution: null,
    regions: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [stats, setStats] = useState({
    totalSites: 0,
    totalOperators: 0,
    totalRegions: 0,
    totalTechs: 0
  });
  
  const abortControllersRef = useRef(new Map());
  const isMountedRef = useRef(true);

  const colorPalette = {
    primary: '#0a66c2',
    secondary: '#10b981',
    accent: '#8b5cf6',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    success: '#84cc16'
  };

  const fetchData = async () => {
    if (!isMountedRef.current) return;

    try {
      setError(null);
      setLoading(true);
      
      const baseURL = 'http://localhost/app-web/backend/api';
      
      const currentControllers = new Map();
      abortControllersRef.current = currentControllers;

      const endpoints = [
        { 
          key: 'coverage', 
          url: `${baseURL}/stats-region-tech.php`,
          name: 'Couverture Régionale'
        },
        { 
          key: 'operators', 
          url: `${baseURL}/stats-operator-tech.php`,
          name: 'Opérateurs'
        },
        { 
          key: 'evolution', 
          url: `${baseURL}/stats-evolution-trimestre.php`,
          name: 'Évolution'
        },
        { 
          key: 'regions', 
          url: `${baseURL}/stats-top-regions.php`,
          name: 'Régions Top'
        }
      ];

      const results = await Promise.allSettled(
        endpoints.map(async ({ key, url, name }) => {
          if (!isMountedRef.current) {
            throw new Error('Composant démonté');
          }

          const controller = new AbortController();
          currentControllers.set(key, controller);

          try {
            const response = await fetch(url, {
              signal: controller.signal,
              headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const text = await response.text();
            if (!text.trim()) throw new Error('Données vides');
            
            const data = JSON.parse(text.trim());
            
            if (!isMountedRef.current) {
              throw new Error('Composant démonté');
            }
            
            return { key, data, name };
          } catch (err) {
            if (err.name !== 'AbortError' && err.message !== 'Composant démonté') {
              console.warn(`❌ Erreur ${name}:`, err.message);
            }
            throw { key, error: err.message, name };
          }
        })
      );

      if (!isMountedRef.current) return;

      const newCharts = { ...charts };
      let hasErrors = false;
      let successfulRequests = 0;

      let totalSites = 0;
      let totalOperators = 0;
      let totalRegions = 0;
      let totalTechs = 0;

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { key, data, name } = result.value;
          const transformedData = transformData(key, data, name);
          if (transformedData) {
            newCharts[key] = transformedData;
            successfulRequests++;

            switch (key) {
              case 'coverage':
                totalRegions = new Set(data.map(item => item.nom_region)).size;
                totalTechs = new Set(data.map(item => item.libelle_type)).size;
                totalSites += data.reduce((sum, item) => sum + parseInt(item.total_sites || 0), 0);
                break;
              case 'operators':
                totalOperators = new Set(data.map(item => item.nom_operateur)).size;
                totalSites += data.reduce((sum, item) => sum + parseInt(item.total_sites || 0), 0);
                break;
              case 'regions':
                totalSites += data.reduce((sum, item) => sum + parseInt(item.total_sites || 0), 0);
                break;
            }
          } else {
            hasErrors = true;
          }
        } else {
          const { key, error } = result.reason;
          if (error !== 'signal is aborted without reason' && 
              error !== 'The user aborted a request.' &&
              error !== 'Composant démonté') {
            hasErrors = true;
          }
          newCharts[key] = null;
        }
      });

      setCharts(newCharts);
      setStats({
        totalSites,
        totalOperators,
        totalRegions,
        totalTechs
      });
      
      if (hasErrors && successfulRequests === 0) {
        setError('Impossible de charger les données. Vérifiez votre connexion.');
      } else if (hasErrors) {
        setError('Certaines données sont temporairement indisponibles');
      }
      
      setLastUpdate(new Date());
      setLoading(false);

    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('❌ Erreur générale:', err);
      setError('Erreur de chargement des données');
      setLoading(false);
    }
  };

  const transformData = (type, rawData, name) => {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.warn(`⚠️ Données vides pour ${name}`);
      return null;
    }

    try {
      switch (type) {
        case 'coverage':
          return createCoverageChart(rawData);
        case 'operators':
          return createOperatorsChart(rawData);
        case 'evolution':
          return createEvolutionChart(rawData);
        case 'regions':
          return createRegionsChart(rawData);
        default:
          return null;
      }
    } catch (err) {
      console.error(`❌ Erreur transformation ${name}:`, err);
      return null;
    }
  };

  const createCoverageChart = (data) => {
    const regions = [...new Set(data.map(item => item.nom_region))];
    const techs = [...new Set(data.map(item => item.libelle_type))];

    console.log(`📊 Régions trouvées: ${regions.length}`, regions);

    const datasets = techs.map((tech, index) => ({
      label: tech,
      data: regions.map(region => {
        const item = data.find(d => d.nom_region === region && d.libelle_type === tech);
        return item ? parseInt(item.total_sites) : 0;
      }),
      backgroundColor: getTechColor(tech, index),
      borderRadius: 6,
      borderWidth: 0,
    }));

    return {
      data: { labels: regions, datasets },
      options: getBarOptions('Couverture par Région')
    };
  };

  const createOperatorsChart = (data) => {
    const operators = [...new Set(data.map(item => item.nom_operateur))];
    const techs = [...new Set(data.map(item => item.libelle_type))];

    console.log(`📊 Opérateurs trouvés: ${operators.length}`, operators);

    const datasets = techs.map((tech, index) => ({
      label: tech,
      data: operators.map(operator => {
        const item = data.find(d => d.nom_operateur === operator && d.libelle_type === tech);
        return item ? parseInt(item.total_sites) : 0;
      }),
      backgroundColor: getTechColor(tech, index),
      borderRadius: 6,
      borderWidth: 0,
    }));

    return {
      data: { labels: operators, datasets },
      options: getBarOptions('Répartition par Opérateur')
    };
  };

  const createEvolutionChart = (data) => {
    const periods = [...new Set(data.map(item => `T${item.id_trimestre} ${item.annee_site}`))];
    const techs = [...new Set(data.map(item => item.libelle_type))];

    console.log(`📊 Périodes trouvées: ${periods.length}`, periods);

    const datasets = techs.map((tech, index) => ({
      label: tech,
      data: periods.map(period => {
        const [trim, annee] = period.split(' ');
        const item = data.find(d => 
          `T${d.id_trimestre} ${d.annee_site}` === period && d.libelle_type === tech
        );
        return item ? parseInt(item.nouveaux_sites) : 0;
      }),
      borderColor: getTechColor(tech, index),
      backgroundColor: `${getTechColor(tech, index)}20`,
      tension: 0.3,
      fill: true,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: getTechColor(tech, index),
    }));

    return {
      data: { labels: periods, datasets },
      options: getLineOptions('Évolution des Déploiements')
    };
  };

  const createRegionsChart = (data) => {
    const allRegions = data
      .sort((a, b) => parseInt(b.total_sites) - parseInt(a.total_sites));

    console.log(`📊 Toutes les régions pour doughnut: ${allRegions.length}`);

    return {
      data: {
        labels: allRegions.map(r => r.nom_region),
        datasets: [{
          data: allRegions.map(r => parseInt(r.total_sites)),
          backgroundColor: generateColors(allRegions.length),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 8,
        }]
      },
      options: getDoughnutOptions('Répartition par Région')
    };
  };

  const getTechColor = (tech, index) => {
    const colors = [
      colorPalette.primary,
      colorPalette.secondary,
      colorPalette.accent,
      colorPalette.warning,
      colorPalette.danger,
      colorPalette.info,
      colorPalette.success,
      '#f97316',
      '#ec4899',
      '#14b8a6'
    ];
    return colors[index % colors.length];
  };

  const generateColors = (count) => {
    const baseColors = [
      colorPalette.primary,
      colorPalette.secondary,
      colorPalette.accent,
      colorPalette.warning,
      colorPalette.danger,
      colorPalette.info,
      colorPalette.success,
      '#f97316',
      '#ec4899',
      '#14b8a6',
      '#84cc16',
      '#06b6d4',
      '#8b5cf6'
    ];
    
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    
    const additionalColors = [];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.5) % 360;
      additionalColors.push(`hsl(${hue}, 70%, 60%)`);
    }
    
    return [...baseColors, ...additionalColors];
  };

  const getBarOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 11, weight: '500' },
          color: '#6b7280'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 10,
        cornerRadius: 6,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 11, weight: '400' }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { 
          font: { size: 10 },
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { 
          font: { size: 10 },
          color: '#6b7280'
        },
        grid: { color: 'rgba(0, 0, 0, 0.04)' }
      }
    }
  });

  const getLineOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 11, weight: '500' },
          color: '#6b7280'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 10 },
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        ticks: { 
          font: { size: 10 },
          color: '#6b7280'
        },
        grid: { color: 'rgba(0, 0, 0, 0.04)' }
      }
    },
    interaction: { intersect: false, mode: 'index' }
  });

  const getDoughnutOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 8,
          font: { size: 10, weight: '500' },
          color: '#6b7280'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 10,
        cornerRadius: 6
      }
    },
    cutout: '50%'
  });

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    
    const interval = setInterval(fetchData, 120000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-home">
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
          <h3>Chargement des données</h3>
          <p>Récupération de toutes les informations...</p>
        </div>
      </div>
    );
  }

  if (error && !Object.values(charts).some(chart => chart !== null)) {
    return (
      <div className="dashboard-home">
        <div className="error-state">
          <div className="error-illustration">
            <i className="bi bi-cloud-slash"></i>
          </div>
          <h3>Données indisponibles</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      {/* Header avec stats et actions */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1>Tableau de Bord</h1>
            <p>Analyse complète de la couverture réseau</p>
          </div>
          <div className="header-actions">
            {lastUpdate && (
              <div className="last-update">
                <i className="bi bi-clock"></i>
                MAJ: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <button className="btn-refresh" onClick={fetchData}>
              <i className="bi bi-arrow-clockwise"></i>
              Actualiser
            </button>
          </div>
        </div>
        
        {/* Stats summary */}
        <div className="stats-summary">
          <div className="stat-item">
            <div className="stat-icon" style={{ background: colorPalette.primary }}>
              <i className="bi bi-tower" style={{ color: 'white' }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalSites.toLocaleString()}</div>
              <div className="stat-label">Sites Total</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon" style={{ background: colorPalette.secondary }}>
              <i className="bi bi-building" style={{ color: 'white' }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalOperators}</div>
              <div className="stat-label">Opérateurs</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon" style={{ background: colorPalette.accent }}>
              <i className="bi bi-map" style={{ color: 'white' }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalRegions}</div>
              <div className="stat-label">Régions</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon" style={{ background: colorPalette.warning }}>
              <i className="bi bi-wifi" style={{ color: 'white' }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalTechs}</div>
              <div className="stat-label">Technologies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des graphiques - 2 par ligne */}
      <div className="charts-grid">
        {/* Ligne 1 */}
        <div className="chart-row">
          {charts.coverage && (
            <div className="chart-card">
              <div className="card-header">
                <h3>Couverture par Région</h3>
                <p>Répartition des sites sur les {stats.totalRegions} régions</p>
              </div>
              <div className="chart-container">
                <Bar data={charts.coverage.data} options={charts.coverage.options} />
              </div>
            </div>
          )}
          
          {charts.operators && (
            <div className="chart-card">
              <div className="card-header">
                <h3>Répartition par Opérateur</h3>
                <p>Distribution par opérateur et technologie</p>
              </div>
              <div className="chart-container">
                <Bar data={charts.operators.data} options={charts.operators.options} />
              </div>
            </div>
          )}
        </div>

        {/* Ligne 2 */}
        <div className="chart-row">
          {charts.evolution && (
            <div className="chart-card">
              <div className="card-header">
                <h3>Évolution Temporelle</h3>
                <p>Progression des déploiements trimestriels</p>
              </div>
              <div className="chart-container">
                <Line data={charts.evolution.data} options={charts.evolution.options} />
              </div>
            </div>
          )}
          
          {charts.regions && (
            <div className="chart-card">
              <div className="card-header">
                <h3>Répartition Régionale</h3>
                <p>Distribution des sites par région</p>
              </div>
              <div className="chart-container">
                <Doughnut data={charts.regions.data} options={charts.regions.options} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message d'erreur partiel */}
      {error && (
        <div className="partial-error">
          <i className="bi bi-info-circle"></i>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;