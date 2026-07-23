import { motion } from 'motion/react';
import { Camera } from 'lucide-react';

export default function ImpactGallery() {
  const images = [
    {
      url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800",
      caption: "Penyaluran Makanan Bergizi",
      category: "KEMANUSIAAN"
    },
    {
      url: "https://images.unsplash.com/photo-1541976844346-f18aeac57b06?auto=format&fit=crop&q=80&w=800",
      caption: "Pembangunan Sumur Wakaf",
      category: "WAKAF"
    },
    {
      url: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=800",
      caption: "Dukungan Pendidikan Anak",
      category: "PENDIDIKAN"
    },
    {
      url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800",
      caption: "Layanan Kesehatan Keliling",
      category: "KESEHATAN"
    }
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative rounded-[2.5rem] overflow-hidden bg-gray-100 aspect-[4/5] shadow-sm hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500"
          >
            <img 
              src={img.url} 
              alt={img.caption}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 md:p-8">
              <span className="text-[10px] font-black text-emerald-400 tracking-widest mb-2 px-3 py-1 bg-emerald-400/10 backdrop-blur-md rounded-full w-fit">
                {img.category}
              </span>
              <p className="text-white font-bold text-sm leading-tight">{img.caption}</p>
            </div>

            <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group flex items-center gap-2 px-8 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
        >
          Lihat Semua Dokumentasi
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            →
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}
