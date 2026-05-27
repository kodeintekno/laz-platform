"use client";

import { useUIStore } from "@/stores/ui.store";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Bell, Menu } from "lucide-react";

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roleName?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const { toggleSidebar } = useUIStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0 relative z-20">
      {/* Left: Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="p-2 rounded-xl text-text-secondary hover:bg-surface-muted transition-colors lg:hidden cursor-pointer"
      >
        <span className="sr-only">Toggle sidebar</span>
        <Menu className="w-5 h-5" />
      </button>

      {/* Center / Left: Page title placeholder */}
      <div className="flex-1 px-4">
        <p className="text-sm text-text-secondary font-semibold">Dashboard</p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <button 
          className="p-1.5 rounded-full text-text-muted hover:bg-surface-muted hover:text-text-primary transition-all cursor-pointer"
          aria-label="Notification bell"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-muted transition-all focus:outline-none cursor-pointer"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-soft"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm shadow-soft">
                {userInitial}
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-soft border border-border py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity Info */}
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-bold text-text-primary truncate">{user?.name || "User"}</p>
                <p className="text-xs text-text-secondary truncate mb-1.5">{user?.email || "No email"}</p>
                {user?.roleName && (
                  <span className="inline-flex items-center rounded-md bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold text-brand-primary ring-1 ring-inset ring-brand-primary/20">
                    {user.roleName}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-error-token hover:bg-error-token/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar / Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

