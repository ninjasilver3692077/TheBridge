import { useEffect, useState } from "react";

export default function useRotatingIndex(count, delayMs) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count < 2) {
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;

    const syncRotation = () => {
      window.clearInterval(timer);
      if (!reducedMotion.matches) {
        timer = window.setInterval(
          () => setIndex((current) => (current + 1) % count),
          delayMs,
        );
      }
    };

    syncRotation();
    reducedMotion.addEventListener("change", syncRotation);

    return () => {
      window.clearInterval(timer);
      reducedMotion.removeEventListener("change", syncRotation);
    };
  }, [count, delayMs]);

  return index;
}
