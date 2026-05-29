import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/features/settings/components/SettingsForm";

export const metadata = {
  title: "Pengaturan Akun",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      emailNotifications: true,
      waNotifications: true,
      avatarUrl: true,
      avatarPublicId: true,
    },
  });

  if (!user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Akun"
        description="Kelola informasi profil Anda, ubah kata sandi, dan atur preferensi notifikasi di sini."
      />

      <SettingsForm user={user} />
    </div>
  );
}
