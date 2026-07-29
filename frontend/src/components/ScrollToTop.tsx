import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router (SPA) tidak reset scroll position saat pindah halaman —
 * beda dengan navigasi multi-page tradisional. Tanpa ini, pindah halaman
 * dari titik scroll manapun akan mempertahankan posisi scroll yang sama
 * di halaman baru.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
