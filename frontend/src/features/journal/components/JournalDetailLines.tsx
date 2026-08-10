import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface JournalDetailLinesProps {
  details: Array<{
    id: string;
    account: { code: string; name: string; normalBalance: string };
    debit: string | number;
    credit: string | number;
    description?: string | null;
  }>;
}

export function JournalDetailLines({ details }: JournalDetailLinesProps) {
  let totalDebit = 0;
  let totalCredit = 0;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-secondary bg-surface-soft uppercase border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Akun</th>
              <th className="px-4 py-3 font-semibold">Keterangan</th>
              <th className="px-4 py-3 font-semibold text-right">Debit</th>
              <th className="px-4 py-3 font-semibold text-right">Kredit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {details.map((line) => {
              const debit = Number(line.debit) || 0;
              const credit = Number(line.credit) || 0;
              totalDebit += debit;
              totalCredit += credit;

              // Indent credit accounts for standard accounting format
              const isCredit = credit > 0;

              return (
                <tr key={line.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className={`flex flex-col ${isCredit ? 'pl-6' : ''}`}>
                      <span className="font-mono font-medium text-primary">{line.account.code}</span>
                      <span className="text-secondary text-xs">{line.account.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {line.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-primary">
                    {debit > 0 ? formatCurrency(debit) : ""}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-primary">
                    {credit > 0 ? formatCurrency(credit) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-surface-soft font-semibold text-primary border-t border-border">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-right uppercase text-xs tracking-wider">
                Total
              </td>
              <td className="px-4 py-3 text-right font-mono text-base">
                Rp {formatCurrency(totalDebit)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-base">
                Rp {formatCurrency(totalCredit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
