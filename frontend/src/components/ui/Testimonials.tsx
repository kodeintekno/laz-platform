import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      name: "Hj. Rahmawati",
      role: "Wirausaha",
      content: "Alhamdulillah, melalui platform ini saya bisa menyalurkan zakat maal dengan tenang karena laporannya sangat transparan dan real-time.",
      img: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Bpk. Subarkah",
      role: "Karyawan Swasta",
      content: "Sangat dimudahkan dengan kalkulator zakatnya. Program wakaf sumurnya juga sangat mulia, semoga menjadi amal jariyah untuk kita semua.",
      img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Ibu Siti Mariam",
      role: "Ibu Rumah Tangga",
      content: "Donasi sekecil apapun terasa sangat dihargai di sini. Notifikasi penyaluran dananya membuat hati tenang bahwa amanah sudah sampai.",
      img: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=200"
    }
  ];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Kisah Para <span className="text-emerald-600">Donatur</span></h2>
        <p className="text-gray-500 max-w-lg mx-auto font-medium">Pengalaman mereka yang telah bergabung dalam langkah kebaikan ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 relative group hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
          >
            <div className="absolute top-8 right-8 text-emerald-100 group-hover:text-emerald-200 transition-colors">
              <Quote className="w-10 h-10 fill-current" />
            </div>
            
            <p className="text-gray-600 italic leading-relaxed relative z-10">"{t.content}"</p>
            
            <div className="flex items-center gap-4">
              <img src={t.img} alt={t.name} className="w-12 h-12 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all shadow-sm" />
              <div>
                <p className="text-sm font-bold text-gray-900">{t.name}</p>
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
