import { z } from "zod";

export const donationSchema = z.object({
  programId: z.string().min(1, "Program tidak valid"),
  amount: z.coerce.number().min(10000, "Minimal donasi Rp 10.000"),
  message: z.string().max(250, "Pesan maksimal 250 karakter").optional(),
  isAnonymous: z.coerce.boolean().default(false),
  paymentMethod: z.string().min(1, "Pilih metode pembayaran"),
  donorName: z.string().max(100, "Nama maksimal 100 karakter").optional(),
  donorEmail: z.string().email("Format email tidak valid").or(z.literal("")).optional(),
  donorPhone: z.string().max(20, "No. Handphone maksimal 20 karakter").optional(),
});

export type DonationInput = z.infer<typeof donationSchema>;

export const adminDonationSchema = z.object({
  programId: z.string().min(1, "Program wajib diisi"),
  userId: z.string().optional(),
  donorName: z.string().max(100, "Nama maksimal 100 karakter").optional(),
  amount: z.coerce.number().min(1000, "Minimal Rp 1.000"),
  message: z.string().max(250, "Pesan maksimal 250 karakter").optional(),
  isAnonymous: z.coerce.boolean().default(false),
  status: z.enum(["PENDING", "PAID", "FAILED"]).default("PAID"),
});

export type AdminDonationInput = z.infer<typeof adminDonationSchema>;
