import { z } from "zod";

export const donationSchema = z.object({
  programId: z.string().min(1, "Program tidak valid"),
  amount: z.coerce.number().min(10000, "Minimal donasi Rp 10.000"),
  message: z.string().max(250, "Pesan maksimal 250 karakter").optional(),
  isAnonymous: z.coerce.boolean().default(false),
  paymentMethod: z.string().min(1, "Pilih metode pembayaran"),
});

export type DonationInput = z.infer<typeof donationSchema>;
