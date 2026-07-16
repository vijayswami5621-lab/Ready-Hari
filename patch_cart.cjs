const fs = require('fs');

let content = fs.readFileSync('src/pages/store/CartScreen.tsx', 'utf8');

const target = `  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Typically, here we'd make a call to our backend to create a Razorpay order
      // const { data } = await axios.post('/api/create-order', { amount: total });

      const options = {
        key: process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mock", // Use from backend/env
        amount: total * 100, // Amount in paise
        currency: "INR",
        name: "Hari Pathshala",
        description: "Store Purchase",
        // order_id: data.orderId,
        handler: function (response: any) {
          alert(
            \`Payment Successful! Payment ID: \${response.razorpay_payment_id}\`,
          );
          // Verify payment on backend
        },
        prefill: {
          name: "Bhakt",
          email: "bhakt@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#F97316",
        },
      };

      // Since Razorpay script isn't loaded by default, we mock it if not present
      if ((window as any).Razorpay) {
        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();
      } else {
        alert("Payment Gateway (Razorpay) would open here in production.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };`;

const replacement = `  const handleCheckout = () => {
    navigate("/store/checkout");
  };`;

content = content.replace(target, replacement);

fs.writeFileSync('src/pages/store/CartScreen.tsx', content);
console.log("Patched CartScreen");
