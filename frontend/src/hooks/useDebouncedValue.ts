import { useState, useEffect } from "react";

/**
 * Hook che restituisce un valore debounced.
 * Utile per ritardare ricerche e filtri mentre l'utente digita.
 * @param value - Il valore da debounceare
 * @param delay - Il ritardo in millisecondi (default 300ms)
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebouncedValue;
