(function () {
  const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY';
  if (typeof supabaseClient === 'undefined') return;
  const base = window.location.pathname.indexOf('/edutrack') !== -1 ? '/edutrack' : '';

  async function fetchWeather(city) {
    const url = 'https://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(city) + '&appid=' + OPENWEATHER_API_KEY + '&units=metric';
    const res = await fetch(url);
    if (!res.ok) throw new Error('City not found or API error');
    return res.json();
  }

  function isUnsafe(data) {
    const wind = (data.wind && data.wind.speed) ? data.wind.speed : 0;
    const rain = (data.rain && data.rain['1h']) ? data.rain['1h'] : 0;
    const desc = (data.weather && data.weather[0] && data.weather[0].main) ? data.weather[0].main.toLowerCase() : '';
    if (wind > 15) return true;
    if (rain > 20) return true;
    if (desc.indexOf('thunder') !== -1 || desc.indexOf('tornado') !== -1) return true;
    return false;
  }

  window.EduTrackWeather = {
    fetchWeather: fetchWeather,
    isUnsafe: isUnsafe,
    async loadHistory(limit) {
      const { data, error } = await supabaseClient.from('weather_logs').select('*').order('logged_at', { ascending: false }).limit(limit || 50);
      if (error) throw error;
      return data || [];
    },
    async logAndNotify(data, city, notifyAdmins) {
      const unsafe = isUnsafe(data);
      const condition = data.weather && data.weather[0] ? data.weather[0].description : null;
      const temp = data.main && data.main.temp != null ? data.main.temp : null;
      const wind = data.wind && data.wind.speed != null ? data.wind.speed : null;
      const { error: insertErr } = await supabaseClient.from('weather_logs').insert({
        city: city,
        condition: condition,
        temperature: temp,
        wind_speed: wind,
        is_unsafe: unsafe,
        holiday_recommended: unsafe
      });
      if (insertErr) console.error(insertErr);
      if (unsafe && notifyAdmins) {
        const { data: admins } = await supabaseClient.from('users').select('id').eq('role', 'admin');
        if (admins && admins.length) {
          const rows = admins.map(function (a) {
            return { recipient_id: a.id, type: 'weather', message: 'Severe weather in ' + city + ' — Holiday recommended.', is_read: false };
          });
          await supabaseClient.from('notifications').insert(rows);
        }
      }
    },
    startAutoRefresh(city, callback, intervalMs) {
      return setInterval(function () {
        fetchWeather(city).then(function (data) {
          callback(data);
          window.EduTrackWeather.logAndNotify(data, city, true);
        }).catch(function () {});
      }, intervalMs || 600000);
    }
  };
})();
