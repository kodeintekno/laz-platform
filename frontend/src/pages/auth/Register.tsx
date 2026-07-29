import { Link } from "react-router-dom";
import { Building2, HeartHandshake } from "lucide-react";

/**
 * Donatur tidak memiliki akun — halaman ini menjadi titik pilihan
 * pendaftaran untuk Lembaga atau Relawan.
 */
export function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Daftar di Ruang Berbagi</h1>
        <p className="text-sm text-secondary">Pilih jenis akun yang ingin Anda daftarkan.</p>
      </div>

      <div className="space-y-4">
        <Link
          to="/lembaga/register"
          className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-brand-primary hover:bg-brand-primary/5 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-primary group-hover:text-brand-primary">Daftar sebagai Lembaga</p>
            <p className="text-sm text-secondary">Kelola program donasi untuk yayasan/organisasi Anda.</p>
          </div>
        </Link>

        <Link
          to="/volunteer/register"
          className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-brand-primary hover:bg-brand-primary/5 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-primary group-hover:text-brand-primary">Daftar sebagai Relawan</p>
            <p className="text-sm text-secondary">Ikut serta membantu program-program kebaikan di lapangan.</p>
          </div>
        </Link>
      </div>

      <p className="text-center text-sm text-secondary">
        Ingin berdonasi?{" "}
        <Link to="/programs" className="text-brand-primary hover:underline font-semibold">
          Tidak perlu akun — lihat program donasi
        </Link>
        .
      </p>

      <p className="text-center text-sm text-secondary">
        Sudah punya akun lembaga?{" "}
        <Link to="/login" className="text-brand-primary hover:underline font-semibold">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
