/**
 * SuratTugas.tsx
 * Komponen @react-pdf/renderer untuk mencetak Surat Tugas Relawan.
 * Di-render sepenuhnya di browser (client-side PDF generation).
 */
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Warna & Tipografi ────────────────────────────────────────────────────────
const COLOR = {
  primary: "#1E3A5F",    // navy deep
  accent: "#2E86C1",     // biru lembaga
  text: "#1A1A2E",
  muted: "#555E7B",
  border: "#CBD5E1",
  bg: "#F7FAFC",
  white: "#FFFFFF",
  gold: "#B8860B",
};

Font.registerHyphenationCallback((word) => [word]); // disable hyphenation

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLOR.white,
    fontFamily: "Helvetica",
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // ── Header strip ──
  headerStrip: {
    backgroundColor: COLOR.primary,
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 8,
    objectFit: "contain",
    backgroundColor: COLOR.white,
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLOR.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholderText: {
    color: COLOR.white,
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  headerTextBlock: {
    flex: 1,
  },
  lembagaName: {
    color: COLOR.white,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  lembagaSubtitle: {
    color: "#A8C4E0",
    fontSize: 9,
    marginTop: 3,
  },
  // ── Divider ──
  accentBar: {
    height: 4,
    backgroundColor: COLOR.accent,
  },
  // ── Body ──
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
  },
  // ── Title block ──
  titleCenter: {
    alignItems: "center",
    marginBottom: 8,
  },
  docTitle: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: COLOR.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  docSubtitle: {
    fontSize: 9,
    color: COLOR.muted,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  nomorSurat: {
    fontSize: 9,
    color: COLOR.muted,
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLOR.primary,
    marginTop: 12,
    marginBottom: 20,
  },
  // ── Intro text ──
  introText: {
    fontSize: 10,
    color: COLOR.text,
    lineHeight: 1.7,
    textAlign: "justify",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  // ── Info card ──
  infoCard: {
    backgroundColor: COLOR.bg,
    borderRadius: 8,
    borderLeft: `3px solid ${COLOR.accent}`,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoLabel: {
    width: 130,
    fontSize: 9,
    color: COLOR.muted,
  },
  infoColon: {
    width: 10,
    fontSize: 9,
    color: COLOR.muted,
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: COLOR.text,
    fontFamily: "Helvetica-Bold",
  },
  // ── Closing text ──
  closingText: {
    fontSize: 10,
    color: COLOR.text,
    lineHeight: 1.7,
    textAlign: "justify",
    marginTop: 4,
  },
  // ── Signature block ──
  signatureSection: {
    marginTop: 36,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBox: {
    alignItems: "center",
    width: 200,
  },
  signatureCity: {
    fontSize: 9,
    color: COLOR.muted,
    marginBottom: 2,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLOR.primary,
    marginTop: 48,
    textAlign: "center",
  },
  signatureRole: {
    fontSize: 8,
    color: COLOR.muted,
    textAlign: "center",
    marginTop: 2,
  },
  signatureLine: {
    height: 1,
    backgroundColor: COLOR.border,
    width: "100%",
    marginTop: 2,
  },
  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLOR.primary,
    paddingVertical: 8,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#A8C4E0",
  },
  // ── Watermark area ──
  validBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    marginBottom: 4,
  },
  validDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  validText: {
    fontSize: 8,
    color: "#22C55E",
    fontFamily: "Helvetica-Bold",
  },
});

// ─── Helper ──────────────────────────────────────────────────────────────────
function fmtDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(dateStr));
}

