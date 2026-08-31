import { Wallet, HeartHandshake, CalendarRange, Users } from "lucide-react";

interface ImpactStatsProps {
  totalDonations: number;
  totalDistributed: number;
  activePrograms: number;
  totalDonors: number;
}

export function ImpactStats({
  totalDonations,
  totalDistributed,
  activePrograms,
  totalDonors,
}: ImpactStatsProps) {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="bg-gradient-to-br from-brand-primary to-brand-secondary text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Dampak Kebaikan Bersama
          </h2>
          <p className="mt-4 text-base text-surface-soft/80">
            Amanah zakat dan Infak/Sedekah Anda yang telah kami salurkan untuk kesejahteraan umat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Wallet className="w-6 h-6 text-brand-soft" />
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-soft/75 uppercase tracking-wide">Total Dana Terkumpul</p>
              <h3 className="text-xl font-bold mt-1">{formatRupiah(totalDonations)}</h3>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <HeartHandshake className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-soft/75 uppercase tracking-wide">Total Disalurkan</p>
              <h3 className="text-xl font-bold mt-1">{formatRupiah(totalDistributed)}</h3>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <CalendarRange className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-soft/75 uppercase tracking-wide">Program Kebaikan</p>
              <h3 className="text-xl font-bold mt-1">{activePrograms} Program</h3>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Users className="w-6 h-6 text-info-token" />
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-soft/75 uppercase tracking-wide">Donatur Aktif</p>
              <h3 className="text-xl font-bold mt-1">{totalDonors} Jiwa</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
