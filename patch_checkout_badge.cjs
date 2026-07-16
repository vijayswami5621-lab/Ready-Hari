const fs = require('fs');
let content = fs.readFileSync('src/pages/store/CheckoutScreen.tsx', 'utf8');

const target = `                {(() => {
                  const active = RazorpayCheckoutManager.getSettings() || paymentSettings;
                  const isLiveMode = active?.enabled === true && active?.onlinePayment === true && active?.testMode === false && typeof active?.keyId === 'string' && active.keyId.startsWith('rzp_live_');
                  return !isLiveMode;
                })() && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md tracking-widest uppercase">
                    Test Mode
                  </span>
                )}`;

if(content.includes(target)) {
  content = content.replace(target, '');
  fs.writeFileSync('src/pages/store/CheckoutScreen.tsx', content);
  console.log("Removed Test Mode badge");
} else {
  console.log("Could not find Test Mode badge target");
}
