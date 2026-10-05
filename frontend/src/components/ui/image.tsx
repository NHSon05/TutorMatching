import * as React from "react";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: "1/1" | "16/9" | "4/3" | "3/2" | "auto";
  fit?: "cover" | "contain" | "fill";
  rounded?: "none" | "md" | "xl" | "2xl" | "full";
  fallbackSrc?: string;
}

const aspectMap = {
  "1/1": "aspect-square",
  "16/9": "aspect-video",
  "4/3": "aspect-4/3",
  "3/2": "aspect-3/2",
  auto: "aspect-auto",
};

const roundedMap = {
  none: "rounded-none",
  md: "rounded-md",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export function Image({
  src,
  alt,
  aspectRatio = "auto",
  fit = "cover",
  rounded = "xl",
  fallbackSrc,
  className = "",
  ...props
}: ImageProps) {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const displaySrc = hasError && fallbackSrc ? fallbackSrc : src;

  React.useEffect(() => {
    if (imgRef.current?.complete) {
      if (imgRef.current.naturalWidth === 0) {
        setHasError(true);
      }
      setIsLoading(false);
    }
  }, [displaySrc]);

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${
        aspectMap[aspectRatio]
      } ${roundedMap[rounded]} ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {hasError && !fallbackSrc ? (
        <div className="flex flex-col items-center justify-center w-full h-full p-4 text-gray-400 dark:text-gray-500">
          <svg className="w-8 h-8 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-[11px] text-center">Không thể tải ảnh</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={displaySrc}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`w-full h-full transition-opacity duration-300 object-${fit} ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          {...props}
        />
      )}
    </div>
  );
}

export default Image;
