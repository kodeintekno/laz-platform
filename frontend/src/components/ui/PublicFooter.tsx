import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import Logo from "./Logo";

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 py-16 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        {/* Kolom 1: Profil */}
        <div className="space-y-6">
          <Link to="/" className="inline-block">
            <Logo size="md" variant="dark" />
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm font-medium">
            Wadah digital inovatif untuk manajemen ZISWAF. Kami memastikan setiap kebaikan Anda tersalurkan secara aman, transparan, dan akuntabel.
          </p>
        </div>

        {/* Kolom 2: Hubungi Kami */}
        <div className="space-y-6">
          <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Hubungi Kami</h4>
          <ul className="space-y-4 text-sm text-gray-600 font-medium">
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="mt-1">Jl. Pahlawan No.55, Cileungsi, Kec. Cileungsi, Kabupaten Bogor, Jawa Barat 16820</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <span>+62 21-500-1234</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <span>support@ruangberbagi.id</span>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Regulasi & Legal */}
        <div className="space-y-6">
          <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Legalitas</h4>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            Platform penggalangan dana terafiliasi dengan Lembaga Amil Zakat yang memegang izin operasional resmi dari Kementerian Agama RI dan diaudit secara kepatuhan syariah berkala.
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-emerald-600">
            <Link to="/terms" className="hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-full">Syarat & Ketentuan</Link>
            <Link to="/privacy" className="hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-full">Kebijakan Privasi</Link>
          </div>
        </div>
      </div>

      <hr className="border-gray-100 mb-8" />

      {/* Copyright */}
      <div className="text-center flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto text-xs text-gray-400 font-bold tracking-wide">
        <p>&copy; 2026 Yayasan Ruang Berbagi Indonesia. Seluruh hak cipta dilindungi undang-undang.</p>
        <p className="mt-2 md:mt-0">Amanah & Transparan</p>
      </div>
    </footer>
  );
}
