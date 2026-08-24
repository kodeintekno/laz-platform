import { useEffect, useRef, useState, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle2, Clock, Copy, XCircle, RefreshCw, Loader2, Download } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import {
  getDonationStatusAction,
  type DonationStatusData,
} from "@/features/donations/actions/donations.actions";

// ─── Constants ────────────────────────────────────────────────────────────────

const VA_BANK_NAMES: Record<string, string> = {
  BCA_VIRTUAL_ACCOUNT: "BCA",
  BRI_VIRTUAL_ACCOUNT: "BRI",
  MANDIRI_VIRTUAL_ACCOUNT: "Mandiri",
  BNI_VIRTUAL_ACCOUNT: "BNI",
  PERMATA_VIRTUAL_ACCOUNT: "Permata",
  BSI_VIRTUAL_ACCOUNT: "BSI",
};

const POLL_INTERVAL_MS = 5_000; // 5 seconds

const TERMINAL_STATUSES = ["PAID", "FAILED", "EXPIRED"] as const;
type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

function isTerminalStatus(s: string | undefined): s is TerminalStatus {
  return TERMINAL_STATUSES.includes(s as TerminalStatus);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentInstructionsProps {
  donationId: string;
  paymentMethod: string;
  amount: number;
  qrString: string | null;
  vaNumber: string | null;
  expiresAt: string;
  programSlug: string;
  onRetry: () => void;
}

// ─── Helper: format rupiah ────────────────────────────────────────────────────

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Hook: countdown timer ────────────────────────────────────────────────────

function useCountdown(expiresAt: string) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const formatted =
    hours > 0
      ? `${hours}j ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}d`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { secondsLeft, formatted, isExpired: secondsLeft === 0 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const { formatted, isExpired } = useCountdown(expiresAt);

  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg ${isExpired
          ? "bg-destructive/10 text-destructive"
          : "bg-warning/10 text-warning"
        }`}
    >
      <Clock className="w-4 h-4 shrink-0" />
      {isExpired ? "Pembayaran telah kadaluarsa" : `Berlaku: ${formatted}`}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Nomor VA disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin. Salin manual.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-2 rounded-lg transition-all cursor-pointer border ${copied
          ? "bg-success/10 text-success border-success/20"
          : "bg-white text-brand-primary border-border/40 hover:bg-brand-primary/5 hover:border-brand-primary/30 shadow-sm"
        }`}
      aria-label="Salin nomor Virtual Account"
    >
      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

// ─── State screens ────────────────────────────────────────────────────────────

function PaidScreen({ amount }: { amount: number }) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    
    // Ulang animasi logo setiap 3 detik
    const interval = setInterval(() => {
      setAnimKey(prev => prev + 1);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center text-center py-10 px-2 sm:px-6 max-w-sm mx-auto overflow-hidden">
      {/* Animated Checkmark Container */}
      <div className="relative mb-6 flex justify-center items-center h-32 w-32">
        <svg key={animKey} className="anim-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle className="anim-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
          <path className="anim-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
      
      {/* Text Content */}
      <div 
        className="space-y-1.5 animate-bounce-fade-in" 
        style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}
      >
        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-emerald-700">
          Alhamdulillah!
        </h2>
        <p className="text-secondary font-bold uppercase tracking-widest text-[10px] sm:text-xs">
          Pembayaran Diterima
        </p>
      </div>

      <div 
        className="my-6 p-5 bg-surface-soft rounded-2xl border border-border/50 w-full shadow-sm animate-bounce-fade-in" 
        style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}
      >
        <p className="text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">Total Donasi</p>
        <p className="text-3xl font-black text-primary tracking-tight">{formatRupiah(amount)}</p>
      </div>
      
      <p 
        className="text-sm text-secondary leading-relaxed max-w-xs animate-bounce-fade-in" 
        style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}
      >
        Donasi Anda telah berhasil dikonfirmasi. Semoga menjadi amal jariyah yang pahalanya mengalir tiada henti.
      </p>
    </div>
  );
}

function FailedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <XCircle className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-primary mb-2">Pembayaran Gagal</h2>
      <p className="text-secondary mb-6 max-w-xs">
        Pembayaran tidak dapat diproses. Silakan coba lagi dengan metode pembayaran lain.
      </p>
      <Button intent="primary" onClick={onRetry}>
        Coba Lagi
      </Button>
    </div>
  );
}

function ExpiredScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mb-4">
        <Clock className="w-10 h-10 text-warning" />
      </div>
      <h2 className="text-xl font-bold text-primary mb-2">Waktu Habis</h2>
      <p className="text-secondary mb-6 max-w-xs">
        Batas waktu pembayaran telah berakhir. Silakan buat donasi baru untuk melanjutkan.
      </p>
      <Button intent="primary" onClick={onRetry}>
        Buat Donasi Baru
      </Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * PaymentInstructions — step 2 of the donation flow.
 *
 * Displays QRIS QR code or Virtual Account number with:
 * - Countdown timer to expiry
 * - Auto-polling of payment status (every 5s)
 * - Proper handling of all terminal states (PAID, FAILED, EXPIRED)
 *
 * Frontend security contract:
 * - Frontend DOES NOT decide payment success — it only displays backend state
 * - Polling calls the backend, which reads from DB (written by Xendit webhook)
 * - Terminal state detection uses donationStatus from backend
 */
