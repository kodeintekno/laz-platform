import { Outlet } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";

/** Root route wrapper — shared behavior (scroll reset) across every route group. */
export function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}
