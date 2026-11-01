import { useState } from "react";
import useRotatingIndex from "../../hooks/useRotatingIndex.js";
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
  const available = HERO_IMAGES.filter((src) => !failed.has(src));
  const count = available.length;
  const activeIndex = useRotatingIndex(count, ROTATION_MS);
  const activeSrc = count > 0 ? available[activeIndex % count] : null;

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
