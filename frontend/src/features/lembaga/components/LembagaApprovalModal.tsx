import { useState } from "react";
import type { Lembaga } from "@prisma/client";
import { Button, Badge } from "@/components/ui";
import {
  X,
  Building2,
  User,
  Phone,
  MapPin,
  Globe,
  Hash,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileCheck,
  Camera,
  Download,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DOCUMENT_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  AKTA_YAYASAN: { label: "Akta Yayasan", icon: FileCheck },
  SK_KEMENKUMHAM: { label: "SK Kemenkumham / Legalitas", icon: FileCheck },
  NPWP: { label: "NPWP", icon: FileText },
  OTHER: { label: "Dokumen Pendukung Lainnya", icon: FileText },
};

type Tab = "info" | "dokumen";

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Helper: detect if URL points to a PDF file
// ---------------------------------------------------------------------------
function isPdfUrl(url: string): boolean {
  // Cloudinary PDFs (resource_type auto/image) have .pdf in the URL path
  // e.g. https://res.cloudinary.com/cloud/image/upload/folder/file.pdf
  // Also covers /raw/upload/ just in case
  return /\.pdf($|\?)/i.test(url) || url.includes("/raw/upload/");
}

function isImageUrl(url: string): boolean {
  if (isPdfUrl(url)) return false;
  return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
}

// ---------------------------------------------------------------------------
// Helper: force download URL (Cloudinary) — works for both image and raw/PDF
// ---------------------------------------------------------------------------
function getDownloadUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  // PDFs stored as raw resource type
  if (url.includes("/raw/upload/")) {
    return url.replace("/raw/upload/", "/raw/upload/fl_attachment/");
  }
  // Images and PDFs stored as image resource type
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/fl_attachment/");
  }
  // Fallback generic /upload/ replacement
  if (url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
}

