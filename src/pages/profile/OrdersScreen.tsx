import { SecureImage } from "../../components/common/SecureImage";
import React, { useMemo, useState } from "react";
import { SEO } from "../../components/SEO";
import {
  ArrowLeft,
  Package,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  HeadphonesIcon,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { useAuthStore } from "../../store/useAuthStore";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { where } from "firebase/firestore";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { generateInvoicePDF } from "../../utils/invoiceGenerator";
import { useGoBack } from "../../hooks/useGoBack";

export const OrdersScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuthStore();
  const { settings } = useAppSettings();
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(
    null,
  );

  const queryConstraints = useMemo(() => {
    if (user?.uid) {
      return [where("userId", "==", user.uid)];
    }
    return [];
  }, [user?.uid]);

  const { data: dbOrders, loading } = useRealtimeCollection<any>(
    "orders",
    queryConstraints,
  );

  const userOrders = [...dbOrders].sort((a: any, b: any) => {
    if (a.createdAt && b.createdAt) {
      return b.createdAt.seconds - a.createdAt.seconds;
    }
    return 0;
  });

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return {
          icon: CheckCircle2,
          color: "text-green-500",
          bg: "bg-green-50 dark:bg-green-900/20",
          text: "Delivered",
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-red-500",
          bg: "bg-red-50 dark:bg-red-900/20",
          text: "Cancelled",
        };
      case "shipped":
        return {
          icon: Truck,
          color: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          text: "Shipped",
        };
      case "out for delivery":
        return {
          icon: Truck,
          color: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          text: "Out for Delivery",
        };
      case "packed":
        return {
          icon: Package,
          color: "text-purple-500",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          text: "Packed",
        };
      case "processing":
        return {
          icon: Clock,
          color: "text-amber-500",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          text: "Processing",
        };
      case "paid":
        return {
          icon: CheckCircle2,
          color: "text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
          text: "Paid",
        };
      default:
        return {
          icon: Clock,
          color: "text-orange-500",
          bg: "bg-orange-50 dark:bg-orange-900/20",
          text: "Confirmed",
        };
    }
  };

  const handleDownloadInvoice = async (e: React.MouseEvent, order: any) => {
    e.stopPropagation();
    if (order.deliveryStatus?.toLowerCase() !== "delivered") {
      alert("Invoice is only available after the order has been delivered.");
      return;
    }

    setGeneratingInvoice(order.id);
    try {
      await generateInvoicePDF(order, settings);
    } catch (error) {
      console.error("Failed to generate invoice", error);
      alert("Failed to generate invoice. Please try again.");
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const handleContactSupport = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    navigate("/info/contact");
  };

  const handleTrackShipment = (
    e: React.MouseEvent,
    orderId: string,
    trackingUrl?: string,
  ) => {
    e.stopPropagation();
    navigate(`/store/track-order/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-20">
      <SEO
        title="Order History | Hari Pathshala"
        description="Order History page for Hari Pathshala."
      />

      <header className="pt-12 pb-4 px-6 sticky top-0 z-20 flex justify-between items-center bg-orange-50/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">
            Order History
          </h1>
        </div>
      </header>

      <div className="px-6 mt-4">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : userOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No Orders Yet"
            message="You haven't placed any orders yet. Explore the Spiritual Store to begin."
            buttonText="Explore Store"
            buttonPath="/store"
          />
        ) : (
          <div className="space-y-4">
            {userOrders.map((order: any) => {
              const statusInfo = getStatusInfo(
                order.deliveryStatus || order.status || "Confirmed",
              );
              const StatusIcon = statusInfo.icon;

              let orderDate = "Recently";
              if (order.createdAt?.seconds) {
                orderDate = new Date(
                  order.createdAt.seconds * 1000,
                ).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              } else if (order.createdAt) {
                try {
                  orderDate = new Date(order.createdAt).toLocaleDateString();
                } catch (e) {}
              }

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4 border-b border-orange-100 dark:border-slate-700 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-brown-light dark:text-slate-400 font-mono tracking-wider">
                        ORDER NO
                      </p>
                      <p className="text-sm font-bold text-brown-dark dark:text-slate-200 uppercase">
                        {order.id?.slice(0, 10) || "UNKNOWN"}
                      </p>
                      <p className="text-[10px] text-brown-light dark:text-slate-500 mt-0.5">
                        {orderDate}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusInfo.bg}`}
                    >
                      <StatusIcon size={14} className={statusInfo.color} />
                      <span
                        className={`text-[10px] font-bold ${statusInfo.color}`}
                      >
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    {order.items &&
                      order.items.map((item: any, index: number) => (
                        <div key={index} className="flex gap-3 mb-4 last:mb-0">
                          <div className="w-16 h-16 rounded-xl bg-orange-50 dark:bg-slate-700 overflow-hidden shrink-0">
                            <SecureImage
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover shrink-0"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-brown-dark dark:text-white line-clamp-2 leading-tight">
                              {item.title}
                            </h4>
                            <div className="flex justify-between items-end mt-1">
                              <p className="text-xs text-brown-light dark:text-slate-400 font-medium">
                                Qty: {item.quantity}
                              </p>
                              <p className="text-sm font-bold text-saffron-dark">
                                ₹{item.price}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="px-4 pb-4 border-b border-orange-100 dark:border-slate-700">
                    <div className="bg-orange-50 dark:bg-slate-700/30 rounded-2xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-brown-light dark:text-slate-400 uppercase tracking-wider mb-0.5">
                          Payment
                        </p>
                        <p className="text-xs font-bold text-green-600">
                          SUCCESS ({order.paymentMethod || "razorpay"})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-brown-light dark:text-slate-400 uppercase tracking-wider mb-0.5">
                          Total Amount
                        </p>
                        <p className="text-sm font-bold text-brown-dark dark:text-white">
                          ₹{order.totalAmount || order.total || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={(e) => handleContactSupport(e, order.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 dark:bg-slate-700 rounded-xl text-[11px] font-bold text-brown-dark dark:text-slate-200 hover:bg-orange-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <HeadphonesIcon size={12} /> Support
                    </button>
                    <button
                      onClick={(e) => handleDownloadInvoice(e, order)}
                      disabled={generatingInvoice === order.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-saffron text-white rounded-xl text-[11px] font-bold hover:bg-saffron-dark transition-colors disabled:opacity-70"
                    >
                      {generatingInvoice === order.id ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Download size={12} />
                      )}
                      Invoice
                    </button>
                    {order.deliveryStatus !== "Delivered" &&
                      order.deliveryStatus !== "Cancelled" && (
                        <button
                          onClick={(e) =>
                            handleTrackShipment(e, order.id, order.trackingUrl)
                          }
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <Truck size={12} /> Track
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
