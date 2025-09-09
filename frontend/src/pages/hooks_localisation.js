// src/hooks/useGeographicHierarchy.js
import { useCallback } from 'react';

export const useGeographicHierarchy = (localite, departements, provinces) => {
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

  return {
    getDepartementFromLocalite,
    getProvinceFromDepartement,
    getRegionFromProvince,
    getProvinceFromLocalite,
    getRegionFromLocalite,
    getRegionFromDepartement,
  };
};