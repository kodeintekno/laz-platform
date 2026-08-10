import { z } from "zod";

export const journalDetailSchema = z.object({
  id: z.string().optional(), // only used for edit
  accountId: z.string().min(1, "Akun harus dipilih"),
  debit: z.coerce.number().min(0, "Debit tidak boleh negatif"),
  credit: z.coerce.number().min(0, "Kredit tidak boleh negatif"),
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
    .refine(details => {
      // Validate balance
      const totalDebit = details.reduce((sum, d) => sum + (Number(d.debit) || 0), 0);
      const totalCredit = details.reduce((sum, d) => sum + (Number(d.credit) || 0), 0);
      
      // Floating point safe comparison
      return Math.abs(totalDebit - totalCredit) < 0.01;
    }, {
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
