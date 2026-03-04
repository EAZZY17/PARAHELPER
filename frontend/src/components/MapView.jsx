import React, { useState, useCallback, useEffect } from 'react';
import Map, { NavigationControl, Source, Layer, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const DEFAULT_VIEW = {
  longitude: -79.3832,
  latitude: 43.6532,
  zoom: 11
};

const ROUTE_LAYER = {
  id: 'route',
  type: 'line',
  paint: {
    'line-color': '#3b82f6',
    'line-width': 4
  }
};

export default function MapView({ profile, initialDestination, onClose }) {
  const [viewState, setViewState] = useState(DEFAULT_VIEW);
  const [searchQuery, setSearchQuery] = useState(initialDestination || '');
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  const geocode = useCallback(async (query) => {
    if (!query?.trim() || !MAPBOX_TOKEN) return null;
    // Restrict to Canada, prefer actual addresses/places, bias toward Ontario
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      limit: '5',
      country: 'CA',
      types: 'address,place,poi',
      proximity: '-79.38,43.65'
    });
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json?${params}`
    );
    const data = await res.json();
    const features = data.features || [];
    const feat = features.find(f => f.place_type?.includes('address') || f.place_type?.includes('place')) || features[0];
    return feat ? feat.center : null; // [lng, lat]
  }, []);

  const fetchDirections = useCallback(async (origin, dest) => {
    if (!origin || !dest || !MAPBOX_TOKEN) return null;
    const coords = `${origin[0]},${origin[1]};${dest[0]},${dest[1]}`;
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
    );
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration
    };
  }, []);

  const searchAndRoute = useCallback(async (query, origin = null) => {
    if (!query?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const dest = await geocode(query);
      if (!dest) {
        setError('Address not found');
        setLoading(false);
        return;
      }
      setDestinationCoords(dest);
      setSearchQuery(query);

      const from = origin || [-79.3832, 43.6532]; // default Toronto
      const dir = await fetchDirections(from, dest);
      if (dir) {
        setRouteGeoJSON({
          type: 'Feature',
          properties: {},
          geometry: dir.geometry
        });
        setRouteInfo({
          distance: (dir.distance / 1000).toFixed(1),
          duration: Math.round(dir.duration / 60)
        });
        setOriginCoords(from);
        const coords = dir.geometry.coordinates;
        if (coords.length > 0) {
          const bounds = coords.reduce(
            (acc, c) => ({
              minLng: Math.min(acc.minLng, c[0]),
              maxLng: Math.max(acc.maxLng, c[0]),
              minLat: Math.min(acc.minLat, c[1]),
              maxLat: Math.max(acc.maxLat, c[1])
            }),
            { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
          );
          setViewState((v) => ({
            ...v,
            longitude: (bounds.minLng + bounds.maxLng) / 2,
            latitude: (bounds.minLat + bounds.maxLat) / 2,
            zoom: Math.max(10, v.zoom - 0.5)
          }));
        }
      } else {
        setRouteGeoJSON(null);
        setRouteInfo(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to get directions');
    }
    setLoading(false);
  }, [geocode, fetchDirections]);

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const [lng, lat] = [pos.coords.longitude, pos.coords.latitude];
        setOriginCoords([lng, lat]);
        setViewState((v) => ({ ...v, longitude: lng, latitude: lat, zoom: 14 }));
        if (searchQuery) {
          searchAndRoute(searchQuery, [lng, lat]);
        } else {
          setLoading(false);
        }
      },
      () => {
        setError('Could not get your location');
        setLoading(false);
      }
    );
  }, [searchQuery, searchAndRoute]);

  useEffect(() => {
    if (initialDestination?.trim()) {
      setSearchQuery(initialDestination);
      searchAndRoute(initialDestination);
    }
  }, [initialDestination]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h2 style={styles.title}>Map</h2>
            <button onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
          </div>
          <div style={styles.errorBox}>
            <p>Add your Mapbox token to <code>frontend/.env</code>:</p>
            <code style={styles.code}>REACT_APP_MAPBOX_TOKEN=your_key_here</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Map & Directions</h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
        </div>

        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Address (e.g. 123 McCowan Rd, Scarborough, ON, Canada)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchAndRoute(searchQuery)}
            style={styles.searchInput}
          />
          <button
            onClick={() => searchAndRoute(searchQuery)}
            disabled={loading}
            style={styles.searchBtn}
          >
            {loading ? '...' : 'Go'}
          </button>
          <button onClick={handleUseLocation} style={styles.locationBtn} title="Use my location">
            📍
          </button>
        </div>

        {routeInfo && (
          <div style={styles.routeInfo}>
            ~{routeInfo.distance} km · ~{routeInfo.duration} min
          </div>
        )}
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.mapContainer}>
          <Map
            {...viewState}
            onMove={onMove}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            {routeGeoJSON && (
              <Source id="route" type="geojson" data={routeGeoJSON}>
                <Layer {...ROUTE_LAYER} />
              </Source>
            )}
            {destinationCoords && (
              <Marker longitude={destinationCoords[0]} latitude={destinationCoords[1]} color="#ef4444" />
            )}
          </Map>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    width: '90vw',
    maxWidth: '1200px',
    height: '80vh',
    background: '#0d1f3c',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  title: { color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 },
  closeBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
    lineHeight: 1
  },
  searchBar: {
    display: 'flex',
    gap: '8px',
    padding: '12px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  searchInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.3)',
    color: '#fff',
    fontSize: '14px'
  },
  searchBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: '#e53935',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer'
  },
  locationBtn: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.3)',
    cursor: 'pointer',
    fontSize: '18px'
  },
  routeInfo: {
    padding: '8px 24px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px'
  },
  error: {
    padding: '8px 24px',
    color: '#ef4444',
    fontSize: '14px'
  },
  mapContainer: {
    flex: 1,
    minHeight: 0
  },
  errorBox: {
    padding: '40px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px'
  },
  code: {
    display: 'block',
    marginTop: '12px',
    padding: '12px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    fontSize: '12px'
  }
};
