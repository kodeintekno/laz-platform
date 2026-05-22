"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { donationSchema } from "@/features/donations/validations/donations.schema";
import type { DonationInput } from "@/features/donations/validations/donations.schema";
import { createDonationAction } from "@/features/donations/actions/donations.actions";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      } else if (result?.success) {
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-lg mx-auto mt-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Alhamdulillah!</h2>
        <p className="text-gray-600 mb-8">
          Donasi Anda telah berhasil dicatat. Semoga menjadi amal jariyah yang pahalanya mengalir tiada henti.
        </p>
        <Link
          href={`/programs/${programSlug}`}
          className="inline-flex justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full"
        >
          Kembali ke Halaman Program
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Link href={`/programs/${programSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {error}
            </div>
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
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600" 
                      : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300"
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
            
            <div className="relative mt-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="text-gray-500 font-medium sm:text-sm">Rp</span>
              </div>
              <input
                {...register("amount")}
                type="number"
                className="block w-full rounded-xl border-0 py-3 pl-12 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-lg font-bold"
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
                <label key={method} className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:checked]:ring-1 has-[:checked]:ring-indigo-600 transition">
                  <input
                    {...register("paymentMethod")}
                    type="radio"
                    value={method}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                    disabled={isPending}
                  />
                  <span className="ml-3 font-medium text-gray-900">{method.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
            {errors.paymentMethod && <p className="mt-1 text-xs text-red-500">{errors.paymentMethod.message}</p>}
          </div>

          <hr className="border-gray-100" />

          {/* Profile Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dukungan Anda</h3>
            
            <label className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div className="flex h-6 items-center">
                <input
                  {...register("isAnonymous")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  disabled={isPending}
                />
              </div>
              <div className="text-sm leading-6">
                <span className="font-semibold text-gray-900">Sembunyikan nama saya (Hamba Allah)</span>
                <p className="text-gray-500">Nama Anda tidak akan ditampilkan di halaman publik.</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tulis Doa atau Dukungan (Opsional)</label>
              <textarea
                {...register("message")}
                rows={3}
                placeholder="Semoga lekas sembuh, semoga bermanfaat..."
                className="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                disabled={isPending}
              />
              {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
            </div>
          </div>

        </div>

        <div className="bg-gray-50 p-6 sm:p-8 border-t border-gray-100">
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-4 text-lg font-bold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {isPending ? <LoadingSpinner size="md" /> : `Lanjutkan Pembayaran`}
          </button>
          <p className="text-xs text-center text-gray-500 mt-4">
            Dengan berdonasi, Anda menyetujui Syarat dan Ketentuan.
          </p>
        </div>
      </form>
    </div>
  );
}
