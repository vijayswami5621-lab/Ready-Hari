import axios from 'axios';

async function test() {
  const key = "1a8a3f8e21799e9c562165708555d21c4b8b85e00817d71cf3ad4b4be622ffc0";
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

  try {
    const response = await axios.post("https://api.freeastroapi.com/api/v2/vedic/panchang", payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key
      }
    });
    console.log("Full JSON Response:\n", JSON.stringify(response.data, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
