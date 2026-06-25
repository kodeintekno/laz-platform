import React from 'react';
import { motion } from 'motion/react';
import { MousePointer2, CreditCard, HeartHandshake, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: MousePointer2,
    title: 'Pilih Program',
    desc: 'Temukan berbagai inisiatif kebaikan yang ingin Anda dukung.',
    color: 'emerald'
  },
  {
    icon: CreditCard,
    title: 'Donasi Mudah',
    desc: 'Lakukan pembayaran melalui berbagai metode yang tersedia.',
    color: 'blue'
  },
  {
    icon: HeartHandshake,
    title: 'Dana Disalurkan',
    desc: 'Kami menyalurkan titipan Anda langsung ke penerima manfaat.',
    color: 'orange'
  },
  {
    icon: CheckCircle2,
    title: 'Laporan Real-time',
    desc: 'Pantau status dan bukti penyaluran secara transparan.',
    color: 'emerald'
  }
];

export default function HowItWorks() {
  return (
    <div className="py-20 md:py-24">
      <div className="text-center space-y-4 mb-20 text-balance">
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
          Langkah Mudah <span className="text-emerald-600">Berbagi</span>
        </h2>
        <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium leading-relaxed">
          Sistem kami dirancang untuk memastikan setiap langkah kebaikan Anda tercatat dan tersalurkan dengan tepat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all hover:-translate-y-1"
          >
            <div className="absolute top-6 right-8 text-4xl font-black text-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
              0{i + 1}
            </div>
            <div className={`w-14 h-14 rounded-2xl bg-${step.color}-50 text-${step.color}-600 flex items-center justify-center mb-6`}>
              <step.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
