import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Droplets, BookOpen, HeartPulse, HandHeart, Info } from 'lucide-react';

export default function ImpactSummary({ donorCount = 0 }: { donorCount?: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const stats = [
    { 
      label: 'Donatur Terverifikasi', 
      value: `${(15000 + donorCount).toLocaleString('id-ID')}+`, 
      icon: Users, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      description: 'Jumlah individu yang telah menyalurkan donasi melalui platform kami.'
    },
    { 
      label: 'Penerima Manfaat', 
      value: '45,000+', 
      icon: HandHeart, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      description: 'Total individu yang telah menerima bantuan dari berbagai program sosial.'
    },
    { 
      label: 'Sumur Wakaf', 
      value: '120+', 
      icon: Droplets, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      description: 'Penyediaan sumber air bersih untuk masyarakat di daerah kekeringan.'
    },
    { 
      label: 'Beasiswa Pendidikan', 
      value: '2,500+', 
      icon: BookOpen, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      description: 'Bantuan biaya pendidikan untuk pelajar berprestasi dari keluarga kurang mampu.'
    },
    { 
      label: 'Bantuan Kesehatan', 
      value: '8,400+', 
      icon: HeartPulse, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50',
      description: 'Layanan pengobatan dan bantuan fasilitas kesehatan untuk kaum dhuafa.'
    },
  ];

  return (
    <div className="py-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={`stat-${i}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all text-center space-y-4 relative group"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mx-auto shadow-inner relative group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
              <p className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
            </div>

            <AnimatePresence>
              {hoveredIndex === i && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-1/2 -translate-x-1/2 -top-2 w-48 p-3 bg-gray-900 text-white text-[10px] rounded-xl shadow-2xl z-50 pointer-events-none"
                  style={{ transform: 'translate(-50%, -100%)' }}
                >
                  <p className="leading-relaxed font-medium">
                    {stat.description}
                  </p>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
