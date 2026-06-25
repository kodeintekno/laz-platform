import { motion } from 'motion/react';
import { X, Shield, HelpCircle, Book, MessageSquare, Info } from 'lucide-react';
import type { ReactNode } from 'react';

export function TermsContent() {
  const sections = [
    {
      title: "Ketentuan Umum",
      content: "Ruang Berbagi adalah platform donasi online yang memfasilitasi penggalangan dana untuk kegiatan kemanusiaan, wakaf, pendidikan, dan kesehatan. Dengan menggunakan platform ini, Anda setuju untuk mematuhi seluruh syarat dan ketentuan yang berlaku."
    },
    {
      title: "Kebijakan Donasi",
      content: "Setiap donasi yang masuk akan diproses secara transparan. Donatur akan mendapatkan konfirmasi melalui email. Donasi yang telah masuk tidak dapat dibatalkan atau ditarik kembali, kecuali terjadi kesalahan sistem yang terbukti."
    },
    {
      title: "Transparansi & Laporan",
      content: "Kami berkomitmen untuk memberikan laporan penyaluran dana secara berkala pada setiap program kampanye. Admin berhak mengupdate progres penyaluran sebagai bentuk pertanggungjawaban kepada donatur."
    }
  ];

  return (
    <div className="space-y-8 py-4">
      {sections.map((s, i) => (
        <div key={i} className="space-y-3">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            {s.title}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">{s.content}</p>
        </div>
      ))}
    </div>
  );
}

export function HelpContent() {
  const faqs = [
    { q: "Bagaimana cara berdonasi?", a: "Klik tombol 'Donasi Sekarang' pada program yang ingin Anda bantu, pilih metode pembayaran, dan ikuti instruksi yang muncul." },
    { q: "Apakah donasi saya tercatat?", a: "Ya, setiap donasi akan tercatat secara otomatis dan Anda akan menerima email konfirmasi serta ID Transaksi." },
    { q: "Apa itu Donatur Terverifikasi?", a: "Status yang diberikan kepada pengguna yang telah login dan melakukan transaksi secara berkala untuk menjaga integritas komunitas." }
  ];

  return (
    <div className="space-y-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
          <Book className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
          <div>
            <h5 className="font-bold text-emerald-900 text-sm">Panduan Donasi</h5>
            <p className="text-xs text-emerald-700/70 mt-1">Pelajari langkah mudah berbagi kebaikan di platform kami.</p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
          <MessageSquare className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <div>
            <h5 className="font-bold text-blue-900 text-sm">Hubungi CS</h5>
            <p className="text-xs text-blue-700/70 mt-1">WhatsApp kami tersedia 24/7 untuk membantu kendala Anda.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          Pertanyaan Umum (FAQ)
        </h4>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
              <p className="font-bold text-gray-900 text-sm italic">"{f.q}"</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ModalProps {
  key?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function LegalModal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[3.5rem] shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>

        <div className="p-8 border-t border-gray-50 bg-gray-50 shrink-0 text-center">
          <p className="text-xs text-gray-400 font-medium italic">"Terakhir diperbarui: 06 Mei 2024 • Ruang Berbagi Foundation"</p>
        </div>
      </motion.div>
    </div>
  );
}
