import axios from 'axios';

async function test() {
  const keys = [
    "1a8a3f8e21799e9c562165708555d21c4b8b85e00817d71cf3ad4b4be622ffc0",
    "11ccbe1efa55e242577b191f7cabee889763db18d621f2e1018c458df2de1472"
  ];
  
  const payload = {
    year: 2026,
    month: 7,
    day: 6,
    hour: 12,
    minute: 0,
    lat: 28.6139,
    lng: 77.2090,
    tz_str: "Asia/Kolkata"
  };

  for (const key of keys) {
    try {
      console.log(`Testing key: ${key.substring(0, 8)}...`);
      const response = await axios.post("https://api.freeastroapi.com/api/v2/vedic/panchang", payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key
        },
        timeout: 8000
      });
      console.log(`Success! Response status: ${response.data.status}`);
      console.log("Response data structure keys:", Object.keys(response.data));
      if (response.data.data) {
        console.log("Nested data keys:", Object.keys(response.data.data));
        console.log("Tithi:", JSON.stringify(response.data.data.tithi));
        console.log("Nakshatra:", JSON.stringify(response.data.data.nakshatra));
        console.log("Yoga:", JSON.stringify(response.data.data.yoga));
        console.log("Karana:", JSON.stringify(response.data.data.karana || response.data.data.karanas));
        console.log("Lunar Month:", JSON.stringify(response.data.data.lunar_month));
      }
      return;
    } catch (e) {
      console.error(`Failed with key: ${key.substring(0, 8)}..., Error: ${e.message}`);
      if (e.response) {
        console.error("Response error data:", e.response.data);
      }
    }
  }
}

test();
