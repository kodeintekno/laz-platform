import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  ShieldCheck, 
  Calculator, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  Smartphone
} from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import { AnimatePresence, motion } from "motion/react";

interface PublicHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    roleName?: string;
  } | null;
}

export function PublicHeader({ user }: PublicHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <div className="bg-emerald-900 text-emerald-100 py-2 px-4 text-center text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2">
        <Smartphone className="w-4 h-4" />
        Download Aplikasi Ruang Berbagi
      </div>
      
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm shadow-gray-200/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link to="/" className="flex items-center gap-3 cursor-pointer">
              <Logo size="sm" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link 
                to="/"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-emerald-600",
                  currentPath === '/' ? "text-emerald-600" : "text-gray-500"
                )}
              >
                Beranda
              </Link>
              <Link 
                to="/#about"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-emerald-600",
                  currentPath === '/about' ? "text-emerald-600" : "text-gray-500"
                )}
              >
                Tentang
              </Link>
              
              <div className="h-6 border-l border-gray-200 mx-1" />
              
              <Link 
                to="/reports"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-emerald-600 flex items-center gap-2",
                  currentPath === '/reports' ? "text-emerald-600" : "text-gray-500"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                Transparansi
              </Link>
              <Link 
                to="/calculator"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-emerald-600 flex items-center gap-2",
                  currentPath === '/calculator' ? "text-emerald-600" : "text-gray-500"
                )}
              >
                <Calculator className="w-4 h-4" />
                Kalkulator
              </Link>
              {user && (
                <Link 
                  to="/dashboard"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-emerald-600 flex items-center gap-2",
                    currentPath.startsWith('/dashboard') ? "text-emerald-600" : "text-gray-500"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}
              
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-gray-900">{user.name || 'Hamba Allah'}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{user.roleName || 'User'}</span>
                  </div>
                  <Link to="/settings" className="relative group">
                    {user.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name || 'User'} 
                        className="w-10 h-10 rounded-full border-2 border-emerald-100 group-hover:border-emerald-600 transition-all object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:border-emerald-600 transition-all">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5 hover:shadow-emerald-300 duration-200"
                >
                  Mulai Berbagi
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              {!user && (
                <Link 
                  to="/login"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Mulai
                </Link>
              )}
              {user && (
                <Link to="/settings" className="w-8 h-8 rounded-full border border-emerald-100 overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </Link>
              )}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2 text-gray-500 bg-gray-50 rounded-xl border border-gray-100"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-100 overflow-hidden shadow-2xl absolute w-full left-0"
            >
              <div className="px-5 pt-4 pb-10 space-y-2">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 w-full text-left px-4 py-4 text-sm font-bold text-gray-700 hover:bg-emerald-50 rounded-2xl transition-colors">
                  Beranda
                </Link>
                <Link to="/#about" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 w-full text-left px-4 py-4 text-sm font-bold text-gray-700 hover:bg-emerald-50 rounded-2xl transition-colors">
                  Tentang Kami
                </Link>
                <Link to="/reports" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 w-full text-left px-4 py-4 text-sm font-bold text-gray-700 hover:bg-emerald-50 rounded-2xl transition-colors">
                  Transparansi
                </Link>
                <Link to="/calculator" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 w-full text-left px-4 py-4 text-sm font-bold text-gray-700 hover:bg-emerald-50 rounded-2xl transition-colors">
                  Kalkulator Zakat
                </Link>
                {user && (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 w-full text-left px-4 py-4 text-sm font-bold text-gray-700 hover:bg-emerald-50 rounded-2xl transition-colors">
                    Dashboard
                  </Link>
                )}
                {user && (
                  <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="flex items-center gap-4 w-full text-left px-4 py-4 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-colors mt-4">
                    Keluar
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
