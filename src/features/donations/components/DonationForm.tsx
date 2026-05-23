"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button, Input, Textarea, Card, CardContent, CardFooter, Alert } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { createDonationAction } from "@/features/donations/actions/donations.actions";
import { donationSchema, type DonationInput } from "@/features/donations/validations/donations.schema";

export function DonationForm({ programId, programSlug }: { programId: string; programSlug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const predefinedAmounts = [25000, 50000, 100000, 250000, 500000, 1000000];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonationInput>({
    resolver: zodResolver(donationSchema) as any,
    defaultValues: {
      programId,
      amount: 50000,
      isAnonymous: false,
      message: "",
      paymentMethod: "BCA_VA",
    },
  });

  const selectedAmount = watch("amount");

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = (data: DonationInput) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = await createDonationAction(formData);

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        setSuccess(true);
        toast.success("Donasi berhasil dicatat!");
      }
    });
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <Card>
          <CardContent className="text-center flex flex-col items-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30 mb-6">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Alhamdulillah!</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-8">
              Donasi Anda telah berhasil dicatat. Semoga menjadi amal jariyah yang pahalanya mengalir tiada henti.
            </p>
            <Link href={`/programs/${programSlug}`} className="w-full">
              <Button className="w-full">Kembali ke Halaman Program</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Link href={`/programs/${programSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-8">
            
            {error && (
              <Alert intent="error">
                {error}
              </Alert>
            )}

          {/* Nominal Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pilih Nominal Donasi</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {predefinedAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setValue("amount", amt, { shouldValidate: true })}
                  className={`py-3 px-2 text-sm font-semibold rounded-xl border transition ${
                    selectedAmount === amt 
                      ? "bg-primary/5 border-primary text-primary ring-1 ring-primary" 
                      : "bg-background border-border text-foreground hover:border-primary-hover"
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
            
            <div className="relative mt-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 z-10">
                <span className="text-gray-500 font-medium sm:text-sm">Rp</span>
              </div>
              <Input
                {...register("amount")}
                type="number"
                error={!!errors.amount}
                className="pl-12 text-lg font-bold"
                placeholder="Nominal lainnya"
                disabled={isPending}
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <hr className="border-gray-100" />

          {/* Metode Pembayaran Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Metode Pembayaran</h3>
            <div className="space-y-3">
              {['BCA_VA', 'MANDIRI_VA', 'GO_PAY', 'QRIS'].map((method) => (
                <label key={method} className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:checked]:ring-primary transition">
                  <input
                    {...register("paymentMethod")}
                    type="radio"
                    value={method}
                    className="h-4 w-4 text-primary border-border focus:ring-primary cursor-pointer"
                    disabled={isPending}
                  />
                  <span className="ml-3 font-semibold text-foreground">{method.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
            {errors.paymentMethod && <p className="mt-1 text-xs text-red-500">{errors.paymentMethod.message}</p>}
          </div>

          <hr className="border-gray-100" />

          {/* Profile Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dukungan Anda</h3>
            
            <label className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-muted border border-border cursor-pointer">
              <div className="flex h-6 items-center">
                <input
                  {...register("isAnonymous")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  disabled={isPending}
                />
              </div>
              <div className="text-sm leading-6">
                <span className="font-semibold text-foreground">Sembunyikan nama saya (Hamba Allah)</span>
                <p className="text-gray-500">Nama Anda tidak akan ditampilkan di halaman publik.</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Tulis Doa atau Dukungan (Opsional)</label>
              <Textarea
                {...register("message")}
                rows={3}
                error={!!errors.message}
                placeholder="Semoga lekas sembuh, semoga bermanfaat..."
                disabled={isPending}
              />
              {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
            </div>
          </div>
        </CardContent>

          <CardFooter>
            <Button
              type="submit"
              intent="primary"
              size="lg"
              isLoading={isPending}
              className="w-full text-lg font-bold"
            >
              Lanjutkan Pembayaran
            </Button>
            <p className="text-xs text-center text-gray-500 mt-4">
              Dengan berdonasi, Anda menyetujui Syarat dan Ketentuan.
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
