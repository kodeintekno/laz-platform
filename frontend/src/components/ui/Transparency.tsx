import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { formatCurrency, cn } from '@/lib/utils';
import { ShieldCheck, BarChart3, Users, Download, CheckCircle2, Info, Search, Send, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BeneficiaryImpactReport from './BeneficiaryImpactReport';

const DONATION_STATUS_LABEL: Record<string, string> = {
  PAID: 'Berhasil',
  PENDING: 'Menunggu Pembayaran',
  FAILED: 'Gagal',
  EXPIRED: 'Kedaluwarsa',
};

export default function Transparency() {
  const [globalStats] = useState({ totalRaised: 1250000000, totalDistributed: 980000000, donorCount: 15420 });

  // Search state
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const phone = searchPhone.trim();
      const [donationsRes, distributionsRes] = await Promise.all([
        api.get<any[]>('/donations/history', { phone, limit: 50 }),
        api.get<any[]>('/distributions/history', { phone, limit: 50 }),
      ]);
      setSearchResult({ donations: donationsRes.data, distributions: distributionsRes.data });
    } catch (err: any) {
      setSearchError(err?.message ?? 'Format nomor WhatsApp tidak valid');
    } finally {
      setIsSearching(false);
    }
  };

  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [isGeneralLoading, setIsGeneralLoading] = useState(false);

  const handleGeneralDownload = async () => {
    setIsGeneralLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGeneralLoading(false);
  };

  const handleDownload = async (index: number, title: string) => {
    setDownloadingIndex(index);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDownloadingIndex(null);
  };

  const reports = [
    { title: 'Laporan Tahunan 2023', size: '2.4 MB', date: 'Maret 2024', type: 'Annual' },
    { title: 'Laporan Kuartal IV 2023', size: '1.8 MB', date: 'Januari 2024', type: 'Quarterly' },
    { title: 'Laporan Ramadhan 1445H', size: '3.1 MB', date: 'April 2024', type: 'Special' },
    { title: 'Laporan Dampak Sosial', size: '4.5 MB', date: 'Mei 2024', type: 'Impact' },
  ];

  const recentDonations = [
    { id: '1', donorName: 'Hamba Allah', amount: 500000, type: 'zakat', message: 'Semoga berkah untuk semuanya' },
    { id: '2', donorName: 'Budi Santoso', amount: 1000000, type: 'sedekah', message: 'Titip doa untuk keluarga' },
    { id: '3', donorName: 'Hamba Allah', amount: 250000, type: 'wakaf', message: '' },
    { id: '4', donorName: 'Siti Aminah', amount: 150000, type: 'donasi', message: 'Semoga bermanfaat' },
    { id: '5', donorName: 'Hamba Allah', amount: 3000000, type: 'zakat', message: 'Zakat maal keluarga' }
  ];

  return (
    <div className="space-y-16">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Transparansi & Laporan Publik</h2>
        <p className="text-gray-500">Keterbukaan adalah pondasi utama kami. Pantau setiap rupiah yang masuk dan keluar secara real-time.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {[
          { label: 'Total Dana Terkumpul', value: formatCurrency(globalStats.totalRaised), icon: BarChart3, color: 'emerald' },
          { label: 'Total Dana Disalurkan', value: formatCurrency(globalStats.totalDistributed), icon: CheckCircle2, color: 'blue' },
          { label: 'Total Donatur Unik', value: globalStats.donorCount.toLocaleString('id-ID'), icon: Users, color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", `bg-${stat.color}-50 text-${stat.color}-600`)}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <BeneficiaryImpactReport />

      {/* Public Reports Archive Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Download className="w-6 h-6 text-emerald-600" />
            Arsip Laporan Publik Berkala
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diperbarui setiap bulan</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reports.map((report, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-emerald-500 transition-all flex flex-col gap-4 group">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">{report.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{report.date}</span>
                  <span className="px-2 py-0.5 bg-gray-50 text-[8px] font-bold text-gray-400 rounded uppercase tracking-tighter border border-gray-100">{report.type}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDownload(i, report.title)}
                disabled={downloadingIndex !== null}
                className="w-full mt-2 bg-gray-50 text-emerald-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {downloadingIndex === i ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    Unduh PDF
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Distribution Records - Now Private Lookup */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Riwayat Donasi &amp; Penyaluran Dana Anda
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Demi menjaga kehormatan dan privasi penerima manfaat, laporan detil donasi dan penyaluran dana hanya diberikan kepada donatur terkait melalui verifikasi nomor WhatsApp.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative group">
            <input 
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Masukkan nomor WhatsApp Anda..."
              className="w-full bg-white border border-gray-100 rounded-3xl py-6 pl-14 pr-32 text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSearching ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-3 h-3" />}
              Cek Laporan
            </button>
          </form>

          <div className="space-y-4 min-h-[300px]">
            <AnimatePresence mode="wait">
              {!searchResult && !isSearching && !searchError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 text-gray-400 space-y-4"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-gray-200">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <p className="text-sm italic">Silakan masukkan nomor WhatsApp yang Anda gunakan saat berdonasi untuk melihat laporan penyaluran dana Anda.</p>
                </motion.div>
              )}

              {searchError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-12 text-center bg-red-50 rounded-[2.5rem] border border-red-100 text-red-500 space-y-2"
                >
                  <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-bold">Nomor Tidak Valid</p>
                  <p className="text-xs opacity-80">{searchError}</p>
                </motion.div>
              )}

              {searchResult && searchResult.donations.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-12 text-center bg-red-50 rounded-[2.5rem] border border-red-100 text-red-500 space-y-2"
                >
                  <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-bold">Data Tidak Ditemukan</p>
                  <p className="text-xs opacity-80">Maaf, kami tidak menemukan riwayat donasi untuk nomor ini. Pastikan nomor yang Anda masukkan sudah benar.</p>
                </motion.div>
              )}

              {searchResult && searchResult.donations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {searchResult.donations.map((d: any) => (
                    <div
                      key={d.id}
                      className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            to={`/programs/${d.program?.slug}`}
                            className="font-bold text-gray-900 text-sm hover:text-emerald-600 transition-colors"
                          >
                            {d.program?.title}
                          </Link>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            {d.lembaga?.name}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-gray-50 text-[8px] font-bold text-gray-400 rounded uppercase tracking-tighter border border-gray-100 shrink-0">
                          {DONATION_STATUS_LABEL[d.status] ?? d.status}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="text-lg font-black text-emerald-600">{formatCurrency(Number(d.amount))}</p>
                        <p className="text-[10px] text-gray-400 font-bold">
                          {new Date(d.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' } as any)}
                        </p>
                      </div>
                      {d.message && (
                        <p className="text-xs italic bg-gray-50 p-2 rounded-lg text-gray-500">"{d.message}"</p>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {searchResult && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Riwayat Penyaluran Dana
              </h4>
              {searchResult.distributions.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 text-gray-400">
                  <p className="text-sm italic">Belum ada riwayat penyaluran dana dari lembaga yang Anda donasikan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResult.distributions.map((dist: any) => (
                    <div
                      key={dist.id}
                      className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{dist.title}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            {dist.program?.title} &middot; {dist.lembaga?.name}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{dist.description}</p>
                      <div className="flex items-end justify-between">
                        <p className="text-lg font-black text-emerald-600">{formatCurrency(Number(dist.amount))}</p>
                        <p className="text-[10px] text-gray-400 font-bold">
                          {new Date(dist.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' } as any)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Donasi Terbaru
          </h3>
          <div className="bg-emerald-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-emerald-100 space-y-6">
            {recentDonations.map((donation, i) => (
              <motion.div 
                key={donation.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 items-start border-b border-emerald-900 pb-6 last:border-0 last:pb-0"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold">{donation.donorName}</p>
                    <p className="text-xs font-mono text-emerald-400">{formatCurrency(donation.amount)}</p>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest">{donation.type}</p>
                  {donation.message && (
                    <p className="text-xs italic bg-emerald-900/50 p-2 rounded-lg mt-2 text-emerald-300">
                      "{donation.message}"
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
