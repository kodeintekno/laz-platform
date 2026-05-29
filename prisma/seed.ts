/**
 * Prisma Seed Script — Phase 2
 *
 * Seeds:
 * 1. All permission rows from constants
 * 2. All 5 roles
 * 3. Role ↔ Permission matrix (from docs/user-roles-rbac.md)
 * 4. One SUPER_ADMIN user
 *
 * Run with: npx prisma db seed
 *
 * Safe to re-run — uses upsert throughout.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Permission definitions ───────────────────────────────────────────────────

const PERMISSION_DEFINITIONS = [
  // Users
  { key: "users.read", description: "Melihat daftar pengguna" },
  { key: "users.create", description: "Menambah/mendaftarkan pengguna baru" },
  { key: "users.update", description: "Mengubah informasi profil & status pengguna" },
  { key: "users.delete", description: "Menghapus akun pengguna dari sistem" },
  { key: "users.manage_roles", description: "Mengatur dan menetapkan peran (Role) pengguna" },
  // Programs
  { key: "programs.read", description: "Melihat daftar program bantuan/kampanye" },
  { key: "programs.create", description: "Membuat program bantuan/kampanye baru" },
  { key: "programs.update", description: "Mengubah detail informasi program bantuan" },
  { key: "programs.delete", description: "Menghapus program bantuan dari sistem" },
  { key: "programs.publish", description: "Mempublikasikan program agar bisa menerima donasi" },
  // Donations
  { key: "donations.read", description: "Melihat riwayat transaksi donasi masuk" },
  { key: "donations.create", description: "Mencatat transaksi donasi secara manual" },
  { key: "donations.update", description: "Mengubah status atau informasi donasi" },
  // Payments
  { key: "payments.read", description: "Melihat riwayat transaksi pembayaran" },
  { key: "payments.manage", description: "Mengelola dan verifikasi status pembayaran donasi" },
  // Distributions
  { key: "distributions.read", description: "Melihat riwayat penyaluran dana zakat/bantuan" },
  { key: "distributions.manage", description: "Mengelola dan menyetujui pengajuan penyaluran dana" },
  { key: "distributions.upload", description: "Mengunggah dokumentasi/bukti penyaluran dana" },
  // Audit
  { key: "audit.read", description: "Melihat catatan aktivitas/log audit sistem" },
  // Reports
  { key: "reports.read", description: "Melihat laporan statistik umum kinerja platform" },
  { key: "reports.financial", description: "Melihat laporan keuangan dan kas lembaga" },
  // RBAC
  { key: "roles.read", description: "Melihat daftar tingkat peran (Role)" },
  { key: "roles.manage", description: "Mengatur hak akses dan matriks izin peran (RBAC)" },
  { key: "permissions.manage", description: "Mengelola daftar definisi hak akses sistem" },
  // Settings
  { key: "settings.manage", description: "Mengubah pengaturan dan konfigurasi sistem" },
  // LAZ Management
  { key: "laz.manage", description: "Mengelola pendaftaran lembaga amil zakat (LAZ)" },
];

// ─── Role ↔ Permission matrix (from docs/user-roles-rbac.md) ─────────────────

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSION_DEFINITIONS.map((p) => p.key), // full access

  ADMIN: [
    "programs.read",
    "programs.create",
    "programs.update",
    "programs.delete",
    "programs.publish",
    "donations.read",
    "donations.update",
    "distributions.read",
    "distributions.manage",
    "reports.read",
    "users.read",
  ],

  FINANCE: [
    "payments.read",
    "payments.manage",
    "distributions.read",
    "distributions.manage",
    "reports.read",
    "reports.financial",
    "donations.read",
  ],

  DONATUR: ["donations.read", "donations.create"],

  RELAWAN: ["distributions.read", "distributions.upload"],
};

const ROLE_DEFINITIONS = [
  { name: "SUPER_ADMIN", description: "Full system access" },
  { name: "ADMIN", description: "Manage programs and donations" },
  { name: "FINANCE", description: "Manage payments and distributions" },
  { name: "DONATUR", description: "Make donations and view history" },
  { name: "RELAWAN", description: "Support field distributions" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding LAZ Platform...\n");

  // 0. Upsert default LAZ organization
  console.log("🏢 Seeding default LAZ organization...");
  const defaultLaz = await prisma.laz.upsert({
    where: { slug: "laz-peduli" },
    update: { name: "LAZ Peduli" },
    create: {
      name: "LAZ Peduli",
      slug: "laz-peduli",
      logoUrl: "https://example.com/logo.png",
      status: "ACTIVE",
    },
  });
  console.log(` ✓ Default LAZ created: ${defaultLaz.name}\n`);

  // 1. Upsert all permissions
  console.log("📋 Seeding permissions...");
  const permissionMap: Record<string, string> = {};

  for (const perm of PERMISSION_DEFINITIONS) {
    const created = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: { key: perm.key, description: perm.description },
    });
    permissionMap[perm.key] = created.id;
    process.stdout.write(".");
  }
  console.log(` ✓ ${PERMISSION_DEFINITIONS.length} permissions\n`);

  // 2. Upsert all roles
  console.log("🔐 Seeding roles...");
  const roleMap: Record<string, string> = {};

  for (const role of ROLE_DEFINITIONS) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
    roleMap[role.name] = created.id;
    process.stdout.write(".");
  }
  console.log(` ✓ ${ROLE_DEFINITIONS.length} roles\n`);

  // 3. Upsert role-permission mappings
  console.log("🔗 Seeding role-permission mappings...");
  let mappingCount = 0;

  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    for (const key of permKeys) {
      const permissionId = permissionMap[key];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
      mappingCount++;
    }
  }
  console.log(` ✓ ${mappingCount} mappings\n`);

  // 4. Seed SUPER_ADMIN user
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@laz.id";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const superAdminRoleId = roleMap["SUPER_ADMIN"];

  console.log(`👤 Seeding SUPER_ADMIN user (${adminEmail})...`);

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      roleId: superAdminRoleId,
      status: "ACTIVE",
      lazId: defaultLaz.id,
    },
    create: {
      email: adminEmail,
      name: "Super Admin",
      password: hashedPassword,
      status: "ACTIVE",
      roleId: superAdminRoleId,
      lazId: defaultLaz.id,
    },
  });
  console.log(" ✓ Super admin created");

  // ─── Dummy Programs ─────────────────────────────────────────────────────────
  console.log("\n📦 Seeding dummy programs...");

  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (adminUser) {
    const dummyPrograms = [
      {
        title: "Bantu Pembangunan Masjid Pelosok",
        slug: "bantu-pembangunan-masjid-pelosok",
        description: "Masjid di desa terpencil ini butuh bantuan renovasi agar jamaah bisa beribadah dengan aman.",
        targetAmount: 50000000,
        currentAmount: 12500000,
        category: "INFAK" as const,
        status: "PUBLISHED" as const,
        imageUrl: "https://images.unsplash.com/photo-1594957422315-77a829e0ebef?q=80&w=800&auto=format&fit=crop",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdById: adminUser.id,
      },
      {
        title: "Zakat Fitrah & Maal 1447 H",
        slug: "zakat-fitrah-maal",
        description: "Tunaikan kewajiban zakat Anda untuk membersihkan harta dan menyucikan jiwa.",
        targetAmount: 100000000,
        currentAmount: 45000000,
        category: "ZAKAT" as const,
        status: "PUBLISHED" as const,
        imageUrl: "https://images.unsplash.com/photo-1628185521855-3ebffc634dd3?q=80&w=800&auto=format&fit=crop",
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdById: adminUser.id,
      },
      {
        title: "Sedekah Air Bersih untuk Kekeringan",
        slug: "sedekah-air-bersih",
        description: "Bantu alirkan air bersih untuk desa-desa yang mengalami kekeringan ekstrem musim ini.",
        targetAmount: 25000000,
        currentAmount: 25000000,
        category: "SEDEKAH" as const,
        status: "COMPLETED" as const,
        imageUrl: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=800&auto=format&fit=crop",
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdById: adminUser.id,
      }
    ];

    for (const prog of dummyPrograms) {
      await prisma.program.upsert({
        where: { lazId_slug: { lazId: defaultLaz.id, slug: prog.slug } },
        update: {},
        create: {
          ...prog,
          lazId: defaultLaz.id,
        },
      });
    }
    console.log(" ✓ Dummy programs seeded");
  }

  console.log("\n✅ Seeding complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
