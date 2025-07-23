// src/components/FormulaireInfos.js
import React from 'react';

const operateurs = ['Orange', 'Onatel', 'Telecel'];

const FormulaireInfos = ({ formData, handleChange, wordCount, editMode = true }) => {
  return (
    <>
      {/* Site 2G */}
      <div className="mb-3">
        <label className="form-label">Site couvert par la 2G ?</label>
        <select
          name="site_2g"
          value={formData.site_2g}
          onChange={handleChange}
          className="form-select"
          disabled={!editMode}
        >
          <option value="">-- Choisir --</option>
          <option value="oui">Oui</option>
          <option value="non">Non</option>
        </select>
      </div>

      {/* Appel possible */}
      {formData.site_2g === 'oui' && (
        <>
          <div className="mb-3">
            <label className="form-label">Appel téléphonique possible ?</label>
            <select
              name="appel_possible"
              value={formData.appel_possible}
              onChange={handleChange}
              className="form-select"
              disabled={!editMode}
            >
              <option value="">-- Choisir --</option>
              <option value="oui">Oui</option>
              <option value="non">Non</option>
            </select>
          </div>

          {/* Opérateurs appel */}
          {formData.appel_possible === 'oui' && (
            <div className="mb-3">
              <label className="form-label">Compagnies disponibles</label>
              {operateurs.map(op => (
                <div className="form-check" key={op}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="operateurs_appel"
                    value={op}
                    checked={formData.operateurs_appel?.includes(op)}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                  <label className="form-check-label">{op}</label>
                </div>
              ))}
            </div>
          )}

          {/* Raison pas appel */}
          {formData.appel_possible === 'non' && (
            <div className="mb-3">
              <label className="form-label">Pourquoi ?</label>
              <select
                name="raison_pas_appel"
                value={formData.raison_pas_appel}
                onChange={handleChange}
                className="form-select"
                disabled={!editMode}
              >
                <option value="">-- Sélectionner --</option>
                <option value="incident">Incident</option>
                <option value="jamais eu d'antenne">Jamais eu d'antenne</option>
              </select>
            </div>
          )}
        </>
      )}

      {/* Qualité 2G */}
      <div className="mb-3">
        <label className="form-label">Qualité 2G</label>
        <select
          name="qualite_2g"
          value={formData.qualite_2g}
          onChange={handleChange}
          className="form-select"
          disabled={!editMode}
        >
          <option value="">-- Choisir --</option>
          <option value="bonne">Bonne</option>
          <option value="moyenne">Moyenne</option>
          <option value="mauvaise">Mauvaise</option>
        </select>
      </div>

      {/* Antenne */}
      <div className="mb-3">
        <label className="form-label">Antenne disponible ?</label>
        <select
          name="antenne"
          value={formData.antenne}
          onChange={handleChange}
          className="form-select"
          disabled={!editMode}
        >
          <option value="">-- Choisir --</option>
          <option value="oui">Oui</option>
          <option value="non">Non</option>
        </select>
      </div>

      {/* Raison pas antenne */}
      {formData.antenne === 'non' && (
        <div className="mb-3">
          <label className="form-label">Pourquoi ?</label>
          <select
            name="raison_pas_antenne"
            value={formData.raison_pas_antenne}
            onChange={handleChange}
            className="form-select"
            disabled={!editMode}
          >
            <option value="">-- Sélectionner --</option>
            <option value="incident">Incident</option>
            <option value="jamais eu d'antenne">Jamais eu d'antenne</option>
          </select>
        </div>
      )}

      {/* Site 3G */}
      <div className="mb-3">
        <label className="form-label">Site couvert par la 3G ?</label>
        <select
          name="site_3g"
          value={formData.site_3g}
          onChange={handleChange}
          className="form-select"
          disabled={!editMode}
        >
          <option value="">-- Choisir --</option>
          <option value="oui">Oui</option>
          <option value="non">Non</option>
        </select>
      </div>

      {/* Internet */}
      <div className="mb-3">
        <label className="form-label">Internet disponible ?</label>
        <select
          name="internet"
          value={formData.internet}
          onChange={handleChange}
          className="form-select"
          disabled={!editMode}
        >
          <option value="">-- Choisir --</option>
          <option value="oui">Oui</option>
          <option value="non">Non</option>
        </select>
      </div>

      {/* Opérateurs Internet */}
      {formData.internet === 'oui' && (
        <>
          <div className="mb-3">
            <label className="form-label">Opérateurs Internet</label>
            {operateurs.map(op => (
              <div className="form-check" key={op}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="operateurs_internet"
                  value={op}
                  checked={formData.operateurs_internet?.includes(op)}
                  onChange={handleChange}
                  disabled={!editMode}
                />
                <label className="form-check-label">{op}</label>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <label className="form-label">Qualité Internet</label>
            <select
              name="qualite_internet"
              value={formData.qualite_internet}
              onChange={handleChange}
              className="form-select"
              disabled={!editMode}
            >
              <option value="">-- Choisir --</option>
              <option value="bonne">Bonne</option>
              <option value="moyenne">Moyenne</option>
              <option value="mauvaise">Mauvaise</option>
            </select>
          </div>
        </>
      )}

      {/* Commentaire */}
      <div className="mb-3">
        <label className="form-label">Commentaire</label>
        <textarea
          name="commentaire"
          className="form-control"
          rows="3"
          value={formData.commentaire}
          onChange={handleChange}
          disabled={!editMode}
        />
        {editMode && (
          <div className="form-text text-danger">
            Nb: Ne pas dépasser 25 mots. ({wordCount}/25)
          </div>
        )}
      </div>
    </>
  );
};

export default FormulaireInfos;
