import { Search, CreditCard, ClipboardCheck } from "lucide-react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">
            Cara Mudah Berbagi Kebaikan
          </h2>
          <p className="mt-4 text-lg text-secondary">
            Salurkan donasi Anda hanya dalam beberapa menit dan pantau langsung dampaknya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector Line (Desktop Only) */}
          <div className="hidden md:block absolute top-1/4 left-[15%] right-[15%] h-0.5 border-t border-dashed border-border/80 -z-0" />

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-6 shadow-sm">
              <Search className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-2">Langkah 1</span>
            <h3 className="text-lg font-bold text-primary mb-2">Pilih Program</h3>
            <p className="text-sm text-secondary leading-relaxed max-w-xs">
              Temukan kampanye kemanusiaan, zakat, atau sedekah yang sesuai dengan niat baik Anda.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-6 shadow-sm">
              <CreditCard className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-success mb-2">Langkah 2</span>
            <h3 className="text-lg font-bold text-primary mb-2">Transfer Donasi</h3>
            <p className="text-sm text-secondary leading-relaxed max-w-xs">
              Selesaikan pembayaran donasi dengan cepat menggunakan metode pembayaran Virtual Account atau QRIS.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mb-6 shadow-sm">
              <ClipboardCheck className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-warning mb-2">Langkah 3</span>
            <h3 className="text-lg font-bold text-primary mb-2">Pantau Laporan</h3>
            <p className="text-sm text-secondary leading-relaxed max-w-xs">
              Terima perkembangan penyaluran dana langsung secara transparan melalui kabar terbaru program.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
