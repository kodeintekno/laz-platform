import { ShieldCheck, Award, Heart } from "lucide-react";

export function TrustIndicators() {
  return (
    <section className="bg-surface border-y border-border/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Jaminan 1 */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-primary mb-1">Aman & Transparan</h4>
            <p className="text-sm text-secondary leading-relaxed">
              Setiap donasi dicatat secara digital dengan riwayat penyaluran terbuka.
            </p>
          </div>
        </div>

        {/* Jaminan 2 */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="p-3 bg-success/10 rounded-2xl text-success shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-primary mb-1">Diawasi Kemenag RI</h4>
            <p className="text-sm text-secondary leading-relaxed">
              Terafiliasi dengan Lembaga Amil Zakat resmi yang terdaftar legal di Indonesia.
            </p>
          </div>
        </div>

        {/* Jaminan 3 */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="p-3 bg-warning/10 rounded-2xl text-warning shrink-0">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-primary mb-1">Sesuai Syariat</h4>
            <p className="text-sm text-secondary leading-relaxed">
              Pengelolaan dana zakat dan Infak/Sedekah terverifikasi mematuhi asas fikih MUI.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