// ---------------------------------------------------------------------------
// Sub-component: Document/File preview card
// ---------------------------------------------------------------------------
function DocCard({ doc }: { doc: { id: string; type: string; fileUrl: string } }) {
  const meta = DOCUMENT_LABELS[doc.type] ?? { label: doc.type, icon: FileText };
  const isImage = isImageUrl(doc.fileUrl);
  const isPdf = isPdfUrl(doc.fileUrl);
  const Icon = meta.icon;

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-surface hover:border-brand-primary/40 transition-all duration-200 shadow-sm hover:shadow-md group">
      {/* Preview area */}
      <div className="bg-surface-muted h-44 flex items-center justify-center overflow-hidden relative">
        {isImage ? (
          <img
            src={doc.fileUrl}
            alt={meta.label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* PDF / Document placeholder with always-visible open button */
          <div className="flex flex-col items-center gap-3 text-muted px-4 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-red-400" strokeWidth={1.2} />
            </div>
            <p className="text-xs font-semibold text-primary">
              {isPdf ? "File PDF" : "Dokumen"}
            </p>
            {/* Always-visible open link for PDF — not buried in hover overlay */}
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka PDF
            </a>
          </div>
        )}
        {/* Action overlay — for images only */}
        {isImage && (
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 hover:bg-black/50 transition-all duration-200 opacity-0 group-hover:opacity-100">
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition"
              title="Buka di tab baru"
            >
              <ExternalLink className="w-5 h-5 text-white drop-shadow-md" />
            </a>
            <a
              href={getDownloadUrl(doc.fileUrl)}
              download
              className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition"
              title="Download"
            >
              <Download className="w-5 h-5 text-white drop-shadow-md" />
            </a>
          </div>
        )}
      </div>
      {/* Label */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
          <span className="text-xs font-semibold text-primary truncate">{meta.label}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-brand-primary hover:text-brand-secondary transition"
            title="Buka"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={getDownloadUrl(doc.fileUrl)}
            download
            className="text-brand-primary hover:text-brand-secondary transition"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info row helper
// ---------------------------------------------------------------------------
function InfoRow({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-primary break-words">{value || <span className="text-muted italic">—</span>}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------
export function LembagaApprovalModal({
  lembaga,
  onClose,
  onApprove,
  onReject,
}: {
  lembaga: Lembaga;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const documents = (lembaga.documents as any[]) ?? [];
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const isPending = lembaga.status === "PENDING";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-3xl shadow-2xl border border-border/40 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4 p-6 border-b border-border/40 shrink-0">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl border border-border/40 overflow-hidden bg-surface-muted shrink-0 flex items-center justify-center">
            {lembaga.logoUrl ? (
              <img src={lembaga.logoUrl} alt={lembaga.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary">{lembaga.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-primary truncate">{lembaga.name}</h3>
              <Badge intent={lembaga.status === "APPROVED" ? "success" : lembaga.status === "REJECTED" ? "destructive" : "warning"}>
                {lembaga.status === "PENDING" ? "Menunggu Persetujuan"
                  : lembaga.status === "APPROVED" ? "Disetujui"
                  : "Ditolak"}
              </Badge>
            </div>
            <p className="text-sm text-secondary mt-0.5">
              Didaftarkan:{" "}
              {new Date(lembaga.createdAt).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface-muted transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 px-6 pt-4 shrink-0 border-b border-border/40">
          {([
            { id: "info", label: "Informasi Lembaga", icon: Building2 },
            { id: "dokumen", label: `Dokumen (${documents.length})`, icon: FileText },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? "border-brand-primary text-brand-primary bg-brand-primary/5"
                  : "border-transparent text-secondary hover:text-primary"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── TAB: Info ──────────────────────────────────────────────────── */}
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Foto Kantor */}
              {lembaga.officePhotoUrl && (
                <div>
                  <p className="text-sm font-bold text-primary mb-2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-brand-primary" />
                    Foto Kantor
                  </p>
                  <div className="relative overflow-hidden rounded-2xl border border-border/40 group">
                    <img
                      src={lembaga.officePhotoUrl}
                      alt="Foto kantor lembaga"
                      className="w-full max-h-64 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={lembaga.officePhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-black/60 hover:bg-black/80 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Buka
                      </a>
                      <a
                        href={getDownloadUrl(lembaga.officePhotoUrl)}
                        download
                        className="bg-brand-primary/90 hover:bg-brand-primary text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Lembaga */}
              <div>
                <p className="text-sm font-bold text-primary mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-brand-primary" />
                  Data Lembaga
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-muted/60 rounded-2xl p-4 border border-border/30">
                  <InfoRow label="Nama Lembaga" value={lembaga.name} full />
                  <InfoRow label="Penanggung Jawab (PIC)" value={lembaga.picName} />
                  <InfoRow label="Nomor Telepon PIC" value={lembaga.picPhone} />
                  <InfoRow label="Nomor Izin Yayasan" value={lembaga.izinYayasanNumber} />
                  <InfoRow label="Website" value={lembaga.website} />
                  <InfoRow label="Alamat" value={lembaga.address} full />
                  {lembaga.description && (
                    <InfoRow label="Deskripsi" value={lembaga.description} full />
                  )}
                </dl>
              </div>

              {/* Info Dokumen ringkas */}
              {documents.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    Terdapat <strong>{documents.length} dokumen</strong> yang dilampirkan. Buka tab{" "}
                    <button
                      className="underline font-semibold hover:text-amber-900"
                      onClick={() => setActiveTab("dokumen")}
                    >
                      Dokumen
                    </button>{" "}
                    untuk melihat dan memeriksa setiap dokumen.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Dokumen ───────────────────────────────────────────────── */}
          {activeTab === "dokumen" && (
            <div>
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc: any) => (
                    <DocCard key={doc.id} doc={doc} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-secondary">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Tidak ada dokumen yang dilampirkan</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Actions ────────────────────────────────────────────────── */}
        {isPending && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border/40 bg-surface-muted/40 shrink-0">
            <p className="text-xs text-secondary text-center sm:text-left">
              Pastikan Anda telah memeriksa semua dokumen sebelum memberikan keputusan.
            </p>
            <div className="flex gap-3 shrink-0">
              <Button
                intent="destructive"
                onClick={onReject}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Tolak
              </Button>
              <Button
                intent="primary"
                onClick={onApprove}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Setujui Pendaftaran
              </Button>
            </div>
          </div>
        )}

        {/* For non-PENDING: just close button */}
        {!isPending && (
          <div className="flex justify-end px-6 py-4 border-t border-border/40 shrink-0">
            <Button intent="outline" onClick={onClose}>Tutup</Button>
          </div>
        )}
      </div>
    </div>
  );
}
