import { z } from "zod";

/** Nomor HP Indonesia: 08xx, 628xx, atau +628xx. */
export const INDONESIA_PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/;

export const SUPPORTED_PAYMENT_METHODS = [
  "QRIS",
  "BCA_VIRTUAL_ACCOUNT",
  "BRI_VIRTUAL_ACCOUNT",
  "MANDIRI_VIRTUAL_ACCOUNT",
  "BNI_VIRTUAL_ACCOUNT",
  "PERMATA_VIRTUAL_ACCOUNT",
  "BSI_VIRTUAL_ACCOUNT",
] as const;

export type SupportedPaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

export const donationSchema = z.object({
  programId: z.string().min(1, "Program tidak valid"),
  amount: z.coerce.number().int("Nominal harus bilangan bulat").min(10000, "Minimal donasi Rp 10.000"),
  message: z.string().max(250, "Pesan maksimal 250 karakter").optional(),
  isAnonymous: z.coerce.boolean().default(false),
  paymentMethod: z.enum(SUPPORTED_PAYMENT_METHODS, {
    error: "Pilih metode pembayaran yang valid",
  }),
  donorName: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  donorEmail: z.string().email("Format email tidak valid").or(z.literal("")).optional(),
  donorPhone: z
    .string()
    .regex(INDONESIA_PHONE_REGEX, "Format nomor telepon tidak valid"),
});

export type DonationInput = z.infer<typeof donationSchema>;

export const donationHistoryQuerySchema = z.object({
  phone: z.string().regex(INDONESIA_PHONE_REGEX, "Format nomor telepon tidak valid"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type DonationHistoryQuery = z.infer<typeof donationHistoryQuerySchema>;

export const adminDonationSchema = z.object({
  programId: z.string().min(1, "Program wajib diisi"),
  donorName: z.string().max(100, "Nama maksimal 100 karakter").optional(),
  amount: z.coerce.number().min(1000, "Minimal Rp 1.000"),
  message: z.string().max(250, "Pesan maksimal 250 karakter").optional(),
  isAnonymous: z.coerce.boolean().default(false),
  status: z.enum(["PENDING", "PAID", "FAILED"]).default("PAID"),
});

export type AdminDonationInput = z.infer<typeof adminDonationSchema>;
