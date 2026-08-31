import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useForm,
  FormProvider,
  useFormContext,
  type FieldPath,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  lembagaRegistrationSchema,
  type LembagaRegistrationInput,
} from "../validations/lembaga.schema";
import { FormField, Button, FormCheckbox } from "@/components/ui";
import { LEMBAGA_TERMS_MD } from "../constants/terms";
import { StepIndicator, type StepConfig } from "@/components/ui/StepIndicator";
import { FileUpload } from "@/components/ui/FileUpload";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/api-client";
import { toast } from "@/stores/toast.store";

// ---------------------------------------------------------------------------
// Draft persistence helpers
// ---------------------------------------------------------------------------
const DRAFT_KEY = "laz_lembaga_reg_draft";
const STEP_KEY = "laz_lembaga_reg_step";

type UploadState = { url: string; publicId: string };
const EMPTY_UPLOAD: UploadState = { url: "", publicId: "" };

type UploadDraft = {
  logo: UploadState;
  officePhoto: UploadState;
  aktaYayasan: UploadState;
  skKemenkumham: UploadState;
  npwp: UploadState;
  otherDocument: UploadState;
};

const EMPTY_UPLOADS: UploadDraft = {
  logo: EMPTY_UPLOAD,
  officePhoto: EMPTY_UPLOAD,
  aktaYayasan: EMPTY_UPLOAD,
  skKemenkumham: EMPTY_UPLOAD,
  npwp: EMPTY_UPLOAD,
  otherDocument: EMPTY_UPLOAD,
};

