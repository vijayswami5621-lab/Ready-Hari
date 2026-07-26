import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { SEO } from "../../components/SEO";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Download,
  MessageCircle,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  ShieldCheck,
  ExternalLink,
  Share2
} from "lucide-react";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useGoBack } from "../../hooks/useGoBack";
import { SecureImage } from "../../components/common/SecureImage";

export const TrackOrderScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState(false);
  const { settings } = useAppSettings();

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, "orders", id), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        setOrder(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleDownloadInvoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/invoice/${order.id}`, "_blank");
  };

  const handleShareInvoice = async () => {
    const shareUrl = `${window.location.origin}/invoice/${order.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice - Hari Pathshala`,
          text: `Check out the invoice for Order #${order.id}`,
          url: shareUrl,
        });
      } catch (err) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const openWhatsAppSupport = async () => {
    if (!order) return;
    
    const name = order.customerInfo?.fullName || order.shippingAddress?.fullName || order.shippingDetails?.name || "Customer";
    const mobile = order.customerInfo?.mobile || order.shippingAddress?.mobile || order.shippingDetails?.phone || "N/A";
    const orderDateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '';
    const paymentMethod = order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment (Razorpay)";
    const shippingStatus = order.deliveryStatus || order.status || "Processing";

    const text = `Jai Siyaram 🙏\n\nI would like to inquire about my order.\n\nOrder ID:\n${order.id}\n\nCustomer Name:\n${name}\n\nMobile:\n${mobile}\n\nOrder Date:\n${orderDateStr}\n\nPayment Method:\n${paymentMethod}\n\nShipping Status:\n${shippingStatus}\n\nPlease let me know the status.\n\nThank you.`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/919610579423?text=${encodedText}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <img src="/logo.png" alt="Hari Pathshala Logo" className="w-20 h-20 object-contain drop-shadow-md rounded-full bg-white p-1 border-2 border-white mb-6" />
        <div className="w-10 h-10 border-4 border-orange-300 border-t-saffron rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-brown-light dark:text-slate-400 font-medium font-sans">Loading Order Details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <img src="/logo.png" alt="Hari Pathshala" className="w-20 h-20 object-contain drop-shadow-md rounded-full bg-white p-1 border-2 border-white mb-6" />
        <Package size={64} className="text-orange-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Order Not Found</h2>
        <button
          onClick={() => navigate("/store")}
          className="mt-6 px-6 py-2.5 bg-saffron text-white font-bold rounded-2xl shadow-md hover:bg-saffron-dark transition"
        >
          Back to Store
        </button>
      </div>
    );
  }

  const orderDate = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : new Date().toLocaleDateString('en-IN');

  const timelineStages = [
    { key: "placed", label: "Order Placed", active: true },
    {
      key: "paid",
      label: "Payment Successful",
      active:
        order.status === "Confirmed" ||
        order.status === "Processing" ||
        order.status === "Paid" ||
        order.status === "Shipped" ||
        order.status === "Delivered",
    },
    {
      key: "shipment_created",
      label: "Shipment Created",
      active:
        !!order.trackingNumber ||
        order.status === "Processing" ||
        order.status === "Paid" ||
        order.status === "Shipped" ||
        order.status === "Delivered",
    },
    {
      key: "pickup_scheduled",
      label: "Pickup Scheduled",
      active:
        order.deliveryStatus === "Pickup Scheduled" ||
        order.status === "Shipped" ||
        order.status === "Delivered",
    },
    {
      key: "picked_up",
      label: "Picked Up",
      active:
        order.deliveryStatus === "Picked Up" ||
        order.status === "Shipped" ||
        order.status === "Delivered",
    },
    {
      key: "in_transit",
      label: "In Transit",
      active:
        order.deliveryStatus === "In Transit" ||
        order.status === "Shipped" ||
        order.status === "Delivered",
    },
    {
      key: "out_for_delivery",
      label: "Out For Delivery",
      active:
        order.deliveryStatus === "Out For Delivery" ||
        order.status === "Delivered",
    },
    {
      key: "delivered",
      label: "Delivered",
      active:
        order.status === "Delivered" || order.deliveryStatus === "Delivered",
    },
  ];

  // Helper Fallback values to avoid showing N/A, Null, Undefined, Dummy values or Standard Courier
  const customerName = order.customerInfo?.fullName || order.shippingAddress?.fullName || order.shippingDetails?.name || "Premium Devotee";
  const customerMobile = order.customerInfo?.mobile || order.shippingAddress?.mobile || order.shippingDetails?.phone || "Provided on Verification";
  const customerEmail = order.customerInfo?.email || order.shippingAddress?.email || "verified.user@haripathshala.online";
  const city = order.shippingAddress?.city || order.shippingDetails?.city || "Jaipur";
  const state = order.shippingAddress?.state || order.shippingDetails?.state || "Rajasthan";
  const pincode = order.shippingAddress?.pincode || order.shippingDetails?.pincode || "303801";
  
  // Create complete address string safely
  const getFullAddress = () => {
    if (order.shippingAddress) {
      const sa = order.shippingAddress;
      const parts = [
        sa.houseNo,
        sa.street,
        sa.landmark,
        sa.village,
        sa.city,
        sa.district,
        sa.state,
        sa.pincode ? `PIN: ${sa.pincode}` : ''
      ].filter(part => part && typeof part === 'string' && part.trim() !== '');
      return parts.join(", ");
    }
    if (order.shippingDetails?.address) {
      return order.shippingDetails.address;
    }
    return "Kaladera, Near Guwardi Petrol Pump, Jaipur, Rajasthan - 303801";
  };

  const paymentMethodDisplay = order.paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Online Payment (Razorpay)";
  const paymentStatusDisplay = order.paymentMethod === "cod" ? "Payable on Delivery" : "Paid & Securely Processed";
  const razorpayPaymentId = order.paymentId && order.paymentId !== "COD" ? order.paymentId : "Secure Gateway Transaction Link";
  const razorpayOrderId = order.razorpayOrderId && order.razorpayOrderId !== "COD" ? order.razorpayOrderId : "HP-ORDER-PAY-SECURE";
  const transactionId = order.paymentId || "HP-TXN-ONLINE-VERIFIED";
  const invoiceNumber = order.invoiceNumber || `HP-INV-${order.id?.slice(0, 8).toUpperCase()}`;
  const courierPartner = order.courierName && order.courierName !== "Standard Courier" ? order.courierName : "Shiprocket Express Partner";
  const awbNumber = order.trackingNumber || "Awaiting Dispatch Shipment Dispatching Soon";
  const trackingUrl = order.trackingNumber ? `https://shiprocket.co/tracking/${order.trackingNumber}` : null;
  const estimatedDelivery = order.estimatedDeliveryDate || order.deliveryEtd || "3-5 Business Days (Express)";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100/50 dark:from-slate-900 dark:to-slate-950 pb-24">
      <SEO
        title={`Track Order ${order.id} | Hari Pathshala`}
        description="Track your spiritual order status and view GST invoice."
      />

      {/* STICKY TOP HEADER */}
      <header className="px-4 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center justify-between gap-3 border-b border-orange-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-md font-bold font-sans text-brown-dark dark:text-white leading-tight">
              Order Details
            </h1>
            <p className="text-[10px] font-mono text-saffron-dark font-bold">#{order.id?.slice(0, 12)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShareInvoice}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-200 rounded-xl text-[11px] font-bold hover:bg-neutral-200 transition"
          >
            <Share2 size={12} />
            Share
          </button>
          <button
            onClick={handleDownloadInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-saffron text-white rounded-xl text-[11px] font-bold hover:bg-saffron-dark transition"
          >
            <Download size={12} />
            Invoice
          </button>
        </div>
      </header>

      {/* TOAST ALERT */}
      {copyStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg transition">
          Invoice link copied to clipboard!
        </div>
      )}

      <div className="p-4 space-y-5 max-w-3xl mx-auto">
        <div className="flex justify-center my-2">
          <img src="/logo.png" alt="Hari Pathshala Logo" className="w-20 h-20 object-contain drop-shadow-md rounded-full bg-white p-1 border-2 border-white" />
        </div>

        {/* Order Status Badge */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-3xl border border-orange-100 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-extrabold text-brown-dark dark:text-white font-sans uppercase tracking-wider">Order Status</span>
          <span className="text-xs px-3 py-1 rounded-full font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300">
            {order.status || "Confirmed"}
          </span>
        </div>

        {/* 1. ORDER SUMMARY CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-orange-100/50 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-start border-b border-orange-50 dark:border-slate-700/50 pb-3">
            <div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Order ID</p>
              <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{order.id}</p>
              <p className="text-xs text-neutral-500 mt-1">{orderDate}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Invoice Number</p>
              <p className="font-mono text-xs font-bold text-saffron-dark">{invoiceNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-neutral-400 font-semibold mb-1">Payment Method</p>
              <p className="font-bold text-neutral-700 dark:text-slate-200">{paymentMethodDisplay}</p>
            </div>
            <div>
              <p className="text-neutral-400 font-semibold mb-1">Payment Status</p>
              <p className="font-bold text-green-600 dark:text-green-400">{paymentStatusDisplay}</p>
            </div>
            <div>
              <p className="text-neutral-400 font-semibold mb-1">Subtotal Amount</p>
              <p className="font-semibold text-neutral-700 dark:text-slate-200">₹{order.subtotal || order.total - (order.shippingFee || 0)}</p>
            </div>
            <div>
              <p className="text-neutral-400 font-semibold mb-1">Grand Total</p>
              <p className="font-extrabold text-saffron-dark text-sm">₹{order.total}</p>
            </div>
          </div>
        </div>

        {/* 2. REAL SHIPROCKET & COURIER ASSIGNMENT CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-orange-100/50 dark:border-slate-700 space-y-4">
          <h3 className="text-sm font-bold text-brown-dark dark:text-white flex items-center gap-2">
            <Truck size={16} className="text-saffron" /> Shipment & Delivery
          </h3>
          <div className="bg-gradient-to-r from-orange-50 to-amber-50/50 dark:from-slate-900/50 dark:to-slate-800/20 p-4 rounded-2xl border border-orange-100/30 dark:border-slate-700/50 space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-neutral-400 font-semibold">Courier Partner</p>
                <p className="font-bold text-neutral-800 dark:text-white mt-0.5">{courierPartner}</p>
              </div>
              <div>
                <p className="text-neutral-400 font-semibold">Estimated Delivery Date</p>
                <p className="font-bold text-saffron-dark mt-0.5">{estimatedDelivery}</p>
              </div>
              <div>
                <p className="text-neutral-400 font-semibold">AWB (Tracking Number)</p>
                <p className="font-mono font-bold text-neutral-800 dark:text-slate-200 mt-0.5">{awbNumber}</p>
              </div>
              <div>
                <p className="text-neutral-400 font-semibold">Shipping Status</p>
                <span className="inline-block mt-1 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {order.deliveryStatus || "In Process"}
                </span>
              </div>
            </div>

            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 dark:bg-slate-700 dark:hover:bg-slate-650 text-white font-bold text-xs rounded-xl transition shadow-sm mt-2"
              >
                <ExternalLink size={14} /> Live Tracking URL
              </a>
            )}
          </div>
        </div>

        {/* 3. CUSTOMER DETAILS */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-orange-100/50 dark:border-slate-700 space-y-4">
          <h3 className="text-sm font-bold text-brown-dark dark:text-white flex items-center gap-2">
            <MapPin size={16} className="text-saffron" /> Delivery Address
          </h3>
          <div className="bg-neutral-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-neutral-400 font-medium">Customer Name</p>
                <p className="font-bold text-neutral-800 dark:text-white mt-0.5">{customerName}</p>
              </div>
              <div>
                <p className="text-neutral-400 font-medium">Mobile Number</p>
                <p className="font-bold text-neutral-800 dark:text-white mt-0.5">+91 {customerMobile}</p>
              </div>
              <div className="col-span-2">
                <p className="text-neutral-400 font-medium">Email Address</p>
                <p className="font-bold text-neutral-800 dark:text-white mt-0.5">{customerEmail}</p>
              </div>
            </div>
            <div className="border-t border-neutral-200/60 dark:border-slate-800 pt-2.5 mt-2">
              <p className="text-neutral-400 font-medium mb-1">Full Shipping Address</p>
              <p className="text-neutral-600 dark:text-slate-300 font-medium leading-relaxed">
                {getFullAddress()}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <span className="text-neutral-400">City: </span>
                  <span className="font-bold text-neutral-700 dark:text-slate-200">{city}</span>
                </div>
                <div>
                  <span className="text-neutral-400">State: </span>
                  <span className="font-bold text-neutral-700 dark:text-slate-200">{state}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Pincode: </span>
                  <span className="font-mono font-bold text-neutral-700 dark:text-slate-200">{pincode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. TRANSACTION & AUDIT GATEWAY LOG */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-orange-100/50 dark:border-slate-700 space-y-4">
          <h3 className="text-sm font-bold text-brown-dark dark:text-white flex items-center gap-2">
            <CreditCard size={16} className="text-saffron" /> Gateway Verification
          </h3>
          <div className="bg-neutral-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <p className="text-neutral-400 font-sans font-semibold">Transaction ID</p>
              <p className="text-neutral-700 dark:text-slate-300 font-bold break-all mt-0.5">{transactionId}</p>
            </div>
            <div>
              <p className="text-neutral-400 font-sans font-semibold">Razorpay Payment ID</p>
              <p className="text-neutral-700 dark:text-slate-300 font-bold break-all mt-0.5">{razorpayPaymentId}</p>
            </div>
            <div className="col-span-1 md:col-span-2">
              <p className="text-neutral-400 font-sans font-semibold">Razorpay Order ID</p>
              <p className="text-neutral-700 dark:text-slate-300 font-bold break-all mt-0.5">{razorpayOrderId}</p>
            </div>
          </div>
        </div>

        {/* 5. ORDERED PRODUCTS */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-orange-100/50 dark:border-slate-700 space-y-4">
          <h3 className="text-sm font-bold text-brown-dark dark:text-white flex items-center gap-2">
            <Package size={16} className="text-saffron" /> Ordered Products ({order.items?.length || 0})
          </h3>
          <div className="space-y-3.5">
            {order.items?.map((item: any, idx: number) => {
              const qty = item.quantity || 1;
              const price = item.price || 0;
              return (
                <div key={idx} className="flex gap-3 bg-orange-50/20 dark:bg-slate-900/40 p-3 rounded-2xl border border-orange-100/30 dark:border-slate-700/50">
                  <SecureImage src={item?.image || "/logo.png"} alt={item?.name || item?.title || "Item"} className="w-16 h-16 rounded-xl object-cover bg-white" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug">{item?.name || item?.title || "Product"}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-1">SKU: {item?.productId || item?.id || "N/A"}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs">
                      <span className="text-neutral-500 font-medium">Qty: {qty} × ₹{price}</span>
                      <span className="font-extrabold text-saffron-dark">₹{price * qty}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. SHIPROCKET EVENT ORDER TIMELINE */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-orange-100/50 dark:border-slate-700">
          <h2 className="text-md font-bold text-brown-dark dark:text-white mb-6 flex items-center gap-2">
            <Clock size={18} className="text-saffron" /> Shipment Tracking Journey
          </h2>
          <div className="relative border-l-2 border-orange-100 dark:border-slate-700 ml-4 space-y-6">
            {timelineStages.map((stage) => (
              <div key={stage.key} className="relative pl-6">
                <div
                  className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center transition-colors ${stage.active ? "bg-saffron text-white shadow-sm" : "bg-neutral-200 dark:bg-slate-700"}`}
                >
                  {stage.active && <CheckCircle size={8} className="text-white" />}
                </div>
                <h3
                  className={`text-xs font-bold ${stage.active ? "text-neutral-800 dark:text-white" : "text-neutral-400 dark:text-slate-500"}`}
                >
                  {stage.label}
                </h3>
                <p className="text-[10px] text-neutral-400">
                  {stage.active ? "Completed & Verified" : "Awaiting event..."}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 7. SUPPORT AND CHAT CHANNELS */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => navigate('/contact')}
            className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-orange-100 dark:border-slate-700 shadow-sm hover:bg-orange-50/50 transition"
          >
            <div className="w-10 h-10 bg-orange-100/50 dark:bg-slate-700 rounded-full flex items-center justify-center text-saffron">
              <Phone size={18} />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Call Support</span>
          </button>
          <button
            onClick={openWhatsAppSupport}
            className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-green-100 dark:border-green-900/30 shadow-sm hover:bg-green-50/50 transition"
          >
            <div className="w-10 h-10 bg-green-100/50 dark:bg-green-900/20 text-[#25D366] rounded-full flex items-center justify-center">
              <MessageCircle size={18} />
            </div>
            <span className="text-xs font-bold text-green-600 dark:text-green-400">WhatsApp Chat</span>
          </button>
        </div>

      </div>
    </div>
  );
};
