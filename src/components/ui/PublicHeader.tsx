"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";

interface PublicHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    roleName?: string;
  } | null;
}

export function PublicHeader({ user }: PublicHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="bg-surface/85 backdrop-blur-md sticky top-0 z-50 shadow-soft border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="LAZ Platform Logo" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-xl font-bold text-primary">LAZ Platform</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/programs" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">
              Semua Program
            </Link>
            <Link href="/#how-it-works" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">
              Cara Donasi
            </Link>
            <Link href="/#about" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">
              Tentang Kami
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-sm font-bold py-2.5 px-5 rounded-xl hover:bg-brand-secondary transition-all shadow-soft"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Ke Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 border border-border text-secondary hover:text-error-token hover:border-error-token/35 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-bold text-secondary hover:text-primary transition-colors px-4 py-2"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-success hover:bg-success-hover text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all shadow-soft"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-secondary hover:bg-surface-muted transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border/40 bg-surface px-4 py-4 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-4">
            <Link
              href="/programs"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-secondary hover:text-primary transition-colors py-1.5"
            >
              Semua Program
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-secondary hover:text-primary transition-colors py-1.5"
            >
              Cara Donasi
            </Link>
            <Link
              href="/#about"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-secondary hover:text-primary transition-colors py-1.5"
            >
              Tentang Kami
            </Link>
          </nav>

          <hr className="border-border/40" />

          {/* Mobile Actions */}
          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 bg-brand-primary text-white text-sm font-bold py-3 px-5 rounded-xl hover:bg-brand-secondary transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Ke Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-1.5 border border-border text-secondary hover:text-error-token hover:border-error-token/35 text-sm font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex justify-center text-sm font-bold text-secondary hover:text-primary py-3 border border-border rounded-xl transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex justify-center bg-success hover:bg-success-hover text-white text-sm font-bold py-3 rounded-xl transition shadow-soft"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
