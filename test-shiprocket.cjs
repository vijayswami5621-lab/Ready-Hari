const axios = require('axios');

async function test() {
  const email = process.env.SHIPROCKET_EMAIL || "swamiajay9783@gmail.com";
  const password = process.env.SHIPROCKET_PASSWORD || "$p0FvTP%8fa6PItUtHcKCtkm&JW2wbL%";
  
  console.log("Email:", email);
  console.log("Password length:", password.length);

  try {
    const authRes = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email, password
    });
    const token = authRes.data?.token;
    console.log("Auth success, token obtained:", token ? "Yes (length " + token.length + ")" : "No");

    if (token) {
      const pickupPincode = "303801";
      const deliveryPincode = "110001"; // Connaught Place, Delhi
      const weight = 0.5;

      try {
        const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=0`;
        console.log("Fetching serviceability:", url);
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Serviceability status:", res.status);
        console.log("Couriers found:", res.data?.data?.available_courier_companies?.length);
        if (res.data?.data?.available_courier_companies?.length > 0) {
          console.log("Cheapest courier:", res.data?.data?.available_courier_companies[0]);
        } else {
          console.log("No couriers found in response structure:", JSON.stringify(res.data));
        }
      } catch (err) {
        console.error("Serviceability error:", err.response?.data || err.message);
      }
    }
  } catch (err) {
    console.error("Auth failed:", err.response?.data || err.message);
  }
}

test();
