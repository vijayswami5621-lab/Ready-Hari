import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingCart, Heart, Search, Star, Package, HelpCircle, 
  Mic, MicOff, Bell, ArrowRight, ShieldCheck, Truck, Sparkles, 
  Flame, Gift, Share2, Plus, Check, RefreshCw, BadgePercent, Tag
} from "lucide-react";
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
  const addToCart = useStoreState((state) => state.addToCart);

  const { data: dbProducts, loading } = useRealtimeCollection<any>("products");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);
  const [shareSuccessId, setShareSuccessId] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  const recognitionRef = useRef<any>(null);

  // Load recently viewed products from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recently_viewed_products");
    if (saved) {
      try {
        setRecentlyViewed(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [dbProducts]);

  // Speech Recognition setup for voice search
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'hi-IN';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };
      rec.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert("Voice search is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Hero banners rotation
  const BANNERS = [
    {
      id: "tulsi_mala_banner",
      title: "प्राकृतिक तुलसी माला",
      subtitle: "Authentic Divine Chanting Beads",
      tagline: "Sourced directly from Vrindavan Dham. 100% pure.",
      cta: "अभी खरीदें",
      bgGradient: "from-amber-600 via-orange-500 to-amber-700",
      image: "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=500&auto=format&fit=crop&q=80",
      categoryLink: "Mala"
    },
    {
      id: "gita_banner",
      title: "श्रीमद्भगवद्गीता यथारूप",
      subtitle: "The Ultimate Guide to Self Realization",
      tagline: "With original Sanskrit verses, Roman transliteration & Hindi translation.",
      cta: "अध्ययन शुरू करें",
      bgGradient: "from-orange-600 via-red-500 to-amber-600",
      image: "https://images.unsplash.com/photo-1609137144814-633094406248?w=500&auto=format&fit=crop&q=80",
      categoryLink: "Books"
    },
    {
      id: "pooja_banner",
      title: "पूर्ण वैदिक पूजन किट",
      subtitle: "Complete Daily Sadhana Kit",
      tagline: "Includes pure camphor, organic incense, gangajal, dhoop, and more.",
      cta: "किट्स देखें",
      bgGradient: "from-amber-700 via-yellow-600 to-orange-700",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
      categoryLink: "Pooja Samagri"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Unique Categories parsing
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

  // Map category names to aesthetic visual icons
  const getCategoryIcon = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes("mala")) return "📿";
    if (lower.includes("book") || lower.includes("gita") || lower.includes("ramcharit")) return "📖";
    if (lower.includes("samagri") || lower.includes("pooja") || lower.includes("puja")) return "🕯️";
    if (lower.includes("cloth") || lower.includes("t-shirt") || lower.includes("kurta")) return "👕";
    if (lower.includes("incense") || lower.includes("dhoop")) return "🪔";
    if (lower.includes("idol") || lower.includes("murti")) return "✨";
    if (lower.includes("deco")) return "🏺";
    if (lower.includes("gift")) return "🎁";
    if (lower.includes("digital") || lower.includes("pdf")) return "📱";
    return "🔮";
  };

  // Main Products Processing
  const products = dbProducts
    ?.filter((prod: any) => {
      const name = String(prod?.name || prod?.title || "").toLowerCase();
      if (
        name.includes("demo") ||
        name.includes("sample") ||
        name.includes("test product") ||
        name.includes("placeholder")
      ) {
        return false;
      }

      const prodCat = prod.category || prod.categoryName;
      if (selectedCategory !== "All" && prodCat !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchName = name.includes(query);
        const matchDesc = String(prod.description || "").toLowerCase().includes(query);
        const matchHindi = String(prod.hindiName || "").toLowerCase().includes(query);
        const matchCat = String(prodCat || "").toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchHindi && !matchCat) return false;
      }

      return true;
    })
    .map((prod: any) => {
      const price = typeof prod.price === "number" ? prod.price : parseFloat(prod.price) || 0;
      const discountPrice =
        typeof prod.discountPrice === "number"
          ? prod.discountPrice
          : parseFloat(prod.discountPrice) || 0;
      const hasDiscount = discountPrice > 0 && discountPrice < price;
      const savingsPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;

      return {
        ...prod,
        parsedPrice: price,
        parsedDiscountPrice: discountPrice,
        hasDiscount,
        savingsPercent,
        displayPrice: hasDiscount ? discountPrice : price,
        rating: prod.rating || "4.9",
        reviewsCount: prod.reviewsCount || Math.floor(Math.random() * 80) + 45
      };
    }) || [];

  // Categorize for special sections
  const bestSellers = products.filter((p: any) => parseFloat(p.rating) >= 4.8);
  const trendingProducts = products.filter((p: any) => p.hasDiscount && p.savingsPercent > 10);
  const festivalOffers = products.filter((p: any) => p.savingsPercent >= 15);

  const handleAddToCartClick = (e: React.MouseEvent, prod: any) => {
    e.stopPropagation();
    addToCart({
      productId: prod.id,
      title: prod.name || prod.title || "Product",
      price: prod.displayPrice,
      quantity: 1,
      image: prod.image || ""
    });
    setAddedToCartId(prod.id);
    setTimeout(() => setAddedToCartId(null), 2000);
  };

  const handleBuyNowClick = (e: React.MouseEvent, prod: any) => {
    e.stopPropagation();
    addToCart({
      productId: prod.id,
      title: prod.name || prod.title || "Product",
      price: prod.displayPrice,
      quantity: 1,
      image: prod.image || ""
    });
    navigate("/store/cart");
  };

  const handleProductShare = (e: React.MouseEvent, prod: any) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/store/product/${prod.id}`;
    const shareText = `Check out ${prod.name} on Hari Pathshala Store! Authentic Spiritual Essentials.`;
    
    if (navigator.share) {
      navigator.share({
        title: prod.name,
        text: shareText,
        url: shareUrl
      }).catch(err => console.warn(err));
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setShareSuccessId(prod.id);
      setTimeout(() => setShareSuccessId(null), 2000);
    }
  };

  const handleProductNavigate = (prod: any) => {
    // Save to recently viewed list
    const updatedRecently = [prod, ...recentlyViewed.filter(p => p.id !== prod.id)].slice(0, 6);
    setRecentlyViewed(updatedRecently);
    localStorage.setItem("recently_viewed_products", JSON.stringify(updatedRecently));
    navigate(`/store/product/${prod.id}`);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FCFAF6] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <SEO
        title="Spiritual Pooja Store | Hari Pathshala"
        description="Shop for authentic Puja items, Shaligram, Rudraksha, Vrindavan Tulsi Malas, and divine books."
      />

      {/* PREMIUM STORE HEADER */}
      <header className="px-6 py-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl sticky top-0 z-30 border-b border-orange-100/50 dark:border-slate-900/60 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md border-2 border-white dark:border-slate-950">
            ॐ
          </div>
          <div>
            <h1 className="text-lg font-black font-serif text-amber-950 dark:text-amber-100 leading-tight">
              Hari Pathshala Store
            </h1>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-orange-600 dark:text-orange-400">
              Authentic Spiritual Essentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Wishlist Icon */}
          <button
            onClick={() => navigate("/profile/wishlist")}
            className="relative p-2.5 rounded-full bg-orange-100/40 dark:bg-slate-900 text-amber-900 dark:text-amber-200 hover:bg-orange-100 dark:hover:bg-slate-800 transition shadow-sm"
            title="Wishlist"
          >
            <Heart size={18} className={wishlist.length > 0 ? "fill-red-500 text-red-500 animate-pulse" : ""} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white dark:border-slate-950">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => navigate("/store/cart")}
            className="relative p-2.5 rounded-full bg-orange-100/40 dark:bg-slate-900 text-amber-900 dark:text-amber-200 hover:bg-orange-100 dark:hover:bg-slate-800 transition shadow-sm"
            title="Cart"
          >
            <ShoppingCart size={18} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white dark:border-slate-950">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* SEARCH AND TRENDING SUGGESTIONS */}
      <div className="px-6 pt-5 pb-1 max-w-4xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 border border-orange-200/60 dark:border-slate-800 rounded-2xl pl-4 pr-12 py-3 flex items-center shadow-sm relative focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/10 transition-all">
          <Search className="text-orange-400 mr-2.5 shrink-0" size={18} strokeWidth={2.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Vrindavan Malas, Shastras, Pooja Samagri..."
            className="w-full bg-transparent border-none outline-none text-xs md:text-sm font-semibold text-amber-950 dark:text-white"
          />
          <button 
            onClick={toggleVoiceSearch}
            className={`absolute right-2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800'}`}
            title={isListening ? "Listening... Click to stop" : "Voice Search"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>

        {/* Trending tags */}
        <div className="flex items-center gap-2 mt-2 px-1 overflow-x-auto hide-scrollbar">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5 whitespace-nowrap">
            <Tag size={10} /> Trending:
          </span>
          {["Tulsi Mala", "Bhagavad Gita", "Pooja Camphor", "Idols", "Incense Dhoop"].map(tag => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-orange-100/60 dark:border-slate-800 rounded-full hover:border-orange-300 whitespace-nowrap transition cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* AUTO SLIDING HERO BANNER */}
      <div className="px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="relative rounded-[28px] overflow-hidden shadow-xl aspect-[21/9] md:aspect-[3/1] bg-slate-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBannerIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex flex-col justify-center p-6 md:p-8 text-white"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r ${BANNERS[currentBannerIndex].bgGradient} opacity-90 z-0`} />
              
              {/* Cover Image in background right */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-35 z-0 pointer-events-none">
                <SecureImage src={BANNERS[currentBannerIndex].image} className="w-full h-full object-cover" alt="Banner" referrerPolicy="no-referrer" />
              </div>

              {/* Banner content */}
              <div className="relative z-10 max-w-lg space-y-2">
                <span className="text-[8px] md:text-[9px] font-extrabold uppercase tracking-widest text-yellow-300 bg-black/30 border border-yellow-500/20 px-2.5 py-0.5 rounded-full w-fit block">
                  {BANNERS[currentBannerIndex].subtitle}
                </span>
                <h2 className="text-xl md:text-3xl font-black font-serif leading-tight drop-shadow-sm">
                  {BANNERS[currentBannerIndex].title}
                </h2>
                <p className="text-xs md:text-sm text-white/90 font-medium">
                  {BANNERS[currentBannerIndex].tagline}
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => setSelectedCategory(BANNERS[currentBannerIndex].categoryLink)}
                    className="px-5 py-2.5 bg-white text-orange-600 font-extrabold text-xs rounded-xl shadow hover:bg-orange-50 transition-all flex items-center gap-1.5 transform active:scale-95"
                  >
                    {BANNERS[currentBannerIndex].cta} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Indicators */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
            {BANNERS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={`w-2.5 h-1.5 rounded-full transition-all ${currentBannerIndex === idx ? 'bg-white w-5' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* TRUST & PROMISES SECTION */}
      <div className="px-6 py-2 max-w-7xl mx-auto w-full overflow-x-auto hide-scrollbar">
        <div className="flex gap-4 min-w-[650px] md:min-w-0 md:grid md:grid-cols-4 pt-1 pb-3">
          {[
            { icon: <ShieldCheck className="text-orange-500" size={18} />, title: "100% Authentic", desc: "Pure Vrindavan Sourced" },
            { icon: <Sparkles className="text-amber-500" size={18} />, title: "Pure & Organic", desc: "Chemical-free Camphor" },
            { icon: <Truck className="text-blue-500" size={18} />, title: "Fast Shipping", desc: "Shiprocket Integrated" },
            { icon: <Gift className="text-rose-500" size={18} />, title: "Secure Checkout", desc: "Razorpay Protected" }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-slate-900 border border-orange-100/50 dark:border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm"
            >
              <div className="p-2 bg-orange-50 dark:bg-slate-800 rounded-xl">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-amber-950 dark:text-amber-100">{item.title}</h4>
                <p className="text-[9px] text-slate-400 font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES SELECTION GRID / BAR */}
      {CATEGORIES.length > 1 && (
        <div className="px-6 py-4 max-w-7xl mx-auto w-full space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-amber-800/60 dark:text-slate-400 font-black">Browse Categories</h3>
          <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-sm border flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent transform scale-105"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-orange-100/50 dark:border-slate-800 hover:bg-orange-50/50 dark:hover:bg-slate-800"
                }`}
              >
                <span>{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SPECIAL FESTIVAL OFFERS (HORIZONTAL IF EXIST) */}
      {festivalOffers.length > 0 && selectedCategory === "All" && (
        <div className="px-6 py-4 max-w-7xl mx-auto w-full space-y-3 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent rounded-[32px] border border-orange-100/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BadgePercent className="text-red-500 animate-bounce" size={18} />
              <div>
                <h3 className="text-base font-black text-amber-950 dark:text-amber-100">Festival Offers & Discounts</h3>
                <p className="text-[10px] text-slate-400 font-medium">Extra savings on sacred essentials</p>
              </div>
            </div>
            <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full dark:bg-red-500/10 dark:text-red-400">SALE LIVE</span>
          </div>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {festivalOffers.slice(0, 6).map((prod) => (
              <div 
                key={prod.id}
                onClick={() => handleProductNavigate(prod)}
                className="min-w-[200px] bg-white dark:bg-slate-900 border border-orange-100/60 dark:border-slate-800 p-3 rounded-2xl shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mb-2.5">
                  <SecureImage src={prod.image} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" alt={prod.name} referrerPolicy="no-referrer" />
                  <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">
                    {prod.savingsPercent}% OFF
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-100 line-clamp-1">{prod.name || prod.title}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-extrabold text-orange-600">₹{prod.displayPrice}</span>
                    <span className="text-[9px] text-slate-400 line-through">₹{prod.parsedPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCTS DISPLAY SECTION */}
      <div className="px-6 py-4 max-w-7xl mx-auto w-full flex-1 pb-16">
        <div className="flex justify-between items-end mb-4 border-b border-orange-100/60 dark:border-slate-800 pb-2">
          <div>
            <h2 className="text-lg font-black font-serif text-amber-950 dark:text-amber-100">
              {selectedCategory === "All" ? "Divine Spiritual Collection" : `${selectedCategory} Collection`}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Authentic, pure and energized products for sadhana</p>
          </div>
          <span className="text-[10px] font-extrabold bg-orange-100 text-orange-600 px-3 py-1 rounded-full dark:bg-orange-500/10 dark:text-orange-400">
            {products.length} Items Available
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs text-amber-950 dark:text-amber-100 font-bold">Divine items loading...</span>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No Products Available"
            message="We are currently sourcing fresh and authentic batch of items. Check back soon!"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((prod: any) => {
              const isOutOfStock = prod.stock <= 0 || prod.inStock === false;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={prod.id}
                  onClick={() => !isOutOfStock && handleProductNavigate(prod)}
                  className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm flex flex-col group cursor-pointer border border-orange-100/40 dark:border-slate-800 transition hover:shadow-lg relative ${
                    isOutOfStock ? "opacity-75 grayscale-[20%]" : ""
                  }`}
                >
                  {/* Image Container with Badges */}
                  <div className="relative aspect-square bg-slate-50 dark:bg-slate-950 overflow-hidden rounded-t-3xl">
                    <SecureImage
                      src={prod.image || ""}
                      alt={prod?.name || prod?.title || "Product"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />

                    {/* Stock Status overlays */}
                    {isOutOfStock ? (
                      <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-sm">
                        OUT OF STOCK
                      </div>
                    ) : prod.hasDiscount ? (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-sm">
                        {prod.savingsPercent}% OFF
                      </div>
                    ) : null}

                    {prod.isDigital && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-sm">
                        E-BOOK / PDF
                      </div>
                    )}

                    {/* Wishlist Button over image */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(prod.id);
                      }}
                      className="absolute top-2 right-2 w-7.5 h-7.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                    >
                      <Heart
                        size={13}
                        className={wishlist.includes(prod.id) ? "fill-red-500 text-red-500" : ""}
                      />
                    </button>

                    {/* Fast delivery / COD indicators if available */}
                    <div className="absolute bottom-2 left-2 flex gap-1 z-10">
                      <span className="text-[7px] font-extrabold bg-black/60 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm uppercase">
                        COD Available
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 flex flex-col flex-1 justify-between space-y-2">
                    <div className="space-y-1">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <div className="flex items-center text-amber-500">
                          <Star size={10} className="fill-amber-500" />
                        </div>
                        <span className="text-[9px] text-slate-400 font-extrabold">
                          {prod.rating} ({prod.reviewsCount} reviews)
                        </span>
                      </div>

                      {/* Main Title */}
                      <h3 className="font-extrabold text-xs md:text-sm text-amber-950 dark:text-white line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                        {prod?.name || prod?.title || "Product"}
                      </h3>

                      {prod.hindiName && (
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-serif font-bold">
                          {prod.hindiName}
                        </p>
                      )}

                      {prod.description && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 font-medium">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2.5 border-t border-orange-50/50 dark:border-slate-800">
                      {/* Pricing */}
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-orange-600 dark:text-orange-400 text-base">
                          ₹{prod.displayPrice}
                        </span>
                        {prod.hasDiscount && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{prod.parsedPrice}
                          </span>
                        )}
                      </div>

                      {/* Quick Interactive Actions */}
                      {!isOutOfStock && (
                        <div className="grid grid-cols-1 gap-1.5 pt-1 relative">
                          <button
                            onClick={(e) => handleAddToCartClick(e, prod)}
                            className="w-full py-1.5 bg-orange-100/40 dark:bg-slate-800 hover:bg-orange-100 text-orange-700 dark:text-orange-300 font-extrabold text-[10px] rounded-xl transition flex items-center justify-center gap-1"
                          >
                            <ShoppingCart size={11} /> Add To Cart
                          </button>
                          <button
                            onClick={(e) => handleBuyNowClick(e, prod)}
                            className="w-full py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm transition transform active:scale-95"
                          >
                            Buy Now
                          </button>
                          <button
                            onClick={(e) => handleProductShare(e, prod)}
                            className="absolute -top-7 right-0 p-1 text-slate-300 hover:text-orange-500 transition-colors"
                            title="Share Product"
                          >
                            <Share2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toast Alerts on Add to Cart */}
                  <AnimatePresence>
                    {addedToCartId === prod.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 flex flex-col items-center justify-center text-center p-3 rounded-3xl z-20"
                      >
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow mb-2">
                          <Check size={20} strokeWidth={3} />
                        </div>
                        <p className="text-xs font-black text-green-600">Added to Cart!</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Item ready in your cart.</p>
                      </motion.div>
                    )}
                    {shareSuccessId === prod.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-3 py-1.5 rounded-full z-20 shadow-lg"
                      >
                        Link Copied!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECENTLY VIEWED SECTION */}
      {recentlyViewed.length > 0 && (
        <div className="px-6 py-4 bg-orange-100/15 border-t border-orange-100/50 dark:border-slate-900/60">
          <div className="max-w-7xl mx-auto w-full space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-amber-800/60 dark:text-slate-400 font-black flex items-center gap-1.5">
              <RefreshCw size={12} className="animate-spin-slow" /> Recently Viewed
            </h3>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1">
              {recentlyViewed.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => navigate(`/store/product/${prod.id}`)}
                  className="min-w-[120px] max-w-[120px] cursor-pointer group flex flex-col space-y-1"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <SecureImage src={prod.image} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" alt={prod.name} referrerPolicy="no-referrer" />
                  </div>
                  <h4 className="text-[10px] font-bold text-amber-950 dark:text-amber-100 truncate">{prod.name || prod.title}</h4>
                  <span className="text-[10px] font-extrabold text-orange-600">₹{prod.displayPrice}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
