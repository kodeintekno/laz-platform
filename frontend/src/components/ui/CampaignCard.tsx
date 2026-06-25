import React, { useState } from 'react';
import { Campaign } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Wallet, Users, Target, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CampaignCard({ campaign, onDonate, onClick }: { campaign: Campaign, onDonate: () => void, onClick: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100);

  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all group flex flex-col h-full cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-gray-100 mb-6">
        <img 
          src={campaign.thumbnail || `https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=800`} 
          alt={campaign.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">
            {campaign.category}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors">
          {campaign.title}
        </h3>
        <div className="space-y-1">
          <p className={cn(
            "text-sm text-gray-500 leading-relaxed transition-all duration-300",
            !isExpanded && "line-clamp-2"
          )}>
            {campaign.description}
          </p>
          {campaign.description.length > 80 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1 transition-colors"
            >
              {isExpanded ? 'Sembunyikan' : 'Baca Selengkapnya'}
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-emerald-600">Terkumpul: {formatCurrency(campaign.raisedAmount)}</span>
            <span className="text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-full bg-emerald-600 rounded-full relative"
            >
              <motion.div 
                animate={{ 
                  left: ["0%", "100%"],
                  opacity: [0, 0.5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-0 bottom-0 w-20 bg-linear-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-400 font-bold tracking-tighter">Target</span>
              <span className="text-xs font-bold">{formatCurrency(campaign.targetAmount)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-400 font-bold tracking-tighter">Tersalurkan</span>
              <span className="text-xs font-bold">{formatCurrency(campaign.distributedAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onDonate(); }}
        className="w-full mt-6 bg-emerald-50 text-emerald-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-xl hover:shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
      >
        Donasikan Sekarang
        <motion.div
           animate={{ x: [0, 5, 0] }}
           transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Target className="w-4 h-4" />
        </motion.div>
      </button>
    </div>
  );
}
