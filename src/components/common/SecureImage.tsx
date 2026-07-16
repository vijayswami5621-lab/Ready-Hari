import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Image as ImageIcon, AlertCircle } from "lucide-react";
import { useImageCacheStore } from "../../store/useImageCacheStore";

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | any;
  alt?: string;
  fallbackSrc?: string;
  containerClassName?: string;
  imageClassName?: string;
  cacheBuster?: string | number;
}

export const SecureImage: React.FC<SecureImageProps> = ({
  src,
  alt = "Image",
  fallbackSrc = "/logo.png",
  containerClassName = "",
  imageClassName = "",
  className = "",
  cacheBuster,
  ...props
}) => {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle",
  );
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_RETRIES = 3;

  const globalCacheBuster = useImageCacheStore(
    (state) => state.globalCacheBuster,
  );
  const effectiveCacheBuster = Math.max(
    cacheBuster ? Number(cacheBuster) : 0,
    globalCacheBuster,
  );

  useEffect(() => {
    let observer: IntersectionObserver;

    if (containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && status === "idle") {
            setStatus("loading");
          }
        },
        { rootMargin: "200px" }, // Preload when 200px away
      );
      observer.observe(containerRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [status]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: any;

    if (status !== "loading") return;

    const resolveSrc = () => {
      let processedSrc = src;

      // Handle ImgBB object response
      if (processedSrc && typeof processedSrc === "object") {
        processedSrc =
          processedSrc?.data?.url ||
          processedSrc?.url ||
          processedSrc?.display_url ||
          "";
      }

      if (typeof processedSrc !== "string") {
        processedSrc = "";
      }

      // We cannot render HTML pages as images, so block ibb.co page links
      if (
        processedSrc.includes("ibb.co/") &&
        !processedSrc.includes("i.ibb.co/")
      ) {
        if (isMounted) {
          setCurrentSrc(fallbackSrc);
          setStatus("error");
        }
        return;
      }

      if (!processedSrc || !processedSrc.startsWith("http")) {
        if (isMounted) {
          setCurrentSrc(fallbackSrc);
          setStatus("error");
        }
        return;
      }

      let finalSrc = processedSrc;
      if (effectiveCacheBuster) {
        try {
          const url = new URL(processedSrc);
          url.searchParams.set("t", effectiveCacheBuster.toString());
          finalSrc = url.toString();
        } catch (e) {
          finalSrc = processedSrc.includes("?")
            ? `${processedSrc}&t=${effectiveCacheBuster}`
            : `${processedSrc}?t=${effectiveCacheBuster}`;
        }
      }

      const img = new Image();
      img.src = finalSrc;

      img.onload = () => {
        if (isMounted) {
          setCurrentSrc(finalSrc);
          setStatus("loaded");
        }
      };

      img.onerror = () => {
        if (isMounted) {
          if (retryCount < MAX_RETRIES) {
            timeoutId = setTimeout(
              () => {
                if (isMounted) {
                  setRetryCount((c) => c + 1);
                  setStatus("loading"); // re-trigger loading
                }
              },
              1000 * Math.pow(2, retryCount),
            ); // exponential backoff
          } else {
            setCurrentSrc(fallbackSrc);
            setStatus("error");
          }
        }
      };
    };

    resolveSrc();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [src, retryCount, fallbackSrc, effectiveCacheBuster, status]);

  // If src changes, reset state
  useEffect(() => {
    setStatus("idle");
    setRetryCount(0);
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-slate-100/50 dark:bg-slate-800 flex-shrink-0 ${containerClassName} ${className}`}
    >
      <AnimatePresence mode="wait">
        {(status === "idle" || status === "loading") && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse flex flex-col items-center justify-center"
          >
            <ImageIcon className="w-6 h-6 text-slate-400 dark:text-slate-500 mb-2 opacity-50" />
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
          >
            <img
              src={fallbackSrc}
              alt={alt}
              className={`w-full h-full object-contain p-2 bg-white ${imageClassName}`}
              loading="lazy"
            />
          </motion.div>
        )}

        {status === "loaded" && (
          <motion.div
            key="image-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
          >
            <img
              src={currentSrc}
              alt={alt}
              className={`w-full h-full object-cover ${imageClassName}`}
              loading="lazy"
              {...props}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
