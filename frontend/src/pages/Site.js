import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import MapView from "../components/MapView";
import jsPDF from 'jspdf';
import toast, { Toaster } from 'react-hot-toast';
import './Sites.css';

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
  
  // États pour les rôles
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  // États pour les filtres
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

  // Récupérer le rôle de l'utilisateur
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
          setUserRole('observateur');
          setRoleLoading(false);
          return;
        }

        const response = await fetch(`http://localhost/app-web/backend/api/get_user_role.php?user_id=${userId}`);
        const result = await response.json();
        
        if (result.success) {
          setUserRole(result.role);
        } else {
          setUserRole('observateur');
        }
      } catch (error) {
        console.error('Erreur chargement rôle:', error);
        setUserRole('observateur');
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  // Déterminer les permissions
  const canAddSites = userRole === 'admin' || userRole === 'technicien';
  const canImportSites = userRole === 'admin' || userRole === 'technicien';
  const canViewList = true;

  // Gestion des erreurs
  const handleApiError = (error) => {
    console.error("Erreur API:", error);
    toast.error(`Une erreur est survenue : ${error.response?.data?.message || error.message}`);
  };

  // FONCTION PRINCIPALE DE MISE À JOUR DES FILTRES
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  // === FONCTIONS DE FILTRAGE TOUJOURS COMPLÈTES ===
  const getFilteredProvinces = useCallback(() => {
    // TOUJOURS retourner toutes les provinces
    return provinces;
  }, [provinces]);

  const getFilteredDepartements = useCallback(() => {
    // TOUJOURS retourner tous les départements
    return departements;
  }, [departements]);

  const getFilteredLocalites = useCallback(() => {
    // TOUJOURS retourner toutes les localités
    return localite;
  }, [localite]);

  // === GESTIONNAIRES D'ÉVÉNEMENTS AVEC LOGIQUE HIÉRARCHIQUE ===
  const handleRegionChange = useCallback((e) => {
    const value = e.target.value || null;
    updateFilters({
      region: value,
      province: null,
      departement: null,
      localite: null
    });
  }, [updateFilters]);

  const handleProvinceChange = useCallback((e) => {
    const value = e.target.value || null;
    
    if (value) {
      // Trouver la province sélectionnée
      const selectedProvince = provinces.find(p => String(p.id_province) === String(value));
      
      if (selectedProvince) {
        // Mettre à jour la province et la région correspondante
        updateFilters({
          province: value,
          region: selectedProvince.id_region,
          departement: null,
          localite: null
        });
      }
    } else {
      updateFilters({
        province: value,
        departement: null,
        localite: null
      });
    }
  }, [provinces, updateFilters]);

  const handleDepartementChange = useCallback((e) => {
    const value = e.target.value || null;
    
    if (value) {
      // Trouver le département sélectionné
      const selectedDepartement = departements.find(d => String(d.id_departement) === String(value));
      
      if (selectedDepartement) {
        // Trouver la province de ce département
        const selectedProvince = provinces.find(p => String(p.id_province) === String(selectedDepartement.id_province));
        
        if (selectedProvince) {
          // Mettre à jour le département, la province et la région correspondante
          updateFilters({
            departement: value,
            province: selectedDepartement.id_province,
            region: selectedProvince.id_region,
            localite: null
          });
        }
      }
    } else {
      updateFilters({
        departement: value,
        localite: null
      });
    }
  }, [departements, provinces, updateFilters]);

  const handleLocaliteChange = useCallback((e) => {
    const value = e.target.value || null;
    
    if (value) {
      // Trouver la localité sélectionnée
      const selectedLocalite = localite.find(l => String(l.id_localite) === String(value));
      
      if (selectedLocalite) {
        // Trouver le département de cette localité
        const selectedDepartement = departements.find(d => String(d.id_departement) === String(selectedLocalite.id_departement));
        
        if (selectedDepartement) {
          // Trouver la province de ce département
          const selectedProvince = provinces.find(p => String(p.id_province) === String(selectedDepartement.id_province));
          
          if (selectedProvince) {
            // Mettre à jour tous les niveaux hiérarchiques
            updateFilters({
              localite: value,
              departement: selectedLocalite.id_departement,
              province: selectedDepartement.id_province,
              region: selectedProvince.id_region
            });
            return;
          }
        }
      }
    }
    
    // Si aucune valeur ou localité non trouvée, réinitialiser seulement la localité
    updateFilters({
      localite: value
    });
  }, [localite, departements, provinces, updateFilters]);

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
      let yPos = yPosStats + 20;

      // Parcourir les opérateurs
      for (const [operateur, techGroups] of Object.entries(sitesByOperatorAndTech)) {
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
    formData.append("id_operateur", importData.id_operateur);
    formData.append("id_type_site", importData.id_type_site);
    formData.append("annee_site", importData.annee_site);
    formData.append("id_trimestre", importData.id_trimestre);
    formData.append("file", importFile);

    setLoading(true);
    try {
      const response = await api.post("importer_sites.php", formData, { 
        headers: { 
          'Content-Type': 'multipart/form-data',
        } 
      });
      
      const result = response.data;
      toast.success(`Importation terminée ! Sites ajoutés : ${result.sites_ajoutes}, Doublons ignorés : ${result.doublons_ignores}, Total traité : ${result.total_traite}`);
      
      setCurrentView("liste");
      setImportFile(null);
      setImportData({ 
        id_operateur: "", 
        id_type_site: "", 
        annee_site: "", 
        id_trimestre: "" 
      });
      
      // Recharger les données
      const hasActiveFilter = Object.values(filters).some(value => value !== null);
      if (hasActiveFilter) {
        applyFilters();
      } else {
        const response = await api.get('getSites.php');
        setSites(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error("Erreur import:", err);
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
      if (local) parts.push(`Localité: ${local.nom_localite}`);
    } else if (filters.departement) {
      const dep = departements.find(d => d.id_departement == filters.departement);
      if (dep) parts.push(`Département: ${dep.nom_departement}`);
    } else if (filters.province) {
      const prov = provinces.find(p => p.id_province == filters.province);
      if (prov) parts.push(`Province: ${prov.nom_province}`);
    } else if (filters.region) {
      const reg = regions.find(r => r.id_region == filters.region);
      if (reg) parts.push(`Région: ${reg.nom_region}`);
    }
    if (filters.technologie) {
      const tech = typeSites.find(t => t.id_type_site == filters.technologie);
      if (tech) parts.push(`Technologie: ${tech.libelle_type}`);
    }
    if (filters.operateur) {
      const op = operateurs.find(o => o.id_operateur == filters.operateur);
      if (op) parts.push(`Opérateur: ${op.nom_operateur}`);
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

  // Fonctions pour la navigation
  const getViewIcon = (view) => {
    switch(view) {
      case 'liste': return 'list-ul';
      case 'ajout': return 'plus-circle';
      case 'import': return 'file-earmark-excel';
      default: return 'list-ul';
    }
  };

  const getViewLabel = (view) => {
    switch(view) {
      case 'liste': return 'Liste';
      case 'ajout': return 'Ajouter';
      case 'import': return 'Importer';
      default: return 'Liste';
    }
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
      
      <div className="sites-container">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="spinner"></div>
              <p>Chargement...</p>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="sites-header">
          <div className="sites-header-top">
            <div className="sites-title-container">
              <div className="sites-title-icon">
                <i className="bi bi-building"></i>
              </div>
              <div className="sites-title-text">
                <h2>Gestion des Sites</h2>
                <p>Analyse et suivi des infrastructures télécom</p>
              </div>
            </div>
            
            <div className="sites-header-info">
              <div className="sites-count-badge">
                <i className="bi bi-grid"></i>
                <span>{sites.length} sites</span>
              </div>
              
              {/* Indicateur de rôle */}
              {!roleLoading && userRole && (
                <div className={`role-badge role-${userRole}`}>
                  <i className={`bi ${
                    userRole === 'admin' ? 'bi-shield-check' :
                    userRole === 'technicien' ? 'bi-tools' :
                    'bi-eye'
                  } me-1`}></i>
                  {userRole}
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation avec gestion des rôles */}
          <div className="sites-nav">
            {/* Liste - accessible à tous */}
            <button
              className={`sites-nav-button ${currentView === 'liste' ? 'active' : ''}`}
              onClick={() => setCurrentView('liste')}
              disabled={loading}
            >
              <i className="bi bi-list-ul"></i>
              Liste
            </button>

            {/* Ajouter - seulement admin et technicien */}
            {(canAddSites) && (
              <button
                className={`sites-nav-button ${currentView === 'ajout' ? 'active' : ''}`}
                onClick={() => setCurrentView('ajout')}
                disabled={loading}
              >
                <i className="bi bi-plus-circle"></i>
                Ajouter
              </button>
            )}

            {/* Importer - seulement admin et technicien */}
            {(canImportSites) && (
              <button
                className={`sites-nav-button ${currentView === 'import' ? 'active' : ''}`}
                onClick={() => setCurrentView('import')}
                disabled={loading}
              >
                <i className="bi bi-file-earmark-excel"></i>
                Importer
              </button>
            )}
          </div>
        </div>

        {/* Vue Liste */}
        {currentView === "liste" && (
          <>
            {/* Section Filtres */}
            <div className="sites-card">
              <div className="sites-card-header">
                <h5><i className="bi bi-funnel"></i>Filtres</h5>
              </div>
              <div className="sites-card-body">
                <div className="filters-grid">
                  <div className="filter-group">
                    <label className="filter-label">Région</label>
                    <select
                      className="filter-select"
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
                  
                  <div className="filter-group">
                    <label className="filter-label">Province</label>
                    <select
                      className="filter-select"
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
                  
                  <div className="filter-group">
                    <label className="filter-label">Département</label>
                    <select
                      className="filter-select"
                      value={filters.departement || ""}
                      onChange={handleDepartementChange}
                      disabled={loading}
                    >
                      <option value="">Tous</option>
                      {getFilteredDepartements().map(opt => (
                        <option key={opt.id_departement} value={opt.id_departement}>
                          {opt.nom_departement}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label className="filter-label">Localité</label>
                    <select
                      className="filter-select"
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
                <div className="toggle-container">
                  <div className="toggle-group">
                    <div className="toggle-group-label">
                      <i className="bi bi-wifi"></i> Technologie
                    </div>
                    {typeSites.map(t => {
                      const isActive = filters.technologie === t.id_type_site;
                      return (
                        <div key={t.id_type_site} className="toggle-item">
                          <span className="toggle-label">{t.libelle_type}</span>
                          <button
                            onClick={() => handleTechnologieToggle(t.id_type_site)}
                            disabled={loading}
                            className={`toggle-switch tech ${isActive ? 'active' : ''}`}
                          >
                            <span></span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Filtres opérateur */}
                  <div className="toggle-group">
                    <div className="toggle-group-label">
                      <i className="bi bi-building"></i> Opérateur
                    </div>
                    {operateurs.map(o => {
                      const isActive = filters.operateur === o.id_operateur;
                      return (
                        <div key={o.id_operateur} className="toggle-item">
                          <span className="toggle-label">{o.nom_operateur}</span>
                          <button
                            onClick={() => handleOperateurToggle(o.id_operateur)}
                            disabled={loading}
                            className={`toggle-switch operator ${isActive ? 'active' : ''}`}
                          >
                            <span></span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Résumé */}
                {(summary || analysis) && (
                  <div className="filter-summary">
                    {summary && (
                      <div>
                        {summary.map((line, i) => (
                          <div key={i} style={{marginBottom: '4px'}}>
                            <i className="bi bi-filter-circle me-2"></i>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                    {analysis && (
                      <div className="filter-analysis">
                        <div style={{marginBottom: '8px'}}>
                          <i className="bi bi-graph-up me-2"></i>
                          <strong>{analysis.count} site{analysis.count > 1 ? "s" : ""}</strong>
                        </div>
                        <div style={{marginBottom: '4px'}}>
                          <i className="bi bi-building me-2"></i>
                          <strong>Opérateurs :</strong> {analysis.operators}
                        </div>
                        <div>
                          <i className="bi bi-wifi me-2"></i>
                          <strong>Technologies :</strong> {analysis.technologies}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="action-buttons">
                  <button
                    className="btn-action btn-outline"
                    onClick={resetFilters}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>Réinitialiser
                  </button>
                  <button
                    className="btn-action btn-primary"
                    onClick={() => setShowMap(!showMap)}
                    disabled={loading || sites.length === 0}
                  >
                    <i className={`bi ${showMap ? 'bi-list-ul' : 'bi-geo-alt'}`}></i>
                    {showMap ? 'Voir liste' : 'Voir sur la carte'}
                  </button>
                  <button
                    className="btn-action btn-success"
                    onClick={handlePrint}
                    disabled={loading || sites.length === 0}
                  >
                    <i className="bi bi-printer"></i>Imprimer
                  </button>
                  <button
                    className="btn-action btn-danger"
                    onClick={handleDownloadPDF}
                    disabled={loading || sites.length === 0}
                  >
                    <i className="bi bi-file-pdf"></i>Télécharger PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Vue Tableau ou Carte */}
            {!showMap ? (
              <div className="sites-card">
                <div className="sites-table-container">
                  <table className="sites-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Coordonnées</th>
                        <th>Localité</th>
                        <th>Opérateur</th>
                        <th>Type</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.length > 0 ? (
                        sites.map((s) => (
                          <tr key={s.id_site}>
                            <td>
                              <strong>{s.nom_site || 'N/A'}</strong>
                            </td>
                            <td>
                              <div><i className="bi bi-geo-alt text-primary me-1"></i>{s.latitude_site || '-'}</div>
                              <div><i className="bi bi-geo-alt text-primary me-1"></i>{s.longitude_site || '-'}</div>
                            </td>
                            <td>{s.nom_localite || 'N/A'}</td>
                            <td>
                              <span className="badge badge-operator">
                                {s.nom_operateur}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-tech">
                                {s.libelle_type}
                              </span>
                            </td>
                            <td>{s.annee_site} - {s.libelle_trimestre}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty-state">
                            <i className="bi bi-inbox"></i>
                            Aucun site trouvé
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="sites-card">
                <div className="map-header">
                  <h5>
                    <i className="bi bi-geo-alt"></i>
                    Carte des sites ({sites.length} site{sites.length > 1 ? 's' : ''})
                  </h5>
                  <div className="map-info-badge">
                    <i className="bi bi-info-circle me-1"></i>
                    Cliquez sur un marqueur pour voir les détails
                  </div>
                </div>
                <div className="map-container">
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
          <div className="sites-card">
            <div className="sites-card-header">
              <h3><i className="bi bi-plus-circle me-2"></i>Ajouter un site</h3>
            </div>
            <div className="sites-card-body">
              <form onSubmit={handleFormSubmit} className="form-grid">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Nom du site *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nom_site"
                      value={formData.nom_site}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Localité *</label>
                    <select
                      className="form-control"
                      name="id_localite"
                      value={formData.id_localite}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Sélectionner</option>
                      {localite.map(l => (
                        <option key={l.id_localite} value={l.id_localite}>{l.nom_localite}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Latitude *</label>
                    <input
                      type="number"
                      step="0.00000001"
                      className="form-control"
                      name="latitude_site"
                      value={formData.latitude_site}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude *</label>
                    <input
                      type="number"
                      step="0.00000001"
                      className="form-control"
                      name="longitude_site"
                      value={formData.longitude_site}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Opérateur *</label>
                    <select
                      className="form-control"
                      name="id_operateur"
                      value={formData.id_operateur}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Sélectionner</option>
                      {operateurs.map(o => (
                        <option key={o.id_operateur} value={o.id_operateur}>{o.nom_operateur}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type de site *</label>
                    <select
                      className="form-control"
                      name="id_type_site"
                      value={formData.id_type_site}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Sélectionner</option>
                      {typeSites.map(t => (
                        <option key={t.id_type_site} value={t.id_type_site}>{t.libelle_type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Année *</label>
                    <input
                      type="text"
                      pattern="\d{4}"
                      className="form-control"
                      name="annee_site"
                      value={formData.annee_site}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Trimestre *</label>
                    <select
                      className="form-control"
                      name="id_trimestre"
                      value={formData.id_trimestre}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Sélectionner</option>
                      {trimestres.map(t => (
                        <option key={t.id_trimestre} value={t.id_trimestre}>{t.libelle_trimestre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-action btn-secondary"
                    onClick={() => setCurrentView("liste")}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-action btn-success"
                    disabled={loading}
                  >
                    {loading ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vue Import - Version Pro */}
        {currentView === "import" && (
          <div className="sites-card">
            <div className="sites-card-header">
              <h3><i className="bi bi-file-earmark-excel me-2"></i>Importer des sites</h3>
            </div>
            <div className="sites-card-body">
              <div className="alert alert-info">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle me-3 fs-5"></i>
                  <div>
                    <strong className="d-block mb-1">Format de fichier requis</strong>
                    <span className="text-muted">Colonnes attendues : </span>
                    <code>Nom_localite, Nom_site, Longitude_site, Latitude_site</code>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleImportSubmit} className="form-grid">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">
                      <i className="bi bi-building me-2"></i>Opérateur *
                    </label>
                    <select
                      className="form-control"
                      name="id_operateur"
                      value={importData.id_operateur}
                      onChange={handleImportChange}
                      required
                    >
                      <option value="">Sélectionner un opérateur</option>
                      {operateurs.map(o => (
                        <option key={o.id_operateur} value={o.id_operateur}>{o.nom_operateur}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <i className="bi bi-wifi me-2"></i>Type de site *
                    </label>
                    <select
                      className="form-control"
                      name="id_type_site"
                      value={importData.id_type_site}
                      onChange={handleImportChange}
                      required
                    >
                      <option value="">Sélectionner une technologie</option>
                      {typeSites.map(t => (
                        <option key={t.id_type_site} value={t.id_type_site}>{t.libelle_type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">
                      <i className="bi bi-calendar me-2"></i>Année *
                    </label>
                    <input
                      type="text"
                      pattern="\d{4}"
                      className="form-control"
                      name="annee_site"
                      value={importData.annee_site}
                      onChange={handleImportChange}
                      placeholder="2024"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <i className="bi bi-calendar-range me-2"></i>Trimestre *
                    </label>
                    <select
                      className="form-control"
                      name="id_trimestre"
                      value={importData.id_trimestre}
                      onChange={handleImportChange}
                      required
                    >
                      <option value="">Sélectionner un trimestre</option>
                      {trimestres.map(t => (
                        <option key={t.id_trimestre} value={t.id_trimestre}>{t.libelle_trimestre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-file-spreadsheet me-2"></i>Fichier Excel *
                  </label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="form-control"
                      onChange={handleImportFileChange}
                      required
                    />
                    <div className="form-text">
                      <i className="bi bi-info-circle me-1"></i>
                      Formats acceptés : .xlsx, .xls, .csv
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-action btn-outline"
                    onClick={() => setCurrentView("liste")}
                  >
                    <i className="bi bi-arrow-left me-2"></i>Retour
                  </button>
                  <button
                    type="submit"
                    className="btn-action btn-info"
                    disabled={loading}
                  >
                    <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-upload'} me-2`}></i>
                    {loading ? "Import en cours..." : "Importer les données"}
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