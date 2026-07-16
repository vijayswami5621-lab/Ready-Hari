import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

class RazorpayCheckoutManagerClass {
  private static instance: RazorpayCheckoutManagerClass;
  private razorpayKey: string | null = null;
  private isInitializing: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private settings: any = null;

  private constructor() {}

  public static getInstance(): RazorpayCheckoutManagerClass {
    if (!RazorpayCheckoutManagerClass.instance) {
      RazorpayCheckoutManagerClass.instance = new RazorpayCheckoutManagerClass();
    }
    return RazorpayCheckoutManagerClass.instance;
  }

  public getSettings() {
    return this.settings;
  }

  private async fetchKeyFromFirestore(): Promise<string> {
    try {
      const configDoc = await getDoc(doc(db, 'settings', 'payment'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        this.settings = data;
        
        const isLiveMode = data.enabled === true && data.onlinePayment === true && data.testMode === false && typeof data.keyId === 'string' && data.keyId.startsWith('rzp_live_');
        
        if (isLiveMode) {
          data.calculatedMode = 'live';
          return data.keyId;
        } else {
          data.calculatedMode = 'test';
          return data.keyId || '';
        }
      }
    } catch (error) {
      console.warn('Error fetching Razorpay key from Firestore:', error);
    }
    
    // No hardcoded keys are allowed as fallbacks, except the requested live production fallback.
    const fallbackKey = import.meta.env.VITE_RAZORPAY_KEY || 
                        import.meta.env.VITE_RAZORPAY_LIVE_KEY_ID || 
                        "rzp_live_T91BWZao0CJ2Bi";
    this.settings = {
      enabled: true,
      onlinePayment: true,
      testMode: false,
      keyId: fallbackKey,
      calculatedMode: 'live',
    };
    return fallbackKey;
  }

  private async loadRazorpayScript(retryCount = 0): Promise<boolean> {
    return new Promise((resolve) => {
      // If already loaded, resolve immediately
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      // Cleanup duplicate scripts if any
      const existingScripts = document.querySelectorAll('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScripts.length > 0 && retryCount === 0) {
        existingScripts.forEach(script => script.remove());
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => resolve(true);
      
      script.onerror = () => {
        if (retryCount < 3) {
          console.warn(`Failed to load Razorpay SDK. Retrying... (${retryCount + 1}/3)`);
          setTimeout(() => {
            this.loadRazorpayScript(retryCount + 1).then(resolve);
          }, 1000 * Math.pow(2, retryCount));
        } else {
          console.error('Failed to load Razorpay SDK after 3 attempts');
          resolve(false);
        }
      };

      document.body.appendChild(script);
    });
  }

  public async initialize(): Promise<void> {
    if (this.razorpayKey && (window as any).Razorpay) {
      return;
    }

    if (this.isInitializing && this.initializationPromise) {
      return this.initializationPromise;
    }

    this.isInitializing = true;
    
    this.initializationPromise = (async () => {
      try {
        const [key, isScriptLoaded] = await Promise.all([
          this.fetchKeyFromFirestore(),
          this.loadRazorpayScript()
        ]);

        if (!isScriptLoaded) {
          throw new Error('Could not load Razorpay SDK');
        }

        this.razorpayKey = key;
      } catch (error) {
        this.isInitializing = false;
        this.initializationPromise = null;
        throw error;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initializationPromise;
  }

  public async initializePayment(options: any): Promise<any> {
    await this.initialize();

    if (!this.razorpayKey || !(window as any).Razorpay) {
      throw new Error('Razorpay is not properly initialized');
    }

    return new Promise((resolve, reject) => {
      const finalOptions = {
        ...options,
        key: this.razorpayKey,
        handler: function (response: any) {
          resolve(response);
        },
      };

      finalOptions.modal = {
        ondismiss: function () {
          reject(new Error('Payment cancelled by user'));
        },
      };

      try {
        const rzp = new (window as any).Razorpay(finalOptions);
        rzp.on('payment.failed', function (response: any) {
          reject(new Error(response.error.description || 'Payment failed'));
        });
        rzp.open();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const RazorpayCheckoutManager = RazorpayCheckoutManagerClass.getInstance();
