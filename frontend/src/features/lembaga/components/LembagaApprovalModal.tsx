import type { Lembaga } from "@prisma/client";
import { Button, Badge } from "@/components/ui";
import { FileText, X } from "lucide-react";

const DOCUMENT_LABELS: Record<string, string> = {
  AKTA_YAYASAN: "Akta Yayasan",
  SK_KEMENKUMHAM: "SK Kemenkumham / Legalitas",
  NPWP: "NPWP",
  OTHER: "Dokumen Pendukung Lainnya",
};

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface rounded-2xl shadow-xl border border-border/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/40">
          <h3 className="text-lg font-bold text-primary">Detail Pendaftaran Lembaga</h3>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            {lembaga.logoUrl ? (
              <img src={lembaga.logoUrl} alt={lembaga.name} className="w-16 h-16 rounded-xl object-cover border border-border/40" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-surface-muted flex items-center justify-center font-bold text-primary border border-border/40">
                {lembaga.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xl font-bold text-primary">{lembaga.name}</p>
              <Badge intent="warning">Menunggu Persetujuan</Badge>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-secondary font-medium">Penanggung Jawab</dt>
              <dd className="text-primary font-semibold">{lembaga.picName}</dd>
            </div>
            <div>
              <dt className="text-secondary font-medium">No. Telepon PIC</dt>
              <dd className="text-primary font-semibold">{lembaga.picPhone || "-"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-secondary font-medium">Alamat</dt>
              <dd className="text-primary font-semibold">{lembaga.address}</dd>
            </div>
            <div>
              <dt className="text-secondary font-medium">Nomor Izin Yayasan</dt>
              <dd className="text-primary font-semibold">{lembaga.izinYayasanNumber || "-"}</dd>
            </div>
            <div>
              <dt className="text-secondary font-medium">Website</dt>
              <dd className="text-primary font-semibold">{lembaga.website || "-"}</dd>
            </div>
            {lembaga.description && (
              <div className="sm:col-span-2">
                <dt className="text-secondary font-medium">Deskripsi</dt>
                <dd className="text-primary whitespace-pre-wrap">{lembaga.description}</dd>
              </div>
            )}
          </dl>

          {lembaga.officePhotoUrl && (
            <div>
              <p className="text-sm font-bold text-primary mb-2">Foto Kantor</p>
              <img
                src={lembaga.officePhotoUrl}
                alt="Foto kantor lembaga"
                className="w-full max-h-64 object-cover rounded-xl border border-border/40"
              />
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-primary mb-3">Dokumen Terlampir</p>
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-brand-primary transition text-sm"
                  >
                    <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="font-medium text-primary">{DOCUMENT_LABELS[doc.type] ?? doc.type}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary">Tidak ada dokumen yang diunggah.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border/40">
          <Button intent="destructive" onClick={onReject}>Tolak</Button>
          <Button intent="primary" onClick={onApprove}>Setujui</Button>
        </div>
      </div>
    </div>
  );
}
