import React, { useEffect, useState, useCallback } from 'react';

function formatForInput(val, type) {
  if (!val) return '';
  if (type.startsWith('datetime') || type.startsWith('timestamp')) {
    return val.replace(' ', 'T').slice(0, 16);
  }
  return val;
}

export default function TableCrud({ table }) {
  const [schema, setSchema] = useState([]);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [editingPk, setEditingPk] = useState(null);
  const [pkName, setPkName] = useState(null);

  // URL de base API
  const API_BASE = "http://localhost/app-web/backend/api";

  // Fonction pour récupérer les lignes (stabilisée avec useCallback)
  const fetchRows = useCallback((p) => {
    if (!table) return;
    setLoading(true);
    fetch(`${API_BASE}/records.php?table=${encodeURIComponent(table)}&page=${p}&pageSize=${pageSize}`)
      .then(r => r.json())
      .then(data => {
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setPage(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [table, pageSize]);

  // Chargement du schéma et des premières lignes
  useEffect(() => {
    if (!table) return;
    fetch(`${API_BASE}/schema.php?table=${encodeURIComponent(table)}`)
      .then(r => r.json())
      .then(data => {
        setSchema(data.columns || []);
        const pk = (data.columns || []).find(c => c.is_primary);
        setPkName(pk ? pk.Field : null);
      })
      .catch(console.error);

    setForm({});
    setEditingPk(null);
    fetchRows(1);
  }, [table, fetchRows]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const createRow = (e) => {
    e.preventDefault();
    const payload = { ...form };
    schema.forEach(col => {
      if (payload[col.Field] && (col.Type.startsWith('datetime') || col.Type.startsWith('timestamp'))) {
        payload[col.Field] = payload[col.Field].replace('T', ' ') + ':00';
      }
    });
    fetch(`${API_BASE}/records.php?table=${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(res => {
        if (res.success || res.id) {
          fetchRows(1);
          setForm({});
        } else {
          alert('Erreur création: ' + JSON.stringify(res));
        }
      })
      .catch(err => { console.error(err); alert('Erreur'); });
  };

  const startEdit = (row) => {
    const f = {};
    schema.forEach(col => {
      f[col.Field] = formatForInput(row[col.Field], col.Type);
    });
    setForm(f);
    setEditingPk(row[pkName]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!pkName) return alert('Pas de PK défini - impossible modifier');

    const payload = { ...form };
    schema.forEach(col => {
      if (payload[col.Field] && (col.Type.startsWith('datetime') || col.Type.startsWith('timestamp'))) {
        payload[col.Field] = payload[col.Field].replace('T', ' ') + ':00';
      }
    });
    payload[pkName] = editingPk;

    fetch(`${API_BASE}/records.php?table=${encodeURIComponent(table)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          fetchRows(page);
          setForm({});
          setEditingPk(null);
        } else {
          alert('Erreur update: ' + JSON.stringify(res));
        }
      })
      .catch(err => { console.error(err); alert('Erreur'); });
  };

  const confirmDelete = (row) => {
    if (!pkName) return alert('Pas de PK - suppression impossible');
    if (!window.confirm('Supprimer cette ligne ?')) return;

    fetch(`${API_BASE}/records.php?table=${encodeURIComponent(table)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [pkName]: row[pkName] })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) fetchRows(page);
        else alert('Erreur suppression');
      })
      .catch(err => { console.error(err); alert('Erreur'); });
  };

  return (
    <div className="card p-3 mb-5">
      {/* Formulaire CRUD */}
      <form onSubmit={editingPk ? submitEdit : createRow}>
        <div className="row">
          {schema.map(col => {
            const name = col.Field;
            if (col.Extra && col.Extra.includes('auto_increment') && !editingPk) return null;

            const val = form[name] ?? '';
            if (col.enum_values && col.enum_values.length) {
              return (
                <div className="col-md-3 mb-2" key={name}>
                  <label className="form-label">{name}</label>
                  <select className="form-select" value={val} onChange={e => handleChange(name, e.target.value)}>
                    <option value="">--</option>
                    {col.enum_values.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              );
            }
            if (col.Type.startsWith('int') || col.Type.startsWith('decimal') || col.Type.startsWith('float')) {
              return (
                <div className="col-md-3 mb-2" key={name}>
                  <label className="form-label">{name}</label>
                  <input type="number" className="form-control" value={val} onChange={e => handleChange(name, e.target.value)} />
                </div>
              );
            }
            if (col.Type.startsWith('datetime') || col.Type.startsWith('timestamp')) {
              return (
                <div className="col-md-4 mb-2" key={name}>
                  <label className="form-label">{name}</label>
                  <input type="datetime-local" className="form-control" value={val} onChange={e => handleChange(name, e.target.value)} />
                </div>
              );
            }
            if (col.Type.startsWith('text')) {
              return (
                <div className="col-12 mb-2" key={name}>
                  <label className="form-label">{name}</label>
                  <textarea className="form-control" value={val} onChange={e => handleChange(name, e.target.value)} />
                </div>
              );
            }
            return (
              <div className="col-md-3 mb-2" key={name}>
                <label className="form-label">{name}</label>
                <input type="text" className="form-control" value={val} onChange={e => handleChange(name, e.target.value)} />
              </div>
            );
          })}
        </div>

        <div className="mt-2">
          <button type="submit" className="btn btn-sm btn-success me-2">
            {editingPk ? 'Enregistrer (modifier)' : 'Créer'}
          </button>
          {editingPk && (
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setEditingPk(null); setForm({}); }}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <hr />

      {/* Tableau des données */}
     {/* Tableau des données */}
<h6>Liste ({total})</h6>
{loading ? <p>Chargement...</p> : (
  <div className="table-responsive">
    <table className="table table-sm table-bordered">
      <thead>
        <tr>
          <th>#</th>
          {schema
            .filter(c => c.Field !== pkName) // exclure la PK
            .map(c => <th key={c.Field}>{c.Field}</th>)}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{(page - 1) * pageSize + i + 1}</td>
            {schema
              .filter(c => c.Field !== pkName) // exclure la PK
              .map(c => <td key={c.Field}>{String(r[c.Field] ?? '')}</td>)}
            <td>
              <button className="btn btn-sm btn-outline-primary me-1" onClick={() => startEdit(r)}>Edit</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(r)}>Del</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}


      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-2">
        <div>Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
        <div>
          <button className="btn btn-sm btn-outline-secondary me-1" disabled={page <= 1} onClick={() => fetchRows(page - 1)}>Prev</button>
          <button className="btn btn-sm btn-outline-secondary" disabled={page >= Math.ceil(total / pageSize)} onClick={() => fetchRows(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
