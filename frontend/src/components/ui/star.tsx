import * as React from "react";

export interface StarRatingProps {
  value?: number;
  defaultValue?: number;
  max?: number;
  allowHalf?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (value: number) => void;
  size?: "small" | "medium" | "large";
  showScore?: boolean;
  className?: string;
}

const sizeConfig = {
  small: {
    star: "w-4 h-4",
    gap: "gap-0.5",
    text: "text-xs ml-1.5",
  },
  medium: {
    star: "w-5 h-5",
    gap: "gap-1",
    text: "text-sm font-semibold ml-2",
  },
  large: {
    star: "w-6 h-6",
    gap: "gap-1.5",
    text: "text-base font-bold ml-2.5",
  },
};

export function Star({
  value: controlledValue,
  defaultValue = 0,
  max = 5,
  allowHalf = true,
  readOnly = false,
  disabled = false,
  onChange,
  size = "medium",
  showScore = false,
  className = "",
}: StarRatingProps) {
  const isControlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const currentValue = isControlled ? (controlledValue ?? 0) : uncontrolledValue;
  const activeRating = hoverValue !== null ? hoverValue : currentValue;
  const currentSize = sizeConfig[size] || sizeConfig.medium;

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (readOnly || disabled) return;
    const finalValue = isHalf && allowHalf ? starIndex + 0.5 : starIndex + 1;
    if (!isControlled) {
      setUncontrolledValue(finalValue);
    }
    onChange?.(finalValue);
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLButtonElement>,
    starIndex: number
  ) => {
    if (readOnly || disabled) return;
    if (!allowHalf) {
      setHoverValue(starIndex + 1);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    setHoverValue(isLeftHalf ? starIndex + 0.5 : starIndex + 1);
  };

  const handleMouseLeave = () => {
    if (readOnly || disabled) return;
    setHoverValue(null);
  };

  return (
    <div
      className={`inline-flex items-center ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flex items-center ${currentSize.gap}`}>
        {Array.from({ length: max }).map((_, i) => {
          const filled = activeRating >= i + 1;
          const halfFilled = !filled && activeRating >= i + 0.5;

          return (
            <button
              key={i}
              type="button"
              disabled={readOnly || disabled}
              onClick={() => handleClick(i, halfFilled)}
              onMouseMove={(e) => handleMouseMove(e, i)}
              aria-label={`${i + 1} sao`}
              className={`relative p-0.5 transition-transform duration-75 ${
                readOnly || disabled
                  ? "cursor-default"
                  : "cursor-pointer hover:scale-110 active:scale-95"
              }`}
            >
              <svg
                className={`${currentSize.star} ${
                  filled
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300 dark:text-gray-600 fill-transparent"
                }`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>

              {halfFilled && (
                <div
                  className="absolute inset-0.5 overflow-hidden w-1/2 pointer-events-none"
                  aria-hidden="true"
                >
                  <svg
                    className={`${currentSize.star} text-amber-400 fill-amber-400`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {showScore && (
        <span className={`text-gray-700 dark:text-gray-300 ${currentSize.text}`}>
          {currentValue.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default Star;