export function PaymentInstructions({
  donationId,
  paymentMethod,
  amount,
  qrString,
  vaNumber,
  expiresAt,
  onRetry,
}: PaymentInstructionsProps) {
  const [status, setStatus] = useState<DonationStatusData | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isExpired } = useCountdown(expiresAt);

  const isVA = paymentMethod !== "QRIS";
  const bankName = VA_BANK_NAMES[paymentMethod] ?? paymentMethod;

  const poll = useCallback(async () => {
    const data = await getDonationStatusAction(donationId);
    if (!data) return;

    setStatus(data);

    // Stop polling when terminal state reached
    if (isTerminalStatus(data.donationStatus)) {
      setIsPolling(false);
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [donationId]);

  // Start polling immediately and every 5s
  useEffect(() => {
    void poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [poll]);

  // Stop polling if timer expired (even if webhook hasn't arrived yet)
  useEffect(() => {
    if (isExpired && status?.donationStatus !== "PAID") {
      setIsPolling(false);
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [isExpired, status?.donationStatus]);

  // ── Terminal state screens ──────────────────────────────────────────────────

  const currentStatus = status?.donationStatus;

  if (currentStatus === "PAID") {
    return (
      <Card className="max-w-md mx-auto mt-6">
        <CardContent>
          <PaidScreen amount={amount} />
        </CardContent>
      </Card>
    );
  }

  if (currentStatus === "FAILED") {
    return (
      <Card className="max-w-md mx-auto mt-6">
        <CardContent>
          <FailedScreen onRetry={onRetry} />
        </CardContent>
      </Card>
    );
  }

  if (currentStatus === "EXPIRED" || (isExpired && status?.donationStatus !== "PAID")) {
    return (
      <Card className="max-w-md mx-auto mt-6">
        <CardContent>
          <ExpiredScreen onRetry={onRetry} />
        </CardContent>
      </Card>
    );
  }

  // ── Waiting for payment ─────────────────────────────────────────────────────

  return (
    <Card className="max-w-md mx-auto mt-6">
      <CardContent className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {isVA ? `Pembayaran Virtual Account ${bankName}` : "Scan QRIS"}
            </h2>
            <p className="text-sm text-secondary mt-0.5">
              {isVA
                ? "Gunakan nomor Virtual Account untuk melakukan pembayaran"
                : "Scan dengan aplikasi e-wallet atau m-banking"}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-surface-soft rounded-xl p-4 text-center">
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">Total Donasi</p>
          <p className="text-3xl font-bold text-primary">{formatRupiah(amount)}</p>
        </div>

        {/* Countdown */}
        <div className="flex justify-center">
          <PaymentCountdown expiresAt={expiresAt} />
        </div>

        {/* Payment method specific content */}
        {isVA ? (
          <VirtualAccountDisplay bankName={bankName} vaNumber={vaNumber} />
        ) : (
          <QrisDisplay qrString={qrString} />
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-2 justify-center text-sm text-secondary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Menunggu pembayaran…</span>
        </div>

        {/* Instructions */}
        {isVA ? (
          <VAInstructions bankName={bankName} />
        ) : (
          <QrisInstructions />
        )}
      </CardContent>
    </Card>
  );
}

// ─── VA display ───────────────────────────────────────────────────────────────

function VirtualAccountDisplay({
  bankName,
  vaNumber,
}: {
  bankName: string;
  vaNumber: string | null;
}) {
  if (!vaNumber) {
    return (
      <div className="bg-surface-soft border border-border/40 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        <p className="text-secondary text-sm font-medium">Nomor Virtual Account sedang diproses…</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-soft border border-border/40 rounded-2xl p-4 sm:p-5">
      <p className="text-xs font-semibold text-secondary mb-2 uppercase tracking-wider">
        Nomor Virtual Account {bankName}
      </p>
      <div className="flex flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-border/30 shadow-sm">
        <p
          className="text-base sm:text-xl font-bold text-primary tracking-wider font-mono whitespace-nowrap"
          aria-label={`Nomor Virtual Account ${bankName}: ${vaNumber}`}
        >
          {vaNumber}
        </p>
        <div className="shrink-0">
          <CopyButton value={vaNumber} />
        </div>
      </div>
    </div>
  );
}

function VAInstructions({ bankName }: { bankName: string }) {
  const getInstructions = () => {
    switch (bankName.toUpperCase()) {
      case "BCA":
        return (
          <>
            <li>Buka aplikasi <strong>BCA mobile</strong> atau <strong>KlikBCA</strong> Anda.</li>
            <li>Pilih menu <strong>m-Transfer</strong>, lalu pilih <strong>BCA Virtual Account</strong>.</li>
            <li>Masukkan <strong>Nomor Virtual Account</strong> di atas pada kolom yang tersedia.</li>
            <li>Periksa kembali nama tagihan dan nominal pembayaran pada layar konfirmasi.</li>
            <li>Masukkan PIN m-BCA Anda untuk menyelesaikan pembayaran.</li>
          </>
        );
      case "MANDIRI":
        return (
          <>
            <li>Buka aplikasi <strong>Livin' by Mandiri</strong> Anda.</li>
            <li>Pilih menu <strong>Bayar</strong>, lalu pilih <strong>Virtual Account</strong> atau penyedia jasa.</li>
            <li>Masukkan <strong>Nomor Virtual Account</strong> di atas pada kolom yang disediakan.</li>
            <li>Pastikan detail nama dan nominal tagihan sudah sesuai pada layar konfirmasi.</li>
            <li>Masukkan PIN Livin' Anda untuk mengonfirmasi transaksi.</li>
          </>
        );
      case "BRI":
        return (
          <>
            <li>Buka aplikasi <strong>BRImo</strong> Anda.</li>
            <li>Pilih menu <strong>Tagihan</strong> atau <strong>Pembayaran</strong>, lalu pilih <strong>BRIVA</strong>.</li>
            <li>Masukkan <strong>Nomor Briva (Virtual Account)</strong> di atas.</li>
            <li>Periksa detail tagihan yang muncul pada layar konfirmasi Anda.</li>
            <li>Masukkan PIN BRImo Anda untuk memproses pembayaran.</li>
          </>
        );
      case "BNI":
        return (
          <>
            <li>Buka aplikasi <strong>BNI Mobile Banking</strong> Anda.</li>
            <li>Pilih menu <strong>Transfer</strong>, lalu pilih opsi <strong>Virtual Account Billing</strong>.</li>
            <li>Pilih <strong>Input Baru</strong> dan masukkan <strong>Nomor Virtual Account</strong> di atas.</li>
            <li>Pastikan nominal dan nama institusi sudah benar, kemudian pilih <strong>Lanjut</strong>.</li>
            <li>Masukkan <em>Password Transaksi</em> Anda untuk menyelesaikan pembayaran.</li>
          </>
        );
      case "PERMATA":
        return (
          <>
            <li>Buka aplikasi <strong>PermataMobile X</strong> Anda.</li>
            <li>Pilih menu <strong>Bayar Tagihan</strong>, kemudian pilih <strong>Virtual Account</strong>.</li>
            <li>Masukkan <strong>Nomor Virtual Account</strong> di atas dengan benar.</li>
            <li>Periksa kembali rincian nominal dan nama tagihan pada layar perangkat Anda.</li>
            <li>Konfirmasi pembayaran menggunakan PIN atau otentikasi lainnya.</li>
          </>
        );
      case "BSI":
        return (
          <>
            <li>Buka aplikasi <strong>BSI Mobile</strong> Anda.</li>
            <li>Pilih menu <strong>Pembayaran</strong>, lalu pilih opsi <strong>Institusi</strong>.</li>
            <li>Masukkan nama institusi <strong>Xendit</strong> atau kode <strong>9347</strong>.</li>
            <li>Masukkan <strong>Nomor Virtual Account</strong> di atas pada kolom pembayaran.</li>
            <li>Pastikan informasi tagihan sudah sesuai, lalu masukkan PIN BSI Mobile Anda.</li>
          </>
        );
      default:
        return (
          <>
            <li>Buka aplikasi <strong>Mobile Banking</strong> dari bank Anda.</li>
            <li>Pilih menu <strong>Pembayaran Tagihan</strong> atau <strong>Virtual Account</strong>.</li>
            <li>Masukkan <strong>Nomor Virtual Account</strong> di atas secara teliti.</li>
            <li>Pastikan bahwa nama institusi dan nominal pembayaran sudah sesuai.</li>
            <li>Lanjutkan proses pembayaran dan simpan bukti transaksinya.</li>
          </>
        );
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-secondary uppercase tracking-wide">
        Tata Cara Pembayaran
      </p>
      <ol className="text-sm text-secondary space-y-2 list-decimal list-outside ml-4">
        {getInstructions()}
      </ol>
    </div>
  );
}

// ─── QRIS display ─────────────────────────────────────────────────────────────

function QrisDisplay({ qrString }: { qrString: string | null }) {
  if (!qrString) {
    return (
      <div className="flex items-center justify-center bg-surface-soft rounded-xl p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  const handleDownload = () => {
    const canvas = document.getElementById("qris-canvas") as HTMLCanvasElement;
    if (!canvas) return;

    // We want to download the QR with a white background padding
    const padding = 20;
    const newCanvas = document.createElement("canvas");
    newCanvas.width = canvas.width + padding * 2;
    newCanvas.height = canvas.height + padding * 2;
    const ctx = newCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    const url = newCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `QRIS-Donasi.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-inner inline-block">
        <QRCodeCanvas
          id="qris-canvas"
          value={qrString}
          size={220}
          level="M"
          includeMargin={false}
          aria-label="QR Code pembayaran QRIS"
        />
      </div>
      <Button
        type="button"
        intent="outline"
        size="sm"
        onClick={handleDownload}
        className="flex items-center gap-2 mt-1"
      >
        <Download className="w-4 h-4" /> Unduh QR
      </Button>
      <p className="text-xs text-secondary text-center max-w-xs">
        Pindai QR dengan aplikasi e-wallet atau m-banking, atau unduh gambar untuk dipindai dari galeri perangkat Anda.
      </p>
    </div>
  );
}

function QrisInstructions() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-secondary uppercase tracking-wide">
        Tata Cara Pembayaran QRIS
      </p>
      <ol className="text-sm text-secondary space-y-2 list-decimal list-outside ml-4">
        <li>Buka aplikasi <strong>e-wallet</strong> atau <strong>m-banking</strong> pilihan Anda.</li>
        <li>Pilih menu <strong>Scan QR</strong> atau <strong>QRIS</strong>.</li>
        <li>Pindai kode QRIS di atas, atau pilih ikon galeri untuk mengunggah gambar QRIS yang sudah Anda unduh.</li>
        <li>Periksa kembali informasi pembayaran dan pastikan nominal donasi sesuai.</li>
        <li>Masukkan PIN atau kata sandi Anda untuk menyelesaikan transaksi.</li>
      </ol>
    </div>
  );
}
