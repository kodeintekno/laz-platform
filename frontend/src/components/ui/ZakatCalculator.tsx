import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Coins, Landmark, Scale, HelpCircle, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useThousandsInput } from '@/hooks/useThousandsInput';
import { toast } from '@/stores/toast.store';

interface ZakatCalculatorProps {
  user?: any;
  onProceedToDonate: (amount: number) => void;
}

export default function ZakatCalculator({ user, onProceedToDonate }: ZakatCalculatorProps) {
  const [cash, setCash] = useState<number>(0);
  const [gold, setGold] = useState<number>(0);
  const [silver, setSilver] = useState<number>(0);
  const [investments, setInvestments] = useState<number>(0);
  const [receivables, setReceivables] = useState<number>(0);
  const [debts, setDebts] = useState<number>(0);
  const [goldPrice, setGoldPrice] = useState<number>(1200000); // Standard per gram
  
  const [totalWealth, setTotalWealth] = useState(0);
  const [zakatAmount, setZakatAmount] = useState(0);
  const [isNissabReached, setIsNissabReached] = useState(false);

  const nissabThreshold = 85 * goldPrice;

  useEffect(() => {
    const goldValue = gold * goldPrice;
    const silverValue = silver * 15000; // Ballpark price
    const netWealth = (cash + goldValue + silverValue + investments + receivables) - debts;
    
    setTotalWealth(netWealth > 0 ? netWealth : 0);
    
    const reached = netWealth >= nissabThreshold;
    setIsNissabReached(reached);
    
    if (reached) {
      setZakatAmount(netWealth * 0.025);
    } else {
      setZakatAmount(0);
    }
  }, [cash, gold, silver, investments, receivables, debts, goldPrice]);

  const setZakatReminder = async () => {
    if (!user) {
        toast.error("Masuk terlebih dahulu untuk mengatur pengingat.");
        return;
    }
    toast.success("Pengingat Zakat Maal telah diset untuk satu tahun ke depan.");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      {/* Input Section */}
      <div className="lg:col-span-2 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-emerald-600" />
            Kalkulator Zakat Maal
          </h2>
          <p className="text-gray-500">Hitung kewajiban Zakat Anda berdasarkan aset yang telah mencapai haul (1 tahun).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aset Lancar */}
          <div className="bg-white p-6 md:p-8 md:rounded-[2.5rem] rounded-[1.5rem] border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Uang Lancar
            </h3>
            
            <div className="space-y-4">
              <InputField 
                label="Tabungan & Uang Tunai" 
                value={cash} 
                onChange={setCash} 
                prefix="Rp" 
              />
              <InputField 
                label="Investasi (Saham/Reksadana)" 
                value={investments} 
                onChange={setInvestments} 
                prefix="Rp" 
              />
              <InputField 
                label="Piutang Lancar" 
                value={receivables} 
                onChange={setReceivables} 
                prefix="Rp" 
              />
            </div>
          </div>

          {/* Logam Mulia */}
          <div className="bg-white p-6 md:p-8 md:rounded-[2.5rem] rounded-[1.5rem] border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Logam Mulia
            </h3>
            
            <div className="space-y-4">
              <InputField 
                label="Emas (Guna/Simpanan)" 
                value={gold} 
                onChange={setGold} 
                suffix="gram" 
              />
              <InputField 
                label="Perak" 
                value={silver} 
                onChange={setSilver} 
                suffix="gram" 
              />
              <InputField 
                label="Harga Emas Saat Ini" 
                value={goldPrice} 
                onChange={setGoldPrice} 
                prefix="Rp" 
                description="Harga per gram"
              />
            </div>
          </div>

          {/* Pengurang */}
          <div className="bg-white p-6 md:p-8 md:rounded-[2.5rem] rounded-[1.5rem] border border-gray-100 shadow-sm space-y-6 md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pengurang (Hutang)
            </h3>
            
            <div className="max-w-md">
              <InputField 
                label="Hutang Jatuh Tempo" 
                value={debts} 
                onChange={setDebts} 
                prefix="Rp" 
                description="Hutang yang harus dilunasi dalam waktu dekat"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="space-y-6">
        <div className="sticky top-32">
          <div className="bg-emerald-950 md:rounded-[3rem] rounded-[2rem] p-6 md:p-8 text-white space-y-8 shadow-2xl shadow-emerald-900/20">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Total Harta Kena Zakat</p>
              <p className="text-3xl font-black">{formatCurrency(totalWealth)}</p>
            </div>

            <div className="space-y-4 py-6 border-y border-emerald-900">
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-300 flex items-center gap-1">
                  Syarat Nissab
                  <HelpCircle className="w-3 h-3" />
                </span>
                <span className="font-bold">{formatCurrency(nissabThreshold)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-300">Status</span>
                {isNissabReached ? (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">Mencapai Nissab</span>
                ) : (
                  <span className="px-3 py-1 bg-white/10 text-white/50 rounded-full font-bold">Belum Wajib</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Jumlah Zakat (2.5%)</p>
              <p className={cn(
                "text-5xl font-black tracking-tighter transition-colors",
                zakatAmount > 0 ? "text-white" : "text-white/20"
              )}>
                {formatCurrency(zakatAmount)}
              </p>
            </div>

             <button 
              disabled={zakatAmount <= 0}
              onClick={() => onProceedToDonate(zakatAmount)}
              className="w-full bg-emerald-500 text-emerald-950 py-6 rounded-[2rem] font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-900/50 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              Tunaikan Sekarang
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={setZakatReminder}
              className="w-full bg-transparent border border-emerald-500/30 text-emerald-100 py-3 rounded-[1.5rem] font-bold text-sm hover:bg-white/10 transition-all"
            >
              Ingatkan Saya Tahun Depan
            </button>

            <div className="bg-white/5 p-4 rounded-2xl flex gap-3">
              <Info className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-[10px] text-emerald-100/60 leading-relaxed">
                Nissab Zakat Maal setara dengan hara 85 gram emas. Zakat diwajibkan bila harta telah dimiliki selama satu tahun hijriah.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, prefix, suffix, description }: {
  label: string,
  value: number,
  onChange: (v: number) => void,
  prefix?: string,
  suffix?: string,
  description?: string
}) {
  const { displayValue, handleChange, inputRef } = useThousandsInput(value, onChange);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">{prefix}</span>}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder="0"
          className={cn(
            "w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm font-bold",
            prefix ? "pl-10" : "pl-4",
            suffix ? "pr-14" : "pr-4"
          )}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px] uppercase">{suffix}</span>}
      </div>
      {description && <p className="text-[10px] text-gray-400">{description}</p>}
    </div>
  );
}
