import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { Modal } from 'bootstrap';
import FormulaireInfos from '../components/FormulaireInfos';

const ExplorationRegionale = () => {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');

  const [titre, setTitre] = useState('Tous les villages');
  const [search, setSearch] = useState('');

  const [selectedVillage, setSelectedVillage] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isExisting, setIsExisting] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const fetchData = async () => {
    try {
      const [resRegions, resProvinces, resCommunes, resVillages] = await Promise.all([
        axios.get('http://localhost/app-web/backend/api/regions.php'),
        axios.get('http://localhost/app-web/backend/api/provinces.php'),
        axios.get('http://localhost/app-web/backend/api/communes.php'),
        axios.get('http://localhost/app-web/backend/api/villages.php'),
      ]);
      setRegions(resRegions.data);
      setProvinces(resProvinces.data);
      setCommunes(resCommunes.data);
      setVillages(resVillages.data);
    } catch (err) {
      console.error('Erreur de chargement des données initiales :', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCommune) {
      const commune = communes.find(c => c.id_commune == selectedCommune);
      if (commune) {
        setSelectedProvince(commune.id_province.toString());
      }
    }
  }, [selectedCommune]);

  useEffect(() => {
    if (selectedProvince) {
      const province = provinces.find(p => p.id_province == selectedProvince);
      if (province) {
        setSelectedRegion(province.id_region.toString());
      }
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCommune) {
      axios.get(`http://localhost/app-web/backend/api/villages.php?id_commune=${selectedCommune}`)
        .then(res => {
          setVillages(res.data || []);
          const commune = communes.find(c => c.id_commune == selectedCommune);
          setTitre(`Villages de la commune : ${commune?.nom_commune || ''}`);
        })
        .catch(err => console.error(err));
    } else if (selectedProvince) {
      axios.get(`http://localhost/app-web/backend/api/villages_par_province.php?id_province=${selectedProvince}`)
        .then(res => {
          setVillages(res.data || []);
          const province = provinces.find(p => p.id_province == selectedProvince);
          setTitre(`Villages de la province : ${province?.nom_province || ''}`);
        })
        .catch(err => console.error(err));
    } else if (selectedRegion) {
      axios.get(`http://localhost/app-web/backend/api/villages_par_region.php?id_region=${selectedRegion}`)
        .then(res => {
          setVillages(res.data || []);
          const region = regions.find(r => r.id_region == selectedRegion);
          setTitre(`Villages de la région : ${region?.nom_region || ''}`);
        })
        .catch(err => console.error(err));
    } else {
      setTitre('Tous les villages');
    }
  }, [selectedRegion, selectedProvince, selectedCommune]);

  const handleVillageClick = async (village) => {
    setSelectedVillage(village);
    try {
      const res = await axios.get(`http://localhost/app-web/backend/api/village-details.php?id=${village.id_village}`);
      if (res.data?.id) {
        if (window.confirm('✅ Formulaire déjà renseigné. Voulez-vous le modifier ?')) {
          setIsExisting(true);
          setFormData({
            ...res.data,
            operateurs_appel: res.data.operateurs_appel?.split(',') || [],
            operateurs_internet: res.data.operateurs_internet?.split(',') || [],
          });
          setWordCount(res.data.commentaire?.split(/\s+/).length || 0);
        }
      } else {
        if (window.confirm('❌ Village non renseigné. Voulez-vous le renseigner ?')) {
          setIsExisting(false);
          setFormData({
            id_village: village.id_village,
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
        }
      }

      setTimeout(() => {
        const modal = new Modal(document.getElementById('villageModal'));
        modal.show();
      }, 100);
    } catch (err) {
      console.error('Erreur lors du chargement des infos :', err);
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
        alert('✅ Formulaire sauvegardé !');
        Modal.getInstance(document.getElementById('villageModal')).hide();
      })
      .catch((err) => {
        console.error('Erreur lors de la sauvegarde :', err);
      });
  };

  const filteredVillages = villages.filter((v) =>
    v.nom_village?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mt-4">
      <h3 className="fw-bold mb-4 text-primary">🌍 Exploration Régionale</h3>

      <div className="row mb-4">
        <div className="col-md-4">
          <label>Région</label>
          <select className="form-select" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
            <option value="">-- Choisir une région --</option>
            {regions.map((r) => (
              <option key={r.id_region} value={String(r.id_region)}>{r.nom_region}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label>Province</label>
          <select className="form-select" value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)}>
            <option value="">-- Choisir une province --</option>
            {provinces.map((p) => (
              <option key={p.id_province} value={String(p.id_province)}>{p.nom_province}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label>Commune</label>
          <select className="form-select" value={selectedCommune} onChange={(e) => setSelectedCommune(e.target.value)}>
            <option value="">-- Choisir une commune --</option>
            {communes.map((c) => (
              <option key={c.id_commune} value={String(c.id_commune)}>{c.nom_commune}</option>
            ))}
          </select>
        </div>
      </div>

      <h5 className="text-muted mb-3">{titre}</h5>
      <input
        className="form-control mb-3"
        placeholder="🔍 Rechercher un village..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-primary text-center">
            <tr>
              <th>Nom du village</th>
              <th>Hommes</th>
              <th>Femmes</th>
              <th>Total Population</th>
            </tr>
          </thead>
          <tbody>
            {filteredVillages.map((v) => (
              <tr key={v.id_village} onClick={() => handleVillageClick(v)} style={{ cursor: 'pointer' }}>
                <td>{v.nom_village}</td>
                <td className="text-end">{v.hommes || 0}</td>
                <td className="text-end">{v.femmes || 0}</td>
                <td className="text-end">{v.pop_total || (+v.hommes + +v.femmes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="modal fade" id="villageModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                {selectedVillage?.nom_village} – {isExisting ? 'Fiche existante' : 'Nouveau formulaire'}
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
  );
};

export default ExplorationRegionale;
