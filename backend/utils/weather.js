/**
 * OpenWeather API integration for real weather data in paramedic briefings.
 * Uses current weather endpoint: https://api.openweathermap.org/data/2.5/weather
 */

const STATION_CITY = {
  'Station 1': 'Bracebridge,CA',
  'Station 2': 'Orillia,CA',
  'Station 3': 'Barrie,CA',
  'Station 4': 'Midland,CA',
  'Station 5': 'Collingwood,CA',
  'Station 6': 'Gravenhurst,CA',
  'Station 7': 'Huntsville,CA'
};

const DEFAULT_CITY = process.env.OPENWEATHER_CITY || 'Barrie,CA';

async function getCurrentWeather(cityOrStation) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  const city = STATION_CITY[cityOrStation] || cityOrStation || DEFAULT_CITY;
  const q = encodeURIComponent(city);
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${apiKey}&units=metric`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return formatWeatherSummary(data);
  } catch (err) {
    console.error('[Weather] Fetch error:', err.message);
    return null;
  }
}

function formatWeatherSummary(data) {
  const main = data.weather?.[0];
  const temp = Math.round(data.main?.temp ?? 0);
  const feelsLike = Math.round(data.main?.feels_like ?? temp);
  const desc = main?.description || 'unknown';
  const wind = data.wind?.speed ?? 0;
  const rain = data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0;
  const snow = data.snow?.['1h'] ?? data.snow?.['3h'] ?? 0;

  const conditions = [];
  if (main?.main === 'Snow' || snow > 0) conditions.push('snow');
  if (main?.main === 'Rain' || main?.main === 'Drizzle' || rain > 0) conditions.push('rain');
  if (main?.main === 'Thunderstorm') conditions.push('thunderstorms');
  if (data.main?.humidity > 90 && temp <= 2) conditions.push('risk of ice/black ice');
  if (temp <= 0 && (rain > 0 || snow > 0 || main?.main === 'Drizzle')) conditions.push('freezing rain/ice possible');

  return {
    temp,
    feelsLike,
    description: desc,
    windSpeed: wind,
    conditions: conditions.length > 0 ? conditions : [desc],
    raw: data
  };
}

module.exports = { getCurrentWeather, formatWeatherSummary };
