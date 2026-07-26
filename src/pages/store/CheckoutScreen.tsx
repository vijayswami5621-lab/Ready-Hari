import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SEO } from "../../components/SEO";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Truck,
  CheckCircle,
  User as UserIcon,
  MapPin,
  Edit3,
  Trash2,
  Plus,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStoreState } from "../../store/useStoreState";
import { useAuthStore } from "../../store/useAuthStore";
import {
  doc,
  collection,
  setDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  updateDoc,
  addDoc,
  writeBatch,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { SecureImage } from "../../components/common/SecureImage";
import { AppLauncher } from "@capacitor/app-launcher";
import { Capacitor } from "@capacitor/core";
import { RazorpayCheckoutManager } from "../../services/razorpayService";
import { fetchApi } from "../../utils/apiHelper";
import { useGoBack } from "../../hooks/useGoBack";
import { useAppSettings } from "../../contexts/AppSettingsContext";

interface Address {
  id?: string;
  fullName: string;
  email: string;
  mobile: string;
  altMobile?: string;
  houseNo: string;
  street: string;
  landmark?: string;
  village: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
}

export const CheckoutScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { settings, paymentSettings, shippingSettings } = useAppSettings();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const stepParam = parseInt(urlParams.get("step") || "1");
  const currentStep = stepParam >= 1 && stepParam <= 4 ? stepParam : 1;

  const setCurrentStep = (step: number) => {
    navigate(`/store/checkout?step=${step}`, { replace: false });
  };

  const { cart, clearCart, updateQuantity, removeFromCart } = useStoreState();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [fetchingAddresses, setFetchingAddresses] = useState(true);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Forms
  const [customerInfo, setCustomerInfo] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    mobile: "",
    altMobile: "",
  });

  const [addressForm, setAddressForm] = useState<Address>({
    fullName: "",
    email: "",
    mobile: "",
    altMobile: "",
    houseNo: "",
    street: "",
    landmark: "",
    village: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    isDefault: false,
  });

  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [paymentError, setPaymentError] = useState("");
  const [failedOrderDetails, setFailedOrderDetails] = useState<{
    paymentId: string;
    address: Address;
  } | null>(null);

  const [installedUpiApps, setInstalledUpiApps] = useState<any[]>([]);
  const [calculatedShipping, setCalculatedShipping] = useState<number>(50);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [serviceableError, setServiceableError] = useState<string>("");
  const [codAvailable, setCodAvailable] = useState<boolean | null>(null);
  const [codCharge, setCodCharge] = useState<number>(0);
  const [deliveryEtd, setDeliveryEtd] = useState<string>("");
  const [courierPartner, setCourierPartner] = useState<string>("");
  const [isShiprocketTemporarilyDown, setIsShiprocketTemporarilyDown] = useState<boolean>(false);
  const [shippingRetryAttempt, setShippingRetryAttempt] = useState<number>(0);

  // Coupon / Discount states
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (code === "HARI10") {
      const disc = Math.round(total * 0.10);
      setDiscount(disc);
      setCouponApplied(true);
    } else if (code === "GURU20") {
      const disc = Math.round(total * 0.20);
      setDiscount(disc);
      setCouponApplied(true);
    } else if (code === "") {
      setCouponError("कृपया कूपन कोड दर्ज करें।");
    } else {
      setCouponError("अमान्य कूपन कोड। HARI10 या GURU20 का उपयोग करें।");
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate total weight (default 0.5kg per item if not set)
  const totalWeight = cart.reduce(
    (sum, item) => sum + ((item as any).weight || 0.5) * item.quantity,
    0,
  );

  const freeShippingActive = shippingSettings?.freeShippingEnabled || false;
  const freeShippingThreshold = shippingSettings?.freeShippingThreshold || 0;
  const isFreeShipping = (freeShippingActive && total >= freeShippingThreshold) || calculatedShipping === 0;
  const shipping = isFreeShipping ? 0 : calculatedShipping;
  const finalAmount = total + shipping - discount;

  const performShippingCalculation = async () => {
    if (!selectedAddressId || addresses.length === 0) return;

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr || !selectedAddr.pincode) return;

    let success = false;
    let attempt = 0;
    const maxAttempts = 3;
    const baseDelay = 1000;

    setIsCalculatingShipping(true);
    setServiceableError("");
    setIsShiprocketTemporarilyDown(false);
    setShippingRetryAttempt(1);

    while (attempt < maxAttempts && !success) {
      attempt++;
      setShippingRetryAttempt(attempt);
      try {
        if (attempt > 1) {
          const delay = baseDelay * Math.pow(2, attempt - 2);
          console.log(`[Checkout] Retrying shipping calculation... Attempt ${attempt}/${maxAttempts} in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const data = await fetchApi("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pincode: selectedAddr.pincode,
            weight: totalWeight,
            paymentMethod: paymentMethod,
          }),
        });
        
        if (data.serviceable === false) {
          console.warn("[Checkout] Pincode not serviceable via Shiprocket, using free shipping fallback.");
          setCalculatedShipping(0);
          setCodAvailable(true);
          setCodCharge(0);
          setDeliveryEtd("5-7 दिन");
          setCourierPartner("Standard Courier");
          setIsShiprocketTemporarilyDown(true);
          setServiceableError("");
          success = true; // stop retrying and use the fallback gracefully
        } else if (data.serviceable === true) {
          if (data.shippingFee !== undefined) {
            setCalculatedShipping(data.shippingFee);
          }
          if (data.codAvailable !== undefined) {
            setCodAvailable(data.codAvailable);
          } else {
            setCodAvailable(true);
          }
          if (data.codCharge !== undefined) {
            setCodCharge(data.codCharge);
          } else {
            setCodCharge(paymentMethod === "cod" ? 50 : 0);
          }
          if (data.etd) {
            setDeliveryEtd(data.etd);
          } else {
            setDeliveryEtd(`${data.transitTime || "3-5"} दिन`);
          }
          if (data.courierName) {
            setCourierPartner(data.courierName);
          } else {
            setCourierPartner("Standard Courier");
          }
          setServiceableError("");
          setIsShiprocketTemporarilyDown(false);
          success = true;
        } else {
          throw new Error("Invalid response status from shipping API");
        }
      } catch (err: any) {
        console.error(`[Checkout] Shipping calculation attempt ${attempt} failed:`, err.message || err);
        // Let the loop retry
      }
    }

    if (!success) {
      console.warn("[Checkout] Shiprocket calculation failed or timed out, applying standard free shipping fallback.");
      setIsShiprocketTemporarilyDown(true);
      setCalculatedShipping(0); // ₹0 shipping charge fallback
      setCodAvailable(true);
      setCodCharge(0);
      setDeliveryEtd("5-7 दिन");
      setCourierPartner("Standard Courier");
      setServiceableError(""); // Empty error ensures checkout is never blocked
    }
    
    setIsCalculatingShipping(false);
  };

  // Recalculate shipping when address or payment method changes
  useEffect(() => {
    performShippingCalculation();
  }, [selectedAddressId, addresses, total, totalWeight, paymentMethod]);



  useEffect(() => {
    const checkUpiApps = async () => {
      if (!Capacitor.isNativePlatform()) return;

      const upiAppsToCheck = [
        { id: "gpay", name: "Google Pay", url: "tez://upi/pay" },
        { id: "phonepe", name: "PhonePe", url: "phonepe://pay" },
        { id: "paytm", name: "Paytm", url: "paytmmp://pay" },
        { id: "bhim", name: "BHIM", url: "bhim://pay" },
      ];

      const availableApps = [];
      for (const app of upiAppsToCheck) {
        try {
          const { value } = await AppLauncher.canOpenUrl({ url: app.url });
          if (value) {
            availableApps.push(app);
          }
        } catch (e) {
          console.log(`Failed to check ${app.name}`);
        }
      }
      setInstalledUpiApps(availableApps);
    };

    checkUpiApps();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      setFetchingAddresses(true);
      const querySnapshot = await getDocs(
        collection(db, `users/${user.uid}/addresses`),
      );
      const fetchedAddresses: Address[] = [];
      querySnapshot.forEach((doc) => {
        fetchedAddresses.push({ id: doc.id, ...doc.data() } as Address);
      });
      setAddresses(fetchedAddresses);
      const defaultAddr =
        fetchedAddresses.find((a) => a.isDefault) || fetchedAddresses[0];
      if (defaultAddr && defaultAddr.id) {
        setSelectedAddressId(defaultAddr.id);
        setCustomerInfo({
          fullName: defaultAddr.fullName,
          email: defaultAddr.email,
          mobile: defaultAddr.mobile,
          altMobile: defaultAddr.altMobile || "",
        });
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setFetchingAddresses(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please login");
    if (
      !addressForm.fullName ||
      !addressForm.mobile ||
      !addressForm.houseNo ||
      !addressForm.street ||
      !addressForm.village ||
      !addressForm.city ||
      !addressForm.district ||
      !addressForm.state ||
      !addressForm.pincode
    ) {
      return alert("Please fill all required fields");
    }
    if (addressForm.mobile.length < 10)
      return alert("Enter valid 10-digit mobile number");

    try {
      setLoading(true);
      const addressesRef = collection(db, `users/${user.uid}/addresses`);

      // If setting as default, update others
      if (addressForm.isDefault) {
        const batchUpdates = addresses.map(async (addr) => {
          if (addr.id && addr.isDefault) {
            await updateDoc(doc(db, `users/${user.uid}/addresses`, addr.id), {
              isDefault: false,
            });
          }
        });
        await Promise.all(batchUpdates);
      }

      if (editingAddressId) {
        await updateDoc(
          doc(db, `users/${user.uid}/addresses`, editingAddressId),
          { ...addressForm },
        );
      } else {
        await addDoc(addressesRef, { ...addressForm });
      }

      await fetchAddresses();
      setIsAddingAddress(false);
      setEditingAddressId(null);
      resetAddressForm();
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user || !id) return;
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, `users/${user.uid}/addresses`, id));
      await fetchAddresses();
      if (selectedAddressId === id) setSelectedAddressId("");
    } catch (error) {
      console.error("Error deleting address:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      fullName: customerInfo.fullName || user?.displayName || "",
      email: customerInfo.email || user?.email || "",
      mobile: customerInfo.mobile || "",
      altMobile: "",
      houseNo: "",
      street: "",
      landmark: "",
      village: "",
      city: "",
      district: "",
      state: "",
      country: "India",
      pincode: "",
      isDefault: addresses.length === 0,
    });
  };

  const handleEditAddress = (addr: Address) => {
    setAddressForm({ ...addr });
    setEditingAddressId(addr.id || null);
    setIsAddingAddress(true);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (
        !customerInfo.fullName ||
        !customerInfo.email ||
        !customerInfo.mobile
      ) {
        return alert("Please fill all required customer info fields.");
      }
      if (customerInfo.mobile.length < 10) {
        return alert("Please enter a valid 10-digit mobile number.");
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedAddressId && addresses.length > 0) {
        return alert("Please select a delivery address.");
      }
      if (addresses.length === 0) {
        return alert("Please add a delivery address.");
      }
      if (serviceableError) {
        return alert(serviceableError);
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePay = async () => {
    if (!user) return alert("Please login to continue");
    if (cart.length === 0) return alert("Cart is empty");
    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) return alert("Delivery address missing");
    if (serviceableError) return alert(serviceableError);

    setLoading(true);
    setPaymentError("");

    // Handle Cash on Delivery (COD) flow
    if (paymentMethod === "cod") {
      if (codAvailable !== true) {
        setPaymentError("कैश ऑन डिलीवरी इस पते पर उपलब्ध नहीं है।");
        setLoading(false);
        return;
      }
      try {
        await handleOrderCreation("COD", "COD", "COD", selectedAddr);
      } catch (err: any) {
        console.error("COD checkout failed:", err);
        setPaymentError(err.message || "Could not process Cash on Delivery order.");
        setLoading(false);
      }
      return;
    }

    // Handle Razorpay Online Payment flow
    let activeSettings = RazorpayCheckoutManager.getSettings() || paymentSettings;

    // Check if configuration has all required values: enabled, onlinePayment, testMode, keyId
    const validateConfig = (cfg: any) => {
      if (!cfg) return false;
      const key = cfg.keyId || cfg.razorpayLiveKeyId;
      if (!key) return false;
      if (cfg.enabled === undefined) return false;
      if (cfg.onlinePayment === undefined) return false;
      return true;
    };

    if (!validateConfig(activeSettings)) {
      setPaymentError("डेटा लोड किया जा रहा है, कृपया प्रतीक्षा करें...");
      
      let retries = 0;
      const maxRetries = 5;
      while (retries < maxRetries) {
        retries++;
        console.log(`Retrying loading payment configuration... Attempt ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          await RazorpayCheckoutManager.initialize();
          activeSettings = RazorpayCheckoutManager.getSettings();
          if (validateConfig(activeSettings)) {
            break;
          }
        } catch (e) {
          console.warn("Retry initialization failed:", e);
        }
      }

      if (!validateConfig(activeSettings)) {
        setLoading(false);
        setPaymentError("त्रुटि: भुगतान कॉन्फ़िगरेशन उपलब्ध नहीं है। कृपया पुनः प्रयास करें।");
        return;
      }
    }

    if (activeSettings.enabled === false || activeSettings.onlinePayment === false) {
      setPaymentError("प्रशासक द्वारा भुगतान सेवा वर्तमान में बंद कर दी गई है।");
      setLoading(false);
      return;
    }

    setPaymentError("");

    try {

      const orderDataResponse = await fetchApi("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, currency: "INR" }),
      });


      const razorpayKey = activeSettings.keyId || activeSettings.razorpayLiveKeyId;

      if (!razorpayKey) {
        throw new Error(
          "भुगतान कुंजी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।"
        );
      }

      const options = {
        key: razorpayKey,
        amount: orderDataResponse.amount,
        currency: activeSettings.currency || orderDataResponse.currency || "INR",
        order_id: orderDataResponse.orderId,
        name: activeSettings.companyName || activeSettings.merchantName || settings?.appName || "Hari Pathshala",
        description: "Order Payment",
        image: settings?.appLogo || "https://api.dicebear.com/7.x/avataaars/svg?seed=Hari",
        prefill: {
          name: customerInfo.fullName,
          email: customerInfo.email,
          contact: customerInfo.mobile,
        },
        theme: { color: activeSettings.themeColor || settings?.themeColors?.primary || "#FF6B00" },
      };

      const paymentResponse =
        await RazorpayCheckoutManager.initializePayment(options);

      await handleOrderCreation(
        paymentResponse.razorpay_payment_id,
        paymentResponse.razorpay_order_id,
        paymentResponse.razorpay_signature,
        selectedAddr,
      );
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentError(err.message || "Could not initialize payment gateway.");
      setLoading(false);
    }
  };

  const handleOrderCreation = async (
    paymentId: string,
    orderId: string,
    signature: string,
    address: Address,
  ) => {
    try {
      const orderData = {
        userId: user?.uid,
        items: cart,
        totalAmount: finalAmount,
        subtotal: total,
        shippingFee: shipping,
        discount: discount,
        shippingAddress: address,
        customerInfo: customerInfo,
        paymentMethod: paymentMethod,
        courierName: courierPartner || "Standard Courier",
        estimatedDelivery: deliveryEtd || "",
        codAvailable: codAvailable !== null ? codAvailable : true,
        codCharge: codCharge,
      };

      const verifyData = await fetchApi("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          orderData: {
            userId: user?.uid,
            items: cart,
            totalAmount: finalAmount,
            subtotal: total,
            shippingFee: shipping,
            discount: discount,
            shippingAddress: address,
            customerInfo: customerInfo,
            paymentMethod: paymentMethod,
            courierName: courierPartner || "Standard Courier",
            estimatedDelivery: deliveryEtd || "",
            codAvailable: codAvailable !== null ? codAvailable : true,
            codCharge: codCharge,
          },
          cart: cart,
        }),
      });

      clearCart();
      setLoading(false);
      navigate("/store/order-success", {
        state: { orderId: verifyData.orderId, paymentId },
      });
    } catch (error: any) {
      console.log("Order verification failed (handled):", error.message);
      setPaymentError(
        error.message ||
          "Payment was successful, but we failed to save the order details.",
      );
      setFailedOrderDetails({ paymentId, orderId, signature, address } as any);
      setLoading(false);
    }
  };

  const retryOrderCreation = async () => {
    if (failedOrderDetails) {
      setPaymentError("");
      setLoading(true);
      const fd = failedOrderDetails as any;
      await handleOrderCreation(
        fd.paymentId,
        fd.orderId,
        fd.signature,
        fd.address,
      );
    }
  };

  const isShippingIncomplete = shippingSettings?.shiprocketEnabled && (!shippingSettings.shiprocketEmail || !shippingSettings.shiprocketPassword);

  if (isShippingIncomplete) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[28px] shadow-lg max-w-md border border-orange-100 dark:border-slate-700 space-y-4">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Truck size={32} />
          </div>
          <h2 className="text-xl font-bold text-brown-dark dark:text-white font-devanagari">
            सेवा अस्थायी रूप से अनुपलब्ध है
          </h2>
          <p className="text-sm text-brown-light dark:text-slate-400 font-mukta leading-relaxed">
            प्रिय भक्त, शिपिंग सेवाएं वर्तमान में अपडेट की जा रही हैं। कृपया कुछ क्षण प्रतीक्षा करें या बाद में प्रयास करें।
          </p>
          <button
            onClick={() => navigate("/store")}
            className="w-full bg-saffron hover:bg-saffron-dark text-white py-3 rounded-xl font-bold transition duration-200"
          >
            स्टोर पर वापस जाएं
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && currentStep === 1) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-brown-dark dark:text-white mb-2">
          Cart is Empty
        </h2>
        <p className="text-sm text-brown-light dark:text-slate-400 mb-6">
          You need items in your cart to checkout.
        </p>
        <button
          onClick={() => navigate("/store")}
          className="bg-saffron text-white px-6 py-2 rounded-xl font-bold"
        >
          Go to Store
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-32">
      <SEO title="Checkout | Hari Pathshala" description="Secure checkout." />

      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-3 border-b border-orange-50 dark:border-slate-800">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex-1">
          {currentStep === 1 && "Customer Info"}
          {currentStep === 2 && "Delivery Address"}
          {currentStep === 3 && "Order Summary"}
          {currentStep === 4 && "Payment"}
        </h1>
        <div className="text-xs font-bold text-saffron-dark bg-orange-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          Step {currentStep} / 4
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-orange-100 dark:bg-slate-800">
        <div
          className="h-full bg-saffron transition-all duration-300"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        ></div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* STEP 1: CUSTOMER INFO */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-2 text-brown-dark dark:text-white font-bold mb-2">
                <UserIcon size={20} className="text-saffron-dark" /> Contact
                Details
              </div>

              <div>
                <label className="block text-xs font-medium text-brown-light dark:text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.fullName}
                  onChange={(e) =>
                    setCustomerInfo({
                      ...customerInfo,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-orange-50 dark:bg-slate-700 border border-transparent focus:border-saffron rounded-xl text-sm text-brown-dark dark:text-white outline-none transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brown-light dark:text-slate-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, email: e.target.value })
                  }
                  className="w-full p-3 bg-orange-50 dark:bg-slate-700 border border-transparent focus:border-saffron rounded-xl text-sm text-brown-dark dark:text-white outline-none transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brown-light dark:text-slate-400 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={customerInfo.mobile}
                  onChange={(e) =>
                    setCustomerInfo({
                      ...customerInfo,
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  className="w-full p-3 bg-orange-50 dark:bg-slate-700 border border-transparent focus:border-saffron rounded-xl text-sm text-brown-dark dark:text-white outline-none transition-colors"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brown-light dark:text-slate-400 mb-1">
                  Alternate Mobile (Optional)
                </label>
                <input
                  type="tel"
                  value={customerInfo.altMobile}
                  onChange={(e) =>
                    setCustomerInfo({
                      ...customerInfo,
                      altMobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  className="w-full p-3 bg-orange-50 dark:bg-slate-700 border border-transparent focus:border-saffron rounded-xl text-sm text-brown-dark dark:text-white outline-none transition-colors"
                  placeholder="Alternate mobile number"
                />
              </div>
            </div>

            <button
              onClick={nextStep}
              className="w-full bg-saffron text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-saffron/20 hover:bg-saffron-dark transition-colors"
            >
              Continue to Delivery
            </button>
          </motion.div>
        )}

        {/* STEP 2: DELIVERY ADDRESS */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {!isAddingAddress ? (
              <>
                {fetchingAddresses ? (
                  <div className="flex justify-center p-8">
                    <RefreshCw
                      size={24}
                      className="text-saffron animate-spin"
                    />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-3xl border border-orange-100 dark:border-slate-700">
                    <MapPin
                      size={40}
                      className="mx-auto text-brown-light dark:text-slate-500 mb-3 opacity-50"
                    />
                    <h3 className="font-bold text-brown-dark dark:text-white mb-2">
                      No Saved Addresses
                    </h3>
                    <p className="text-sm text-brown-light dark:text-slate-400 mb-4">
                      Please add a delivery address to continue.
                    </p>
                    <button
                      onClick={() => {
                        resetAddressForm();
                        setIsAddingAddress(true);
                      }}
                      className="inline-flex items-center gap-2 bg-saffron text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm"
                    >
                      <Plus size={16} /> Add Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="font-bold text-brown-dark dark:text-white">
                        Saved Addresses
                      </h3>
                      <button
                        onClick={() => {
                          resetAddressForm();
                          setIsAddingAddress(true);
                        }}
                        className="text-sm text-saffron-dark font-bold flex items-center gap-1"
                      >
                        <Plus size={14} /> Add New
                      </button>
                    </div>

                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id || "")}
                        className={`p-4 rounded-3xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? "border-saffron bg-saffron/5" : "border-orange-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-saffron/30"}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-brown-dark dark:text-white text-sm">
                              {addr.fullName}
                            </h4>
                            {addr.isDefault && (
                              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          {selectedAddressId === addr.id && (
                            <CheckCircle size={20} className="text-saffron" />
                          )}
                        </div>
                        <p className="text-xs text-brown-light dark:text-slate-400 mb-1">
                          {addr.houseNo}, {addr.street}
                          {addr.landmark ? `, ${addr.landmark}` : ""}
                        </p>
                        <p className="text-xs text-brown-light dark:text-slate-400 mb-2">
                          {addr.village}, {addr.city}, {addr.state} -{" "}
                          {addr.pincode}
                        </p>
                        <p className="text-xs text-brown-dark dark:text-slate-300 font-medium">
                          Mob: {addr.mobile}
                        </p>

                        <div className="flex gap-3 mt-3 pt-3 border-t border-orange-100 dark:border-slate-700/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(addr);
                            }}
                            className="text-xs font-bold text-blue-600 flex items-center gap-1"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(addr.id!);
                            }}
                            className="text-xs font-bold text-red-500 flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {addresses.length > 0 && (
                  <button
                    onClick={nextStep}
                    disabled={!selectedAddressId}
                    className="w-full bg-saffron text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-saffron/20 hover:bg-saffron-dark transition-colors disabled:opacity-50 mt-6"
                  >
                    Deliver to this address
                  </button>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4 border-b border-orange-50 dark:border-slate-700 pb-3">
                  <h3 className="font-bold text-brown-dark dark:text-white flex items-center gap-2">
                    <MapPin size={18} className="text-saffron" />{" "}
                    {editingAddressId ? "Edit Address" : "Add New Address"}
                  </h3>
                  <button
                    onClick={() => setIsAddingAddress(false)}
                    className="text-brown-light hover:text-brown-dark p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={addressForm.fullName}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Mobile *"
                        value={addressForm.mobile}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            mobile: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10),
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Alt Mobile"
                        value={addressForm.altMobile}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            altMobile: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10),
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="email"
                        placeholder="Email Address *"
                        value={addressForm.email}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="House No / Flat No *"
                        value={addressForm.houseNo}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            houseNo: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Street / Area *"
                        value={addressForm.street}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            street: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Landmark (Optional)"
                        value={addressForm.landmark}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            landmark: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Village/Locality *"
                        value={addressForm.village}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            village: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="City *"
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            city: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="District *"
                        value={addressForm.district}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            district: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="State *"
                        value={addressForm.state}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            state: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="PIN Code *"
                        value={addressForm.pincode}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            pincode: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          })
                        }
                        className="w-full p-3 bg-orange-50 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-saffron dark:text-white"
                        required
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Country"
                        value={addressForm.country}
                        readOnly
                        className="w-full p-3 bg-orange-100 dark:bg-slate-800 rounded-xl text-sm text-brown-light dark:text-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          isDefault: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-saffron accent-saffron"
                    />
                    <span className="text-sm text-brown-dark dark:text-slate-300">
                      Set as default address
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brown-dark dark:bg-slate-700 text-white py-3 rounded-xl font-bold mt-4 flex justify-center items-center"
                  >
                    {loading ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      "Save Address"
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3: ORDER SUMMARY */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700">
              <h3 className="font-bold text-brown-dark dark:text-white mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-saffron" /> Items to
                Order
              </h3>

              <div className="space-y-4 mb-4">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 pb-4 border-b border-orange-50 dark:border-slate-700 last:border-0 last:pb-0"
                  >
                    <div className="w-16 h-16 rounded-xl bg-orange-50 dark:bg-slate-700 overflow-hidden shrink-0">
                      <SecureImage
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-brown-dark dark:text-white line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs font-bold text-saffron-dark mt-1">
                        ₹{item.price}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-orange-50 dark:bg-slate-700 rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              item.quantity > 1
                                ? updateQuantity(
                                    item.productId,
                                    item.quantity - 1,
                                  )
                                : removeFromCart(item.productId)
                            }
                            className="px-2 py-1 text-brown-dark dark:text-white hover:bg-orange-100 dark:hover:bg-slate-600 font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-brown-dark dark:text-white min-w-[30px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="px-2 py-1 text-brown-dark dark:text-white hover:bg-orange-100 dark:hover:bg-slate-600 font-bold"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-bold text-brown-dark dark:text-white">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 space-y-2 mt-4">
                <label className="block text-xs font-bold text-brown-dark dark:text-white uppercase tracking-wider">
                  Promo / Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="कूपन कोड डालें (e.g. HARI10, GURU20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                    className="flex-1 px-3 py-2 text-sm border border-orange-100 dark:border-slate-700 rounded-xl bg-orange-50/30 dark:bg-slate-900 text-brown-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponApplied}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                      couponApplied
                        ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                        : "bg-saffron text-white hover:bg-saffron-dark shadow-md"
                    }`}
                  >
                    {couponApplied ? "✓ Applied" : "Apply"}
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    बधाई हो! आपको ₹{discount} की छूट मिली है।
                  </p>
                )}
                {couponError && (
                  <p className="text-xs text-red-500 font-medium">
                    {couponError}
                  </p>
                )}
              </div>

              <div className="bg-orange-50 dark:bg-slate-700/50 p-4 rounded-2xl space-y-2 text-sm mt-4">
                <div className="flex justify-between text-brown-light dark:text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-medium text-brown-dark dark:text-white">
                    ₹{total}
                  </span>
                </div>
                
                <div className="flex justify-between text-brown-light dark:text-slate-300">
                  <span>GST (if applicable)</span>
                  <span className="font-medium text-brown-dark dark:text-white">
                    Included
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-bold">
                    <span>Discount</span>
                    <span>- ₹{discount}</span>
                  </div>
                )}

                <div className="flex justify-between text-brown-light dark:text-slate-300">
                  <span>Shipping charges</span>
                  <span className="font-medium text-green-600 dark:text-green-400 font-bold">
                    {isCalculatingShipping
                      ? `Calculating... (Attempt ${shippingRetryAttempt}/3)`
                      : serviceableError
                        ? "N/A"
                        : shipping === 0
                          ? "FREE"
                          : `+ ₹${shipping}`}
                  </span>
                </div>

                {!isCalculatingShipping && !serviceableError && courierPartner && (
                  <div className="flex justify-between text-xs text-brown-light/80 dark:text-slate-400">
                    <span>Courier Partner</span>
                    <span className="font-medium text-brown-dark dark:text-white">
                      {courierPartner}
                    </span>
                  </div>
                )}

                {!isCalculatingShipping && !serviceableError && deliveryEtd && (
                  <div className="flex justify-between text-xs text-brown-light/80 dark:text-slate-400">
                    <span>Estimated Delivery</span>
                    <span className="font-semibold text-saffron-dark dark:text-saffron">
                      {deliveryEtd}
                    </span>
                  </div>
                )}

                {serviceableError && (
                  <div className="text-red-500 dark:text-red-400 font-bold text-xs p-2.5 bg-red-50 dark:bg-red-950/30 rounded-xl mt-1 text-center">
                    ⚠️ {serviceableError}
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-lg text-brown-dark dark:text-white pt-2 border-t border-orange-100 dark:border-slate-600">
                  <span>Grand Total</span>
                  <span className="text-saffron-dark">
                    ₹{finalAmount}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={isCalculatingShipping}
              className={`w-full py-3.5 rounded-2xl font-bold shadow-lg transition-colors ${
                isCalculatingShipping
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-saffron text-white shadow-saffron/20 hover:bg-saffron-dark"
              }`}
            >
              Proceed to Payment
            </button>
          </motion.div>
        )}

        {/* STEP 4: PAYMENT */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {paymentError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-2xl flex flex-col gap-3 text-sm border border-red-100 dark:border-red-800">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <p>{paymentError}</p>
                </div>
                {failedOrderDetails && (
                  <button
                    onClick={retryOrderCreation}
                    disabled={loading}
                    className="self-end bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100 px-4 py-2 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-700 transition"
                  >
                    {loading ? "Retrying..." : "Retry Saving Order"}
                  </button>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-brown-dark dark:text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-saffron" /> Payment Method
                </h3>
              </div>

              <div className="space-y-3">
                {/* Razorpay Option */}
                <div 
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "razorpay" 
                      ? "border-saffron bg-saffron/5 shadow-sm" 
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-200"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Wallet className="text-saffron" size={20} />
                      <span className={`font-bold ${paymentMethod === "razorpay" ? "text-saffron-dark dark:text-saffron" : "text-brown-dark dark:text-white"}`}>
                        Online Payment (Razorpay)
                      </span>
                    </div>
                    <p className="text-xs text-brown-light dark:text-slate-400 pl-8">
                      Pay securely via UPI, Credit/Debit Card, Net Banking or Wallets.
                    </p>
                  </div>
                  <div className="shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "razorpay" ? "border-saffron bg-saffron animate-pulse" : "border-gray-300 dark:border-slate-600"
                    }`}>
                      {paymentMethod === "razorpay" && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery Option */}
                <div 
                  onClick={() => {
                    if (codAvailable) {
                      setPaymentMethod("cod");
                    }
                  }}
                  className={`flex items-start p-4 rounded-2xl border-2 transition-all ${
                    !codAvailable 
                      ? "opacity-50 cursor-not-allowed border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50"
                      : paymentMethod === "cod" 
                        ? "border-saffron bg-saffron/5 shadow-sm cursor-pointer" 
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-200 cursor-pointer"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Truck className="text-saffron" size={20} />
                      <span className={`font-bold ${paymentMethod === "cod" ? "text-saffron-dark dark:text-saffron" : "text-brown-dark dark:text-white"}`}>
                        Cash on Delivery (COD)
                      </span>
                      {codCharge > 0 && codAvailable && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">
                          +₹{codCharge} COD Charge
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brown-light dark:text-slate-400 pl-8">
                      {!codAvailable 
                        ? "कैश ऑन डिलीवरी आपके पिनकोड पर उपलब्ध नहीं है।" 
                        : "Pay cash at the time of delivery using Shiprocket's COD service."}
                    </p>
                  </div>
                  <div className="shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "cod" && codAvailable ? "border-saffron bg-saffron animate-pulse" : "border-gray-300 dark:border-slate-600"
                    }`}>
                      {paymentMethod === "cod" && codAvailable && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {deliveryEtd && (
                <div className="mt-4 p-3.5 bg-orange-50/50 dark:bg-orange-950/10 rounded-2xl flex items-center gap-3 border border-orange-100/30">
                  <Truck size={18} className="text-saffron animate-bounce" />
                  <div className="text-xs">
                    <span className="text-brown-light dark:text-slate-400">अनुमानित डिलीवरी तिथि: </span>
                    <span className="font-bold text-brown-dark dark:text-white text-saffron-dark dark:text-saffron">{deliveryEtd}</span>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-orange-50 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-brown-light dark:text-slate-400 font-medium">
                    Amount to Pay
                  </span>
                  <span className="text-xl font-bold text-brown-dark dark:text-white">
                    ₹{finalAmount}
                  </span>
                </div>

                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="w-full bg-saffron text-white py-4 rounded-2xl font-bold shadow-lg shadow-saffron/20 flex items-center justify-center gap-2 hover:bg-saffron-dark transition-colors disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{" "}
                      Processing your order...
                    </>
                  ) : (
                    `Pay ₹${finalAmount} Securely`
                  )}
                </button>
              </div>
            </div>

            <div className="text-center flex items-center justify-center gap-2 text-xs text-brown-light dark:text-slate-500 pb-8">
              <svg
                className="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
              100% Secure Payments by Razorpay
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
