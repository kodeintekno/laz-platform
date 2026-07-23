import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MapPin, 
  HeartHandshake, 
  Sparkles, 
  TrendingUp, 
  BookOpen, 
  Heart, 
  Coins, 
  Droplet, 
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ImpactStory {
  id: string;
  category: 'pendidikan' | 'kesehatan' | 'ekonomi' | 'kemanusiaan';
  title: string;
  location: string;
  beneficiariesCount: string;
  aidType: string;
  beneficiaryName: string;
  beneficiaryRole: string;
  story: string;
  img: string;
  distributedAmount: number;
  date: string;
}

const stories: ImpactStory[] = [
  {
    id: '1',
    category: 'pendidikan',
    title: 'Beasiswa Mentari Pelosok Negeri',
    location: 'Sleman, D.I. Yogyakarta',
    beneficiariesCount: '150 Anak Yatim & Dhuafa',
    aidType: 'Paket Beasiswa, Perlengkapan Sekolah & Saku Bulanan',
    beneficiaryName: 'Dafi Al-Ghifari',
    beneficiaryRole: 'Penerima Beasiswa SD Kelas 4',
    story: 'Semenjak ayah meninggal, ibu harus bekerja sendirian serabutan keliling. Beasiswa ini membuat saya tidak perlu takut putus sekolah dan bisa mewujudkan cita-cita membuat rumah untuk Ibu.',
    img: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=300',
    distributedAmount: 45000000,
    date: 'Mei 2026'
  },
  {
    id: '2',
    category: 'kemanusiaan',
    title: 'Sumur Bor & Sanitasi Air Bersih',
    location: 'Gunung Kidul, Yogyakarta',
    beneficiariesCount: '250 Kepala Keluarga (KK)',
    aidType: 'Pengeboran Air 120m, Pompa Submersible & Pipanisasi',
    beneficiaryName: 'Mbah Karto Suwiryo',
    beneficiaryRole: 'Tokoh Masyarakat Desa Panggang',
    story: 'Setiap musim kemarau panjang, kami terpaksa menjual ternak untuk membeli tanki air bersih. Air sumur bor ini mengalir jernih langsung ke masjid dan rumah-rumah warga. Alhamdulillah, beban kami dicabut.',
    img: 'https://images.unsplash.com/photo-1541976844346-f18aeac57b06?auto=format&fit=crop&q=80&w=300',
    distributedAmount: 78000000,
    date: 'April 2026'
  },
  {
    id: '3',
    category: 'ekonomi',
    title: 'Pemberdayaan Modal Koperasi Syariah Mandiri',
    location: 'Soreang, Kab. Bandung',
    beneficiariesCount: '35 Pelaku UMKM Mikro',
    aidType: 'Gerobak Usaha Baru & Modal Tanpa Bunga Rp 3-5 Juta/UMKM',
    beneficiaryName: 'Pak Joko',
    beneficiaryRole: 'Pedagang Bakso Keliling',
    story: 'Gerobak lama saya sudah rapuh dan modal habis untuk kebutuhan sehari-hari. Berkat bantuan ini, gerobak saya sekarang kokoh, bersih, dan dagangan semakin ramai berkah pinjaman modal tanpa bunga ini.',
    img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=300',
    distributedAmount: 52500000,
    date: 'Maret 2026'
  },
  {
    id: '4',
    category: 'kesehatan',
    title: 'Klinik Apung Kesehatan Gratis Pesisir',
    location: 'Cilincing, Jakarta Utara',
    beneficiariesCount: '620 Nelayan & Buruh Cuci',
    aidType: 'Pemeriksaan Dokter Spesialis, USG Gratis & Edukasi Gizi Anak',
    beneficiaryName: 'Ibu Aminah',
    beneficiaryRole: 'Ibu Rumah Tangga & Buruh Cuci',
    story: 'Klinik apung ini datang memberi resep obat, asupan vitamin tambahan untuk anak kami, dan dokter memeriksa tekanan darah saya secara ramah tanpa memungut biaya sepeser pun. Sangat menolong rakyat kecil.',
    img: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=300',
    distributedAmount: 64000000,
    date: 'Mei 2026'
  }
];

