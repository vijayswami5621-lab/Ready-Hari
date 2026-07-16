import React, { useState } from "react";
import { motion } from "motion/react";
import { ShoppingCart, Heart, Search, Star, Package, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStoreState } from "../../store/useStoreState";
import { SEO } from "../../components/SEO";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { EmptyState } from "../../components/EmptyState";
import { SecureImage } from "../../components/common/SecureImage";

export const StoreScreen = () => {
  const navigate = useNavigate();
  const cart = useStoreState((state) => state.cart);
  const wishlist = useStoreState((state) => state.wishlist);
  const toggleWishlist = useStoreState((state) => state.toggleWishlist);
  const { data: dbProducts, loading } = useRealtimeCollection<any>("products");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract actual unique categories dynamically from Firestore products, ignoring any demo names
  const fetchedCategories = Array.from(
    new Set(
      dbProducts
        ?.map((p: any) => p.category || p.categoryName)
        .filter(Boolean)
    )
  );

  const cleanCategories = fetchedCategories.filter((cat: any) => {
    const lower = String(cat).toLowerCase();
    return (
      !lower.includes("demo") &&
      !lower.includes("sample") &&
      !lower.includes("default") &&
      !lower.includes("placeholder")
    );
  });

  const CATEGORIES = ["All", ...cleanCategories];

  // Filter products based on selected category, search query, and excluding any demo entries
  const products = dbProducts
    ?.filter((prod: any) => {
      // 1. Exclude products with demo keywords in title/name
      const name = String(prod?.name || prod?.title || "").toLowerCase();
      if (
        name.includes("demo") ||
        name.includes("sample") ||
        name.includes("test product") ||
        name.includes("placeholder")
      ) {
        return false;
      }

      // 2. Filter by category
      const prodCat = prod.category || prod.categoryName;
      if (selectedCategory !== "All" && prodCat !== selectedCategory) {
        return false;
      }

      // 3. Filter by search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchName = name.includes(query);
        const matchDesc = String(prod.description || "").toLowerCase().includes(query);
        const matchHindi = String(prod.hindiName || "").toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchHindi) return false;
      }

      return true;
    })
    // Ensure only valid items are shown
    .map((prod: any) => {
      const price = typeof prod.price === "number" ? prod.price : parseFloat(prod.price) || 0;
      const discountPrice =
        typeof prod.discountPrice === "number"
          ? prod.discountPrice
          : parseFloat(prod.discountPrice) || 0;
      const hasDiscount = discountPrice > 0 && discountPrice < price;

      return {
        ...prod,
        parsedPrice: price,
        parsedDiscountPrice: discountPrice,
        hasDiscount,
        displayPrice: hasDiscount ? discountPrice : price,
      };
    }) || [];

  return (
    <div className="flex flex-col min-h-full bg-orange-50 dark:bg-slate-900 transition-colors">
      <SEO
        title="Spiritual Store | Hari Pathshala"
        description="Shop for authentic Puja items, Shaligram, Rudraksha, Malas, and divine Books."
      />

      {/* HEADER */}
      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center justify-between border-b border-orange-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold font-sans text-brown-dark dark:text-white">
            Pooja Store
          </h1>
          <p className="text-xs text-brown-light dark:text-slate-400 font-mukta">
            Authentic Spiritual Essentials
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/profile/wishlist")}
            className="relative text-brown-dark dark:text-slate-200 p-1.5 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <Heart size={22} />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {wishlist.length}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/store/cart")}
            className="relative text-brown-dark dark:text-slate-200 p-1.5 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <ShoppingCart size={22} />
            {cart.length > 0 && (
              <span className="absolute top-1 right-1 bg-saffron text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-light/50"
            size={20}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spiritual items, books, malas..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-orange-100 dark:border-slate-700 shadow-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 rounded-2xl outline-none transition-all text-sm font-medium dark:text-white"
          />
        </div>
      </div>

      {/* STATIC PROMOTIONAL BANNER */}
      <div className="px-6 pb-6">
        <div className="w-full aspect-[21/9] bg-gradient-to-r from-saffron to-amber-600 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden shadow-md">
          <div className="absolute right-0 bottom-0 opacity-15 w-32 h-32 bg-white rounded-tl-full"></div>
          <span className="text-[10px] uppercase font-bold text-white bg-white/20 px-2 py-0.5 rounded-full w-fit mb-1.5">
            Hari Pathshala Sangha
          </span>
          <h2 className="text-white text-xl font-bold font-devanagari leading-tight drop-shadow-sm">
            शुद्ध एवं प्रामाणिक पूजा सामग्री
          </h2>
          <p className="text-white/95 text-xs mt-1">
            Empowering your daily sadhana with authentic Vedic goods.
          </p>
        </div>
      </div>

      {/* CATEGORIES CHIPS CONTAINER */}
      {CATEGORIES.length > 1 && (
        <div className="px-6 pb-6 overflow-x-auto hide-scrollbar flex gap-2.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm border ${
                selectedCategory === cat
                  ? "bg-brown-dark dark:bg-saffron text-white border-brown-dark dark:border-saffron"
                  : "bg-white dark:bg-slate-800 text-brown-light dark:text-slate-300 border-orange-50 dark:border-slate-700 hover:bg-orange-100/50 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* PRODUCTS GRID */}
      <div className="px-6 flex-1 pb-12">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold font-sans text-brown-dark dark:text-white">
            {selectedCategory === "All" ? "Divine Collection" : selectedCategory}
          </h2>
          <span className="text-xs text-brown-light dark:text-slate-400 font-medium">
            {products.length} Products
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs text-brown-light font-medium">Loading Products...</span>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No Products Available"
            message="No products found in this category. We are adding new items daily!"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((prod: any) => {
              const isOutOfStock = prod.stock <= 0 || prod.inStock === false;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={prod.id}
                  className={`bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col group cursor-pointer border border-orange-100/50 dark:border-slate-700 transition hover:shadow-md ${
                    isOutOfStock ? "opacity-75 grayscale-[20%]" : ""
                  }`}
                  onClick={() => !isOutOfStock && navigate(`/store/product/${prod.id}`)}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square bg-neutral-50 dark:bg-slate-900 overflow-hidden">
                    <SecureImage
                      src={prod.image || ""}
                      alt={prod?.name || prod?.title || "Product"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {isOutOfStock ? (
                      <div className="absolute top-2 left-2 bg-neutral-900/90 text-white text-[8px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                        OUT OF STOCK
                      </div>
                    ) : prod.hasDiscount ? (
                      <div className="absolute top-2 left-2 bg-saffron text-white text-[8px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                        SALE
                      </div>
                    ) : null}

                    {prod.isDigital && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                        E-BOOK / PDF
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(prod.id);
                      }}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full flex items-center justify-center text-brown-light hover:text-red-500 transition-colors shadow-sm"
                    >
                      <Heart
                        size={14}
                        className={
                          wishlist.includes(prod.id) ? "fill-red-500 text-red-500" : ""
                        }
                      />
                    </button>
                  </div>

                  {/* Body Details */}
                  <div className="p-3.5 flex flex-col flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <Star size={10} className="text-golden fill-golden" />
                      <span className="text-[10px] text-brown-light dark:text-slate-400 font-bold">
                        {prod.rating || "4.8"}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-brown-dark dark:text-white line-clamp-2 leading-snug flex-1">
                      {prod?.name || prod?.title || "Product"}
                    </h3>

                    {prod.hindiName && (
                      <p className="text-[10px] text-saffron-dark font-devanagari mt-1 font-bold">
                        {prod.hindiName}
                      </p>
                    )}

                    <p className="text-[9px] text-neutral-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                      {prod.category || "Devotional"}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-orange-50/50 dark:border-slate-700/50">
                      <span className="font-extrabold text-saffron-dark dark:text-saffron text-sm">
                        ₹{prod.displayPrice}
                      </span>
                      {prod.hasDiscount && (
                        <span className="text-[10px] text-brown-light/50 dark:text-slate-500 line-through">
                          ₹{prod.parsedPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
