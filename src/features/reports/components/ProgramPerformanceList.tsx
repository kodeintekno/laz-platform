"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Award } from "lucide-react";

interface TopProgram {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  distributedAmount: number;
  status: string;
  progressPercentage: number;
  laz: { name: string };
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function ProgramPerformanceList({ programs }: { programs: TopProgram[] }) {
  if (programs.length === 0) {
    return (
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <Award className="w-10 h-10 text-muted mb-4" />
        <p className="text-secondary text-sm">Belum ada data program.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm col-span-1 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-border/50 bg-surface-soft/50">
        <h3 className="text-lg font-bold text-primary">Top Program</h3>
        <p className="text-sm text-secondary">Program dengan pendanaan tertinggi</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-border/30">
          {programs.map((program, index) => (
            <li key={program.id} className="p-5 hover:bg-surface-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <h4 className="font-semibold text-primary line-clamp-1" title={program.title}>
                      {program.title}
                    </h4>
                  </div>
                  <p className="text-xs text-secondary ml-7">{program.laz.name}</p>
                </div>
                <Badge intent={program.status === "COMPLETED" ? "success" : "info"} className="shrink-0">
                  {program.progressPercentage}%
                </Badge>
              </div>

              <div className="ml-7">
                <div className="w-full bg-surface-muted rounded-full h-2 mb-2 overflow-hidden">
                  <div 
                    className="bg-brand-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, program.progressPercentage)}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-secondary">Terkumpul: </span>
                    <span className="font-semibold text-primary">{formatRupiah(program.currentAmount)}</span>
                  </div>
                  {program.targetAmount > 0 && (
                    <div className="text-muted">
                      Target: {formatRupiah(program.targetAmount)}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