export default function BeneficiaryImpactReport() {
  const [filter, setFilter] = useState<'semua' | 'pendidikan' | 'kesehatan' | 'ekonomi' | 'kemanusiaan'>('semua');
  const [activeStory, setActiveStory] = useState<string>('1');

  const filteredStories = filter === 'semua' ? stories : stories.filter(s => s.category === filter);
  const selectedStory = stories.find(s => s.id === activeStory) || stories[0];

  const totalAggregatedBeneficiaries = "1.650+ Jiwa";
  const totalLocations = "4 Wilayah Provinsi";
  const totalAidDistributed = 240000000;

  return (
    <div className="space-y-10">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-emerald-700/15 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="space-y-4 relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-widest leading-none">
            <Sparkles className="w-3.5 h-3.5" />
            Laporan Realisasi Dampak
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none">Transparansi Penyaluran Dana</h2>
          <p className="text-emerald-100 text-sm leading-relaxed font-medium">
            Lihat ke mana setiap rupiah donasi Anda mengalir. Kami berkomitmen menyalurkan amanah secara cepat, berkala, dan terdokumentasi rapi.
          </p>
        </div>
        
        {/* Metric Overview cards */}
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-1">
            <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Penerima Manfaat</p>
            <p className="text-xl font-black">{totalAggregatedBeneficiaries}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-1">
            <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Dana Tersalurkan</p>
            <p className="text-xl font-black">{formatCurrency(totalAidDistributed)}</p>
          </div>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap items-center gap-2.5 pb-2 border-b border-gray-100">
        {[
          { id: 'semua', label: 'Semua Dampak', icon: TrendingUp },
          { id: 'pendidikan', label: 'Pendidikan', icon: BookOpen },
          { id: 'kesehatan', label: 'Kesehatan', icon: Heart },
          { id: 'ekonomi', label: 'UMKM & Ekonomi', icon: Coins },
          { id: 'kemanusiaan', label: 'Kemanusiaan / Air', icon: Droplet },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => {
              setFilter(btn.id as any);
              const firstMatch = btn.id === 'semua' ? stories[0] : stories.find(s => s.category === btn.id);
              if (firstMatch) setActiveStory(firstMatch.id);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
              filter === btn.id
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-white border-gray-100 text-gray-500 hover:text-gray-900 shadow-sm'
            }`}
          >
            <btn.icon className="w-4 h-4" />
            {btn.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Story List */}
        <div className="lg:col-span-5 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Program Yang Terealisasi</p>
          <div className="space-y-3">
            {filteredStories.map((story) => (
              <button
                key={story.id}
                onClick={() => setActiveStory(story.id)}
                className={`w-full text-left p-5 rounded-[2rem] border transition-all flex items-center justify-between gap-4 ${
                  activeStory === story.id
                    ? 'bg-emerald-50/50 border-emerald-500 shadow-sm ring-1 ring-emerald-500/10'
                    : 'bg-white border-gray-100 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    story.category === 'pendidikan' ? 'bg-blue-50 text-blue-700' :
                    story.category === 'kesehatan' ? 'bg-red-50 text-red-700' :
                    story.category === 'ekonomi' ? 'bg-amber-50 text-amber-700' :
                    'bg-cyan-50 text-cyan-700'
                  }`}>
                    {story.category}
                  </span>
                  <h4 className="font-bold text-gray-950 text-sm leading-tight">{story.title}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                    {story.location}
                  </div>
                </div>
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-gray-100 shrink-0 text-emerald-600 shadow-sm">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Detailed Narrative Dashboard */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedStory.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-xl shadow-gray-100/40 space-y-8"
            >
              {/* Report Metrics Block */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-50">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Realisasi Program</span>
                  <h3 className="text-xl font-black text-gray-950">{selectedStory.title}</h3>
                </div>
                <div className="bg-emerald-50 border border-emerald-100/50 px-5 py-3 rounded-2xl">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Penyaluran Dana</p>
                  <p className="text-lg font-black text-emerald-900 leading-none">{formatCurrency(selectedStory.distributedAmount)}</p>
                </div>
              </div>

              {/* Rincian Penyaluran */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Penerima Manfaat</h5>
                      <p className="text-sm font-bold text-gray-900">{selectedStory.beneficiariesCount}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lokasi Penyaluran</h5>
                      <p className="text-sm font-bold text-gray-900">{selectedStory.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                      <HeartHandshake className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Jenis Bantuan</h5>
                      <p className="text-xs font-bold text-gray-900 pb-1 leading-relaxed">{selectedStory.aidType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Badge / Seal of transparency */}
              <div className="flex items-center gap-2 bg-blue-50/50 text-blue-900 text-xs py-3 px-5 rounded-2xl border border-blue-100/50">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Laporan disetujui, ditinjau secara berkala, dan didokumentasikan di bawah nomor audit <strong>RB-{selectedStory.date.replace(' ', '')}</strong>.
                </span>
              </div>

              {/* Beneficiary Testimonial Story */}
              <div className="space-y-4 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 text-emerald-600">
                  <MessageSquare className="w-4.5 h-4.5" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Kisah Penerima Manfaat</h4>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-emerald-50/20 p-6 rounded-3xl border border-emerald-600/5">
                  <img 
                    src={selectedStory.img} 
                    alt={selectedStory.beneficiaryName} 
                    className="w-20 h-20 rounded-2xl object-cover shadow-md border border-white"
                  />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm italic text-gray-700 leading-relaxed">
                      "{selectedStory.story}"
                    </p>
                    <div>
                      <h5 className="text-sm font-black text-gray-900">{selectedStory.beneficiaryName}</h5>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{selectedStory.beneficiaryRole}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
