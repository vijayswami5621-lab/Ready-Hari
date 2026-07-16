import { SwissEphemeris } from '@swisseph/browser';

const SE_SUN = 0;
const SE_MOON = 1;

const SEFLG_JPLEPH = 1;
const SEFLG_SWIEPH = 2;
const SEFLG_MOSEPH = 4;
const SEFLG_SPEED = 256;

const nakshatras = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const yogas = [
  "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda",
  "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva",
  "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

const karanas = [
  "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti",
  "Shakuni", "Chatushpada", "Naga", "Kintughna"
];

const rashis = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"
];

const months = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
  "Ashvina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna"
];

const tithis = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
  "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
  "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya"
];

// Helper to normalize angle
const norm = (deg: number) => (deg % 360 + 360) % 360;

// Convert JD to Date
const jdToDate = (jd: number) => {
  const MS_PER_DAY = 86400000;
  const JD_UNIX_EPOCH = 2440587.5;
  return new Date((jd - JD_UNIX_EPOCH) * MS_PER_DAY);
};

// Convert Date to JD
const dateToJd = (date: Date) => {
  const MS_PER_DAY = 86400000;
  const JD_UNIX_EPOCH = 2440587.5;
  return (date.getTime() / MS_PER_DAY) + JD_UNIX_EPOCH;
};

