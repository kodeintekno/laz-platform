import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  ShieldCheck, 
  BarChart3, 
  TrendingUp, 
  ChevronDown, 
  Globe,
  Smartphone,
  Apple,
  Heart,
  Wallet,
  Award
} from "lucide-react";
import { motion } from "motion/react";

import Hero from "@/components/ui/Hero";
import CampaignGrid from "@/components/ui/CampaignGrid";
import ImpactSummary from "@/components/ui/ImpactSummary";
import HowItWorks from "@/components/ui/HowItWorks";
import FeatureGrid from "@/components/ui/FeatureGrid";
import Transparency from "@/components/ui/Transparency";
import ImpactGallery from "@/components/ui/ImpactGallery";
import FAQ from "@/components/ui/FAQ";
import Testimonials from "@/components/ui/Testimonials";

export function HomePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const { data: programsResult } = useQuery({
    queryKey: ["public", "programs"],
    queryFn: () => api.get<any[]>("/public/programs"),
  });

  const { data: statsResult } = useQuery({
    queryKey: ["public", "stats"],
    queryFn: () => api.get<any>("/public/stats"),
  });

  const categories = [
    { id: 'semua', label: 'Semua', icon: Globe },
    { id: 'zakat', label: 'Zakat', icon: ShieldCheck },
    { id: 'wakaf', label: 'Wakaf', icon: Award },
    { id: 'sedekah', label: 'Sedekah', icon: Heart },
    { id: 'donasi', label: 'Donasi', icon: Wallet },
  ];

  const rawPrograms = programsResult?.data ?? [];
  const mappedCampaigns = rawPrograms.map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category.toLowerCase(),
    targetAmount: p.targetAmount,
    raisedAmount: p.currentAmount,
    distributedAmount: 0,
    status: 'active' as const,
    thumbnail: p.imageUrl,
    createdAt: p.createdAt,
    slug: p.slug
  }));

  const filteredCampaigns = mappedCampaigns.filter((c: any) => selectedCategory === 'semua' || c.category === selectedCategory);

  return (
    <div className="space-y-16 md:space-y-24 overflow-hidden pt-4 bg-[#f8faf9]">
      <Hero onAction={() => {
        const campaignSection = document.getElementById('programs');
        campaignSection?.scrollIntoView({ behavior: 'smooth' });
      }} />

      <div className="-mt-16 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ImpactSummary />
      </div>

      {/* Trust Bar / Logo Cloud */}
      <div className="py-12 border-y border-gray-100 bg-white/50 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Didukung & Diawasi Oleh</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {['BAZNAS', 'KEMENAG', 'OJK', 'ISO 9001', 'MUI'].map((label) => (
              <div key={label} className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HowItWorks />
      </div>

      <div id="programs" className="scroll-mt-32 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100"
            >
              <TrendingUp className="w-3 h-3" />
              Langkah Kebaikan
            </motion.div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">
              Program <span className="text-emerald-600">Terbaru</span>
            </h2>
            <p className="text-gray-500 max-w-lg font-medium text-sm leading-relaxed">
              Pilih program yang sesuai dengan niat Anda dan mari bantu sesama dengan cara yang paling bermakna.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group flex-1 md:flex-none">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-auto appearance-none bg-white border border-gray-100 rounded-2xl px-6 py-4 pr-12 text-xs font-black uppercase tracking-widest text-gray-900 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none min-w-[200px]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.id === 'semua' ? mappedCampaigns.length : mappedCampaigns.filter((c: any) => c.category === cat.id).length})
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 transition-transform group-hover:scale-110">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <div className="relative group flex-1 md:flex-none">
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="w-full md:w-auto appearance-none bg-white border border-gray-100 rounded-2xl px-6 py-4 pr-12 text-xs font-black uppercase tracking-widest text-gray-900 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none min-w-[200px]"
              >
                <option value="desc">Terbaru</option>
                <option value="asc">Terlama</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 transition-transform group-hover:scale-110">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {filteredCampaigns.length > 0 ? (
          <CampaignGrid 
            campaigns={filteredCampaigns} 
            onClick={(campaign) => navigate(`/programs/${campaign.slug}`)}
            onDonate={(campaign) => navigate(`/donate/${campaign.slug}`)} 
          />
        ) : (
          <div className="text-center py-40 bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <Globe className="w-8 h-8" />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Belum ada program aktif di kategori ini</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeatureGrid />
      </div>

      {/* Public Reports / Transparency CTA */}
      <div className="py-24 bg-emerald-950 rounded-[3rem] md:rounded-[4rem] text-center relative overflow-hidden max-w-7xl mx-4 xl:mx-auto px-6 md:px-12">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-900/50 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-800"
            >
              <ShieldCheck className="w-3 h-3" />
              Transparansi Penuh
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Amanah & <span className="text-emerald-400">Transparansi</span> <br /> Adalah Prioritas Kami
            </h2>
            <p className="text-emerald-100/60 text-base md:text-lg font-medium leading-relaxed">
              Setiap donasi Anda tercatat secara publik. Kami menyajikan laporan berkala yang dapat diakses oleh siapa saja sebagai bentuk pertanggungjawaban kami kepada umat.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              navigate('/reports');
            }}
            className="inline-flex items-center gap-3 bg-white text-emerald-950 px-8 py-4 md:px-12 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-emerald-400 hover:text-white transition-all shadow-2xl shadow-black/40"
          >
            <BarChart3 className="w-5 h-5" />
            Buka Laporan Publik
          </motion.button>
        </div>
      </div>

      <div className="pt-24 border-t border-gray-100 bg-gradient-to-b from-transparent to-emerald-50/30 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 mx-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            Kepercayaan Anda adalah Amanah Kami
          </motion.div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Transparansi Dan <br />
            <span className="text-emerald-600">Akuntabilitas Penuh</span>
          </h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto font-medium leading-relaxed">
            Setiap rupiah yang Anda donasikan tercatat secara otomatis dan dapat dipantau penyalurannya secara real-time melalui sistem kami.
          </p>
        </div>
        <Transparency />
          <div className="mt-20">
            <ImpactGallery />
          </div>
        </div>
      </div>

      <div className="py-24 bg-white/50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FAQ />
        </div>
      </div>

      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Testimonials />
      </div>

      {/* Download App Section */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-emerald-600 rounded-[3rem] overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-50" />
          
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-8 md:px-20 py-16 md:py-24">
            <div className="space-y-8">
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md"
                >
                  <Smartphone className="w-4 h-4" />
                  Kebaikan dalam Genggaman
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
                  Ibadah Lebih Tenang <br />
                  Dengan <span className="italic text-emerald-200">Aplikasi Kami</span>
                </h2>
                <p className="text-emerald-50 max-w-lg font-medium text-lg leading-relaxed opacity-80">
                  Dapatkan notifikasi real-time penyaluran donasi Anda, hitung zakat lebih mudah, dan temukan program kebaikan di mana pun Anda berada.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button className="flex-1 sm:flex-none min-w-[200px] flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-900/10 hover:-translate-y-1 transition-all duration-300">
                  <Apple className="w-6 h-6 shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-black tracking-widest leading-none">Download on</p>
                    <p className="text-lg leading-none mt-1">App Store</p>
                  </div>
                </button>
                <button className="flex-1 sm:flex-none min-w-[200px] flex items-center gap-3 bg-emerald-950 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-900/10 hover:-translate-y-1 transition-all duration-300 border border-white/10">
                  <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L18.66,14.05C20.44,13.03 20.44,10.97 18.66,9.95L16.81,8.88L14.4,11.29L16.81,15.12M4.54,2.15L14.4,12L16.81,9.59L4.54,2.15ZM4.54,21.85L16.81,14.41L14.4,12L4.54,21.85Z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-black tracking-widest leading-none">Get it on</p>
                    <p className="text-lg leading-none mt-1">Google Play</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative z-10 w-[320px] mx-auto overflow-hidden rounded-[3rem] border-8 border-emerald-950 shadow-2xl"
              >
                <img 
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800" 
                  className="w-full h-full object-cover" 
                  alt="App Preview" 
                />
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] -z-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
