import { useState, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Button, Card, CardContent, CardFooter, FormWrapper, FormField } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { createDonationAction } from "@/features/donations/actions/donations.actions";
import { donationSchema, type DonationInput } from "@/features/donations/validations/donations.schema";

const predefinedAmounts = [25000, 50000, 100000, 250000, 500000, 1000000];

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Donasi selalu tanpa akun — donatur tidak memiliki login. Identitas
 * donatur (nama + telepon wajib, email opsional) selalu diminta di form.
 */
export function DonationForm({ programId, programSlug }: { programId: string; programSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-6">
              <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Alhamdulillah!</h2>
            <p className="text-secondary mb-8">
              Donasi Anda telah berhasil dicatat. Semoga menjadi amal jariyah yang pahalanya mengalir tiada henti.
              Simpan nomor telepon Anda untuk melihat riwayat donasi kapan saja.
            </p>
            <div className="w-full space-y-3">
              <Link to="/riwayat-donasi" className="w-full block">
                <Button intent="secondary" className="w-full">Lihat Riwayat Donasi</Button>
              </Link>
              <Link to={`/programs/${programSlug}`} className="w-full block">
                <Button className="w-full">Kembali ke Halaman Program</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Link to={`/programs/${programSlug}`} className="inline-flex items-center gap-2 text-sm text-secondary hover:text-brand-primary mb-6 font-semibold transition">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <FormWrapper
        schema={donationSchema}
        onSubmit={onSubmit}
        defaultValues={{
          programId,
          amount: 50000,
          isAnonymous: false,
          message: "",
          paymentMethod: "BCA_VA",
          donorName: "",
          donorEmail: "",
          donorPhone: "",
        }}
        error={error}
      >
        <Card>
          <CardContent className="space-y-8">
            <DonationFormFields isPending={isPending} />
          </CardContent>

          <CardFooter className="flex flex-col">
            <Button
              type="submit"
              intent="primary"
              size="lg"
              isLoading={isPending}
              className="w-full text-lg font-bold"
            >
              Lanjutkan Pembayaran
            </Button>
            <p className="text-xs text-center text-muted mt-4">
              Dengan berdonasi, Anda menyetujui Syarat dan Ketentuan.
            </p>
          </CardFooter>
        </Card>
      </FormWrapper>
    </div>
  );
}

function DonationFormFields({ isPending }: { isPending: boolean }) {
  const { setValue, watch } = useFormContext<DonationInput>();
  const selectedAmount = watch("amount");

  return (
    <>
      {/* Nominal Section */}
      <div>
        <h3 className="text-lg font-bold text-primary mb-4">Pilih Nominal Donasi</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {predefinedAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setValue("amount", amt, { shouldValidate: true })}
              className={`py-3 px-2 text-sm font-semibold rounded-xl border transition cursor-pointer ${
                Number(selectedAmount) === amt
                  ? "bg-primary/5 border-primary text-primary ring-1 ring-primary"
                  : "bg-surface border-border/40 text-primary hover:border-primary/40"
              }`}
            >
              {formatRupiah(amt)}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <FormField
            name="amount"
            type="currency"
            prefix="Rp"
            className="text-lg font-bold"
            placeholder="Nominal lainnya"
            disabled={isPending}
          />
        </div>
      </div>

      <hr className="border-border" />

      {/* Metode Pembayaran Section */}
      <FormField
        name="paymentMethod"
        type="custom"
        render={({ field }) => (
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">Metode Pembayaran</h3>
            <div className="space-y-3">
              {['BCA_VA', 'MANDIRI_VA', 'GO_PAY', 'QRIS'].map((method) => (
                <label key={method} className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:checked]:ring-primary transition">
                  <input
                    type="radio"
                    name={field.name}
                    value={method}
                    checked={field.value === method}
                    onChange={() => field.onChange(method)}
                    className="h-4 w-4 text-primary border-border focus:ring-primary cursor-pointer"
                    disabled={isPending}
                  />
                  <span className="ml-3 font-semibold text-primary">{method.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      />

      <hr className="border-border" />

      {/* Guest Details Section — selalu tampil, donatur tidak punya akun */}
      <div>
        <h3 className="text-lg font-bold text-primary mb-4">Data Diri Donatur</h3>
        <div className="space-y-4">
          <FormField
            name="donorName"
            label="Nama Lengkap"
            type="input"
            placeholder="Masukkan nama lengkap Anda"
            disabled={isPending}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              name="donorPhone"
              label="No. Handphone"
              type="input"
              inputType="tel"
              placeholder="Contoh: 081234567890"
              disabled={isPending}
              description="Digunakan sebagai identitas untuk melihat riwayat donasi Anda."
            />
            <FormField
              name="donorEmail"
              label="Alamat Email (Opsional)"
              type="input"
              inputType="email"
              placeholder="nama@email.com"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Profile Section */}
      <div>
        <h3 className="text-lg font-bold text-primary mb-4">Dukungan Anda</h3>

        <FormField
          name="isAnonymous"
          type="checkbox"
          label="Sembunyikan nama saya (Hamba Allah)"
          description="Nama Anda tidak akan ditampilkan di halaman publik."
          disabled={isPending}
          className="mb-6"
        />

        <FormField
          name="message"
          label="Tulis Doa atau Dukungan (Opsional)"
          type="textarea"
          rows={3}
          placeholder="Semoga lekas sembuh, semoga bermanfaat..."
          disabled={isPending}
        />
      </div>
    </>
  );
}
