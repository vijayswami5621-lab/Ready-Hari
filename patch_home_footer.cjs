const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/home/HomeScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

const target = `            case 'footer':
              return (
                <footer key={section.id} className="text-center pt-8 pb-4">
                  <div className="flex justify-center gap-6 mb-6">
                    <Link to="/profile/contact" className="text-xs text-brown-light dark:text-slate-400 hover:text-saffron-dark">Contact Us</Link>
                    <Link to="/info/terms" className="text-xs text-brown-light dark:text-slate-400 hover:text-saffron-dark">Terms of Service</Link>
                    <Link to="/profile/privacy" className="text-xs text-brown-light dark:text-slate-400 hover:text-saffron-dark">Privacy Policy</Link>
                  </div>
                  <h3 className="font-devanagari font-bold text-2xl text-brown-dark dark:text-white">हरि पाठशाला</h3>
                  <p className="text-xs text-brown-light dark:text-slate-400 mt-2 font-mukta">भक्ति • प्रेम • श्री सीताराम</p>
                  <p className="text-[10px] text-brown-light/60 dark:text-slate-500 mt-6">Version 1.0.0 &copy; {new Date().getFullYear()} Hari Pathshala. All rights reserved.</p>
                </footer>
              );`;

const replacement = `            case 'footer':
              return (
                <footer key={section.id} className="text-center pt-10 pb-8 border-t border-orange-100 dark:border-slate-800 mt-4 bg-orange-50/50 dark:bg-slate-900/50">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 p-1 mb-4 shadow-sm">
                      <img src="/logo.png" alt="Hari Pathshala Logo" className="w-full h-full object-contain" />
                    </div>
                    <h3 className="font-devanagari font-bold text-2xl text-brown-dark dark:text-white">हरि पाठशाला</h3>
                    <p className="text-xs text-brown-light dark:text-slate-400 mt-2 font-mukta max-w-xs px-4 leading-relaxed">Spiritual Education & Authentic Hindu Scriptures. Connecting souls to their divine roots.</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-8 px-4">
                    <Link to="/profile/contact" className="text-xs font-medium text-brown-light dark:text-slate-400 hover:text-saffron-dark">Contact</Link>
                    <Link to="/profile/about" className="text-xs font-medium text-brown-light dark:text-slate-400 hover:text-saffron-dark">About</Link>
                    <Link to="/profile/privacy" className="text-xs font-medium text-brown-light dark:text-slate-400 hover:text-saffron-dark">Privacy Policy</Link>
                    <Link to="/info/terms" className="text-xs font-medium text-brown-light dark:text-slate-400 hover:text-saffron-dark">Terms & Conditions</Link>
                    <Link to="/info/refunds" className="text-xs font-medium text-brown-light dark:text-slate-400 hover:text-saffron-dark">Refund Policy</Link>
                    <Link to="/info/shipping" className="text-xs font-medium text-brown-light dark:text-slate-400 hover:text-saffron-dark">Shipping Policy</Link>
                  </div>
                  
                  <div className="flex justify-center gap-6 mt-8 mb-6">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-brown-light hover:text-saffron hover:shadow-sm transition-all">
                      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-brown-light hover:text-red-500 hover:shadow-sm transition-all">
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.86-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15V9l5.2,3L10,15z"></path></svg>
                    </a>
                  </div>

                  <p className="text-[10px] text-brown-light/60 dark:text-slate-500 mt-6 px-4">&copy; {new Date().getFullYear()} Hari Pathshala. All rights reserved.</p>
                </footer>
              );`;

content = content.replace(target, replacement);
fs.writeFileSync(p, content);
