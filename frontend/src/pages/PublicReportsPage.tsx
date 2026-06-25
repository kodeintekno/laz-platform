import React from 'react';
import Transparency from '@/components/ui/Transparency';

export function PublicReportsPage() {
  return (
    <div className="bg-[#f8faf9] min-h-screen pt-24 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Laporan <span className="text-emerald-600">Transparansi</span></h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium">Akses publik untuk memantau langsung semua aliran dana dan distribusi zakat, infaq, serta sedekah yang diamanahkan kepada kami.</p>
        </div>
        <Transparency />
      </div>
    </div>
  );
}
