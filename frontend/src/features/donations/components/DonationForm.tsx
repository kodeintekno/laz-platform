import { useState, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import { ArrowLeft, QrCode, Building2, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

import { Button, Card, CardContent, CardFooter, FormWrapper, FormField } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { createDonationAction, type CreateDonationData } from "@/features/donations/actions/donations.actions";
import { donationSchema, type DonationInput, SUPPORTED_PAYMENT_METHODS } from "@/features/donations/validations/donations.schema";
import { PaymentInstructions } from "./PaymentInstructions";

// ─── Constants ────────────────────────────────────────────────────────────────

const predefinedAmounts = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

const PAYMENT_METHODS = [
  {
    value: "QRIS" as const,
    label: "QRIS",
    description: "Semua e-wallet & m-banking",
    icon: QrCode,
  },
  {
    value: "BCA_VIRTUAL_ACCOUNT" as const,
    label: "Virtual Account BCA",
    description: "Transfer via ATM, mobile banking, atau internet banking BCA",
    icon: Building2,
  },
  {
    value: "BRI_VIRTUAL_ACCOUNT" as const,
    label: "Virtual Account BRI",
    description: "Transfer via ATM, mobile banking, atau internet banking BRI",
    icon: Building2,
  },
  {
    value: "MANDIRI_VIRTUAL_ACCOUNT" as const,
    label: "Virtual Account Mandiri",
    description: "Transfer via ATM, mobile banking, atau internet banking Mandiri",
    icon: Building2,
  },
  {
    value: "BNI_VIRTUAL_ACCOUNT" as const,
    label: "Virtual Account BNI",
    description: "Transfer via ATM, mobile banking, atau internet banking BNI",
    icon: Building2,
  },
  {
    value: "PERMATA_VIRTUAL_ACCOUNT" as const,
    label: "Virtual Account Permata",
    description: "Transfer via ATM, mobile banking, atau internet banking Permata",
    icon: Building2,
  },
  {
    value: "BSI_VIRTUAL_ACCOUNT" as const,
    label: "Virtual Account BSI",
    description: "Transfer via ATM, m-banking (BSI Mobile), atau internet banking BSI",
    icon: Building2,
  },
] satisfies {
  value: (typeof SUPPORTED_PAYMENT_METHODS)[number];
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * DonationForm — multi-step donation flow.
 *
 * Step 1: Donor fills in amount, payment method, and personal details.
 * Step 2: PaymentInstructions (QRIS or VA number + status polling).
 *
 * Security:
 * - Amount validation enforced by Zod schema (min 10000, integer)
 * - paymentMethod restricted to allowed Xendit channels
 * - Backend derives lembagaId, platformFee, institutionAmount — not the frontend
 */
export function DonationForm({ programId, programSlug }: { programId: string; programSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<CreateDonationData | null>(null);

  const handleRetry = () => {
    setPaymentData(null);
    setError(null);
  };

  const onSubmit = (data: DonationInput) => {
    setError(null);

    startTransition(async () => {
      const result = await createDonationAction({
        programId: data.programId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        donorName: data.donorName,
        donorEmail: data.donorEmail || undefined,
        donorPhone: data.donorPhone,
        message: data.message || undefined,
        isAnonymous: data.isAnonymous,
      });

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.success && result.donationId) {
        // Step 2: show payment instructions
        setPaymentData({
          donationId: result.donationId,
          paymentMethod: result.paymentMethod!,
          amount: result.amount!,
          qrString: result.qrString ?? null,
          vaNumber: result.vaNumber ?? null,
          expiresAt: result.expiresAt!,
        });
        toast.success("Donasi berhasil dibuat!");

        window.scrollTo({ top: 0, behavior: "instant" });
      }
    });
  };

  // ── Step 2: Payment Instructions ──────────────────────────────────────────

  if (paymentData) {
    return (
      <div className="max-w-md mx-auto mt-4 px-4">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-brand-primary mb-4 font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <PaymentInstructions
          donationId={paymentData.donationId}
          paymentMethod={paymentData.paymentMethod}
          amount={paymentData.amount}
          qrString={paymentData.qrString}
          vaNumber={paymentData.vaNumber}
          expiresAt={paymentData.expiresAt}
          programSlug={programSlug}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // ── Step 1: Donation Form ─────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto mt-8 px-4">
      <Link
        to={`/programs/${programSlug}`}
        className="inline-flex items-center gap-2 text-sm text-secondary hover:text-brand-primary mb-6 font-semibold transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <FormWrapper
        schema={donationSchema}
        onSubmit={onSubmit}
        defaultValues={{
          programId,
          amount: 50_000,
          isAnonymous: false,
          message: "",
          paymentMethod: "QRIS",
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
              {isPending ? "Membuat Pembayaran…" : "Lanjutkan Pembayaran"}
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

// ─── Form fields ──────────────────────────────────────────────────────────────

function DonationFormFields({ isPending }: { isPending: boolean }) {
  const { setValue, watch } = useFormContext<DonationInput>();
  const selectedAmount = watch("amount");
  const selectedMethod = watch("paymentMethod");
  const [isVaOpen, setIsVaOpen] = useState(selectedMethod.includes("VIRTUAL_ACCOUNT"));

  return (
    <>
      {/* Nominal Section */}
      <div>
        <h3 className="text-lg font-bold text-primary mb-4">Pilih Nominal Donasi</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {predefinedAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setValue("amount", amt, { shouldValidate: true })}
              className={`py-3 px-2 text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                Number(selectedAmount) === amt
                  ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                  : "bg-surface border-border/40 text-primary hover:border-brand-primary/50 hover:bg-brand-primary/5"
              }`}
            >
              {formatRupiah(amt)}
            </button>
          ))}
        </div>

        <div className="mt-2">
          <p className="text-sm font-medium text-secondary mb-2">Atau masukkan nominal lainnya</p>
          <FormField
            name="amount"
            type="currency"
            prefix="Rp"
            className="[&_input]:text-xl [&_input]:font-bold [&_input]:h-12 [&_input]:text-brand-primary [&_.font-medium]:text-lg [&_.font-medium]:font-semibold [&_.font-medium]:text-brand-primary/80"
            placeholder="0"
            disabled={isPending}
          />
        </div>
      </div>

      <hr className="border-border" />

      {/* Metode Pembayaran Section */}
      <FormField
        name="paymentMethod"
        type="custom"
        render={({ field }) => {
          const vaMethods = PAYMENT_METHODS.filter((m) => m.value !== "QRIS");
          const isQrisSelected = field.value === "QRIS";
          const isVaSelected = field.value.includes("VIRTUAL_ACCOUNT");

          return (
            <div>
              <h3 className="text-lg font-bold text-primary mb-4">Metode Pembayaran</h3>
              <div className="space-y-3">
                {/* QRIS Option */}
                <label
                  className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${
                    isQrisSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/40 bg-surface hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value="QRIS"
                    checked={isQrisSelected}
                    onChange={() => {
                      field.onChange("QRIS");
                      setIsVaOpen(false);
                    }}
                    className="h-4 w-4 mt-0.5 text-primary border-border focus:ring-primary cursor-pointer shrink-0"
                    disabled={isPending}
                  />
                  <QrCode
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      isQrisSelected ? "text-primary" : "text-muted"
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-primary text-sm">QRIS</span>
                    <p className="text-xs text-secondary mt-0.5">Semua e-wallet & mobile banking (GoPay, OVO, Dana, ShopeePay, dll)</p>
                  </div>
                </label>

                {/* Virtual Account (VA) Group */}
                <div
                  className={`border rounded-xl transition overflow-hidden ${
                    isVaOpen || isVaSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/40 bg-surface hover:border-primary/40"
                  }`}
                >
                  <label
                    className="flex items-start gap-3 p-4 cursor-pointer"
                    onClick={() => {
                      setIsVaOpen(true);
                      if (!isVaSelected) {
                        field.onChange("BCA_VIRTUAL_ACCOUNT");
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      checked={isVaSelected}
                      readOnly
                      className="h-4 w-4 mt-0.5 text-primary border-border focus:ring-primary cursor-pointer shrink-0"
                      disabled={isPending}
                    />
                    <CreditCard
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        isVaSelected ? "text-primary" : "text-muted"
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-primary text-sm">Virtual Account (VA)</span>
                      <p className="text-xs text-secondary mt-0.5">Transfer via ATM, m-banking, atau internet banking berbagai bank</p>
                    </div>
                  </label>

                  {/* Sub-options for VA Banks */}
                  {(isVaOpen || isVaSelected) && (
                    <div className="px-4 pb-4 pt-1 border-t border-primary/10">
                      <p className="text-xs font-medium text-secondary mb-3 mt-2">Pilih Bank Tujuan:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {vaMethods.map((method) => {
                          const isMethodSelected = field.value === method.value;
                          const bankName = method.label.replace("Virtual Account ", "");
                          return (
                            <label
                              key={method.value}
                              className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition ${
                                isMethodSelected
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "border-border/40 bg-surface hover:bg-surface-hover hover:border-primary/30"
                              }`}
                            >
                              <input
                                type="radio"
                                className="sr-only"
                                checked={isMethodSelected}
                                onChange={() => field.onChange(method.value)}
                                disabled={isPending}
                              />
                              <span className={`font-bold text-sm ${isMethodSelected ? 'text-primary' : 'text-primary/70'}`}>
                                {bankName}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      />

      <hr className="border-border" />

      {/* Data Diri Section */}
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

      {/* Dukungan Section */}
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

      {/* Hidden programId field */}
      <input type="hidden" {...{ name: "programId" }} value={selectedMethod} />
    </>
  );
}
