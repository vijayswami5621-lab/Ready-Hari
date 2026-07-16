import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Star,
  Share2,
  Check,
  Truck,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import { motion } from "motion/react";
import { useStoreState } from "../../store/useStoreState";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { SecureImage } from "../../components/common/SecureImage";
import { useGoBack } from "../../hooks/useGoBack";
import { NotFoundScreen } from "../misc/NotFoundScreen";
import { useShareContent } from "../../hooks/useShareContent";


export const ProductDetailsScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { shareContent } = useShareContent();
  const addToCart = useStoreState((state) => state.addToCart);
  const toggleWishlist = useStoreState((state) => state.toggleWishlist);
  const wishlist = useStoreState((state) => state.wishlist);
  const cart = useStoreState((state) => state.cart);

  const { data: products, loading } = useRealtimeCollection<any>("products");

  const dbProduct = products.find((p) => p.id === id);
  const product = dbProduct;

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!product) {
    return <NotFoundScreen />;
  }

  const images = product?.images?.length > 0 ? product.images : (product?.image ? [product.image] : []);
  const displayTitle = product?.name || product?.title || 'Product Details';
  const sellingPrice = product?.discountPrice && product?.discountPrice < (product?.price || 0) ? product.discountPrice : (product?.price || 0);
  const originalPrice = product?.price || 0;
  const hasDiscount = product?.discountPrice && product?.discountPrice < (product?.price || 0);
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : 0;
  const isOutOfStock = (product?.stock !== undefined && product.stock <= 0) || product?.inStock === false;

  const handleShare = async () => {
    await shareContent({
      title: displayTitle,
      urlPath: `/product/${product?.id}`
    });
  };

  const handleAddToCart = () => {
    addToCart({
      productId: product?.id,
      title: displayTitle,
      price: sellingPrice,
      quantity: 1,
      image: images[0],
    });
  };

  if (loading && !dbProduct) {
    return (
      <div className="flex flex-col h-screen bg-orange-50 dark:bg-slate-900 justify-center items-center">
        <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-orange-50 dark:bg-slate-900 overflow-hidden">
      {/* HEADER */}
      <header className="px-4 py-4 bg-transparent absolute top-0 w-full z-30 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => goBack()}
          className="pointer-events-auto w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center text-brown-dark dark:text-white shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={() => toggleWishlist(product?.id)}
            className="w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center text-brown-dark dark:text-white shadow-sm"
          >
            <Heart
              size={20}
              className={
                wishlist.includes(product?.id) ? "fill-red-500 text-red-500" : ""
              }
            />
          </button>
          <button
            onClick={() => navigate("/store/cart")}
            className="w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center text-brown-dark dark:text-white shadow-sm relative"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-saffron text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* IMAGE GALLERY */}
        <div className="w-full aspect-square bg-white dark:bg-slate-800 relative">
          <SecureImage
            src={images[0]}
            alt={displayTitle}
            cacheBuster={
              product?.updatedAt?.toMillis
                ? product?.updatedAt.toMillis()
                : Date.now()
            }
            containerClassName="w-full h-full"
          />
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === 0 ? "bg-saffron" : "bg-white/50"}`}
                ></div>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-t-3xl -mt-6 relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white leading-snug flex-1 pr-4">
              {displayTitle}
            </h1>
            <button onClick={handleShare} className="text-brown-light hover:text-saffron transition">
              <Share2 size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-[10px] font-bold">
              <span>{product?.rating || 4.9}</span>
              <Star size={10} className="fill-current" />
            </div>
          </div>

          <div className="flex items-end gap-3 mb-6 border-b border-orange-100 dark:border-slate-800 pb-6">
            <span className="text-3xl font-bold text-brown-dark dark:text-white">
              ₹{sellingPrice}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-brown-light/60 line-through mb-1">
                  ₹{originalPrice}
                </span>
                {discountPercentage > 0 && (
                  <span className="text-sm font-bold text-red-500 mb-1">
                    {discountPercentage}% OFF
                  </span>
                )}
              </>
            )}
            <span className="text-xs text-brown-light/60 mb-2 ml-auto">
              Inclusive of all taxes
            </span>
          </div>

          <h3 className="font-bold text-sm text-brown-dark dark:text-white mb-2">
            Description
          </h3>
          <p className="text-sm text-brown-light dark:text-slate-400 font-mukta leading-relaxed mb-6 whitespace-pre-line">
            {product?.description || product?.desc}
          </p>

          {product?.spiritualBenefits && (
            <div className="mb-6 bg-orange-50 dark:bg-slate-800 p-4 rounded-xl border border-orange-100 dark:border-slate-700">
              <h3 className="font-bold text-sm text-saffron-dark dark:text-saffron mb-2 flex items-center gap-2">
                <Star size={16} /> Spiritual Benefits
              </h3>
              <p className="text-sm text-brown-dark dark:text-slate-300 font-mukta leading-relaxed">
                {product?.spiritualBenefits}
              </p>
            </div>
          )}

          {/* FEATURES GRID */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-orange-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-saffron-dark">
                <Check size={18} />
              </div>
              <span className="text-xs font-semibold text-brown-dark dark:text-white">
                {!isOutOfStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-orange-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-saffron-dark">
                <Truck size={18} />
              </div>
              <span className="text-xs font-semibold text-brown-dark dark:text-white">
                Delivery Available
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-orange-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-saffron-dark">
                <ShieldCheck size={18} />
              </div>
              <span className="text-xs font-semibold text-brown-dark dark:text-white">
                100% Original
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-orange-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-saffron-dark">
                <Undo2 size={18} />
              </div>
              <span className="text-xs font-semibold text-brown-dark dark:text-white">
                7 Days Return
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 w-full px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-orange-100 dark:border-slate-800 flex gap-4 z-40">
        <button
          onClick={() => {
            if (isOutOfStock) {
              alert("Product is out of stock");
              return;
            }
            handleAddToCart();
          }}
          disabled={isOutOfStock}
          className={`flex-1 py-3.5 font-bold rounded-xl shadow-sm active:scale-95 transition-transform ${isOutOfStock ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-orange-50 dark:bg-slate-800 text-saffron-dark"}`}
        >
          Add to Cart
        </button>
        <button
          onClick={() => {
            if (isOutOfStock) {
              alert("Product is out of stock");
              return;
            }
            handleAddToCart();
            navigate("/store/checkout");
          }}
          disabled={isOutOfStock}
          className={`flex-1 py-3.5 font-bold rounded-xl shadow-lg active:scale-95 transition-transform ${isOutOfStock ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-saffron to-saffron-dark text-white"}`}
        >
          {isOutOfStock ? "Out of Stock" : "Buy Now"}
        </button>
      </div>
    </div>
  );
};
