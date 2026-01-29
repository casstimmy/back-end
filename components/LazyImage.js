import { useState, useEffect, useRef } from "react";

/**
 * Lazy loading image component with placeholder and fade-in effect
 * Uses Intersection Observer for viewport detection
 */
export default function LazyImage({
  src,
  alt = "",
  className = "",
  placeholderColor = "#f3f4f6",
  width,
  height,
  style = {},
  onClick,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Check if IntersectionObserver is available
    if (!("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const containerStyle = {
    position: "relative",
    overflow: "hidden",
    backgroundColor: placeholderColor,
    width: width || "100%",
    height: height || "auto",
    ...style,
  };

  const imageStyle = {
    opacity: isLoaded ? 1 : 0,
    transition: "opacity 0.3s ease-in-out",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const placeholderStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: placeholderColor,
    opacity: isLoaded ? 0 : 1,
    transition: "opacity 0.3s ease-in-out",
  };

  return (
    <div ref={imgRef} style={containerStyle} className={className} onClick={onClick}>
      {/* Placeholder with loading spinner */}
      <div style={placeholderStyle}>
        {!hasError && !isLoaded && (
          <svg
            className="animate-spin h-6 w-6 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {hasError && (
          <svg
            className="h-8 w-8 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>

      {/* Actual image - only load when in view */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Lazy loading product card image with thumbnail support
 */
export function ProductImage({ 
  images = [], 
  alt = "Product", 
  className = "",
  size = "medium" // small, medium, large
}) {
  const sizes = {
    small: { width: "40px", height: "40px" },
    medium: { width: "80px", height: "80px" },
    large: { width: "200px", height: "200px" },
  };

  const { width, height } = sizes[size] || sizes.medium;

  // Get the best image source (prefer thumbnail for smaller sizes)
  const getImageSrc = () => {
    if (!images || images.length === 0) return null;
    
    const firstImage = images[0];
    if (typeof firstImage === "string") return firstImage;
    
    // For small sizes, prefer thumbnail
    if (size === "small" && firstImage.thumb) {
      return typeof firstImage.thumb === "string" 
        ? firstImage.thumb 
        : firstImage.thumb.webp || firstImage.thumb.jpeg;
    }
    
    // For larger sizes, use full image
    if (firstImage.full) {
      return typeof firstImage.full === "string"
        ? firstImage.full
        : firstImage.full.webp || firstImage.full.jpeg;
    }
    
    return firstImage.thumb || firstImage.full || null;
  };

  const src = getImageSrc();

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`}
        style={{ width, height }}
      >
        <svg
          className="h-6 w-6 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`rounded ${className}`}
      style={{ width, height }}
    />
  );
}
