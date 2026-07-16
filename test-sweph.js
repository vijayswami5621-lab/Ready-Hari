import SwissEPH from 'sweph-wasm';
async function run() {
  const swe = await SwissEPH.init();
  console.log(Object.keys(swe));
}
run();
