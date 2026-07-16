import { SecureImage } from "../../components/common/SecureImage";
import React from "react";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { useStoreState } from "../../store/useStoreState";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { useGoBack } from "../../hooks/useGoBack";

export const WishlistScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { wishlist, toggleWishlist, addToCart } = useStoreState();
  const { data: dbProducts, loading } = useRealtimeCollection<any>("products");

  const wishlistProducts = dbProducts.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-20">
      <SEO
        title="Wishlist | Hari Pathshala"
        description="Wishlist page for Hari Pathshala."
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
            Wishlist
          </h1>
        </div>
      </header>

      <div className="px-6 mt-4">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : wishlistProducts.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Empty Wishlist"
            message="Your wishlist is empty. Explore the Spiritual Store and save products you love."
            buttonText="Explore Store"
            buttonPath="/store"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 flex flex-col h-full justify-between"
              >
                <div>
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-3">
                    <SecureImage
                      src={
                        product?.image || "/logo.png" ||
                        `https://picsum.photos/seed/${product.id}/400`
                      }
                      alt={product?.name || product?.title || "Product Details"}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full text-red-500 shadow-sm"
                    >
                      <Heart size={16} className="fill-red-500" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm text-brown-dark dark:text-white line-clamp-2">
                    {product?.name || product?.title || "Product Details"}
                  </h3>
                  <p className="text-saffron-dark font-bold mt-1">
                    ₹{product?.price || 0}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      addToCart({
                        productId: product.id,
                        title: product?.name || product?.title || "Product Details",
                        price: product?.price || 0,
                        quantity: 1,
                        image: product?.image || "/logo.png",
                      });
                      toggleWishlist(product.id);
                    }}
                    className="flex-1 py-2 bg-saffron text-white text-center text-xs font-bold rounded-lg hover:bg-saffron-dark transition-colors flex justify-center items-center gap-1"
                  >
                    <ShoppingBag size={14} /> Add
                  </button>
                  <Link
                    to={`/store/product/${product.id}`}
                    className="px-3 py-2 bg-orange-100 dark:bg-slate-700 text-brown-dark dark:text-white text-center text-xs font-bold rounded-lg hover:bg-orange-200 dark:hover:bg-slate-600 transition-colors flex justify-center items-center"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
