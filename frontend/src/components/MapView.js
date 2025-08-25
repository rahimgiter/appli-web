import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = ({ sites, onSiteClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialiser la carte
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([6.5244, 3.3792], 6); // Centre sur le Bénin

      // Ajouter la couche de tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Nettoyer les marqueurs existants
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    if (sites && sites.length > 0) {
      const bounds = L.latLngBounds();
      
      sites.forEach(site => {
        if (site.latitude_site && site.longitude_site) {
          const lat = parseFloat(site.latitude_site);
          const lng = parseFloat(site.longitude_site);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            // Créer une icône personnalisée selon le type de site
            const getIconColor = (type) => {
              switch (type?.toLowerCase()) {
                case '2g': return '#3b82f6';
                case '3g': return '#10b981';
                case '4g': return '#f59e0b';
                case '5g': return '#ef4444';
                default: return '#6b7280';
              }
            };

            const icon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                width: 20px;
                height: 20px;
                background-color: ${getIconColor(site.libelle_type)};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 10px;
                font-weight: bold;
                transition: all 0.2s ease;
              ">📶</div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            const marker = L.marker([lat, lng], { icon })
              .addTo(mapInstanceRef.current)
              .bindTooltip(`
                <div style="min-width: 250px; max-width: 300px;">
                  <div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e5e7eb;">
                    <h6 style="margin: 0 0 10px 0; color: #111827; font-weight: 600; font-size: 14px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">
                      📡 ${site.nom_site || 'Site sans nom'}
                    </h6>
                    <div style="font-size: 12px; color: #374151; line-height: 1.5;">
                      <div style="margin-bottom: 6px;">
                        <span style="color: #6b7280; font-weight: 500;">📍 Localité:</span>
                        <span style="margin-left: 5px; font-weight: 600;">${site.nom_localite || 'N/A'}</span>
                      </div>
                      <div style="margin-bottom: 6px;">
                        <span style="color: #6b7280; font-weight: 500;">🏢 Opérateur:</span>
                        <span style="margin-left: 5px; font-weight: 600; color: #1e40af;">${site.nom_operateur || 'N/A'}</span>
                      </div>
                      <div style="margin-bottom: 6px;">
                        <span style="color: #6b7280; font-weight: 500;">📶 Type:</span>
                        <span style="margin-left: 5px; font-weight: 600; color: ${getIconColor(site.libelle_type)};">${site.libelle_type || 'N/A'}</span>
                      </div>
                      <div style="margin-bottom: 6px;">
                        <span style="color: #6b7280; font-weight: 500;">📅 Date:</span>
                        <span style="margin-left: 5px; font-weight: 600;">${site.annee_site || ''} ${site.libelle_trimestre || ''}</span>
                      </div>
                      <div style="margin-bottom: 6px;">
                        <span style="color: #6b7280; font-weight: 500;">🌐 Coordonnées:</span>
                        <span style="margin-left: 5px; font-weight: 600; font-family: monospace;">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `, {
                permanent: false,
                direction: 'top',
                offset: [0, -10],
                className: 'custom-tooltip'
              })
              .bindPopup(`
                <div style="min-width: 200px;">
                  <h6 style="margin: 0 0 8px 0; color: #111827; font-weight: 600;">
                    ${site.nom_site || 'Site sans nom'}
                  </h6>
                  <div style="font-size: 0.85rem; color: #6b7280; line-height: 1.4;">
                    <div><strong>📍 Localité:</strong> ${site.nom_localite || 'N/A'}</div>
                    <div><strong>🏢 Opérateur:</strong> ${site.nom_operateur || 'N/A'}</div>
                    <div><strong>📶 Type:</strong> ${site.libelle_type || 'N/A'}</div>
                    <div><strong>📅 Date:</strong> ${site.annee_site || ''} ${site.libelle_trimestre || ''}</div>
                    <div><strong>🌐 Coordonnées:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
                  </div>
                </div>
              `);

            markersRef.current.push(marker);
            bounds.extend([lat, lng]);

            // Ajouter un événement de clic
            marker.on('click', () => {
              if (onSiteClick) {
                onSiteClick(site);
              }
            });
          }
        }
      });

      // Ajuster la vue pour inclure tous les marqueurs
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }

    return () => {
      // Nettoyage lors du démontage
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [sites, onSiteClick]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        borderRadius: '0 0 16px 16px'
      }}
    />
  );
};

export default MapView;
