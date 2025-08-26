import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import MapView from "../components/MapView";
import jsPDF from 'jspdf';
import toast, { Toaster } from 'react-hot-toast';

// Configuration Axios
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? 'http://localhost/app-web/backend/api'
    : '/api',
  headers: { 'Content-Type': 'application/json' }
});

const Sites = () => {
  // États pour les données
  const [sites, setSites] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const [typeSites, setTypeSites] = useState([]);
  const [trimestres, setTrimestres] = useState([]);
  const [localite, setLocalite] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [departements, setDepartements] = useState([]);
  // États pour l'interface
  const [currentView, setCurrentView] = useState("liste");
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  // États pour les filtres - CORRECTION: initialisation avec null au lieu de ""
  const [filters, setFilters] = useState({
    region: null,
    province: null,
    departement: null,
    localite: null,
    operateur: null,
    technologie: null
  });
  // États pour les formulaires
  const [formData, setFormData] = useState({
    nom_site: "",
    latitude_site: "",
    longitude_site: "",
    id_localite: "",
    id_operateur: "",
    id_type_site: "",
    annee_site: "",
    id_trimestre: "",
  });
  const [importData, setImportData] = useState({
    id_operateur: "",
    id_type_site: "",
    annee_site: "",
    id_trimestre: "",
  });
  const [importFile, setImportFile] = useState(null);

  // Gestion des erreurs
  const handleApiError = (error) => {
    console.error("Erreur API:", error);
    toast.error(`Une erreur est survenue : ${error.response?.data?.message || error.message}`);
  };

  // Fonctions utilitaires pour la hiérarchie géographique
  const getDepartementFromLocalite = useCallback((locId) => {
    if (!locId) return null;
    const loc = localite.find(l => l.id_localite === locId);
    return loc ? loc.id_departement : null;
  }, [localite]);

  const getProvinceFromDepartement = useCallback((depId) => {
    if (!depId) return null;
    const dep = departements.find(d => d.id_departement === depId);
    return dep ? dep.id_province : null;
  }, [departements]);

  const getRegionFromProvince = useCallback((provId) => {
    if (!provId) return null;
    const prov = provinces.find(p => p.id_province === provId);
    return prov ? prov.id_region : null;
  }, [provinces]);

  const getProvinceFromLocalite = useCallback((locId) => {
    const depId = getDepartementFromLocalite(locId);
    return depId ? getProvinceFromDepartement(depId) : null;
  }, [getDepartementFromLocalite, getProvinceFromDepartement]);

  const getRegionFromLocalite = useCallback((locId) => {
    const provId = getProvinceFromLocalite(locId);
    return provId ? getRegionFromProvince(provId) : null;
  }, [getProvinceFromLocalite, getRegionFromProvince]);

  const getRegionFromDepartement = useCallback((depId) => {
    if (!depId) return null;
    const dep = departements.find(d => d.id_departement === depId);
    if (!dep) return null;
    const prov = provinces.find(p => p.id_province === dep.id_province);
    return prov ? prov.id_region : null;
  }, [departements, provinces]);

  // FONCTION PRINCIPALE DE MISE À JOUR DES FILTRES
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  // === AJOUT DES FONCTIONS DE FILTRAGE ===
  const getFilteredProvinces = useCallback(() => {
    return provinces;
  }, [provinces]);

  const getFilteredDepartements = useCallback(() => {
    return departements;
  }, [departements]);

  const getFilteredLocalites = useCallback(() => {
    return localite;
  }, [localite]);

  // Gestionnaires d'événements pour les filtres hiérarchiques
  const handleLocaliteChange = useCallback((e) => {
    const value = e.target.value || null;
    if (value) {
      const depId = getDepartementFromLocalite(value);
      const provId = getProvinceFromLocalite(value);
      const regId = getRegionFromLocalite(value);
      updateFilters({
        localite: value,
        departement: depId,
        province: provId,
        region: regId
      });
    } else {
      updateFilters({
        localite: null,
        departement: null,
        province: null,
        region: null
      });
    }
  }, [getDepartementFromLocalite, getProvinceFromLocalite, getRegionFromLocalite, updateFilters]);

  const handleDepartementChange = useCallback((e) => {
    const value = e.target.value || null;
    if (value) {
      const provId = getProvinceFromDepartement(value);
      const regId = getRegionFromDepartement(value);
      updateFilters({
        departement: value,
        province: provId,
        region: regId,
        localite: null  // Réinitialise la localité
      });
    } else {
      updateFilters({
        departement: null,
        province: null,
        region: null,
        localite: null
      });
    }
  }, [getProvinceFromDepartement, getRegionFromDepartement, updateFilters]);

  const handleProvinceChange = useCallback((e) => {
    const value = e.target.value || null;
    if (value) {
      const regId = getRegionFromProvince(value);
      updateFilters({
        province: value,
        region: regId,
        departement: null,
        localite: null  // Réinitialise département et localité
      });
    } else {
      updateFilters({
        province: null,
        region: null,
        departement: null,
        localite: null
      });
    }
  }, [getRegionFromProvince, updateFilters]);

  const handleRegionChange = useCallback((e) => {
    const value = e.target.value || null;
    if (value) {
      updateFilters({
        region: value,
        province: null,
        departement: null,
        localite: null  // Réinitialise tous les niveaux inférieurs
      });
    } else {
      updateFilters({
        region: null,
        province: null,
        departement: null,
        localite: null
      });
    }
  }, [updateFilters]);

  const handleOperateurToggle = useCallback((operatorId) => {
    updateFilters({
      operateur: filters.operateur === operatorId ? null : operatorId
    });
  }, [filters.operateur, updateFilters]);

  const handleTechnologieToggle = useCallback((techId) => {
    updateFilters({
      technologie: filters.technologie === techId ? null : techId
    });
  }, [filters.technologie, updateFilters]);

  const resetFilters = useCallback(() => {
    setFilters({
      region: null,
      province: null,
      departement: null,
      localite: null,
      operateur: null,
      technologie: null
    });
  }, []);

  // Gestionnaire de clic sur un site dans la carte
  const handleSiteClick = useCallback((site) => {
    toast.success(`Site sélectionné : ${site.nom_site}
Opérateur : ${site.nom_operateur}
Type : ${site.libelle_type}`);
  }, []);

  // Fonction pour obtenir le titre selon les filtres
  const getReportTitle = () => {
    let title = 'Sites de télécommunication';
    let filtersApplied = [];
    // Filtres géographiques
    if (filters.localite) {
      const local = localite.find(l => l.id_localite === filters.localite);
      if (local) {
        title = `Sites de télécommunication de ${local.nom_localite}`;
        filtersApplied.push(`Localité: ${local.nom_localite}`);
      }
    } else if (filters.departement) {
      const dep = departements.find(d => d.id_departement === filters.departement);
      if (dep) {
        title = `Sites de télécommunication du département ${dep.nom_departement}`;
        filtersApplied.push(`Département: ${dep.nom_departement}`);
      }
    } else if (filters.province) {
      const prov = provinces.find(p => p.id_province === filters.province);
      if (prov) {
        title = `Sites de télécommunication de la province ${prov.nom_province}`;
        filtersApplied.push(`Province: ${prov.nom_province}`);
      }
    } else if (filters.region) {
      const reg = regions.find(r => r.id_region === filters.region);
      if (reg) {
        title = `Sites de télécommunication de la région ${reg.nom_region}`;
        filtersApplied.push(`Région: ${reg.nom_region}`);
      }
    } else {
      title = 'Tous les sites de télécommunication du Burkina Faso';
    }
    // Filtres additionnels
    if (filters.operateur) {
      const op = operateurs.find(o => o.id_operateur === filters.operateur);
      if (op) {
        filtersApplied.push(`Opérateur: ${op.nom_operateur}`);
      }
    }
    if (filters.technologie) {
      const tech = typeSites.find(t => t.id_type_site === filters.technologie);
      if (tech) {
        filtersApplied.push(`Technologie: ${tech.libelle_type}`);
      }
    }
    return { title, filtersApplied };
  };

  // Fonction pour imprimer
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const { title, filtersApplied } = getReportTitle();
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
            .logo i { margin-right: 10px; }
            .date { font-size: 14px; color: #666; }
            .title { text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .stats { margin: 20px 0; padding: 10px; background-color: #f9f9f9; border-radius: 5px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <strong style="color: #4f46e5;">Couverture360</strong>
            </div>
            <div class="date">${currentDate}</div>
          </div>
          <div class="title">${title}</div>
          <div class="stats">
            <strong>Total des sites :</strong> ${sites.length} site${sites.length > 1 ? 's' : ''}
            ${filtersApplied.length > 0 ? `<br><br><strong>Informations spécifiques :</strong><br>${filtersApplied.map(filter => `• ${filter}`).join('<br>')}` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Nom du site</th>
                <th>Localisation</th>
                <th>Localité</th>
                <th>Hommes</th>
                <th>Femmes</th>
                <th>Population totale</th>
              </tr>
            </thead>
            <tbody>
              ${sites.map(site => `
                <tr>
                  <td>${site.nom_site || 'N/A'}</td>
                  <td>${site.latitude_site || 'N/A'}, ${site.longitude_site || 'N/A'}</td>
                  <td>${site.nom_localite || 'N/A'}</td>
                  <td>${site.hommes || 'N/A'}</td>
                  <td>${site.femmes || 'N/A'}</td>
                  <td>${site.pop_total || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Fonction pour télécharger en PDF
  const handleDownloadPDF = async () => {
    const { title, filtersApplied } = getReportTitle();
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      pdf.setFont('helvetica');
      pdf.setFontSize(16);

      // En-tête
      pdf.setTextColor(79, 70, 229);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Couverture360', 15, 20);
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(12);
      pdf.text(currentDate, 250, 20);

      // Titre principal
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (297 - titleWidth) / 2, 40);

      // Statistiques globales
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      let yPosStats = 55;
      pdf.text(`Total des sites : ${sites.length} site${sites.length > 1 ? 's' : ''}`, 15, yPosStats);

      

      // Organiser les sites par opérateur et technologie
      const sitesByOperatorAndTech = {};
      sites.forEach(site => {
        const opKey = site.nom_operateur || 'Non défini';
        const techKey = site.libelle_type || 'Non défini';
        
        if (!sitesByOperatorAndTech[opKey]) {
          sitesByOperatorAndTech[opKey] = {};
        }
        if (!sitesByOperatorAndTech[opKey][techKey]) {
          sitesByOperatorAndTech[opKey][techKey] = [];
        }
        sitesByOperatorAndTech[opKey][techKey].push(site);
      });

      // Configuration du tableau
      const headers = ['Nom du site', 'Localisation', 'Localité', 'Population'];
      const columnWidths = [60, 50, 50, 35];
      let yPos = yPosStats + 20;

      // Parcourir les opérateurs
      for (const [operateur, techGroups] of Object.entries(sitesByOperatorAndTech)) {
        // Pour chaque nouvelle page
        if (yPos > 180) {
          pdf.addPage();
          yPos = 20;
        }

        // Titre de l'opérateur
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(79, 70, 229);
        pdf.text(`Opérateur : ${operateur}`, 15, yPos);
        yPos += 8;

        // Parcourir les technologies
        for (const [tech, sitesList] of Object.entries(techGroups)) {
          if (yPos > 180) {
            pdf.addPage();
            yPos = 20;
          }

          // Sous-titre de la technologie
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(`Technologie : ${tech} (${sitesList.length} sites)`, 15, yPos);
          yPos += 10;

          // En-têtes du tableau
          const headers = ['Nom du site', 'Localisation', 'Localité', 'Hommes', 'Femmes', 'Pop. totale'];
          const columnWidths = [50, 45, 45, 30, 30, 35];
          let xPos = 15;
          pdf.setFontSize(10);
          headers.forEach((header, index) => {
            pdf.text(header, xPos, yPos);
            xPos += columnWidths[index];
          });
          pdf.line(15, yPos + 2, 282, yPos + 2);
          yPos += 8;

          // Données des sites
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          
          sitesList.forEach(site => {
            if (yPos > 180) {
              pdf.addPage();
              yPos = 20;
              // Répéter les en-têtes
              xPos = 15;
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              headers.forEach((header, index) => {
                pdf.text(header, xPos, yPos);
                xPos += columnWidths[index];
              });
              pdf.line(15, yPos + 2, 282, yPos + 2);
              yPos += 8;
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(8);
            }

            xPos = 15;
            const rowData = [
              site.nom_site || 'N/A',
              `${site.latitude_site || 'N/A'}, ${site.longitude_site || 'N/A'}`,
              site.nom_localite || 'N/A',
              site.hommes || 'N/A',
              site.femmes || 'N/A',
              site.pop_total || 'N/A'
            ];

            rowData.forEach((data, colIndex) => {
              let text = data.toString();
              const maxWidth = columnWidths[colIndex] - 2;
              while (pdf.getTextWidth(text) > maxWidth && text.length > 0) {
                text = text.slice(0, -1);
              }
              pdf.text(text, xPos, yPos);
              xPos += columnWidths[colIndex];
            });
            yPos += 6;
          });
          yPos += 15;
        }
        yPos += 10;
      }

      pdf.save(`sites_telecom_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  // Application des filtres
  const applyFilters = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.localite) {
        params.id_localite = parseInt(filters.localite);
      } else if (filters.departement) {
        params.id_departement = parseInt(filters.departement);
      } else if (filters.province) {
        params.id_province = parseInt(filters.province);
      } else if (filters.region) {
        params.id_region = parseInt(filters.region);
      }
      if (filters.operateur) {
        params.id_operateur = parseInt(filters.operateur);
      }
      if (filters.technologie) {
        params.id_type_site = parseInt(filters.technologie);
      }
      const res = await api.get('getSitesByFilters.php', { params });
      setSites(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      handleApiError(error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Chargement initial des données
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const responses = await Promise.allSettled([
          api.get('getSites.php'),
          api.get('getOperateurs.php'),
          api.get('getTypeSites.php'),
          api.get('getTrimestres.php'),
          api.get('getLocalites.php'),
          api.get('regions.php'),
          api.get('provinces.php'),
          api.get('departements.php'),
        ]);
        const [sitesRes, opRes, typeRes, triRes, locRes, regRes, provRes, depRes] = responses;
        setSites(sitesRes.status === 'fulfilled' && Array.isArray(sitesRes.value.data) ? sitesRes.value.data : []);
        setOperateurs(opRes.status === 'fulfilled' ? opRes.value.data : []);
        setTypeSites(typeRes.status === 'fulfilled' ? typeRes.value.data : []);
        setTrimestres(triRes.status === 'fulfilled' ? triRes.value.data : []);
        setLocalite(locRes.status === 'fulfilled' ? locRes.value.data : []);
        setRegions(regRes.status === 'fulfilled' ? regRes.value.data : []);
        setProvinces(provRes.status === 'fulfilled' ? provRes.value.data : []);
        setDepartements(depRes.status === 'fulfilled' ? depRes.value.data : []);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Application des filtres avec debounce
  useEffect(() => {
    const hasActiveFilter = Object.values(filters).some(value => value !== null);
    if (hasActiveFilter) {
      const timeoutId = setTimeout(() => {
        applyFilters();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      const fetchAllSites = async () => {
        setLoading(true);
        try {
          const response = await api.get('getSites.php');
          setSites(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          handleApiError(error);
          setSites([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAllSites();
    }
  }, [filters, applyFilters]);

  // Gestion des formulaires
  const handleFormChange = useCallback((e) => {
    setFormData(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("ajouter_site.php", formData);
      toast.success("Site ajouté avec succès !");
      setFormData({
        nom_site: "", 
        latitude_site: "", 
        longitude_site: "", 
        id_localite: "",
        id_operateur: "", 
        id_type_site: "", 
        annee_site: "", 
        id_trimestre: ""
      });
      setCurrentView("liste");
      const hasActiveFilter = Object.values(filters).some(value => value !== null);
      if (hasActiveFilter) {
        applyFilters();
      } else {
        const response = await api.get('getSites.php');
        setSites(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportChange = useCallback((e) => {
    setImportData(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
  }, []);

  const handleImportFileChange = useCallback((e) => {
    setImportFile(e.target.files[0]);
  }, []);

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Veuillez sélectionner un fichier Excel.");
      return;
    }
    const formData = new FormData();
    Object.entries(importData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", importFile);
    setLoading(true);
    try {
      const response = await api.post("importer_sites.php", formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      const result = response.data;
      toast.success(`Importation terminée ! ✅ Sites ajoutés : ${result.importés}, ⚠️ Doublons ignorés : ${result.ignorés}, 📊 Total traité : ${result.importés + result.ignorés}`);
      setCurrentView("liste");
      setImportFile(null);
      setImportData({ 
        id_operateur: "", 
        id_type_site: "", 
        annee_site: "", 
        id_trimestre: "" 
      });
      const hasActiveFilter = Object.values(filters).some(value => value !== null);
      if (hasActiveFilter) {
        applyFilters();
      } else {
        const response = await api.get('getSites.php');
        setSites(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires pour l'affichage
  const getFilterSummary = () => {
    const parts = [];
    if (filters.localite) {
      const local = localite.find(l => l.id_localite == filters.localite);
      if (local) parts.push(`📍 ${local.nom_localite} (Localité)`);
    } else if (filters.departement) {
      const dep = departements.find(d => d.id_departement == filters.departement);
      if (dep) parts.push(`📍 ${dep.nom_departement} (Département)`);
    } else if (filters.province) {
      const prov = provinces.find(p => p.id_province == filters.province);
      if (prov) parts.push(`📍 ${prov.nom_province} (Province)`);
    } else if (filters.region) {
      const reg = regions.find(r => r.id_region == filters.region);
      if (reg) parts.push(`📍 ${reg.nom_region} (Région)`);
    }
    if (filters.technologie) {
      const tech = typeSites.find(t => t.id_type_site == filters.technologie);
      if (tech) parts.push(`📶 ${tech.libelle_type}`);
    }
    if (filters.operateur) {
      const op = operateurs.find(o => o.id_operateur == filters.operateur);
      if (op) parts.push(`🔧 ${op.nom_operateur}`);
    }
    return parts.length > 0 ? parts : null;
  };

  const getAnalysis = () => {
    if (!Array.isArray(sites) || sites.length === 0) return null;
    const opMap = new Set();
    const techMap = {};
    sites.forEach(s => {
      if (s.id_operateur) opMap.add(s.id_operateur);
      const techLabel = typeSites.find(t => t.id_type_site === s.id_type_site)?.libelle_type || "Inconnu";
      techMap[techLabel] = (techMap[techLabel] || 0) + 1;
    });
    const opNames = Array.from(opMap)
      .map(id => operateurs.find(o => o.id_operateur === id)?.nom_operateur)
      .filter(Boolean)
      .join(", ");
    const techList = Object.entries(techMap)
      .map(([tech, count]) => `${tech} (${count})`)
      .join(", ");
    return { 
      count: sites.length, 
      operators: opNames || "Aucun", 
      technologies: techList || "Aucune" 
    };
  };

  const summary = getFilterSummary();
  const analysis = getAnalysis();

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <div className="sites-container p-3 p-md-4">
        {loading && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "20px 30px",
              borderRadius: "12px",
              textAlign: "center"
            }}>
              <div className="spinner-border text-light" role="status"></div>
              <p style={{ margin: "10px 0 0 0" }}>Chargement...</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-4">
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              backgroundColor: "#f9fafb"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  backgroundColor: "#4f46e5",
                  color: "white",
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem"
                }}>
                  <i className="bi bi-building"></i>
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#111827"
                  }}>
                    Gestion des Sites
                  </h2>
                  <p style={{
                    margin: "4px 0 0 0",
                    fontSize: "0.875rem",
                    color: "#6b7280"
                  }}>
                    Analyse et suivi des infrastructures télécom
                  </p>
                </div>
              </div>
              <div style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "9999px",
                padding: "8px 16px",
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "#111827",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <i className="bi bi-grid" style={{ color: "#4f46e5" }}></i>
                <span>{sites.length} sites</span>
              </div>
            </div>
            {/* Navigation */}
            <div style={{
              display: "flex",
              padding: "0",
              backgroundColor: "white"
            }}>
              {[
                { view: "liste", icon: "list-ul", label: "Liste" },
                { view: "ajout", icon: "plus-circle", label: "Ajouter" },
                { view: "import", icon: "file-earmark-excel", label: "Importer" }
              ].map(({ view, icon, label }) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    border: "none",
                    backgroundColor: currentView === view ? "#4f46e5" : "transparent",
                    color: currentView === view ? "white" : "#4b5563",
                    fontSize: "0.95rem",
                    fontWeight: currentView === view ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <i className={`bi bi-${icon}`}></i>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vue Liste */}
        {currentView === "liste" && (
          <>
            {/* Section Filtres */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              marginBottom: "24px",
              overflow: "hidden"
            }}>
              <div style={{ padding: "24px" }}>
                <h5 style={{
                  marginBottom: "20px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: "#111827",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <i className="bi bi-funnel"></i>
                  Filtres
                </h5>
                <div className="d-flex flex-wrap gap-3 mb-4 align-items-end">
                  <div style={{ minWidth: "140px" }}>
                    <label style={{
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      color: "#111827",
                      marginBottom: "6px",
                      display: "block"
                    }}>
                      Région
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.region || ""}
                      onChange={handleRegionChange}
                      disabled={loading}
                    >
                      <option value="">Toutes</option>
                      {regions.map(opt => (
                        <option key={opt.id_region} value={opt.id_region}>
                          {opt.nom_region}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: "140px" }}>
                    <label style={{
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      color: "#111827",
                      marginBottom: "6px",
                      display: "block"
                    }}>
                      Province
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.province || ""}
                      onChange={handleProvinceChange}
                      disabled={loading}
                    >
                      <option value="">Toutes</option>
                      {getFilteredProvinces().map(opt => (
                        <option key={opt.id_province} value={opt.id_province}>
                          {opt.nom_province}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: "140px" }}>
                    <label style={{
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      color: "#111827",
                      marginBottom: "6px",
                      display: "block"
                    }}>
                      Département
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.departement || ""}
                      onChange={handleDepartementChange}
                      disabled={loading}
                    >
                      <option value="">Toutes</option>
                      {getFilteredDepartements().map(opt => (
                        <option key={opt.id_departement} value={opt.id_departement}>
                          {opt.nom_departement}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: "140px" }}>
                    <label style={{
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      color: "#111827",
                      marginBottom: "6px",
                      display: "block"
                    }}>
                      Localité
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.localite || ""}
                      onChange={handleLocaliteChange}
                      disabled={loading}
                    >
                      <option value="">Toutes</option>
                      {getFilteredLocalites().map(opt => (
                        <option key={opt.id_localite} value={opt.id_localite}>
                          {opt.nom_localite}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Filtres technologie */}
                <div className="mb-4">
                  <label style={{
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    color: "#111827",
                    display: "block",
                    marginBottom: "10px"
                  }}>
                    Technologie
                  </label>
                  <div className="d-flex flex-wrap gap-3">
                    {typeSites.map(t => {
                      const isActive = filters.technologie === t.id_type_site;
                      return (
                        <div key={t.id_type_site} className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: "0.9rem", color: "#4b5563", minWidth: "50px" }}>
                            {t.libelle_type}
                          </span>
                          <button
                            onClick={() => handleTechnologieToggle(t.id_type_site)}
                            disabled={loading}
                            style={{
                              width: "50px",
                              height: "24px",
                              borderRadius: "12px",
                              backgroundColor: isActive ? "#10b981" : "#d1d5db",
                              border: "none",
                              position: "relative",
                              cursor: "pointer",
                              transition: "background-color 0.2s"
                            }}
                          >
                            <span style={{
                              position: "absolute",
                              top: "2px",
                              left: isActive ? "26px" : "2px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              backgroundColor: "white",
                              transition: "left 0.2s",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                            }}></span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Filtres opérateur */}
                <div className="mb-4">
                  <label style={{
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    color: "#111827",
                    display: "block",
                    marginBottom: "10px"
                  }}>
                    Opérateur
                  </label>
                  <div className="d-flex flex-wrap gap-3">
                    {operateurs.map(o => {
                      const isActive = filters.operateur == o.id_operateur;
                      return (
                        <div key={o.id_operateur} className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: "0.9rem", color: "#4b5563", minWidth: "70px" }}>
                            {o.nom_operateur}
                          </span>
                          <button
                            onClick={() => handleOperateurToggle(o.id_operateur)}
                            disabled={loading}
                            style={{
                              width: "50px",
                              height: "24px",
                              borderRadius: "12px",
                              backgroundColor: isActive ? "#3b82f6" : "#d1d5db",
                              border: "none",
                              position: "relative",
                              cursor: "pointer",
                              transition: "background-color 0.2s"
                            }}
                          >
                            <span style={{
                              position: "absolute",
                              top: "2px",
                              left: isActive ? "26px" : "2px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              backgroundColor: "white",
                              transition: "left 0.2s",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                            }}></span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {(summary || analysis) && (
                  <div style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "16px",
                    fontSize: "0.95rem",
                    color: "#1e293b",
                    marginTop: "16px"
                  }}>
                    {summary && (
                      <div style={{ marginBottom: "8px" }}>
                        {summary.map((line, i) => (
                          <div key={i} style={{ marginBottom: "4px" }}>{line}</div>
                        ))}
                      </div>
                    )}
                    {analysis && (
                      <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "8px", marginTop: "8px" }}>
                        <strong>📊 {analysis.count} site{analysis.count > 1 ? "s" : ""}</strong><br />
                        <strong>🔧 Opérateurs :</strong> {analysis.operators}<br />
                        <strong>📶 Technologies :</strong> {analysis.technologies}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={resetFilters}
                    disabled={loading}
                    style={{ padding: "8px 16px" }}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>Réinitialiser
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowMap(!showMap)}
                    disabled={loading || sites.length === 0}
                    style={{ padding: "8px 16px" }}
                  >
                    <i className={`bi ${showMap ? 'bi-list-ul' : 'bi-geo-alt'} me-1`}></i>
                    {showMap ? 'Voir liste' : 'Voir sur la carte'}
                  </button>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={handlePrint}
                    disabled={loading || sites.length === 0}
                    style={{ padding: "8px 16px" }}
                  >
                    <i className="bi bi-printer me-1"></i>Imprimer
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDownloadPDF}
                    disabled={loading || sites.length === 0}
                    style={{ padding: "8px 16px" }}
                  >
                    <i className="bi bi-file-pdf me-1"></i>Télécharger PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Vue Tableau ou Carte */}
            {!showMap ? (
              <div style={{
                backgroundColor: "white",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
                overflow: "hidden"
              }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0",
                    fontSize: "0.875rem"
                  }}>
                    <thead style={{ backgroundColor: "#f9fafb" }}>
                      <tr>
                        <th style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#4b5563",
                          borderBottom: "2px solid #e5e7eb"
                        }}>Nom</th>
                        <th style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#4b5563",
                          borderBottom: "2px solid #e5e7eb"
                        }}>Coordonnées</th>
                        <th style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#4b5563",
                          borderBottom: "2px solid #e5e7eb"
                        }}>Localité</th>
                        <th style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#4b5563",
                          borderBottom: "2px solid #e5e7eb"
                        }}>Opérateur</th>
                        <th style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#4b5563",
                          borderBottom: "2px solid #e5e7eb"
                        }}>Type</th>
                        <th style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#4b5563",
                          borderBottom: "2px solid #e5e7eb"
                        }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.length > 0 ? (
                        sites.map((s) => (
                          <tr key={s.id_site} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{
                              padding: "12px 16px",
                              fontWeight: "500",
                              color: "#111827"
                            }}>
                              <strong>{s.nom_site || 'N/A'}</strong>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#4b5563" }}>
                              <div><i className="bi bi-geo-alt text-primary me-1"></i>{s.latitude_site || '-'}</div>
                              <div><i className="bi bi-geo-alt text-primary me-1"></i>{s.longitude_site || '-'}</div>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#4b5563" }}>{s.nom_localite || 'N/A'}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{
                                backgroundColor: "#dbeafe",
                                color: "#1e40af",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: "500"
                              }}>
                                {s.nom_operateur}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{
                                backgroundColor: "#f3f4f6",
                                color: "#4b5563",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "0.8rem"
                              }}>
                                {s.libelle_type}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#4b5563" }}>{s.annee_site} - {s.libelle_trimestre}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{
                            textAlign: "center",
                            padding: "40px 16px",
                            color: "#9ca3af",
                            fontSize: "1rem"
                          }}>
                            <i className="bi bi-inbox" style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}></i>
                            Aucun site trouvé
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: "white",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
                overflow: "hidden"
              }}>
                <div style={{
                  padding: "20px 24px",
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <h5 style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: "#111827",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <i className="bi bi-geo-alt"></i>
                    Carte des sites ({sites.length} site{sites.length > 1 ? 's' : ''})
                  </h5>
                  <div style={{
                    backgroundColor: "#e5e7eb",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    color: "#4b5563"
                  }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Cliquez sur un marqueur pour voir les détails
                  </div>
                </div>
                <div style={{
                  height: "600px",
                  position: "relative",
                  backgroundColor: "#f8fafc"
                }}>
                  <MapView 
                    sites={sites} 
                    onSiteClick={handleSiteClick}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Vue Ajout */}
        {currentView === "ajout" && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            marginBottom: "24px",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb"
            }}>
              <h3 style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#111827"
              }}>
                <i className="bi bi-plus-circle me-2"></i>Ajouter un site
              </h3>
            </div>
            <div style={{ padding: "24px" }}>
              <form onSubmit={handleFormSubmit} style={{ display: "grid", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Nom du site *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nom_site"
                      value={formData.nom_site}
                      onChange={handleFormChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Localité *</label>
                    <select
                      className="form-select"
                      name="id_localite"
                      value={formData.id_localite}
                      onChange={handleFormChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    >
                      <option value="">Sélectionner</option>
                      {localite.map(l => (
                        <option key={l.id_localite} value={l.id_localite}>{l.nom_localite}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Latitude *</label>
                    <input
                      type="number"
                      step="0.00000001"
                      className="form-control"
                      name="latitude_site"
                      value={formData.latitude_site}
                      onChange={handleFormChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Longitude *</label>
                    <input
                      type="number"
                      step="0.00000001"
                      className="form-control"
                      name="longitude_site"
                      value={formData.longitude_site}
                      onChange={handleFormChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Opérateur *</label>
                    <select
                      className="form-select"
                      name="id_operateur"
                      value={formData.id_operateur}
                      onChange={handleFormChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    >
                      <option value="">Sélectionner</option>
                      {operateurs.map(o => (
                        <option key={o.id_operateur} value={o.id_operateur}>{o.nom_operateur}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Type de site *</label>
                    <select
                      className="form-select"
                      name="id_type_site"
                      value={formData.id_type_site}
                      onChange={handleFormChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    >
                      <option value="">Sélectionner</option>
                      {typeSites.map(t => (
                        <option key={t.id_type_site} value={t.id_type_site}>{t.libelle_type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Année *</label>
                    <input
                      type="text"
                      pattern="\d{4}"
                      className="form-control"
                      name="annee_site"
                      value={formData.annee_site}
                      onChange={handleFormChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Trimestre *</label>
                    <select
                      className="form-select"
                      name="id_trimestre"
                      value={formData.id_trimestre}
                      onChange={handleFormChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    >
                      <option value="">Sélectionner</option>
                      {trimestres.map(t => (
                        <option key={t.id_trimestre} value={t.id_trimestre}>{t.libelle_trimestre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "end", marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentView("liste")}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "none" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                    style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#10b981", border: "none", color: "white" }}
                  >
                    {loading ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vue Import */}
        {currentView === "import" && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            marginBottom: "24px",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb"
            }}>
              <h3 style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#111827"
              }}>
                <i className="bi bi-file-earmark-excel me-2"></i>Importer des sites
              </h3>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "0.9rem",
                color: "#065f46",
                marginBottom: "20px"
              }}>
                <i className="bi bi-info-circle me-2"></i>
                Format requis : <code>Nom_localite, Nom_site, Longitude_site,Latitude_site</code>
              </div>
              <form onSubmit={handleImportSubmit} style={{ display: "grid", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Opérateur *</label>
                    <select
                      className="form-select"
                      name="id_operateur"
                      value={importData.id_operateur}
                      onChange={handleImportChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    >
                      <option value="">Choisir</option>
                      {operateurs.map(o => (
                        <option key={o.id_operateur} value={o.id_operateur}>{o.nom_operateur}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Type de site *</label>
                    <select
                      className="form-select"
                      name="id_type_site"
                      value={importData.id_type_site}
                      onChange={handleImportChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    >
                      <option value="">Choisir</option>
                      {typeSites.map(t => (
                        <option key={t.id_type_site} value={t.id_type_site}>{t.libelle_type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Année *</label>
                    <input
                      type="text"
                      pattern="\d{4}"
                      className="form-control"
                      name="annee_site"
                      value={importData.annee_site}
                      onChange={handleImportChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: "6px"
                    }}>Trimestre *</label>
                    <select
                      className="form-select"
                      name="id_trimestre"
                      value={importData.id_trimestre}
                      onChange={handleImportChange}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    >
                      <option value="">Choisir</option>
                      {trimestres.map(t => (
                        <option key={t.id_trimestre} value={t.id_trimestre}>{t.libelle_trimestre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "6px"
                  }}>Fichier Excel *</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="form-control"
                    onChange={handleImportFileChange}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "end", marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentView("liste")}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "none" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-info text-white"
                    disabled={loading}
                    style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#007bff", border: "none" }}
                  >
                    {loading ? "Import en cours..." : "Importer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sites;