function buildNomor(applicationId: string, approvedAt?: string | null): string {
  const year = approvedAt ? new Date(approvedAt).getFullYear() : new Date().getFullYear();
  const code = applicationId.slice(-6).toUpperCase();
  return `ST/REL/${year}/${code}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────
export interface SuratTugasProps {
  applicationId: string;
  volunteerName: string;
  volunteerPhone?: string;
  volunteerEmail?: string;
  volunteerAddress?: string;
  activityTitle: string;
  activityLocation?: string;
  activityDate?: string;
  lembagaName: string;
  lembagaLogo?: string | null;
  lembagaAddress?: string;
  picName?: string;
  picPhone?: string;
  approvedAt?: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function SuratTugasPdf({
  applicationId,
  volunteerName,
  volunteerPhone,
  volunteerEmail,
  volunteerAddress,
  activityTitle,
  activityLocation,
  activityDate,
  lembagaName,
  lembagaLogo,
  lembagaAddress,
  picName,
  picPhone,
  approvedAt,
}: SuratTugasProps) {
  const nomorSurat = buildNomor(applicationId, approvedAt);
  const tanggalSurat = fmtDate(approvedAt ?? new Date().toISOString());
  const initials = lembagaName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Document
      title={`Surat Tugas Relawan - ${volunteerName}`}
      author={lembagaName}
      subject="Surat Tugas Relawan"
      keywords="surat tugas, relawan, LAZ"
    >
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ── */}
        <View style={styles.headerStrip}>
          {lembagaLogo ? (
            <Image src={lembagaLogo} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>{initials}</Text>
            </View>
          )}
          <View style={styles.headerTextBlock}>
            <Text style={styles.lembagaName}>{lembagaName}</Text>
            {lembagaAddress ? (
              <Text style={styles.lembagaSubtitle}>{lembagaAddress}</Text>
            ) : null}
            {picPhone ? (
              <Text style={styles.lembagaSubtitle}>Telp: {picPhone}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.accentBar} />

        {/* ── BODY ── */}
        <View style={styles.body}>
          {/* Title */}
          <View style={styles.titleCenter}>
            <Text style={styles.docTitle}>Surat Tugas</Text>
            <Text style={styles.docSubtitle}>Penugasan Relawan Kegiatan Sosial</Text>
            <Text style={styles.nomorSurat}>Nomor: {nomorSurat}</Text>
          </View>
          <View style={styles.divider} />

          {/* Intro */}
          <Text style={styles.introText}>
            Yang bertanda tangan di bawah ini, atas nama{" "}
            <Text style={styles.bold}>{lembagaName}</Text>, dengan ini menyatakan bahwa:{"\n\n"}
            Berdasarkan pendaftaran yang telah diverifikasi dan disetujui pada tanggal{" "}
            <Text style={styles.bold}>{tanggalSurat}</Text>, individu yang tercantum di bawah ini
            resmi ditugaskan sebagai <Text style={styles.bold}>Relawan</Text> dalam kegiatan yang
            diselenggarakan oleh {lembagaName}.
          </Text>

          {/* Info Relawan */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>▍ Data Relawan</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Lengkap</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{volunteerName}</Text>
            </View>
            {volunteerPhone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>No. Telepon</Text>
                <Text style={styles.infoColon}>:</Text>
                <Text style={styles.infoValue}>{volunteerPhone}</Text>
              </View>
            )}
            {volunteerEmail && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoColon}>:</Text>
                <Text style={styles.infoValue}>{volunteerEmail}</Text>
              </View>
            )}
            {volunteerAddress && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Alamat Domisili</Text>
                <Text style={styles.infoColon}>:</Text>
                <Text style={styles.infoValue}>{volunteerAddress}</Text>
              </View>
            )}
          </View>

          {/* Info Kegiatan */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>▍ Data Kegiatan</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Kegiatan</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{activityTitle}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Penyelenggara</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{lembagaName}</Text>
            </View>
            {activityLocation && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Lokasi</Text>
                <Text style={styles.infoColon}>:</Text>
                <Text style={styles.infoValue}>{activityLocation}</Text>
              </View>
            )}
            {activityDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tanggal Kegiatan</Text>
                <Text style={styles.infoColon}>:</Text>
                <Text style={styles.infoValue}>{fmtDate(activityDate)}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={[styles.infoValue, { color: "#16A34A" }]}>✓ DISETUJUI</Text>
            </View>
          </View>

          {/* Closing */}
          <Text style={styles.closingText}>
            Surat tugas ini dikeluarkan sebagai bukti resmi penugasan relawan dan berlaku selama
            kegiatan berlangsung. Relawan yang bersangkutan diharapkan untuk melaksanakan tugas
            dengan penuh tanggung jawab sesuai arahan panitia penyelenggara.
          </Text>

          {/* Valid badge */}
          <View style={styles.validBadge}>
            <View style={styles.validDot} />
            <Text style={styles.validText}>Dokumen ini sah dan diterbitkan secara resmi oleh {lembagaName}</Text>
          </View>

          {/* Signature */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureCity}>{tanggalSurat}</Text>
              <Text style={[styles.signatureCity, { marginTop: 2 }]}>Pimpinan / Koordinator</Text>
              <Text style={styles.signatureName}>{picName || lembagaName}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureRole}>{lembagaName}</Text>
            </View>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Nomor Surat: {nomorSurat} · Diterbitkan: {tanggalSurat}
          </Text>
          <Text style={styles.footerText}>LAZ Platform · Dokumen Resmi Relawan</Text>
        </View>
      </Page>
    </Document>
  );
}
