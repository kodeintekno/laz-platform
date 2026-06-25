import { motion } from 'motion/react';
import { Heart, ShieldCheck, ArrowRight, TrendingUp, Users } from 'lucide-react';

export default function Hero({ onAction }: { onAction: () => void }) {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background Documentation Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1593113598332-901416e788ee?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-[0.03] grayscale brightness-50"
          alt="Documentation Background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white" />
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[100px] opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.05]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 md:pt-8 md:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        <div className="space-y-8 md:space-y-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 px-5 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.25em]">Filantropi Digital Terpercaya</span>
          </motion.div>
          
          <div className="space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black text-gray-900 leading-[0.95] tracking-tighter"
            >
              Berbagi <br />
              <span className="text-emerald-600">Tanpa Batas.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-500 max-w-lg leading-relaxed font-medium"
            >
              Ubah niat baik menjadi dampak nyata. Platform transparan untuk Zakat, Infaq, dan Sedekah yang amanah dan tercatat secara real-time.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <button 
              onClick={onAction}
              className="group w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Donasi Sekarang
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex flex-col gap-2">
              <div className="flex -space-x-3">
                {[
                  "https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80&w=100",
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
                  "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=100",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
                ].map((img, i) => (
                  <img 
                    key={i}
                    src={img} 
                    alt="Donator" 
                    className="w-10 h-10 rounded-full border-4 border-white object-cover shadow-sm"
                  />
                ))}
                <div className="w-10 h-10 rounded-full border-4 border-white bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600 shadow-sm">
                  +12k
                </div>
              </div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center sm:text-left">
                Dipercaya oleh 12,450+ Orng Baik
              </p>
            </div>
          </motion.div>
        </div>

        <div className="relative lg:scale-100 xl:scale-105">
          <div className="absolute -inset-10 bg-emerald-600/5 rounded-[5rem] rotate-6 blur-3xl" />
          <div className="relative grid grid-cols-2 gap-6">
            <div className="space-y-6 pt-20">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="aspect-[4/5] bg-gray-100 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl shadow-emerald-900/10"
              >
                <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Impact" />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-emerald-900/5 space-y-4"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dana Terkumpul</p>
                  <p className="text-2xl font-black text-gray-900">Rp 12.5M+</p>
                </div>
              </motion.div>
            </div>
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200/50 space-y-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-100/60 uppercase tracking-widest">Penerima Manfaat</p>
                  <p className="text-2xl font-black italic">45,000+</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="aspect-[4/5] bg-gray-100 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl shadow-emerald-900/10"
              >
                <img src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb8?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Community" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
