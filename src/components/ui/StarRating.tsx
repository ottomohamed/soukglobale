import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingDisplayProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function StarRatingDisplay({ rating, count, size = "md", showCount = true }: StarRatingDisplayProps) {
  const sizes = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-6 h-6" };
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  const cls = sizes[size];

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rating);
          const half = !filled && star === Math.ceil(rating) && rating % 1 >= 0.5;
          return (
            <Star
              key={star}
              className={`${cls} transition-colors ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : half
                  ? "fill-amber-200 text-amber-400"
                  : "fill-gray-200 text-gray-300"
              }`}
            />
          );
        })}
      </div>
      {rating > 0 && (
        <span className={`font-bold text-foreground ${textSizes[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}
      {showCount && count !== undefined && count > 0 && (
        <span className={`text-muted-foreground ${textSizes[size]}`}>
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
      {(!rating || rating === 0) && (
        <span className={`text-muted-foreground ${textSizes[size]}`}>No reviews yet</span>
      )}
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

export function StarRatingInput({ value, onChange, size = "lg" }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const sizes = { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-10 h-10" };
  const cls = sizes[size];

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`${cls} transition-colors duration-100 ${
                star <= (hovered || value)
                  ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                  : "fill-gray-200 text-gray-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold text-foreground min-w-[80px]">
          {labels[hovered || value] || ""}
        </span>
      </div>
    </div>
  );
}
