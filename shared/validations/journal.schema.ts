import { z } from "zod";

// JournalDetail stores each amount as Decimal(15,2).
const MAX_JOURNAL_AMOUNT = 9_999_999_999_999.99;

export function journalAmountToMinorUnits(amount: number): bigint | null {
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_JOURNAL_AMOUNT) return null;
  // Use the accepted number's decimal representation, without rounding or
  // multiplying a binary floating point value by 100 (e.g. 0.29).
  const parts = /^(\d+)(?:\.(\d{1,2}))?$/.exec(amount.toString());
  if (!parts) return null;
  return BigInt(parts[1]) * 100n + BigInt((parts[2] ?? "").padEnd(2, "0"));
}

export function hasBalancedJournalAmounts(details: readonly { debit: number; credit: number }[]): boolean {
  let balance = 0n;
  for (const detail of details) {
    const debit = journalAmountToMinorUnits(detail.debit);
    const credit = journalAmountToMinorUnits(detail.credit);
    if (debit === null || credit === null) return false;
    balance += debit - credit;
  }
  return balance === 0n;
}

const journalAmountSchema = (label: string) => z.coerce.number()
  .min(0, `${label} tidak boleh negatif`)
  .max(MAX_JOURNAL_AMOUNT, `${label} melebihi batas nominal jurnal`)
  .refine((amount) => journalAmountToMinorUnits(amount) !== null, {
    message: `${label} maksimal menggunakan 2 angka desimal`,
  });

export const journalDetailSchema = z.object({
  id: z.string().optional(), // only used for edit
  accountId: z.string().min(1, "Akun harus dipilih"),
  debit: journalAmountSchema("Debit"),
  credit: journalAmountSchema("Kredit"),
  description: z.string().optional().nullable(),
}).refine(data => {
  // Can't have both debit and credit > 0
  if (data.debit > 0 && data.credit > 0) {
    return false;
  }
  // Must have either debit or credit > 0
  if (data.debit === 0 && data.credit === 0) {
    return false;
  }
  return true;
}, {
  message: "Satu baris hanya boleh diisi debit ATAU kredit (tidak boleh dua-duanya, dan tidak boleh 0 semua)",
  path: ["debit"], // attach error to debit
});

export const journalSchema = z.object({
  journalDate: z.string().or(z.date()).refine(val => !isNaN(new Date(val).getTime()), "Tanggal tidak valid"),
  description: z.string().min(3, "Deskripsi minimal 3 karakter"),
  programId: z.string().optional().nullable(),
  details: z.array(journalDetailSchema)
    .min(2, "Jurnal minimal harus memiliki 2 baris (Debit & Kredit)")
    .refine(hasBalancedJournalAmounts, {
      message: "Total Debit dan Kredit harus seimbang (balance)",
    })
    .refine(details => {
      // Validate at least one debit and one credit
      const hasDebit = details.some(d => (Number(d.debit) || 0) > 0);
      const hasCredit = details.some(d => (Number(d.credit) || 0) > 0);
      return hasDebit && hasCredit;
    }, {
      message: "Harus ada minimal satu transaksi Debit dan satu Kredit",
    })
});

export type JournalInput = z.infer<typeof journalSchema>;
export type JournalDetailInput = z.infer<typeof journalDetailSchema>;

export const voidJournalSchema = z.object({
  reason: z.string().min(5, "Alasan pembatalan minimal 5 karakter"),
});

export type VoidJournalInput = z.infer<typeof voidJournalSchema>;
