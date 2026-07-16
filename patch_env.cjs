const fs = require('fs');

let envContent = '';
if (fs.existsSync('.env')) {
  envContent = fs.readFileSync('.env', 'utf8');
}

if (!envContent.includes('RAZORPAY_LIVE_KEY_ID')) {
  envContent += '\nRAZORPAY_LIVE_KEY_ID=rzp_live_T91BWZao0CJ2Bi\n';
  fs.writeFileSync('.env', envContent);
} else {
  envContent = envContent.replace(/RAZORPAY_LIVE_KEY_ID=.*/, 'RAZORPAY_LIVE_KEY_ID=rzp_live_T91BWZao0CJ2Bi');
  fs.writeFileSync('.env', envContent);
}

if (!envContent.includes('RAZORPAY_LIVE_KEY_SECRET')) {
  envContent += '\nRAZORPAY_LIVE_KEY_SECRET=I7wB0ElgOZO5t5H32546b6wM\n';
  fs.writeFileSync('.env', envContent);
} else {
  envContent = envContent.replace(/RAZORPAY_LIVE_KEY_SECRET=.*/, 'RAZORPAY_LIVE_KEY_SECRET=I7wB0ElgOZO5t5H32546b6wM');
  fs.writeFileSync('.env', envContent);
}

let envExample = '';
if (fs.existsSync('.env.example')) {
  envExample = fs.readFileSync('.env.example', 'utf8');
  if (!envExample.includes('RAZORPAY_LIVE_KEY_ID')) {
    envExample += '\nRAZORPAY_LIVE_KEY_ID=\n';
    fs.writeFileSync('.env.example', envExample);
  }
}
console.log("Patched .env");