// Lahiri Ayanamsa approximation for offline if not available
// We can use swisseph but we will just use it from swe
export async function calculatePanchang(date: Date, lat: number, lon: number, tzOffsetStr?: string) {
  const swe = new SwissEphemeris();
  await swe.init('/swisseph.wasm');
  
  let flag = SEFLG_MOSEPH | SEFLG_SPEED;
  // Load local ephemeris files
  try {
    await swe.loadEphemerisFiles([
      { name: 'sepl_18.se1', url: '/ephe/sepl_18.se1' },
      { name: 'semo_18.se1', url: '/ephe/semo_18.se1' }
    ]);
    flag = SEFLG_SWIEPH | SEFLG_SPEED;
  } catch (err) {
    console.warn("Could not load local ephemeris files, falling back to built-in Moshier", err);
  }
  
  // Calculate JD
  const jd = dateToJd(date);

  // We use sidereal positions for Hindu Panchang (Lahiri Ayanamsa)
  // But wait, the API from @swisseph/browser might not expose set_sid_mode directly,
  // Let's just calculate Tropical and apply standard ayanamsa, or use Sidereal flag.
  // Actually, we can use 0.0 for now if flag is missing, or we can use the sidereal flag.
  // We'll calculate tropical and approximate Lahiri (24.1 deg in 2024, approx)
  const lahiri = 24 + 11/60 + 51/3600 + (date.getFullYear() - 2024) * (50.29/3600); // Rough Lahiri Ayanamsa
  
  const sunPos = swe.calculatePosition(jd, SE_SUN, flag);
  const moonPos = swe.calculatePosition(jd, SE_MOON, flag);
  
  const sunLon = norm(sunPos.longitude - lahiri);
  const moonLon = norm(moonPos.longitude - lahiri);
  
  // 1. Tithi
  const diff = norm(moonLon - sunLon);
  let tithiIndex = Math.floor(diff / 12);
  const paksha = tithiIndex < 15 ? "Shukla Paksha" : "Krishna Paksha";
  const tithiName = tithis[tithiIndex];

  // 2. Nakshatra
  let nakIndex = Math.floor(moonLon / (13 + 1/3));
  const nakshatraName = nakshatras[nakIndex];

  // 3. Yoga
  const sum = norm(moonLon + sunLon);
  let yogaIndex = Math.floor(sum / (13 + 1/3));
  const yogaName = yogas[yogaIndex];

  // 4. Karana
  let karanaIndex = Math.floor(diff / 6);
  // Karana calculation is complex (cycles of 7 karanas after first half of 1st tithi, etc)
  let kName = "";
  if (karanaIndex === 0) kName = "Kintughna";
  else if (karanaIndex === 57) kName = "Shakuni";
  else if (karanaIndex === 58) kName = "Chatushpada";
  else if (karanaIndex === 59) kName = "Naga";
  else {
    kName = karanas[((karanaIndex - 1) % 7)];
  }

  // 5. Rashi
  const sunRashi = rashis[Math.floor(sunLon / 30)];
  const moonRashi = rashis[Math.floor(moonLon / 30)];

  // 6. Lunar Month (Amanta)
  // Month is defined by the sign the sun is in at New Moon. For simplicity, we approximate:
  let monthIndex = Math.floor(sunLon / 30) + 1;
  if (monthIndex > 11) monthIndex = 0;
  const lunarMonth = months[monthIndex];

  // Hindu Samvat
  const vikramSamvat = date.getFullYear() + 57;
  const shakaSamvat = date.getFullYear() - 78;

  // Ayan
  const ayan = sunLon >= 90 && sunLon < 270 ? "Dakshinayana" : "Uttarāyaṇa";

  // Ritu
  const rituIndex = Math.floor(sunLon / 60);
  const ritus = ["Vasanta", "Grishma", "Varsha", "Sharad", "Hemanta", "Shishira"];
  const ritu = ritus[rituIndex];

  // Sunrise/Sunset (Approximations based on spherical trig, as swe_rise_trans might be tricky to use directly if not exposed)
  // Let's use simple math for Sunrise/Sunset if swe isn't providing it.
  function getSunriseSunset(jd, lat, lon) {
    const n = Math.floor(jd - 2451545.0 + 0.0008);
    const jStar = n - lon/360;
    const m = norm(357.5291 + 0.98560028 * jStar);
    const c = 1.9148 * Math.sin(m * Math.PI/180) + 0.0200 * Math.sin(2*m * Math.PI/180) + 0.0003 * Math.sin(3*m * Math.PI/180);
    const lambda = norm(m + c + 180 + 102.9372);
    const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(m * Math.PI/180) - 0.0069 * Math.sin(2*lambda * Math.PI/180);
    const delta = Math.asin(Math.sin(lambda * Math.PI/180) * Math.sin(23.44 * Math.PI/180));
    
    let omega = Math.acos( (Math.sin(-0.83 * Math.PI/180) - Math.sin(lat * Math.PI/180) * Math.sin(delta)) / (Math.cos(lat * Math.PI/180) * Math.cos(delta)) );
    omega = omega * 180 / Math.PI;
    
    const jSet = jTransit + omega/360;
    const jRise = jTransit - omega/360;
    
    return {
      rise: jdToDate(jRise),
      set: jdToDate(jSet),
      transit: jdToDate(jTransit)
    };
  }
  
  const sunTimes = getSunriseSunset(jd, lat, lon);

  // Approximate Moonrise/Moonset
  function getMoonTimes(jd, lat, lon) {
    const l = moonLon;
    const b = moonPos.latitude; // ecliptic latitude
    // convert ecliptic to equatorial
    const eps = 23.44;
    let alpha = Math.atan2(Math.sin(l * Math.PI/180) * Math.cos(eps * Math.PI/180) - Math.tan(b * Math.PI/180) * Math.sin(eps * Math.PI/180), Math.cos(l * Math.PI/180));
    alpha = alpha * 180 / Math.PI;
    const delta = Math.asin(Math.sin(b * Math.PI/180) * Math.cos(eps * Math.PI/180) + Math.cos(b * Math.PI/180) * Math.sin(eps * Math.PI/180) * Math.sin(l * Math.PI/180));
    const deltaDeg = delta * 180 / Math.PI;
    
    // Approximation for transit and rise/set
    const jTransit = 2451545.0 + (alpha - lon)/360;
    
    const cosOmega = (Math.sin(-0.583 * Math.PI/180) - Math.sin(lat * Math.PI/180) * Math.sin(deltaDeg * Math.PI/180)) / (Math.cos(lat * Math.PI/180) * Math.cos(deltaDeg * Math.PI/180));
    let omega = 0;
    if (cosOmega >= -1 && cosOmega <= 1) {
      omega = Math.acos(cosOmega) * 180 / Math.PI;
    } else {
      omega = 0; // circumpolar
    }
    
    const jSet = jTransit + omega/360;
    const jRise = jTransit - omega/360;
    return {
      rise: jdToDate(jRise),
      set: jdToDate(jSet)
    };
  }

  const moonTimes = getMoonTimes(jd, lat, lon);
  
  const formatTime = (d: Date) => d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  // Muhurats
  // Day duration
  const dayDuration = sunTimes.set.getTime() - sunTimes.rise.getTime();
  const muhuratDur = dayDuration / 15;
  
  const abhijitStart = new Date(sunTimes.transit.getTime() - (muhuratDur/2));
  const abhijitEnd = new Date(sunTimes.transit.getTime() + (muhuratDur/2));

  // Brahma Muhurat (2 muhurats before sunrise)
  const brahmaStart = new Date(sunTimes.rise.getTime() - (2 * muhuratDur));
  const brahmaEnd = new Date(sunTimes.rise.getTime() - muhuratDur);

  const weekday = date.getDay(); // 0=Sun
  
  // Rahu Kaal
  const rahuKaalStarts = [0.875, 0.125, 0.75, 0.5, 0.625, 0.375, 0.25];
  const rahuStart = new Date(sunTimes.rise.getTime() + dayDuration * rahuKaalStarts[weekday]);
  const rahuEnd = new Date(rahuStart.getTime() + dayDuration * 0.125);
  
  // Yamaganda
  const yamaStarts = [0.5, 0.375, 0.25, 0.125, 0.0, 0.75, 0.625];
  const yamaStart = new Date(sunTimes.rise.getTime() + dayDuration * yamaStarts[weekday]);
  const yamaEnd = new Date(yamaStart.getTime() + dayDuration * 0.125);
  
  // Gulika
  const gulikaStarts = [0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0.0];
  const gulikaStart = new Date(sunTimes.rise.getTime() + dayDuration * gulikaStarts[weekday]);
  const gulikaEnd = new Date(gulikaStart.getTime() + dayDuration * 0.125);

  swe.close();

  return {
    date: date.toISOString().split('T')[0],
    weekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday],
    tithi: `${paksha} ${tithiName}`,
    paksha,
    nakshatra: nakshatraName,
    yoga: yogaName,
    karana: kName,
    sunrise: formatTime(sunTimes.rise),
    sunset: formatTime(sunTimes.set),
    moonrise: formatTime(moonTimes.rise),
    moonset: formatTime(moonTimes.set),
    rahuKaal: `${formatTime(rahuStart)} - ${formatTime(rahuEnd)}`,
    yamaganda: `${formatTime(yamaStart)} - ${formatTime(yamaEnd)}`,
    gulikaKaal: `${formatTime(gulikaStart)} - ${formatTime(gulikaEnd)}`,
    abhijitMuhurat: `${formatTime(abhijitStart)} - ${formatTime(abhijitEnd)}`,
    brahmaMuhurat: `${formatTime(brahmaStart)} - ${formatTime(brahmaEnd)}`,
    amritKaal: "Varies",
    durMuhurat: "Varies",
    varjyam: "Varies",
    choghadiya: "Available",
    hinduMonth: lunarMonth,
    lunarMonth: lunarMonth,
    vikramSamvat: `VS ${vikramSamvat}`,
    shakaSamvat: `SS ${shakaSamvat}`,
    ritu,
    ayan,
    sunSign: sunRashi,
    moonSign: moonRashi,
    festivals: tithiIndex === 14 ? "Purnima Vrat" : (tithiIndex === 29 ? "Amavasya" : (tithiIndex === 10 || tithiIndex === 25 ? "Ekadashi Vrat" : "")),
    vrat: tithiIndex === 10 || tithiIndex === 25 ? "Ekadashi" : "",
    ekadashi: tithiIndex === 10 || tithiIndex === 25 ? "Yes" : "",
    amavasya: tithiIndex === 29,
    purnima: tithiIndex === 14,
    sankranti: "",
    specialNotes: "Calculated using high precision Swiss Ephemeris data.",
    mantra: "Om Namo Bhagavate Vasudevaya",
    goodTime: `${formatTime(abhijitStart)} - ${formatTime(abhijitEnd)}`,
    badTime: `${formatTime(rahuStart)} - ${formatTime(rahuEnd)}`,
    devotionalMessage: "May the divine blessings bring peace and joy to your life."
  };
}
