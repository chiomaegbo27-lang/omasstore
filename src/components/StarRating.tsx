import { Star } from "lucide-react";
import { useState } from "react";

export function StarRating({
  value,
  onChange,
  size = 24,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="inline-flex items-center gap-0.5" role={readOnly ? "img" : "radiogroup"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`transition ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= display ? "fill-accent text-accent" : "text-muted-foreground/40"}
          />
        </button>
      ))}
    </div>
  );
}