function loadDraft(): Partial<LembagaRegistrationInput> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadUploadDraft(): UploadDraft {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY}_uploads`);
    return raw ? { ...EMPTY_UPLOADS, ...JSON.parse(raw) } : EMPTY_UPLOADS;
  } catch {
    return EMPTY_UPLOADS;
  }
}

function loadStep(): number {
  try {
    const raw = localStorage.getItem(STEP_KEY);
    return raw ? Math.max(0, Math.min(3, parseInt(raw, 10))) : 0;
  } catch {
    return 0;
  }
}

function saveDraft(data: Partial<LembagaRegistrationInput>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {}
}

function saveUploadDraft(uploads: UploadDraft) {
  try {
    localStorage.setItem(`${DRAFT_KEY}_uploads`, JSON.stringify(uploads));
  } catch {}
}

function saveStep(step: number) {
  try {
    localStorage.setItem(STEP_KEY, String(step));
  } catch {}
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(`${DRAFT_KEY}_uploads`);
  localStorage.removeItem(STEP_KEY);
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------
const STEPS: StepConfig[] = [
  { label: "Data Lembaga", description: "Profil & informasi" },
  { label: "Dokumen Legalitas", description: "Upload dokumen resmi" },
  { label: "Akun Admin", description: "Kredensial login" },
  { label: "Syarat & Ketentuan", description: "Persetujuan platform" },
];

// Fields per step for targeted validation
const STEP_FIELDS: FieldPath<LembagaRegistrationInput>[][] = [
  ["name", "picName", "picPhone", "address", "description", "website", "izinYayasanNumber", "logoUrl"],
  [], // uploads only — no required text fields in step 2
  ["adminName", "adminEmail", "adminPassword", "confirmPassword"],
  ["termsAccepted"],
];

// ---------------------------------------------------------------------------
// Inner step panels (they consume FormProvider context)
// ---------------------------------------------------------------------------
function Step1({ isPending, uploads, setUploads, submitAttempted }: {
  isPending: boolean;
  uploads: UploadDraft;
  setUploads: (fn: (prev: UploadDraft) => UploadDraft) => void;
  submitAttempted: boolean;
}) {
  const { setValue, trigger } = useFormContext<LembagaRegistrationInput>();
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-primary">Data Lembaga</h3>
        <p className="text-sm text-secondary">Isi informasi dasar lembaga/yayasan Anda.</p>
      </div>
      <FormField
        name="name"
        label="Nama Lembaga"
        type="input"
        placeholder="Yayasan Peduli Umat"
        disabled={isPending}
        description="URL profil publik lembaga akan dibuat otomatis dari nama ini."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField name="picName" label="Nama Penanggung Jawab" type="input" disabled={isPending} />
        <FormField name="picPhone" label="No. Telepon PIC" type="input" inputType="tel" disabled={isPending} />
      </div>
      <FormField name="address" label="Alamat Lengkap" type="textarea" rows={2} disabled={isPending} />
      <FormField name="description" label="Deskripsi Lembaga" type="textarea" rows={3} disabled={isPending} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField name="website" label="Website (Opsional)" type="input" placeholder="https://" disabled={isPending} />
        <FormField name="izinYayasanNumber" label="Nomor Izin Yayasan" type="input" disabled={isPending} />
      </div>
      <FileUpload
        name="logoUrl"
        label="Logo Lembaga"
        required
        forceValidate={submitAttempted}
        folder="lembaga/logo"
        disabled={isPending}
        initialUrl={uploads.logo.url}
        initialPublicId={uploads.logo.publicId}
        onUpload={(p) => {
          setUploads(prev => ({ ...prev, logo: p }));
          setValue("logoUrl", p.url, { shouldValidate: true });
        }}
        onRemove={() => {
          setUploads(prev => ({ ...prev, logo: EMPTY_UPLOAD }));
          setValue("logoUrl", "", { shouldValidate: true });
        }}
      />
      <FileUpload
        name="officePhotoUrl"
        label="Foto Kantor (Opsional)"
        folder="lembaga/office-photo"
        disabled={isPending}
        initialUrl={uploads.officePhoto.url}
        initialPublicId={uploads.officePhoto.publicId}
        onUpload={(p) => setUploads(prev => ({ ...prev, officePhoto: p }))}
        onRemove={() => setUploads(prev => ({ ...prev, officePhoto: EMPTY_UPLOAD }))}
      />
    </div>
  );
}

function Step2({ isPending, uploads, setUploads, submitAttempted }: {
  isPending: boolean;
  uploads: UploadDraft;
  setUploads: (fn: (prev: UploadDraft) => UploadDraft) => void;
  submitAttempted: boolean;
}) {
  const { setValue } = useFormContext<LembagaRegistrationInput>();
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-primary">Dokumen Legalitas</h3>
        <p className="text-sm text-secondary">Upload dokumen resmi lembaga untuk proses verifikasi.</p>
      </div>
      <FileUpload
        name="aktaYayasanUrl"
        label="Akta Yayasan"
        required
        forceValidate={submitAttempted}
        accept="image/png, image/jpeg, application/pdf"
        folder="lembaga/documents"
        disabled={isPending}
        initialUrl={uploads.aktaYayasan.url}
        initialPublicId={uploads.aktaYayasan.publicId}
        onUpload={(p) => {
          setUploads(prev => ({ ...prev, aktaYayasan: p }));
          setValue("aktaYayasanUrl", p.url, { shouldValidate: true });
        }}
        onRemove={() => {
          setUploads(prev => ({ ...prev, aktaYayasan: EMPTY_UPLOAD }));
          setValue("aktaYayasanUrl", "", { shouldValidate: true });
        }}
      />
      <FileUpload
        name="skKemenkumhamUrl"
        label="SK Kemenkumham / Legalitas"
        required
        forceValidate={submitAttempted}
        accept="image/png, image/jpeg, application/pdf"
        folder="lembaga/documents"
        disabled={isPending}
        initialUrl={uploads.skKemenkumham.url}
        initialPublicId={uploads.skKemenkumham.publicId}
        onUpload={(p) => {
          setUploads(prev => ({ ...prev, skKemenkumham: p }));
          setValue("skKemenkumhamUrl", p.url, { shouldValidate: true });
        }}
        onRemove={() => {
          setUploads(prev => ({ ...prev, skKemenkumham: EMPTY_UPLOAD }));
          setValue("skKemenkumhamUrl", "", { shouldValidate: true });
        }}
      />
      <FileUpload
        name="npwpUrl"
        label="NPWP (Opsional)"
        accept="image/png, image/jpeg, application/pdf"
        folder="lembaga/documents"
        disabled={isPending}
        initialUrl={uploads.npwp.url}
        initialPublicId={uploads.npwp.publicId}
        onUpload={(p) => setUploads(prev => ({ ...prev, npwp: p }))}
        onRemove={() => setUploads(prev => ({ ...prev, npwp: EMPTY_UPLOAD }))}
      />
      <FileUpload
        name="otherDocumentUrl"
        label="Dokumen Pendukung Lainnya (Opsional)"
        accept="image/png, image/jpeg, application/pdf"
        folder="lembaga/documents"
        disabled={isPending}
        initialUrl={uploads.otherDocument.url}
        initialPublicId={uploads.otherDocument.publicId}
        onUpload={(p) => setUploads(prev => ({ ...prev, otherDocument: p }))}
        onRemove={() => setUploads(prev => ({ ...prev, otherDocument: EMPTY_UPLOAD }))}
      />
    </div>
  );
}

function Step3({ isPending }: { isPending: boolean }) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-primary">Akun Admin Lembaga</h3>
        <p className="text-sm text-secondary">Buat akun untuk mengelola dashboard lembaga Anda.</p>
      </div>
      <FormField name="adminName" label="Nama Lengkap" type="input" disabled={isPending} />
      <FormField name="adminEmail" label="Email" type="input" inputType="email" disabled={isPending} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField name="adminPassword" label="Password" type="input" inputType="password" disabled={isPending} />
        <FormField name="confirmPassword" label="Konfirmasi Password" type="input" inputType="password" disabled={isPending} />
      </div>
    </div>
  );
}

function renderMarkdown(text: string) {
  // Split by double newline for paragraphs
  const paragraphs = text.split('\n\n');
  return paragraphs.map((p, i) => {
    // Split by ** to find bold text
    const parts = p.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className="mb-3 last:mb-0">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

function Step4({ isPending }: { isPending: boolean }) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-primary">Syarat dan Ketentuan</h3>
        <p className="text-sm text-secondary">Silakan baca dan setujui Syarat dan Ketentuan kerja sama.</p>
      </div>
      <div className="h-64 overflow-y-auto p-5 border border-border rounded-lg bg-surface-muted/30 text-sm text-secondary text-justify mb-4 leading-relaxed">
        {renderMarkdown(LEMBAGA_TERMS_MD)}
      </div>
      <FormCheckbox 
        name="termsAccepted" 
        label="Saya menyatakan bahwa saya telah membaca, memahami, dan menyetujui seluruh Syarat dan Ketentuan Kerja Sama Lembaga Ruang Berbagi." 
        disabled={isPending} 
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner navigation buttons — uses form context
// ---------------------------------------------------------------------------
function StepNav({
  currentStep,
  totalSteps,
  isPending,
  onNext,
  onBack,
}: {
  currentStep: number;
  totalSteps: number;
  isPending: boolean;
  onNext: (e?: React.MouseEvent) => Promise<void>;
  onBack: () => void;
}) {
  const isLast = currentStep === totalSteps - 1;
  return (
    <div className={`flex gap-3 pt-4 ${currentStep > 0 ? "justify-between" : "justify-end"}`}>
      {currentStep > 0 && (
        <Button
          type="button"
          intent="outline"
          onClick={onBack}
          disabled={isPending}
          className="px-6"
        >
          ← Kembali
        </Button>
      )}
      {!isLast && (
        <Button
          key="btn-next"
          type="button"
          onClick={onNext}
          disabled={isPending}
          className="flex-1 sm:flex-none px-8 text-sm font-semibold"
        >
          Lanjut →
        </Button>
      )}
      {isLast && (
        <Button 
          key="btn-submit"
          type="submit" 
          isLoading={isPending} 
          className="flex-1 sm:flex-none px-8 text-sm font-semibold"
        >
          Kirim Pendaftaran
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function LembagaRegistrationForm() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Load saved step & draft on first mount
  const savedDraft = useRef(loadDraft());
  const savedUploads = useRef(loadUploadDraft());
  const [currentStep, setCurrentStep] = useState(() => loadStep());
  const [uploads, setUploads] = useState<UploadDraft>(() => savedUploads.current);

  const defaultValues: LembagaRegistrationInput = {
    name: "",
    picName: "",
    picPhone: "",
    address: "",
    description: "",
    website: "",
    izinYayasanNumber: "",
    logoUrl: savedUploads.current.logo.url || "",
    logoPublicId: savedUploads.current.logo.publicId || "",
    officePhotoUrl: savedUploads.current.officePhoto.url || "",
    officePhotoPublicId: savedUploads.current.officePhoto.publicId || "",
    aktaYayasanUrl: savedUploads.current.aktaYayasan.url || "",
    aktaYayasanPublicId: savedUploads.current.aktaYayasan.publicId || "",
    skKemenkumhamUrl: savedUploads.current.skKemenkumham.url || "",
    skKemenkumhamPublicId: savedUploads.current.skKemenkumham.publicId || "",
    npwpUrl: savedUploads.current.npwp.url || "",
    npwpPublicId: savedUploads.current.npwp.publicId || "",
    otherDocumentUrl: savedUploads.current.otherDocument.url || "",
    otherDocumentPublicId: savedUploads.current.otherDocument.publicId || "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
    termsAccepted: false as any, // literal true bypass default cast issue
    ...savedDraft.current,
  };

  // Ensure that saved draft values don't overwrite the uploads if they were empty in the draft
  if (!defaultValues.aktaYayasanUrl && savedUploads.current.aktaYayasan.url) {
    defaultValues.aktaYayasanUrl = savedUploads.current.aktaYayasan.url;
    defaultValues.aktaYayasanPublicId = savedUploads.current.aktaYayasan.publicId;
  }
  if (!defaultValues.skKemenkumhamUrl && savedUploads.current.skKemenkumham.url) {
    defaultValues.skKemenkumhamUrl = savedUploads.current.skKemenkumham.url;
    defaultValues.skKemenkumhamPublicId = savedUploads.current.skKemenkumham.publicId;
  }

  const form = useForm<LembagaRegistrationInput>({
    resolver: zodResolver(lembagaRegistrationSchema) as any,
    defaultValues,
    mode: "onTouched",
  });

  const { handleSubmit, trigger, watch, getValues } = form;

  // Auto-save draft whenever form values change
  useEffect(() => {
    const subscription = watch((values) => {
      saveDraft(values as Partial<LembagaRegistrationInput>);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Persist uploads state
  useEffect(() => {
    saveUploadDraft(uploads);
  }, [uploads]);

  // Persist current step
  useEffect(() => {
    saveStep(currentStep);
  }, [currentStep]);

  const handleSetUploads = useCallback(
    (fn: (prev: UploadDraft) => UploadDraft) => setUploads(fn),
    []
  );

  const handleNext = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    // Mark attempted so FileUpload required errors show on current step
    setSubmitAttempted(true);
    const fields = STEP_FIELDS[currentStep];
    const valid = fields.length === 0 ? true : await trigger(fields);
    // For step 1: also check logo upload
    if (currentStep === 0 && !uploads.logo.url) return;
    // For step 2: also check akta & sk
    if (currentStep === 1 && (!uploads.aktaYayasan.url || !uploads.skKemenkumham.url)) return;
    if (valid) {
      setSubmitAttempted(false); // reset for next step
      setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1));
      setError(null);
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
    setError(null);
  };

  const onSubmit = (data: LembagaRegistrationInput) => {
    if (currentStep !== STEPS.length - 1) {
      handleNext();
      return;
    }

    // Mark attempted so all required FileUpload fields show errors if empty
    setSubmitAttempted(true);

    // Guard: validate wajib uploads (tracked outside RHF state)
    if (!uploads.logo.url) {
      setError("Logo lembaga wajib diupload. Kembali ke langkah 1.");
      return;
    }
    if (!uploads.aktaYayasan.url) {
      setError("Akta Yayasan wajib diupload. Kembali ke langkah 2.");
      return;
    }
    if (!uploads.skKemenkumham.url) {
      setError("SK Kemenkumham / Legalitas wajib diupload. Kembali ke langkah 2.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await api.post("/lembaga/register", {
          ...data,
          logoUrl: uploads.logo.url || undefined,
          logoPublicId: uploads.logo.publicId || undefined,
          officePhotoUrl: uploads.officePhoto.url || undefined,
          officePhotoPublicId: uploads.officePhoto.publicId || undefined,
          aktaYayasanUrl: uploads.aktaYayasan.url || undefined,
          aktaYayasanPublicId: uploads.aktaYayasan.publicId || undefined,
          skKemenkumhamUrl: uploads.skKemenkumham.url || undefined,
          skKemenkumhamPublicId: uploads.skKemenkumham.publicId || undefined,
          npwpUrl: uploads.npwp.url || undefined,
          npwpPublicId: uploads.npwp.publicId || undefined,
          otherDocumentUrl: uploads.otherDocument.url || undefined,
          otherDocumentPublicId: uploads.otherDocument.publicId || undefined,
        });
        clearDraft();
        setSubmitted(true);
        toast.success("Pendaftaran lembaga berhasil dikirim!");
      } catch (err: any) {
        setError(err?.message ?? "Pendaftaran gagal. Silakan coba lagi.");
      }
    });
  };

  // ── Success screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-primary">Pendaftaran Terkirim!</h2>
        <p className="text-secondary max-w-md mx-auto text-sm leading-relaxed">
          Pendaftaran lembaga Anda sedang menunggu persetujuan Ruang Berbagi. Anda
          akan dapat login setelah pendaftaran disetujui.
        </p>
        <Button onClick={() => navigate("/login")} className="mt-2">
          Kembali ke Halaman Masuk
        </Button>
      </div>
    );
  }

  // ── Multi-step form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit(onSubmit, (errs) => {
            console.error("Form validation errors:", errs);
            toast.error("Ada isian yang belum lengkap atau tidak valid di langkah sebelumnya. Cek kembali form Anda.");
          })}
          className="space-y-4"
        >
          <fieldset disabled={isPending} className="space-y-4 w-full border-none p-0 m-0">
            {/* Animate step transitions */}
            <div
              key={currentStep}
              className="animate-[fadeSlideIn_0.25s_ease-out_forwards]"
              style={{ animationFillMode: "both" }}
            >
              {currentStep === 0 && (
                <Step1 isPending={isPending} uploads={uploads} setUploads={handleSetUploads} submitAttempted={submitAttempted} />
              )}
              {currentStep === 1 && (
                <Step2 isPending={isPending} uploads={uploads} setUploads={handleSetUploads} submitAttempted={submitAttempted} />
              )}
              {currentStep === 2 && <Step3 isPending={isPending} />}
              {currentStep === 3 && <Step4 isPending={isPending} />}
            </div>

            {error && (
              <Alert intent="error" className="mt-2 w-full">
                {error}
              </Alert>
            )}

            <StepNav
              currentStep={currentStep}
              totalSteps={STEPS.length}
              isPending={isPending}
              onNext={handleNext}
              onBack={handleBack}
            />
          </fieldset>
        </form>
      </FormProvider>

      <p className="text-center text-sm text-secondary">
        Sudah punya akun lembaga?{" "}
        <Link to="/login" className="text-brand-primary hover:underline font-semibold">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
