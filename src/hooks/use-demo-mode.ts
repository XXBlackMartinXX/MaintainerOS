import { useEffect, useState, useCallback } from "react";

const KEY = "mos.demoMode";

function read(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function useDemoMode() {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setEnabled(read());
    };
    const onCustom = () => setEnabled(read());
    window.addEventListener("storage", onStorage);
    window.addEventListener("mos:demo-mode", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("mos:demo-mode", onCustom);
    };
  }, []);

  const setDemo = useCallback((value: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, value ? "1" : "0");
    window.dispatchEvent(new Event("mos:demo-mode"));
    setEnabled(value);
  }, []);

  return { enabled, setDemo };
}

export function enableDemoMode() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, "1");
  window.dispatchEvent(new Event("mos:demo-mode"));
}
