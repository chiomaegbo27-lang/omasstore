import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

export interface MediaItem {
  url: string;
  type: "image" | "video";
  poster?: string | null;
}

/**
 * Multi-image/video gallery. After a video finishes (or is paused mid-way and
 * advanced) the carousel snaps back to the first image so the product picture
 * is always the resting state.
 */
export function ProductMediaCarousel({
  media,
  fallbackEmoji,
  alt,
  rounded = "rounded-2xl",
  onClickWhenIdle,
}: {
  media: MediaItem[];
  fallbackEmoji?: string | null;
  alt: string;
  rounded?: string;
  /** Called when the user clicks the image area (not a control). */
  onClickWhenIdle?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const firstImageIdx = useMemo(() => {
    const i = media.findIndex((m) => m.type === "image");
    return i === -1 ? 0 : i;
  }, [media]);

  // When the active slide changes away from a video, ensure it stops.
  useEffect(() => {
    if (media[idx]?.type !== "video") setPlaying(false);
  }, [idx, media]);

  if (!media.length) {
    return (
      <div className={`relative aspect-square overflow-hidden bg-gradient-to-br from-pink-soft to-blue-soft grid place-items-center ${rounded}`}>
        <span className="text-7xl">{fallbackEmoji ?? "🛒"}</span>
      </div>
    );
  }

  const current = media[idx];
  const go = (next: number) => {
    setIdx(((next % media.length) + media.length) % media.length);
  };

  const onVideoEnded = () => {
    setPlaying(false);
    // Return to first image after the advert finishes
    setIdx(firstImageIdx);
  };

  return (
    <div className={`relative aspect-square overflow-hidden bg-gradient-to-br from-pink-soft to-blue-soft ${rounded}`}>
      {current.type === "image" ? (
        <button
          type="button"
          onClick={onClickWhenIdle}
          className="block h-full w-full"
          aria-label={alt}
        >
          <img src={current.url} alt={alt} loading="lazy" className="h-full w-full object-cover" />
        </button>
      ) : (
        <>
          <video
            ref={videoRef}
            src={current.url}
            poster={current.poster ?? undefined}
            preload="metadata"
            playsInline
            controls={playing}
            onEnded={onVideoEnded}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            className="h-full w-full object-cover"
          />
          {!playing && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); videoRef.current?.play(); }}
              aria-label="Play video"
              className="absolute inset-0 grid place-items-center bg-black/10 hover:bg-black/20 transition"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-primary shadow">
                <Play className="h-6 w-6 ml-0.5" />
              </span>
            </button>
          )}
        </>
      )}

      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(idx - 1); }}
            aria-label="Previous"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/85 text-foreground shadow hover:scale-110 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(idx + 1); }}
            aria-label="Next"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/85 text-foreground shadow hover:scale-110 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {media.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(i); }}
                aria-label={`Go to ${m.type} ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-primary" : "w-1.5 bg-background/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
