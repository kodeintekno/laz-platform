"use client";

import React from "react";
import { Wallet, TrendingUp, Users, Target } from "lucide-react";

interface SummaryStats {
  totalDonationsAmount: number;
  totalDistributionsAmount: number;
  totalDonors: number;
  activePrograms: number;
}

const formatRupiah = (amount: number) => {
  if (amount >= 1e9) {
    return `Rp ${(amount / 1e9).toFixed(2)} Miliar`;
  }
  if (amount >= 1e6) {
    return `Rp ${(amount / 1e6).toFixed(2)} Juta`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ReportSummaryCards({ stats }: { stats: SummaryStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex items-start gap-4 transition-transform hover:scale-[1.02] duration-300">
        <div className="p-3 bg-brand-primary/10 rounded-xl">
          <Wallet className="w-6 h-6 text-brand-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-secondary">Total Pemasukan ZIS</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {formatRupiah(stats.totalDonationsAmount)}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex items-start gap-4 transition-transform hover:scale-[1.02] duration-300">
        <div className="p-3 bg-success-token/10 rounded-xl">
          <TrendingUp className="w-6 h-6 text-success-token" />
        </div>
        <div>
          <p className="text-sm font-medium text-secondary">Total Tersalurkan</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {formatRupiah(stats.totalDistributionsAmount)}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex items-start gap-4 transition-transform hover:scale-[1.02] duration-300">
        <div className="p-3 bg-warning-token/10 rounded-xl">
          <Users className="w-6 h-6 text-warning-token" />
        </div>
        <div>
          <p className="text-sm font-medium text-secondary">Total Donatur Unik</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {new Intl.NumberFormat("id-ID").format(stats.totalDonors)}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex items-start gap-4 transition-transform hover:scale-[1.02] duration-300">
        <div className="p-3 bg-info-token/10 rounded-xl">
          <Target className="w-6 h-6 text-info-token" />
        </div>
        <div>
          <p className="text-sm font-medium text-secondary">Program Aktif</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {new Intl.NumberFormat("id-ID").format(stats.activePrograms)}
          </p>
        </div>
      </div>
    </div>
  );
}
