import axios from 'axios';
async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/payment/create-order', {
      amount: 500,
      currency: "INR"
    });
    console.log(res.data);
  } catch (err: any) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
