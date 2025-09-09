import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { Modal } from 'bootstrap';
import FormulaireInfos from '../components/FormulaireInfos';
import toast, { Toaster } from 'react-hot-toast';

const ExplorationRegionale = () => {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [localites, setLocalites] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDepartement, setSelectedDepartement] = useState('');

  const [titre, setTitre] = useState('Toutes les localités');
  const [search, setSearch] = useState('');

  const [selectedLocalite, setSelectedLocalite] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isExisting, setIsExisting] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const fetchData = async () => {
    try {
      const [resRegions, resProvinces, resDepartements, resLocalites] = await Promise.all([
        axios.get('http://localhost/app-web/backend/api/regions.php'),
        axios.get('http://localhost/app-web/backend/api/provinces.php'),
        axios.get('http://localhost/app-web/backend/api/departements.php'),
        axios.get('http://localhost/app-web/backend/api/getLocalites.php'),
      ]);

      setRegions(resRegions.data);
      setProvinces(resProvinces.data);
      setDepartements(resDepartements.data);
      setLocalites(resLocalites.data);
    } catch (err) {
      console.error('Erreur de chargement des données initiales :', err);
      toast.error('❌ Impossible de charger les données');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fonctions utilitaires pour la hiérarchie géographique
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

  const getRegionFromDepartement = useCallback((depId) => {
    if (!depId) return null;
    const dep = departements.find(d => d.id_departement === depId);
    if (!dep) return null;

    const prov = provinces.find(p => p.id_province === dep.id_province);
    return prov ? prov.id_region : null;
  }, [departements, provinces]);

  // Gestionnaires d'événements pour les filtres hiérarchiques
  const handleDepartementChange = useCallback((e) => {
    const value = e.target.value || '';
    setSelectedDepartement(value);

    if (value) {
      const provId = getProvinceFromDepartement(value);
      const regId = getRegionFromDepartement(value);
      setSelectedProvince(provId ? provId.toString() : '');
      setSelectedRegion(regId ? regId.toString() : '');
    } else {
      setSelectedProvince('');
      setSelectedRegion('');
    }
  }, [getProvinceFromDepartement, getRegionFromDepartement]);

  const handleProvinceChange = useCallback((e) => {
    const value = e.target.value || '';
    setSelectedProvince(value);

    if (value) {
      const regId = getRegionFromProvince(value);
      setSelectedRegion(regId ? regId.toString() : '');
      setSelectedDepartement('');
    } else {
      setSelectedRegion('');
      setSelectedDepartement('');
    }
  }, [getRegionFromProvince]);

  const handleRegionChange = useCallback((e) => {
    const value = e.target.value || '';
    setSelectedRegion(value);
    setSelectedProvince('');
    setSelectedDepartement('');
  }, []);

  // Mise à jour du titre
  useEffect(() => {
    if (selectedDepartement) {
      const departement = departements.find(d => String(d.id_departement) === selectedDepartement);
      setTitre(`Localités du département : ${departement?.nom_departement || ''}`);
    } else if (selectedProvince) {
      const province = provinces.find(p => String(p.id_province) === selectedProvince);
      setTitre(`Localités de la province : ${province?.nom_province || ''}`);
    } else if (selectedRegion) {
      const region = regions.find(r => String(r.id_region) === selectedRegion);
      setTitre(`Localités de la région : ${region?.nom_region || ''}`);
    } else {
      setTitre('Toutes les localités');
    }
  }, [selectedRegion, selectedProvince, selectedDepartement, departements, provinces, regions]);

  // Filtrage des localités
  const getFilteredLocalites = useCallback(() => {
    if (selectedDepartement) {
      return localites.filter(l => l.id_departement == selectedDepartement);
    } else if (selectedProvince) {
      const depsInProvince = departements.filter(d => d.id_province == selectedProvince);
      const depIds = depsInProvince.map(d => d.id_departement);
      return localites.filter(l => depIds.includes(l.id_departement));
    } else if (selectedRegion) {
      const provsInRegion = provinces.filter(p => p.id_region == selectedRegion);
      const provIds = provsInRegion.map(p => p.id_province);
      const depsInRegion = departements.filter(d => provIds.includes(d.id_province));
      const depIds = depsInRegion.map(d => d.id_departement);
      return localites.filter(l => depIds.includes(l.id_departement));
    }
    return localites;
  }, [localites, selectedDepartement, selectedProvince, selectedRegion, departements, provinces]);

  // ✅ Gestion clic sur localité
  const handleLocaliteClick = async (localite) => {
    setSelectedLocalite(localite);
    try {
      const res = await axios.get(`http://localhost/app-web/backend/api/village-details.php?id=${localite.id_localite}`);

      if (res.data?.id) {
        // Localité déjà renseignée → Modifier ou Supprimer
        const choix = window.confirm(
          '✅ Cette localité est déjà renseignée.\n\nCliquez sur OK pour MODIFIER.\nCliquez sur ANNULER pour SUPPRIMER.'
        );

        if (choix) {
          // Modifier
          setIsExisting(true);
          setFormData({
            ...res.data,
            operateurs_appel: res.data.operateurs_appel?.split(',') || [],
            operateurs_internet: res.data.operateurs_internet?.split(',') || [],
          });
          setWordCount(res.data.commentaire?.split(/\s+/).length || 0);

          setTimeout(() => {
            const modal = new Modal(document.getElementById('localiteModal'));
            modal.show();
          }, 100);
        } else {
          // Supprimer
          if (window.confirm('⚠️ Voulez-vous vraiment supprimer cette fiche ?')) {
            try {
              await axios.post('http://localhost/app-web/backend/api/archives_delete.php', {
                id_village: localite.id_localite,
              });
              toast.success('🗑️ Localité supprimée avec succès');
              fetchData(); // recharger les données
            } catch (err) {
              console.error('Erreur lors de la suppression :', err);
              toast.error('❌ Erreur lors de la suppression');
            }
          }
        }
      } else {
        // Localité non renseignée → Renseigner
        if (window.confirm('❌ Localité pas encore renseignée.\nVoulez-vous la renseigner ?')) {
          setIsExisting(false);
          setFormData({
            id_village: localite.id_localite,
            site_2g: '',
            appel_possible: '',
            operateurs_appel: [],
            raison_pas_appel: '',
            qualite_2g: '',
            antenne: '',
            raison_pas_antenne: '',
            site_3g: '',
            internet: '',
            operateurs_internet: [],
            qualite_internet: '',
            commentaire: '',
          });
          setWordCount(0);

          setTimeout(() => {
            const modal = new Modal(document.getElementById('localiteModal'));
            modal.show();
          }, 100);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des infos :', err);
      toast.error('❌ Impossible de charger les informations de la localité');
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (!formData) return;

    if (name === 'commentaire') {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length <= 25) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setWordCount(words.length);
      }
    } else if (type === 'checkbox') {
      setFormData((prev) => {
        const updated = prev[name]?.includes(value)
          ? prev[name].filter((v) => v !== value)
          : [...(prev[name] || []), value];
        return { ...prev, [name]: updated };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (!formData) return;

    const url = isExisting
      ? 'http://localhost/app-web/backend/api/archives_update.php'
      : 'http://localhost/app-web/backend/api/archives_create.php';

    const dataToSend = {
      ...formData,
      operateurs_appel: formData.operateurs_appel.join(','),
      operateurs_internet: formData.operateurs_internet.join(','),
    };

    axios
      .post(url, dataToSend)
      .then(() => {
        toast.success('✅ Formulaire sauvegardé !');
        Modal.getInstance(document.getElementById('localiteModal')).hide();
        fetchData();
      })
      .catch((err) => {
        console.error('Erreur lors de la sauvegarde :', err);
        toast.error('❌ Erreur lors de la sauvegarde');
      });
  };

  const filteredLocalites = getFilteredLocalites().filter((l) =>
    l.nom_localite?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { duration: 4000, style: { background: '#10b981' } },
          error: { duration: 4000, style: { background: '#ef4444' } },
        }}
      />
      <div className="container mt-4">
        <h3 className="fw-bold mb-4 text-primary">🌍 Exploration Régionale</h3>

        <div className="row mb-4">
          <div className="col-md-4">
            <label>Région</label>
            <select className="form-select" value={selectedRegion} onChange={handleRegionChange}>
              <option value="">-- Choisir une région --</option>
              {regions.map((r) => (
                <option key={r.id_region} value={String(r.id_region)}>{r.nom_region}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label>Province</label>
            <select className="form-select" value={selectedProvince} onChange={handleProvinceChange}>
              <option value="">-- Choisir une province --</option>
              {provinces.map((p) => (
                <option key={p.id_province} value={String(p.id_province)}>{p.nom_province}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label>Département</label>
            <select className="form-select" value={selectedDepartement} onChange={handleDepartementChange}>
              <option value="">-- Choisir un département --</option>
              {departements.map((d) => (
                <option key={d.id_departement} value={String(d.id_departement)}>{d.nom_departement}</option>
              ))}
            </select>
          </div>
        </div>

        <h5 className="text-muted mb-3">{titre}</h5>
        <input
          className="form-control mb-3"
          placeholder="🔍 Rechercher une localité..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-primary text-center">
              <tr>
                <th>Nom de la localité</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Hommes</th>
                <th>Femmes</th>
                <th>Population Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocalites.map((l) => (
                <tr key={l.id_localite} onClick={() => handleLocaliteClick(l)} style={{ cursor: 'pointer' }}>
                  <td>{l.nom_localite}</td>
                  <td className="text-center">{l.latitude || 'N/A'}</td>
                  <td className="text-center">{l.longitude || 'N/A'}</td>
                  <td className="text-center">{l.hommes || 'N/A'}</td>
                  <td className="text-center">{l.femmes || 'N/A'}</td>
                  <td className="text-center fw-bold">{l.pop_total || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal fade" id="localiteModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {selectedLocalite?.nom_localite} – {isExisting ? 'Fiche existante' : 'Nouveau formulaire'}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {formData && (
                  <FormulaireInfos
                    formData={formData}
                    handleChange={handleChange}
                    wordCount={wordCount}
                    editMode={true}
                  />
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleSave}>💾 Enregistrer</button>
                <button className="btn btn-secondary" data-bs-dismiss="modal">❌ Annuler</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExplorationRegionale;
