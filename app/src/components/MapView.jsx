import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const TYPE_COLORS = {
  settlement: '#e74c3c',
  river: '#3498db',
  mountain: '#e67e22',
  'mountain range': '#e67e22',
  region: '#9b59b6',
  hill: '#f39c12',
  valley: '#27ae60',
  sea: '#2980b9',
  lake: '#2980b9',
  island: '#1abc9c',
  desert: '#d4ac0d',
  well: '#5dade2',
  spring: '#5dade2',
  road: '#7f8c8d',
  default: '#95a5a6',
};

function getColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

function createIcon(type) {
  const color = getColor(type);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MapView({ markers, onMarkerClick, selectedPlace }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const clusterRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const [loadingGeo, setLoadingGeo] = useState(false);

  // Initialize map
  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [31.7, 35.2], // Jerusalem area
      zoom: 7,
      minZoom: 3,
      maxZoom: 18,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Bible Geocoding Data &copy; <a href="https://www.openbible.info/geo/">OpenBible.info</a> CC BY 4.0',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 12,
    });

    for (const m of markers) {
      if (m.lat == null || m.lon == null) continue;
      const marker = L.marker([m.lat, m.lon], { icon: createIcon(m.type) });

      // Build popup
      const ancientNames = Object.values(m.ancientAssoc || {})
        .map(a => a.name)
        .join(', ');

      marker.bindPopup(`
        <div class="popup-content">
          <strong>${m.name}</strong>
          ${ancientNames ? `<br><em>Biblical: ${ancientNames}</em>` : ''}
          <br><span class="popup-type">${m.type}</span>
          ${m.thumbnail ? `<br><img src="https://a.openbible.info/geo/thumbnails/${m.thumbnail}" alt="${m.name}" style="width:100%;max-width:200px;margin-top:4px;border-radius:4px;">` : ''}
          <br><small>Click for details</small>
        </div>
      `);

      marker.on('click', () => onMarkerClick(m));
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    clusterRef.current = cluster;
  }, [markers, onMarkerClick]);

  // Load GeoJSON when place selected
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (!selectedPlace?.modern?.geojsonFile) return;

    setLoadingGeo(true);
    fetch(`/data/geometry/${selectedPlace.modern.geojsonFile}`)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(geojson => {
        const layer = L.geoJSON(geojson, {
          style: {
            color: getColor(selectedPlace.modern.type),
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2,
          },
        }).addTo(map);
        geoJsonLayerRef.current = layer;

        // Fly to the feature bounds
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
      })
      .catch(() => {
        // No geometry file available, just pan to point
        if (selectedPlace.modern.lat && selectedPlace.modern.lon) {
          map.flyTo([selectedPlace.modern.lat, selectedPlace.modern.lon], 10);
        }
      })
      .finally(() => setLoadingGeo(false));
  }, [selectedPlace]);

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map" />
      {loadingGeo && <div className="geo-loading">Loading geometry...</div>}
      <div className="map-legend">
        {Object.entries(TYPE_COLORS).filter(([k]) => k !== 'default').slice(0, 8).map(([type, color]) => (
          <span key={type} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
