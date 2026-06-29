import { motion } from 'motion/react';
import { ShieldCheck, Users, Target, Heart, Award, Globe, Rocket, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function About() {
  const values = [
    { title: 'Transparan', desc: 'Laporan penyaluran yang dapat diakses secara real-time oleh publik.', icon: ShieldCheck, color: 'emerald' },
    { title: 'Amanah', desc: 'Dikelola oleh tim profesional dengan pengawasan dewan syariah.', icon: Award, color: 'blue' },
    { title: 'Mudah', desc: 'Kemudahan berdonasi dengan berbagai metode pembayaran digital.', icon: Rocket, color: 'orange' },
    { title: 'Cepat', desc: 'Penyaluran dana ke sasaran secara sigap dan tepat sasaran.', icon: Target, color: 'red' },
  ];

  return (
    <div className="space-y-12 md:space-y-24 py-8 md:py-12">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">
            <Heart className="w-4 h-4" />
            Tentang Ruang Berbagi
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight">
            Menghubungkan <span className="text-emerald-600">Kebaikan</span> dengan <span className="text-emerald-600">Kepercayaan</span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Ruang Berbagi adalah platform digital yang berdedikasi untuk mentransformasi cara umat Islam menunaikan kewajiban Zakat, Wakaf, dan Sedekah melalui teknologi yang transparan dan akuntabel.
          </p>
          <div className="flex gap-8 border-t border-gray-100 pt-8">
            <div>
              <p className="text-2xl font-black text-emerald-600">100%</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Penyaluran</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">24/7</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monitoring</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">Secure</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment</p>
            </div>
          </div>
        </div>
        <div className="relative aspect-square bg-emerald-100 md:rounded-[4rem] rounded-[2.5rem] overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=1200" 
            alt="Humanity" 
            className="w-full h-full object-cover mix-blend-multiply opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 to-transparent" />
        </div>
      </div>

      {/* Services Section */}
      <div className="space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">Layanan Kami</h3>
          <p className="text-gray-500">Kami menyediakan berbagai instrumen kebaikan yang disesuaikan dengan kebutuhan Anda sebagai muzakki dan donatur.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: 'Zakat Digital', desc: 'Hitung dan bayar zakat fitrah maupun zakat maal secara otomatis.', icon: ShieldCheck },
            { title: 'Wakaf Produktif', desc: 'Investasi akhirat melalui pembangunan sumur, masjid, hingga sekolah.', icon: Award },
            { title: 'Sedekah Jariyah', desc: 'Langkah sederhana yang mengalirkan pahala tak terputus.', icon: Heart },
            { title: 'Donasi Khusus', desc: 'Bantuan kemanusiaan darurat untuk bencana dan kesehatan.', icon: Globe },
          ].map((service, i) => (
            <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 hover:border-emerald-100 transition-all hover:shadow-xl hover:shadow-emerald-900/5 group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                <service.icon className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-emerald-950 md:rounded-[4rem] rounded-[2.5rem] p-8 md:p-20 text-white space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-4xl font-black tracking-tight leading-tight">Nilai-Nilai Utama <br /> Yang Kami Pegang</h3>
            <p className="text-emerald-100/60 leading-relaxed">
              Kepercayaan Anda adalah aset terbesar kami. Itulah mengapa Ruang Berbagi beroperasi dengan standar transparansi yang belum pernah ada sebelumnya di dunia filantropi Islam.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {values.map((v, i) => (
              <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                <v.icon className={cn("w-6 h-6 mb-4", `text-${v.color}-400`)} />
                <h5 className="font-bold text-sm mb-1">{v.title}</h5>
                <p className="text-[10px] text-emerald-100/50 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vision/Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 py-12">
        <div className="space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Rocket className="w-6 h-6 text-emerald-600" />
            Visi & Misi
          </h3>
          <div className="space-y-4">
            <p className="text-gray-500 leading-relaxed">
              <strong>Visi:</strong> Menjadi jembatan kebaikan digital terpercaya nomor satu di Indonesia yang mampu memberdayakan umat secara mandiri dan berkelanjutan.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-700">Misi Kami:</p>
              {[
                'Mendigitalisasi pengelolaan dana filantropi Islam.',
                'Menyajikan laporan transparansi yang dapat divalidasi.',
                'Memberikan dampak nyata melalui penyaluran tepat sasaran.',
                'Mengedukasi umat tentang pentingnya berbagi secara rutin.'
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-gray-50/50 p-12 rounded-[3rem] border border-gray-100 space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-6 h-6 text-emerald-600" />
            Tim Kami
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Dikelola oleh gabungan praktisi teknologi dan ahli fiqh muamalah, Ruang Berbagi memastikan setiap proses telah sesuai dengan standar syariah namun tetap berada di garis terdepan inovasi digital.
          </p>
          <div className="grid grid-cols-3 gap-6 pt-4">
            {[
              { name: 'Dr. Ahmad Fauzi', pos: 'Dewan Syariah', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300' },
              { name: 'Siti Aminah', pos: 'Operasional', img: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=300' },
              { name: 'Budi Santoso', pos: 'Teknologi', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300' }
            ].map((member, i) => (
              <div key={i} className="space-y-3 text-center group">
                <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 shadow-sm border-2 border-white group-hover:border-emerald-100 group-hover:shadow-xl group-hover:shadow-emerald-900/5">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-900 leading-tight">{member.name}</p>
                  <p className="text-[8px] text-emerald-600 uppercase font-black tracking-widest mt-0.5">{member.pos}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
