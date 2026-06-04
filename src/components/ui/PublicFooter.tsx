import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-surface border-t border-border/40 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        {/* Kolom 1: Profil */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="LAZ Platform Logo" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-primary">LAZ Platform</span>
          </Link>
          <p className="text-sm text-secondary leading-relaxed">
            Platform manajemen zakat, infak, dan sedekah digital terpadu yang mempermudah penyaluran dana sosial keagamaan secara aman, transparan, dan akuntabel.
          </p>
        </div>

        {/* Kolom 2: Hubungi Kami */}
        <div className="space-y-4">
          <h4 className="text-base font-bold text-primary">Kantor Pusat</h4>
          <ul className="space-y-3 text-sm text-secondary">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-1" />
              <span>Jl. Jenderal Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12190</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-brand-primary shrink-0" />
              <span>+62 21-500-1234</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-primary shrink-0" />
              <span>support@lazplatform.id</span>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Regulasi & Legal */}
        <div className="space-y-4">
          <h4 className="text-base font-bold text-primary">Kepatuhan Hukum</h4>
          <p className="text-sm text-secondary leading-relaxed">
            Platform penggalangan dana terafiliasi dengan Lembaga Amil Zakat yang memegang izin operasional resmi dari Kementerian Agama RI dan diaudit secara kepatuhan syariah berkala.
          </p>
          <div className="flex gap-4 text-xs font-semibold text-brand-primary">
            <Link href="/terms" className="hover:underline">Syarat & Ketentuan</Link>
            <span className="text-border">|</span>
            <Link href="/privacy" className="hover:underline">Kebijakan Privasi</Link>
          </div>
        </div>
      </div>

      <hr className="border-border/40 mb-8" />

      {/* Copyright */}
      <div className="text-center text-xs text-secondary">
        <p>&copy; {new Date().getFullYear()} LAZ Platform. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
      </div>
    </footer>
  );
}
