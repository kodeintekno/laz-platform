/**
 * Prisma Seed Script — Business Flow Refactor
 *
 * Seeds:
 * 1. All permission rows from constants
 * 2. Final role set (SUPER_ADMIN, LEMBAGA_ADMIN)
 * 3. Role ↔ Permission matrix
 * 4. One SUPER_ADMIN user (lembagaId = null — platform-level)
 * 5. One APPROVED sample Lembaga + its LEMBAGA_ADMIN
 * 6. Five dummy programs/donations/distributions (dev only)
 * 7. A second APPROVED Lembaga + its LEMBAGA_ADMIN (dev only)
 * 8. One PENDING Lembaga (with dummy documents) for the approval-queue UI —
 *    3 lembaga in total (2 APPROVED + 1 PENDING)
 * 9. Two sample Volunteers
 * 10. Two VolunteerActivity + VolunteerApplication across the full status lifecycle
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
  { key: "programs.approve", description: "Menyetujui atau menolak program yang diajukan lembaga" },
  // Donations
  { key: "donations.read", description: "Melihat riwayat transaksi donasi masuk" },
  { key: "donations.create", description: "Mencatat transaksi donasi secara manual" },
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
  // Withdrawals
  { key: "withdrawals.read", description: "Melihat daftar pencairan dana" },
  { key: "withdrawals.create", description: "Membuat request pencairan dana (Lembaga)" },
  { key: "withdrawals.manage", description: "Menyetujui/menolak pencairan dana (Super Admin)" },
  // Accounting
  { key: "coa.read", description: "Melihat daftar Chart of Accounts lembaga" },
  { key: "journal.read", description: "Melihat daftar Jurnal Umum" },
  { key: "journal.create", description: "Membuat draft Jurnal Umum" },
  { key: "journal.post", description: "Memposting (finalisasi) Jurnal Umum" },
  { key: "journal.void", description: "Membatalkan (void) Jurnal Umum yang sudah di-post" },
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
    "payments.read",
    "payments.manage",
    "distributions.read",
    "distributions.manage",
    "reports.read",
    "reports.financial",
    "users.read",
    "lembaga.read",
    "volunteers.manage",
    "withdrawals.read",
    "withdrawals.create",
    "coa.read",
    "journal.read",
    "journal.create",
    "journal.post",
    "journal.void",
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

  console.log("\n⚙️ Seeding Amil Global Settings...");
  const globalSettings = [
    { category: "ZAKAT", maxTotalPercentage: 12.5, defaultPlatformPercentage: 5 },
    { category: "INFAK", maxTotalPercentage: 20, defaultPlatformPercentage: 5 },
    { category: "SEDEKAH", maxTotalPercentage: 20, defaultPlatformPercentage: 5 },
    { category: "WAKAF", maxTotalPercentage: 10, defaultPlatformPercentage: 5 },
    { category: "CSR", maxTotalPercentage: 20, defaultPlatformPercentage: 5 },
    { category: "DSKL", maxTotalPercentage: 20, defaultPlatformPercentage: 5 },
  ];

  for (const setting of globalSettings) {
    await prisma.amilGlobalSetting.upsert({
      where: { category: setting.category as any },
      update: {
        maxTotalPercentage: setting.maxTotalPercentage,
        defaultPlatformPercentage: setting.defaultPlatformPercentage,
      },
      create: {
        category: setting.category as any,
        maxTotalPercentage: setting.maxTotalPercentage,
        defaultPlatformPercentage: setting.defaultPlatformPercentage,
      },
    });
  }
  console.log(" ✓ Amil Global Settings seeded\n");

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

  console.log("\n🧾 Seeding COA template for approved lembaga...");
  await seedCoaForLembaga(approvedLembaga.id);
  console.log(` ✓ ${COA_TEMPLATE.length} accounts seeded\n`);

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
      {
        title: "Bantuan Pendidikan Anak Yatim & Dhuafa",
        slug: "bantuan-pendidikan-yatim-dhuafa",
        description: "Dukung biaya sekolah dan perlengkapan belajar anak yatim serta dhuafa binaan lembaga.",
        targetAmount: 40000000,
        category: "INFAK" as const,
        status: "PUBLISHED" as const,
        imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop",
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        createdById: lembagaAdminUser.id,
        donations: [
          { amount: 3000000, status: "PAID", method: "OVO", anon: false, name: "Rina Marlina", phone: "081211110007", msg: "Semoga bermanfaat untuk sekolah adik-adik" },
          { amount: 1500000, status: "PAID", method: "DANA", anon: true, name: "Hamba Allah", phone: "081211110008", msg: "" },
        ],
      },
      {
        title: "Wakaf Sumur Bor untuk Pesantren Terpencil",
        slug: "wakaf-sumur-bor-pesantren",
        description: "Bangun sumur bor agar santri dan warga sekitar pesantren pelosok memiliki akses air bersih.",
        targetAmount: 30000000,
        category: "WAKAF" as const,
        status: "PUBLISHED" as const,
        imageUrl: "https://images.unsplash.com/photo-1500932334442-8761ee4810a7?q=80&w=800&auto=format&fit=crop",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdById: lembagaAdminUser.id,
        donations: [
          { amount: 10000000, status: "PAID", method: "BCA_VA", anon: false, name: "H. Slamet Riyadi", phone: "081211110009", msg: "Wakaf untuk pesantren" },
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
        // Hitung split amil berdasarkan global setting
        const isPaid = d.status === "PAID";
        let platformPercentage = 0;
        let institutionPercentage = 0;
        let amilPlatformAmount = 0;
        let amilInstitutionAmount = 0;
        let netAmount = d.amount;

        if (isPaid) {
          const setting = globalSettings.find(s => s.category === prog.category);
          platformPercentage = setting ? setting.defaultPlatformPercentage : 5;
          institutionPercentage = setting ? setting.maxTotalPercentage - platformPercentage : 7.5;
          
          amilPlatformAmount = Math.floor(d.amount * (platformPercentage / 100));
          amilInstitutionAmount = Math.floor(d.amount * (institutionPercentage / 100));
          netAmount = d.amount - amilPlatformAmount - amilInstitutionAmount;
        }

        // Legacy fields
        const platformFee = amilPlatformAmount;
        const institutionAmount = amilInstitutionAmount + netAmount;

        await prisma.donation.create({
          data: {
            lembagaId: approvedLembaga.id,
            programId: createdProgram.id,
            amount: d.amount,
            platformFee,
            institutionAmount,
            platformPercentage,
            institutionPercentage,
            amilPlatformAmount,
            amilInstitutionAmount,
            netAmount,
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

    // Hitung total institutionAmount (87.5%) dari semua donasi PAID & update InstitutionBalance
    const balanceAgg = await prisma.donation.aggregate({
      where: { lembagaId: approvedLembaga.id, status: "PAID" },
      _sum: { institutionAmount: true },
    });
    const totalInstitutionAmount = Number(balanceAgg._sum.institutionAmount || 0);
    await prisma.institutionBalance.upsert({
      where: { lembagaId: approvedLembaga.id },
      update: { balance: totalInstitutionAmount },
      create: { lembagaId: approvedLembaga.id, balance: totalInstitutionAmount, reservedBalance: 0 },
    });
    console.log(` ✓ InstitutionBalance seeded: Rp ${totalInstitutionAmount.toLocaleString("id-ID")}`);
    console.log(" ✓ Dummy programs, donations, and distributions seeded");

    // 7. A second APPROVED Lembaga + its LEMBAGA_ADMIN (for multi-tenant demo) ─
    console.log("\n🏢 Seeding second APPROVED Lembaga...");
    const secondLembaga = await prisma.lembaga.upsert({
      where: { slug: "yayasan-cahaya-ummat" },
      update: {
        name: "Yayasan Cahaya Ummat",
        status: "APPROVED",
      },
      create: {
        name: "Yayasan Cahaya Ummat",
        slug: "yayasan-cahaya-ummat",
        logoUrl: "https://example.com/logo-cahaya-ummat.png",
        status: "APPROVED",
        approvedAt: new Date(),
        picName: "Muhammad Iqbal",
        picPhone: "081345678901",
        address: "Jl. Diponegoro No. 10, Surabaya",
        description: "Yayasan yang fokus pada pemberdayaan ekonomi dan pendidikan masyarakat dhuafa.",
        izinYayasanNumber: "AHU-0002345.AH.01.04.Tahun 2021",
      },
    });
    console.log(` ✓ Lembaga created: ${secondLembaga.name}`);

    await prisma.user.upsert({
      where: { email: "admin@yayasan-cahaya-ummat.id" },
      update: {
        roleId: lembagaAdminRoleId,
        status: "ACTIVE",
        lembagaId: secondLembaga.id,
      },
      create: {
        email: "admin@yayasan-cahaya-ummat.id",
        name: "Admin Yayasan Cahaya Ummat",
        password: hashedPassword,
        status: "ACTIVE",
        roleId: lembagaAdminRoleId,
        lembagaId: secondLembaga.id,
      },
    });
    console.log(" ✓ Lembaga admin created");

    // 8. One PENDING Lembaga with dummy documents (for approval-queue UI) ──────
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

    // 9. Two sample Volunteers ──────────────────────────────────────────────────
    console.log("\n🙋 Seeding sample Volunteers...");
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

    const volunteer2 = await prisma.volunteer.upsert({
      where: { email: "relawan2@ruangberbagi.id" },
      update: {},
      create: {
        name: "Rizky Pratama",
        email: "relawan2@ruangberbagi.id",
        password: volunteerPassword,
        phone: "081377778888",
        address: "Jl. Gotong Royong No. 7, Bogor",
        status: "ACTIVE",
      },
    });
    console.log(" ✓ 2 volunteers seeded");

    // 10. Two VolunteerActivity + applications across the full status lifecycle ─
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
        volunteerId: volunteer.id,
        activitySlug: "activity-renovasi-masjid",
        status: "APPROVED" as const,
      },
      {
        volunteerId: volunteer.id,
        activitySlug: "activity-distribusi-air-bersih",
        status: "COMPLETED" as const,
        reportText: "Telah membantu distribusi 5 tangki air bersih ke Desa Sukamaju bersama tim lembaga.",
        reportSubmittedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        verifiedById: lembagaAdminUser.id,
        verifiedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      },
      {
        volunteerId: volunteer2.id,
        activitySlug: "activity-renovasi-masjid",
        status: "PENDING" as const,
      },
      {
        volunteerId: volunteer2.id,
        activitySlug: "activity-distribusi-air-bersih",
        status: "REJECTED" as const,
        rejectionReason: "Kuota kegiatan sudah terpenuhi lebih dulu.",
      },
    ];

    for (const app of dummyApplications) {
      const activity = activityByslug[app.activitySlug];
      await prisma.volunteerApplication.upsert({
        where: {
          volunteerId_activityId: {
            volunteerId: app.volunteerId,
            activityId: activity.id,
          },
        },
        update: {
          status: app.status,
        },
        create: {
          volunteerId: app.volunteerId,
          activityId: activity.id,
          lembagaId: approvedLembaga.id,
          status: app.status,
          rejectionReason: "rejectionReason" in app ? app.rejectionReason : undefined,
          reportText: "reportText" in app ? app.reportText : undefined,
          reportSubmittedAt: "reportSubmittedAt" in app ? app.reportSubmittedAt : undefined,
          verifiedById: "verifiedById" in app ? app.verifiedById : undefined,
          verifiedAt: "verifiedAt" in app ? app.verifiedAt : undefined,
        },
      });
    }

    console.log(" ✓ Volunteer applications seeded (PENDING, REJECTED, APPROVED, COMPLETED)");
  }

  console.log("\n✅ Seeding complete!\n");
}

// ─── COA Template Seeder ──────────────────────────────────────────────────────────

type CsvCoaRow = {
  code: string;
  name: string;
  accountType: "ASSET" | "LIABILITY" | "FUND" | "REVENUE" | "EXPENSE";
  normalBalance: "DEBIT" | "CREDIT";
  isHeader: boolean;
  parentCode: string | null;
  level: number;
};

/** Template COA standar — digunakan untuk semua lembaga. */
const COA_TEMPLATE: CsvCoaRow[] = [
  // ─── 1000 ASSET ───
  { code: "1000", name: "Aset", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: null, level: 1 },
  { code: "1100", name: "Kas dan Bank", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1101", name: "Kas", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1100", level: 3 },
  { code: "1102", name: "Kas Kecil", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1100", level: 3 },
  { code: "1103", name: "Bank", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1100", level: 3 },
  { code: "1104", name: "Kas Dalam Perjalanan", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1100", level: 3 },
  { code: "1110", name: "Piutang", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1111", name: "Piutang Lain-lain", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1110", level: 3 },
  { code: "1120", name: "Persediaan", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1121", name: "Persediaan", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1120", level: 3 },
  { code: "1200", name: "Aset Tetap", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1201", name: "Peralatan", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1200", level: 3 },
  { code: "1202", name: "Kendaraan", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1200", level: 3 },
  { code: "1203", name: "Gedung", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1200", level: 3 },
  { code: "1290", name: "Akumulasi Penyusutan", accountType: "ASSET", normalBalance: "CREDIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1291", name: "Akumulasi Penyusutan Peralatan", accountType: "ASSET", normalBalance: "CREDIT", isHeader: false, parentCode: "1290", level: 3 },
  { code: "1292", name: "Akumulasi Penyusutan Kendaraan", accountType: "ASSET", normalBalance: "CREDIT", isHeader: false, parentCode: "1290", level: 3 },
  { code: "1293", name: "Akumulasi Penyusutan Gedung", accountType: "ASSET", normalBalance: "CREDIT", isHeader: false, parentCode: "1290", level: 3 },
  // ─── 2000 LIABILITY ───
  { code: "2000", name: "Kewajiban", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: true, parentCode: null, level: 1 },
  { code: "2100", name: "Utang", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: true, parentCode: "2000", level: 2 },
  { code: "2101", name: "Utang Operasional", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: false, parentCode: "2100", level: 3 },
  { code: "2102", name: "Utang Gaji", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: false, parentCode: "2100", level: 3 },
  { code: "2103", name: "Utang Pajak", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: false, parentCode: "2100", level: 3 },
  { code: "2104", name: "Utang Lain-lain", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: false, parentCode: "2100", level: 3 },
  // ─── 3000 FUND ───
  { code: "3000", name: "Dana", accountType: "FUND", normalBalance: "CREDIT", isHeader: true, parentCode: null, level: 1 },
  { code: "3100", name: "Dana", accountType: "FUND", normalBalance: "CREDIT", isHeader: true, parentCode: "3000", level: 2 },
  { code: "3101", name: "Dana Zakat", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3102", name: "Dana Infak", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3103", name: "Dana Sedekah", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3104", name: "Dana Wakaf", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3105", name: "Dana Amil", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3106", name: "Dana Nonhalal", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  // ─── 4000 PENERIMAAN DANA ───
  { code: "4000", name: "Penerimaan Dana", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: true, parentCode: null, level: 1 },
  { code: "4100", name: "Penerimaan", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: true, parentCode: "4000", level: 2 },
  { code: "4101", name: "Penerimaan Zakat", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4102", name: "Penerimaan Infak", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4103", name: "Penerimaan Sedekah", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4104", name: "Penerimaan Wakaf", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4105", name: "Penerimaan Dana Amil", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4106", name: "Penerimaan Hibah", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4107", name: "Pendapatan Lainnya", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  // ─── 5000 PENYALURAN DANA ───
  { code: "5000", name: "Penyaluran Dana", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: true, parentCode: null, level: 1 },
  { code: "5100", name: "Penyaluran", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: true, parentCode: "5000", level: 2 },
  { code: "5101", name: "Penyaluran Zakat", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "5100", level: 3 },
  { code: "5102", name: "Penyaluran Infak", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "5100", level: 3 },
  { code: "5103", name: "Penyaluran Sedekah", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "5100", level: 3 },
  { code: "5104", name: "Penyaluran Wakaf", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "5100", level: 3 },
  // ─── 6000 BEBAN OPERASIONAL ───
  { code: "6000", name: "Beban Operasional", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: true, parentCode: null, level: 1 },
  { code: "6100", name: "Beban Operasional", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: true, parentCode: "6000", level: 2 },
  { code: "6101", name: "Beban Gaji", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6102", name: "Beban Listrik", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6103", name: "Beban Air", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6104", name: "Beban Internet", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6105", name: "Beban ATK", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6106", name: "Beban Transportasi", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6107", name: "Beban Administrasi Bank", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6108", name: "Beban Konsumsi", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6109", name: "Beban Pemeliharaan", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6110", name: "Beban Penyusutan Peralatan", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6111", name: "Beban Penyusutan Kendaraan", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6112", name: "Beban Penyusutan Gedung", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6113", name: "Beban Operasional Lainnya", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6114", name: "Beban Platform", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
];

/**
 * Seed COA template untuk satu lembaga.
 * Aman di-run berulang — menggunakan upsert berdasarkan [lembagaId, code].
 */
async function seedCoaForLembaga(lembagaId: string): Promise<void> {
  for (const row of COA_TEMPLATE) {
    await prisma.chartOfAccount.upsert({
      where: { lembagaId_code: { lembagaId, code: row.code } },
      update: {
        name: row.name,
        accountType: row.accountType,
        normalBalance: row.normalBalance,
        isHeader: row.isHeader,
        parentCode: row.parentCode,
        level: row.level,
      },
      create: {
        lembagaId,
        code: row.code,
        name: row.name,
        accountType: row.accountType,
        normalBalance: row.normalBalance,
        isHeader: row.isHeader,
        parentCode: row.parentCode,
        level: row.level,
        isSystem: true,
        isEditable: false,
        isDeletable: false,
        isActive: true,
      },
    });
    process.stdout.write(".");
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
