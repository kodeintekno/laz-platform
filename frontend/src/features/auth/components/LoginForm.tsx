import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@/features/auth/validations/auth.schema";
import { FormWrapper, FormField, Button } from "@/components/ui";
import { Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { useVolunteerAuth } from "@/auth/VolunteerAuthProvider";
import { Clock, XCircle } from "lucide-react";

type LembagaStatus = "PENDING" | "REJECTED" | null;

export function LoginForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const { refresh: refreshVolunteer } = useVolunteerAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lembagaStatus, setLembagaStatus] = useState<LembagaStatus>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setLembagaStatus(null);
    setRejectionReason(null);
    setIsPending(true);
    try {
      await api.post("/auth/login", data);
      await refresh();
      navigate("/dashboard");
    } catch (err: any) {
      // Tangani status lembaga PENDING / REJECTED dengan banner khusus
      if (err instanceof ApiError && err.status === 403) {
        if (err.code === "LEMBAGA_PENDING") {
          setLembagaStatus("PENDING");
          setIsPending(false);
          return;
        }
        if (err.code === "LEMBAGA_REJECTED") {
          setLembagaStatus("REJECTED");
          setRejectionReason(err.message);
          setIsPending(false);
          return;
        }
      }
      // Relawan adalah principal terpisah (bukan baris User) — kredensial
      // salah di sisi staff (401) dicoba ulang sebagai akun relawan sebelum
      // menampilkan error, supaya satu form /login melayani ketiganya
      // (Super Admin, Admin Lembaga, Relawan).
      if (err instanceof ApiError && err.status === 401) {
        try {
          await api.post("/volunteers/login", data);
          await refreshVolunteer();
          navigate("/volunteer/dashboard");
          return;
        } catch {
          // bukan akun relawan juga — lanjut tampilkan error staff di bawah
        }
      }
      setError(err?.message ?? "Login gagal");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner: Lembaga menunggu persetujuan */}
      {lembagaStatus === "PENDING" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-start">
          <span className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-600" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Pendaftaran Sedang Diverifikasi</p>
            <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">
              Dokumen lembaga Anda sedang dalam proses verifikasi oleh tim{" "}
              <span className="font-semibold">Ruang Berbagi</span>. Anda akan dapat masuk setelah
              pendaftaran disetujui. Proses verifikasi biasanya membutuhkan 1–3 hari kerja.
            </p>
          </div>
        </div>
      )}

      {/* Banner: Lembaga ditolak */}
      {lembagaStatus === "REJECTED" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3 items-start">
          <span className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-red-600" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">Pendaftaran Ditolak</p>
            <p className="text-sm text-red-700 mt-0.5 leading-relaxed">
              {rejectionReason ?? "Pendaftaran lembaga Anda tidak dapat disetujui."}
            </p>
            <p className="text-xs text-red-600 mt-2">
              Hubungi tim <span className="font-semibold">Ruang Berbagi</span> jika ada pertanyaan
              mengenai keputusan ini.
            </p>
          </div>
        </div>
      )}

      <FormWrapper
        schema={loginSchema}
        onSubmit={onSubmit}
        defaultValues={{ email: "", password: "" }}
        error={error}
      >
        <FormField
          name="email"
          label="Email"
          type="input"
          inputType="email"
          placeholder="admin@laz.id"
          autoComplete="email"
        />
        <FormField
          name="password"
          label="Password"
          type="input"
          inputType="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <Button type="submit" isLoading={isPending} className="w-full text-sm font-semibold">
          Masuk
        </Button>
      </FormWrapper>

      <p className="text-center text-sm text-secondary">
        Belum punya akun?{" "}
        <Link
          to="/register"
          className="text-brand-primary hover:text-brand-secondary hover:underline font-semibold transition"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

