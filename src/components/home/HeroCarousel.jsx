import { useEffect, useState } from "react";
import { heroImages } from "../../data/homeContent.js";
import CoverWall from "./CoverWall.jsx";

const HERO_IMAGES = heroImages.map(
  (file) => `${import.meta.env.BASE_URL}assets/hero/${file}`,
);

const ROTATION_MS = 7000;

const imageTreatment =
  "absolute inset-0 h-full w-full scale-105 object-cover blur-[2px] saturate-[.85]";

function HeroCarousel() {
  const [failed, setFailed] = useState(() => new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const available = HERO_IMAGES.filter((src) => !failed.has(src));
  const count = available.length;
  const activeSrc = count > 0 ? available[activeIndex % count] : null;

  useEffect(() => {
    if (count < 2) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % count),
      ROTATION_MS,
    );

    return () => window.clearInterval(timer);
  }, [count]);

  const markFailed = (src) =>
    setFailed((current) => new Set(current).add(src));

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-20">
      {count === 0 ? (
        <CoverWall />
      ) : (
        available.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            onError={() => markFailed(src)}
            className={`${imageTreatment} transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
              src === activeSrc ? "opacity-100" : "opacity-0"
            }`}
          />
        ))
      )}

      {count > 1 && (
        <div className="absolute bottom-5 right-6 flex gap-1.5">
          {available.map((src) => (
            <span
              key={src}
              className={`h-1.5 rounded-full bg-ink/50 transition-all duration-500 ${
                src === activeSrc ? "w-5 bg-ink/70" : "w-1.5"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroCarousel;
