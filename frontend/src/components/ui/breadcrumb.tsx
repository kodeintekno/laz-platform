"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useBreadcrumbs } from "@/providers/breadcrumb-provider";
import { resolveBreadcrumbs } from "@/lib/breadcrumb";

export function Breadcrumbs() {
  const pathname = usePathname();
  const { overrides } = useBreadcrumbs();
  const items = resolveBreadcrumbs(pathname, overrides);

  const isHome = pathname === "/dashboard";

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm py-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {/* Root Dashboard Segment */}
        <li className="inline-flex items-center">
          {isHome ? (
            <span className="inline-flex items-center gap-1.5 font-bold text-primary">
              <Home className="h-4 w-4 text-muted" />
              <span>Dashboard</span>
            </span>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-secondary hover:text-primary font-semibold transition-colors duration-150"
            >
              <Home className="h-4 w-4 text-muted" />
              <span>Dashboard</span>
            </Link>
          )}
        </li>

        {/* Dynamic Nested Segments */}
        {items.map((item) => {
          // Skip mapping the root dashboard path since it is handled by the static element above
          if (item.href === "/dashboard") return null;

          return (
            <li key={item.key} className="inline-flex items-center">
              <ChevronRight className="h-4 w-4 text-muted mx-1 flex-shrink-0" />
              {item.isLast ? (
                <span
                  aria-current="page"
                  className="font-bold text-primary max-w-[180px] sm:max-w-[240px] truncate block"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-secondary hover:text-primary font-semibold transition-colors duration-150 max-w-[150px] truncate block"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


