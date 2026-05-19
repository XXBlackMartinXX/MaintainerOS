import { useCallback, useEffect, useState } from "react";

const KEY = "mos.tour.completedAt";

export function useProductTour() {
  const [completed, setCompleted] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCompleted(Boolean(window.localStorage.getItem(KEY)));
    const onCustom = () =>
      setCompleted(Boolean(window.localStorage.getItem(KEY)));
    window.addEventListener("mos:tour", onCustom);
    return () => window.removeEventListener("mos:tour", onCustom);
  }, []);

  const complete = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, new Date().toISOString());
    window.dispatchEvent(new Event("mos:tour"));
    setCompleted(true);
  }, []);

  const restart = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("mos:tour"));
    setCompleted(false);
  }, []);

  return { completed, complete, restart };
}
