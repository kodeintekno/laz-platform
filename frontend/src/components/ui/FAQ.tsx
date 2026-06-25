import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Bagaimana cara kerja transparansi di Ruang Berbagi?",
      a: "Setiap donasi yang masuk diverifikasi secara otomatis oleh sistem. Penyalurannya didokumentasikan dengan foto dan bukti kuitansi yang dapat diakses oleh donatur melalui menu Transparansi atau Dashboard secara real-time."
    },
    {
      q: "Apakah dana donasi dikenakan biaya administrasi?",
      a: "Kami mengambil maksimal 5-10% untuk biaya operasional platform dan amilin, kecuali program darurat kemanusiaan yang disalurkan 100%. Detail biaya per program bisa dilihat di deskripsi masing-masing kampanye."
    },
    {
      q: "Bagaimana jika saya ingin donasi secara anonim?",
      a: "Saat melakukan donasi, Anda dapat mencentang opsi 'Sembunyikan nama saya'. Di daftar donatur publik, nama Anda akan muncul sebagai 'Hamba Allah'. Namun, laporan resmi untuk Anda tetap tersedia di dashboard pribadi."
    },
    {
      q: "Apakah Ruang Berbagi memiliki izin resmi?",
      a: "Ya, kami beroperasi di bawah pengawasan BAZNAS dan Kementerian Agama RI sebagai Lembaga Amil Zakat yang resmi dan terakreditasi."
    }
  ];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">
          <HelpCircle className="w-3 h-3" />
          Tanya Jawab
        </div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Sering <span className="text-purple-600">Ditanyakan</span></h2>
        <p className="text-gray-500 max-w-lg mx-auto font-medium">Bantu menjawab keraguan Anda sebelum melangkah dalam kebaikan.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-bold text-gray-900">{faq.q}</span>
              <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300", openIndex === i && "rotate-180")} />
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
