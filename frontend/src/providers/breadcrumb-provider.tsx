"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface BreadcrumbContextType {
  overrides: Record<string, string>;
  setOverride: (path: string, label: string) => void;
  removeOverride: (path: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const setOverride = useCallback((path: string, label: string) => {
    setOverrides((prev) => {
      if (prev[path] === label) return prev;
      return { ...prev, [path]: label };
    });
  }, []);

  const removeOverride = useCallback((path: string) => {
    setOverrides((prev) => {
      if (!(path in prev)) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ overrides, setOverride, removeOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider");
  }
  return context;
}

interface BreadcrumbOverrideProps {
  path: string;
  label: string;
}

/**
 * A declarative component to override a breadcrumb label dynamically.
 * Place this inside any page component to update its dynamic breadcrumb segment name.
 * 
 * Example:
 * <BreadcrumbOverride path={`/dashboard/programs/${program.slug}`} label={program.title} />
 */
export function BreadcrumbOverride({ path, label }: BreadcrumbOverrideProps) {
  const { setOverride, removeOverride } = useBreadcrumbs();

  useEffect(() => {
    setOverride(path, label);
    return () => {
      removeOverride(path);
    };
  }, [path, label, setOverride, removeOverride]);

  return null;
}
