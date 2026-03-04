/**
 * Hospital Recommendation Service
 * Finds the fastest hospital to reach from an accident scene using real-time traffic.
 * Uses Mapbox Geocoding + Directions (driving-traffic).
 */

const token = process.env.MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN;

async function geocode(query) {
  if (!token) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1&country=CA&proximity=-79.38,43.65`;
  const res = await fetch(url);
  const data = await res.json();
  const feat = data.features?.[0];
  return feat ? { center: feat.center, place_name: feat.place_name } : null;
}

async function findHospitalsNear(lng, lat, limit = 8) {
  if (!token) return [];
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/hospital.json?proximity=${lng},${lat}&limit=${limit}&country=CA&access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.features || []).map((f) => ({
    center: f.center,
    place_name: f.place_name,
    text: f.text || f.place_name
  }));
}

async function getDrivingTimeWithTraffic(origin, dest) {
  if (!token) return null;
  const coords = `${origin[0]},${origin[1]};${dest[0]},${dest[1]}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    duration: route.duration,
    distance: route.distance
  };
}

/**
 * Recommends the fastest hospital to reach from the given scene address.
 * @param {string} sceneAddress - Address of accident/patient (e.g. "123 McCowan Rd, Toronto")
 * @returns {Promise<{recommended: object, alternatives: array, sceneCoords: array} | null>}
 */
async function recommendHospital(sceneAddress) {
  if (!token) {
    console.error('[HospitalRecommendation] MAPBOX_TOKEN not set');
    return null;
  }

  try {
    const scene = await geocode(sceneAddress);
    if (!scene) {
      console.error('[HospitalRecommendation] Could not geocode scene:', sceneAddress);
      return null;
    }

    const [lng, lat] = scene.center;
    const hospitals = await findHospitalsNear(lng, lat);
    if (hospitals.length === 0) {
      console.error('[HospitalRecommendation] No hospitals found near scene');
      return { recommended: null, alternatives: [], sceneCoords: [lng, lat], sceneName: scene.place_name };
    }

    const results = [];
    for (const h of hospitals) {
      const dir = await getDrivingTimeWithTraffic([lng, lat], h.center);
      if (dir) {
        results.push({
          place_name: h.place_name,
          center: h.center,
          durationMinutes: Math.round(dir.duration / 60),
          distanceKm: (dir.distance / 1000).toFixed(1)
        });
      }
    }

    results.sort((a, b) => a.durationMinutes - b.durationMinutes);
    const recommended = results[0] || null;
    const alternatives = results.slice(1, 4);

    return {
      recommended,
      alternatives,
      sceneCoords: [lng, lat],
      sceneName: scene.place_name
    };
  } catch (e) {
    console.error('[HospitalRecommendation] Error:', e.message);
    return null;
  }
}

module.exports = { recommendHospital, geocode };
