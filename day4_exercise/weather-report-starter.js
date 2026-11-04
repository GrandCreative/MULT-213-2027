// Weather Report — STARTER FILE
// Run:  node weather-report-starter.js
// Needs Node 18+ (built-in fetch). No packages, no API key.

const city = 'Regina';

// Turns Open-Meteo's weather codes into words
const weatherWords = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail'
};

async function main() {
  // 1. Get the data
  // PART 1: paste your API URL from the Open-Meteo docs page between the quotes
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=50.4501&longitude=-104.6178&daily=temperature_2m_max,temperature_2m_min&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto';

  let weatherData;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    weatherData = await response.json();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(weatherData);  // uncomment to see everything the API sent back

  // 2. Pull out the parts we want
  // PART 2: replace each '???' (and each []) with the right value from weatherData
  const current = weatherData.current;
  const daily = weatherData.daily;

  const conditions = weatherWords[current.weather_code] ?? 'Unknown';
  const temperature = current.temperature_2m;
  const feelsLike = current.apparent_temperature;
  const humidity = current.relative_humidity_2m;
  const windSpeed = current.wind_speed_10m;

  const days = daily.time;
  const lows = daily.temperature_2m_min;
  const highs = daily.temperature_2m_max;

  // 3. Render the report (no changes needed here)
  console.log('');
  console.log('=================================');
  console.log(`  WEATHER IN ${city.toUpperCase()}`);
  console.log('=================================');
  console.log(`  Conditions:  ${conditions}`);
  console.log(`  Temperature: ${temperature}°C`);
  console.log(`  Feels like:  ${feelsLike}°C`);
  console.log(`  Humidity:    ${humidity}%`);
  console.log(`  Wind:        ${windSpeed} km/h`);
  console.log('');
  console.log('  7-DAY FORECAST (low / high)');

  for (let i = 0; i < days.length; i++) {
    const day = new Date(days[i] + 'T12:00').toLocaleDateString('en-CA', { weekday: 'short' });
    const low = String(Math.round(lows[i])).padStart(3);
    const high = String(Math.round(highs[i])).padStart(3);
    console.log(`  ${day}  ${low}°C / ${high}°C`);
  }

  console.log('');
}

main();
