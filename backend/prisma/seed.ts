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

  if (process.env.NODE_ENV === "production") {
    console.log(" ℹ️ Skipping dummy programs in production environment.");
  } else {
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminUser) throw new Error("Admin user not found. Cannot seed dummy programs.");

    const dummyDonatur = await prisma.user.upsert({
      where: { email: "donatur@laz.id" },
      update: {},
      create: {
        email: "donatur@laz.id",
        name: "Budi Donatur",
        password: hashedPassword,
        status: "ACTIVE",
        roleId: roleMap["DONATUR"],
        lazId: defaultLaz.id,
      }
    });

    const dummyPrograms = [
      {
        title: "Bantu Pembangunan Masjid Pelosok",
        slug: "bantu-pembangunan-masjid-pelosok",
        description: "Masjid di desa terpencil ini butuh bantuan renovasi agar jamaah bisa beribadah dengan aman.",
        targetAmount: 50000000,
        category: "INFAK" as const,
        status: "PUBLISHED" as const,
        imageUrl: "https://images.unsplash.com/photo-1594957422315-77a829e0ebef?q=80&w=800&auto=format&fit=crop",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdById: adminUser.id,
        donations: [
          { amount: 5000000, status: "PAID", method: "BCA_VA", user: dummyDonatur, anon: false, msg: "Bismillah untuk masjid" },
          { amount: 2500000, status: "PAID", method: "GOPAY", user: null, anon: true, msg: "Semoga cepat selesai pembangunannya" },
          { amount: 5000000, status: "PAID", method: "MANUAL", user: null, anon: true, msg: "Titip infak via kantor LAZ" },
          { amount: 1000000, status: "PENDING", method: "MANDIRI_VA", user: dummyDonatur, anon: false, msg: "" },
        ]
      },
      {
        title: "Zakat Fitrah & Maal 1447 H",
        slug: "zakat-fitrah-maal",
        description: "Tunaikan kewajiban zakat Anda untuk membersihkan harta dan menyucikan jiwa.",
        targetAmount: 100000000,
        category: "ZAKAT" as const,
        status: "PUBLISHED" as const,
        imageUrl: "https://images.unsplash.com/photo-1628185521855-3ebffc634dd3?q=80&w=800&auto=format&fit=crop",
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdById: adminUser.id,
        donations: [
          { amount: 25000000, status: "PAID", method: "BNI_VA", user: null, anon: true, msg: "Zakat Maal keluarga hamba Allah" },
          { amount: 20000000, status: "PAID", method: "MANUAL", user: null, anon: false, msg: "Pembayaran zakat tunai di posko" },
        ]
      },
      {
        title: "Sedekah Air Bersih untuk Kekeringan",
        slug: "sedekah-air-bersih",
        description: "Bantu alirkan air bersih untuk desa-desa yang mengalami kekeringan ekstrem musim ini.",
        targetAmount: 25000000,
        category: "SEDEKAH" as const,
        status: "COMPLETED" as const,
        imageUrl: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=800&auto=format&fit=crop",
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdById: adminUser.id,
        donations: [
          { amount: 15000000, status: "PAID", method: "QRIS", user: dummyDonatur, anon: false, msg: "Semoga airnya mengalir deras" },
          { amount: 10000000, status: "PAID", method: "BCA_VA", user: null, anon: true, msg: "Amin" },
        ],
        distributions: [
          { title: "Penyaluran Tangki Air Tahap 1", amount: 10000000, desc: "Penyaluran 5 truk tangki air bersih ke Desa Sukamaju." },
          { title: "Penyaluran Tangki Air Tahap 2", amount: 15000000, desc: "Penyaluran 8 truk tangki air ke Desa Karanganyar. Program selesai." },
        ]
      }
    ];

    for (const prog of dummyPrograms) {
      // 1. Calculate realistic currentAmount from PAID dummy donations
      const calculatedCurrentAmount = prog.donations
        .filter((d) => d.status === "PAID")
        .reduce((sum, d) => sum + d.amount, 0);

      // 2. Upsert Program
      const createdProgram = await prisma.program.upsert({
        where: { lazId_slug: { lazId: defaultLaz.id, slug: prog.slug } },
        update: { currentAmount: calculatedCurrentAmount },
        create: {
          title: prog.title,
          slug: prog.slug,
          description: prog.description,
          targetAmount: prog.targetAmount,
          currentAmount: calculatedCurrentAmount,
          category: prog.category,
          status: prog.status,
          imageUrl: prog.imageUrl,
          startDate: prog.startDate,
          endDate: prog.endDate,
          createdById: prog.createdById,
          lazId: defaultLaz.id,
        },
      });

      // 3. Purge existing dummy relations to avoid duplicates on re-seed
      await prisma.donation.deleteMany({ where: { programId: createdProgram.id } });
      await prisma.distribution.deleteMany({ where: { programId: createdProgram.id } });

      // 4. Seed precise Donations and linked Payments
      for (const d of prog.donations) {
        await prisma.donation.create({
          data: {
            lazId: defaultLaz.id,
            programId: createdProgram.id,
            userId: d.user ? d.user.id : null,
            amount: d.amount,
            status: d.status as any,
            isAnonymous: d.anon,
            donorName: d.user ? d.user.name : (d.anon ? "Hamba Allah" : "Donatur Tunai"),
            message: d.msg,
            payment: {
              create: {
                lazId: defaultLaz.id,
                amount: d.amount,
                paymentMethod: d.method,
                status: d.status === "PAID" ? "SUCCESS" : "PENDING",
              }
            }
          },
        });
      }

      // 5. Seed Distributions if they exist
      if (prog.distributions) {
        for (const dist of prog.distributions) {
          await prisma.distribution.create({
            data: {
              lazId: defaultLaz.id,
              programId: createdProgram.id,
              title: dist.title,
              description: dist.desc,
              amount: dist.amount,
              status: "COMPLETED",
              createdById: adminUser.id,
            },
          });
        }
      }
    }
    console.log(" ✓ Dummy users, programs, precise donations, and distributions seeded");
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
