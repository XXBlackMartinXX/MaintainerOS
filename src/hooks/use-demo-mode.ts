import { useEffect, useState, useCallback } from "react";

export const DEMO_MODE_STORAGE_KEY = "mos.demoMode";
export const DEMO_MODE_EVENT = "mos:demo-mode";

export function isDemoModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "1";
}

export function useDemoMode() {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(isDemoModeEnabled());
    const onStorage = (e: StorageEvent) => {
      if (e.key === DEMO_MODE_STORAGE_KEY) setEnabled(isDemoModeEnabled());
    };
    const onCustom = () => setEnabled(isDemoModeEnabled());
    window.addEventListener("storage", onStorage);
    window.addEventListener(DEMO_MODE_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(DEMO_MODE_EVENT, onCustom);
    };
  }, []);

  const setDemo = useCallback((value: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, value ? "1" : "0");
    window.dispatchEvent(new Event(DEMO_MODE_EVENT));
    setEnabled(value);
  }, []);

  return { enabled, setDemo };
}

export function enableDemoMode() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "1");
  window.dispatchEvent(new Event(DEMO_MODE_EVENT));
}
