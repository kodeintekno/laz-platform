import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Globe, Heart } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Keamanan Berlapis',
    desc: 'Setiap transaksi dilindungi sistem keamanan enkripsi terkini untuk menjamin keselamatan dana Anda.',
    color: 'emerald'
  },
  {
    icon: Zap,
    title: 'Penyaluran Cepat',
    desc: 'Kami memproses dan menyalurkan bantuan sesegera mungkin sesuai dengan urgensi kebutuhan di lapangan.',
    color: 'blue'
  },
  {
    icon: Globe,
    title: 'Transparansi Penuh',
    desc: 'Akses laporan penggunaan dana kapan saja secara publik melalui dashboard transparansi kami.',
    color: 'orange'
  },
  {
    icon: Heart,
    title: 'Berdampak Nyata',
    desc: 'Fokus pada hasil jangka panjang yang memberdayakan masyarakat agar bisa mandiri secara ekonomi.',
    color: 'red'
  }
];

export default function FeatureGrid() {
  return (
    <div className="relative py-24 border-t border-gray-100 overflow-hidden">
      {/* Visual Decor */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-50 rounded-full blur-[100px] opacity-40 -z-10" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-[1.1]">
              Kenapa Memilih <br />
              <span className="text-emerald-600">Ruang Berbagi?</span>
            </h2>
            <p className="text-lg text-gray-500 font-medium leading-relaxed">
              Kami bukan sekadar wadah donasi, tapi jembatan kebaikan yang mengutamakan amanah dan profesionalisme.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 shrink-0 rounded-2xl bg-${f.color}-50 text-${f.color}-600 flex items-center justify-center`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">{f.title}</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative aspect-square md:aspect-auto md:h-[600px]">
          <div className="absolute inset-0 bg-emerald-600 rounded-[3rem] -rotate-3 blur-3xl opacity-5" />
          <img 
            src="https://images.unsplash.com/photo-1593113598332-901416e788ee?auto=format&fit=crop&q=80&w=1200" 
            alt="Quality" 
            className="w-full h-full object-cover rounded-[3.5rem] shadow-2xl shadow-emerald-900/10 grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute -bottom-8 -right-8 p-8 bg-emerald-950 rounded-[2.5rem] text-white shadow-2xl hidden lg:block max-w-[280px]">
            <p className="text-3xl font-black italic mb-2">99%</p>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-relaxed">Tingkat Kepercayaan Donatur Kami di Seluruh Indonesia</p>
          </div>
        </div>
      </div>
    </div>
  );
}
