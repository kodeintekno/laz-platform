import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface JournalBalanceSummaryProps {
  totalDebit: number;
  totalCredit: number;
}

export function JournalBalanceSummary({ totalDebit, totalCredit }: JournalBalanceSummaryProps) {
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && (totalDebit > 0 || totalCredit > 0);

  return (
    <div className="bg-surface-soft border border-border rounded-xl p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Total Debit */}
        <div className="flex-1">
          <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-1">Total Debit</p>
          <p className="text-2xl font-bold font-mono text-primary">
            Rp {formatCurrency(totalDebit)}
          </p>
        </div>

        <div className="hidden md:block w-px h-12 bg-border"></div>

        {/* Total Kredit */}
        <div className="flex-1 md:pl-6">
          <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-1">Total Kredit</p>
          <p className="text-2xl font-bold font-mono text-primary">
            Rp {formatCurrency(totalCredit)}
          </p>
        </div>

        <div className="hidden md:block w-px h-12 bg-border"></div>

        {/* Status */}
        <div className="flex-1 md:pl-6">
          <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-1">Status Balance</p>
          
          {isBalanced ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <p className="font-bold">SEIMBANG</p>
                <p className="text-xs opacity-80">Debit = Kredit</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-bold">TIDAK SEIMBANG</p>
                <p className="text-xs opacity-80">
                  Selisih: Rp {formatCurrency(difference)}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
