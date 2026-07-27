/**
 * Prisma Seed Script — Business Flow Refactor
 *
 * Seeds:
 * 1. All permission rows from constants
 * 2. Final role set (SUPER_ADMIN, LEMBAGA_ADMIN)
 * 3. Role ↔ Permission matrix
 * 4. One SUPER_ADMIN user (lembagaId = null — platform-level)
 * 5. One APPROVED sample Lembaga + its LEMBAGA_ADMIN
 * 6. Dummy programs/donations/distributions (dev only)
 * 7. One PENDING Lembaga (with dummy documents) for the approval-queue UI
 * 8. One sample Volunteer + VolunteerApplication
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
  // Lembaga Management
  { key: "lembaga.read", description: "Melihat data lembaga" },
  { key: "lembaga.approve", description: "Menyetujui atau menolak pendaftaran lembaga" },
  { key: "lembaga.manage", description: "Mengelola data lembaga (tenant) di seluruh platform" },
  // Volunteers
  { key: "volunteers.manage", description: "Mengelola pendaftaran relawan pada program lembaga" },
];

// ─── Role ↔ Permission matrix ─────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSION_DEFINITIONS.map((p) => p.key), // full access

  LEMBAGA_ADMIN: [
    "programs.read",
    "programs.create",
    "programs.update",
    "programs.delete",
    "programs.publish",
    "donations.read",
    "donations.create",
    "donations.update",
    "payments.read",
    "payments.manage",
    "distributions.read",
    "distributions.manage",
    "reports.read",
    "reports.financial",
    "users.read",
    "lembaga.read",
    "volunteers.manage",
  ],
};

const ROLE_DEFINITIONS = [
  { name: "SUPER_ADMIN", description: "Full system access" },
  { name: "LEMBAGA_ADMIN", description: "Mengelola program, donasi, dan relawan lembaga sendiri" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Ruang Berbagi Platform...\n");

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

  // 2. Upsert final role set
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

  // 2.5 Remove deprecated roles (FINANCE, DONATUR, RELAWAN) if they still exist
  console.log("🧹 Removing deprecated roles (FINANCE, DONATUR, RELAWAN)...");
  const deprecatedRoles = await prisma.role.findMany({
    where: { name: { in: ["FINANCE", "DONATUR", "RELAWAN"] } },
  });
  for (const role of deprecatedRoles) {
    const usersOnRole = await prisma.user.count({ where: { roleId: role.id } });
    if (usersOnRole > 0) {
      console.log(
        ` ⚠️  Melewati penghapusan role ${role.name}: masih dipakai oleh ${usersOnRole} user.`,
      );
      continue;
    }
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.role.delete({ where: { id: role.id } });
    console.log(` ✓ Role ${role.name} dihapus`);
  }
  console.log();

  // 3. Upsert role-permission mappings (and clear stale ones for roles we manage)
  console.log("🔗 Seeding role-permission mappings...");
  let mappingCount = 0;

  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    await prisma.rolePermission.deleteMany({
      where: { roleId, permissionId: { notIn: permKeys.map((k) => permissionMap[k]) } },
    });
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

  // 4. Seed SUPER_ADMIN user (platform-level — no lembaga)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ruangberbagi.id";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const superAdminRoleId = roleMap["SUPER_ADMIN"];

  console.log(`👤 Seeding SUPER_ADMIN user (${adminEmail})...`);

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      roleId: superAdminRoleId,
      status: "ACTIVE",
      lembagaId: null,
    },
    create: {
      email: adminEmail,
      name: "Super Admin",
      password: hashedPassword,
      status: "ACTIVE",
      roleId: superAdminRoleId,
      lembagaId: null,
    },
  });
  console.log(" ✓ Super admin created");

  // 5. Seed one APPROVED sample Lembaga + its LEMBAGA_ADMIN
  console.log("\n🏢 Seeding sample APPROVED Lembaga...");
  const lembagaAdminRoleId = roleMap["LEMBAGA_ADMIN"];

  const approvedLembaga = await prisma.lembaga.upsert({
    where: { slug: "yayasan-peduli-umat" },
    update: {
      name: "Yayasan Peduli Umat",
      status: "APPROVED",
    },
    create: {
      name: "Yayasan Peduli Umat",
      slug: "yayasan-peduli-umat",
      logoUrl: "https://example.com/logo.png",
      status: "APPROVED",
      approvedAt: new Date(),
      picName: "Ahmad Fauzi",
      picPhone: "081234567890",
      address: "Jl. Merdeka No. 1, Jakarta Pusat",
      description: "Yayasan yang fokus pada penyaluran zakat, infak, dan sedekah bagi masyarakat kurang mampu.",
      izinYayasanNumber: "AHU-0001234.AH.01.04.Tahun 2020",
    },
  });
  console.log(` ✓ Lembaga created: ${approvedLembaga.name}`);

  const lembagaAdminUser = await prisma.user.upsert({
    where: { email: "admin@yayasan-peduli-umat.id" },
    update: {
      roleId: lembagaAdminRoleId,
      status: "ACTIVE",
      lembagaId: approvedLembaga.id,
    },
    create: {
      email: "admin@yayasan-peduli-umat.id",
      name: "Admin Yayasan Peduli Umat",
      password: hashedPassword,
      status: "ACTIVE",
      roleId: lembagaAdminRoleId,
      lembagaId: approvedLembaga.id,
    },
  });
  console.log(" ✓ Lembaga admin created");

  if (process.env.NODE_ENV === "production") {
    console.log("\nℹ️  Skipping dummy data (programs, pending lembaga, volunteers) in production.\n");
  } else {
    // 6. Dummy Programs / Donations / Distributions ────────────────────────────
    console.log("\n📦 Seeding dummy programs...");

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
        createdById: lembagaAdminUser.id,
        donations: [
          { amount: 5000000, status: "PAID", method: "BCA_VA", anon: false, name: "Budi Santoso", phone: "081211110001", msg: "Bismillah untuk masjid" },
          { amount: 2500000, status: "PAID", method: "GOPAY", anon: true, name: "Hamba Allah", phone: "081211110002", msg: "Semoga cepat selesai pembangunannya" },
          { amount: 5000000, status: "PAID", method: "MANUAL", anon: true, name: "Hamba Allah", phone: "081211110003", msg: "Titip infak via kantor lembaga" },
          { amount: 1000000, status: "PENDING", method: "MANDIRI_VA", anon: false, name: "Budi Santoso", phone: "081211110001", msg: "" },
        ],
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
        createdById: lembagaAdminUser.id,
        donations: [
          { amount: 25000000, status: "PAID", method: "BNI_VA", anon: true, name: "Hamba Allah", phone: "081211110004", msg: "Zakat Maal keluarga hamba Allah" },
          { amount: 20000000, status: "PAID", method: "MANUAL", anon: false, name: "Siti Aminah", phone: "081211110005", msg: "Pembayaran zakat tunai di posko" },
        ],
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
        createdById: lembagaAdminUser.id,
        donations: [
          { amount: 15000000, status: "PAID", method: "QRIS", anon: false, name: "Budi Santoso", phone: "081211110001", msg: "Semoga airnya mengalir deras" },
          { amount: 10000000, status: "PAID", method: "BCA_VA", anon: true, name: "Hamba Allah", phone: "081211110006", msg: "Amin" },
        ],
        distributions: [
          { title: "Penyaluran Tangki Air Tahap 1", amount: 10000000, desc: "Penyaluran 5 truk tangki air bersih ke Desa Sukamaju." },
          { title: "Penyaluran Tangki Air Tahap 2", amount: 15000000, desc: "Penyaluran 8 truk tangki air ke Desa Karanganyar. Program selesai." },
        ],
      },
    ];

    const createdProgramsBySlug: Record<string, { id: string }> = {};

    for (const prog of dummyPrograms) {
      const calculatedCurrentAmount = prog.donations
        .filter((d) => d.status === "PAID")
        .reduce((sum, d) => sum + d.amount, 0);

      const createdProgram = await prisma.program.upsert({
        where: { lembagaId_slug: { lembagaId: approvedLembaga.id, slug: prog.slug } },
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
          lembagaId: approvedLembaga.id,
        },
      });

      createdProgramsBySlug[prog.slug] = createdProgram;

      await prisma.donation.deleteMany({ where: { programId: createdProgram.id } });
      await prisma.distribution.deleteMany({ where: { programId: createdProgram.id } });

      for (const d of prog.donations) {
        await prisma.donation.create({
          data: {
            lembagaId: approvedLembaga.id,
            programId: createdProgram.id,
            amount: d.amount,
            status: d.status as any,
            isAnonymous: d.anon,
            donorName: d.anon ? "Hamba Allah" : d.name,
            donorPhone: d.phone,
            message: d.msg,
            payment: {
              create: {
                lembagaId: approvedLembaga.id,
                amount: d.amount,
                paymentMethod: d.method,
                status: d.status === "PAID" ? "SUCCESS" : "PENDING",
              },
            },
          },
        });
      }

      if (prog.distributions) {
        for (const dist of prog.distributions) {
          await prisma.distribution.create({
            data: {
              lembagaId: approvedLembaga.id,
              programId: createdProgram.id,
              title: dist.title,
              description: dist.desc,
              amount: dist.amount,
              status: "COMPLETED",
              createdById: lembagaAdminUser.id,
            },
          });
        }
      }
    }
    console.log(" ✓ Dummy programs, donations, and distributions seeded");

    // 7. One PENDING Lembaga with dummy documents (for approval-queue UI) ──────
    console.log("\n🏢 Seeding sample PENDING Lembaga (for approval queue)...");
    const pendingLembaga = await prisma.lembaga.upsert({
      where: { slug: "yayasan-harapan-baru" },
      update: {},
      create: {
        name: "Yayasan Harapan Baru",
        slug: "yayasan-harapan-baru",
        status: "PENDING",
        picName: "Rina Wulandari",
        picPhone: "081298765432",
        address: "Jl. Kebangkitan No. 5, Bandung",
        description: "Yayasan baru yang bergerak di bidang pendidikan anak yatim.",
        website: "https://yayasanharapanbaru.example.com",
        izinYayasanNumber: "AHU-0005678.AH.01.04.Tahun 2025",
      },
    });

    await prisma.lembagaDocument.deleteMany({ where: { lembagaId: pendingLembaga.id } });
    await prisma.lembagaDocument.createMany({
      data: [
        {
          lembagaId: pendingLembaga.id,
          type: "AKTA_YAYASAN",
          fileUrl: "https://example.com/docs/akta-yayasan-harapan-baru.pdf",
          originalName: "akta-yayasan.pdf",
        },
        {
          lembagaId: pendingLembaga.id,
          type: "SK_KEMENKUMHAM",
          fileUrl: "https://example.com/docs/sk-kemenkumham-harapan-baru.pdf",
          originalName: "sk-kemenkumham.pdf",
        },
      ],
    });
    console.log(" ✓ Pending lembaga + dummy documents seeded");

    // 8. Sample Volunteer + VolunteerActivity + VolunteerApplication ───────────
    console.log("\n🙋 Seeding sample Volunteer...");
    const volunteerPassword = await bcrypt.hash("Volunteer@123", 12);
    const volunteer = await prisma.volunteer.upsert({
      where: { email: "relawan@ruangberbagi.id" },
      update: {},
      create: {
        name: "Dewi Lestari",
        email: "relawan@ruangberbagi.id",
        password: volunteerPassword,
        phone: "081355556666",
        address: "Jl. Sukarela No. 3, Depok",
        status: "ACTIVE",
      },
    });

    console.log("📅 Seeding sample Volunteer Activities...");

    const dummyActivities = [
      {
        slug: "activity-distribusi-air-bersih",
        title: "Distribusi Tangki Air Bersih",
        description: "Membantu tim lembaga mendistribusikan tangki air bersih ke desa terdampak kekeringan.",
        location: "Desa Sukamaju, Bandung",
        activityDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        quota: 10,
        status: "CLOSED" as const,
        programSlug: "sedekah-air-bersih",
      },
      {
        slug: "activity-renovasi-masjid",
        title: "Gotong Royong Renovasi Masjid",
        description: "Kegiatan bakti sosial membantu proses renovasi masjid di desa pelosok.",
        location: "Desa Pelosok, Garut",
        activityDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        quota: 20,
        status: "OPEN" as const,
        programSlug: "bantu-pembangunan-masjid-pelosok",
      },
      {
        slug: "activity-edukasi-zakat",
        title: "Edukasi Zakat ke Warga",
        description: "Sosialisasi dan edukasi seputar tata cara zakat fitrah dan zakat maal ke warga sekitar.",
        location: "Balai Desa, Jakarta Timur",
        activityDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        quota: 8,
        status: "OPEN" as const,
        programSlug: "zakat-fitrah-maal",
      },
      {
        slug: "activity-pendataan-mustahik",
        title: "Pendataan Mustahik",
        description: "Kegiatan lapangan mendata calon penerima manfaat (mustahik) di wilayah binaan lembaga.",
        location: "Kantor Yayasan Peduli Umat, Jakarta Pusat",
        activityDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        quota: 5,
        status: "OPEN" as const,
        programSlug: null,
      },
    ];

    const activityByslug: Record<string, { id: string }> = {};

    for (const act of dummyActivities) {
      const linkedProgram = act.programSlug ? createdProgramsBySlug[act.programSlug] : null;
      const activity = await prisma.volunteerActivity.upsert({
        where: { id: `seed-${act.slug}` },
        update: {
          title: act.title,
          status: act.status,
        },
        create: {
          id: `seed-${act.slug}`,
          lembagaId: approvedLembaga.id,
          programId: linkedProgram?.id ?? null,
          createdById: lembagaAdminUser.id,
          title: act.title,
          description: act.description,
          location: act.location,
          activityDate: act.activityDate,
          quota: act.quota,
          status: act.status,
        },
      });
      activityByslug[act.slug] = activity;
    }
    console.log(` ✓ ${dummyActivities.length} volunteer activities seeded`);

    console.log("📝 Seeding sample Volunteer Applications across full lifecycle...");

    const dummyApplications = [
      {
        activitySlug: "activity-edukasi-zakat",
        status: "PENDING" as const,
      },
      {
        activitySlug: "activity-pendataan-mustahik",
        status: "REJECTED" as const,
        rejectionReason: "Kuota kegiatan sudah terpenuhi lebih dulu.",
      },
      {
        activitySlug: "activity-renovasi-masjid",
        status: "APPROVED" as const,
      },
      {
        activitySlug: "activity-distribusi-air-bersih",
        status: "REPORT_SUBMITTED" as const,
        reportText: "Telah membantu distribusi 5 tangki air bersih ke Desa Sukamaju bersama tim lembaga.",
        reportSubmittedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const app of dummyApplications) {
      const activity = activityByslug[app.activitySlug];
      await prisma.volunteerApplication.upsert({
        where: {
          volunteerId_activityId: {
            volunteerId: volunteer.id,
            activityId: activity.id,
          },
        },
        update: {
          status: app.status,
        },
        create: {
          volunteerId: volunteer.id,
          activityId: activity.id,
          lembagaId: approvedLembaga.id,
          status: app.status,
          rejectionReason: "rejectionReason" in app ? app.rejectionReason : undefined,
          reportText: "reportText" in app ? app.reportText : undefined,
          reportSubmittedAt: "reportSubmittedAt" in app ? app.reportSubmittedAt : undefined,
        },
      });
    }

    // One additional COMPLETED application, on its own activity, verified by the lembaga admin
    const completedActivity = await prisma.volunteerActivity.upsert({
      where: { id: "seed-activity-santunan-yatim" },
      update: {},
      create: {
        id: "seed-activity-santunan-yatim",
        lembagaId: approvedLembaga.id,
        createdById: lembagaAdminUser.id,
        title: "Santunan Anak Yatim",
        description: "Kegiatan pembagian santunan dan bingkisan untuk anak yatim binaan lembaga.",
        location: "Panti Asuhan Harapan, Jakarta Selatan",
        activityDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        quota: 15,
        status: "CLOSED",
      },
    });

    await prisma.volunteerApplication.upsert({
      where: {
        volunteerId_activityId: {
          volunteerId: volunteer.id,
          activityId: completedActivity.id,
        },
      },
      update: { status: "COMPLETED" },
      create: {
        volunteerId: volunteer.id,
        activityId: completedActivity.id,
        lembagaId: approvedLembaga.id,
        status: "COMPLETED",
        reportText: "Ikut serta membagikan santunan dan bingkisan kepada 30 anak yatim binaan lembaga.",
        reportSubmittedAt: new Date(Date.now() - 39 * 24 * 60 * 60 * 1000),
        verifiedById: lembagaAdminUser.id,
        verifiedAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(" ✓ Volunteer applications seeded (PENDING, REJECTED, APPROVED, REPORT_SUBMITTED, COMPLETED)");
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
