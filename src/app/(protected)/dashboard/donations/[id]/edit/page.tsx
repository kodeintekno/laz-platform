import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { AdminDonationForm } from "@/features/donations/components/AdminDonationForm";
import { programsRepository } from "@/features/programs/repositories/programs.repository";
import { usersService } from "@/features/users/services/users.service";
import { donationsService } from "@/features/donations/services/donations.service";
import { updateAdminDonationAction } from "@/features/donations/actions/donations.actions";

export const metadata = {
  title: "Edit Donasi Manual",
};

export default async function EditDonationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.DONATIONS_UPDATE)) {
    redirect("/dashboard/donations");
  }

  const { id } = await params;
  const donation = await donationsService.getDonationById(id);

  if (!donation) {
    notFound();
  }

  // Authorize LAZ scope
  if (session.user.roleName !== "SUPER_ADMIN" && donation.lazId !== session.user.lazId) {
    redirect("/dashboard/donations");
  }

  const lazId = session.user.roleName === "SUPER_ADMIN" ? undefined : session.user.lazId;
  const { items: programs } = await programsRepository.findMany(1, 100, undefined, lazId);
  const { items: users } = await usersService.getUsers(1, 200, undefined, lazId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Donasi Manual"
        description="Perbarui informasi donasi offline yang sudah tercatat."
      />
      
      <AdminDonationForm 
        programs={programs} 
        users={users.map(u => ({ id: u.id, name: u.name, email: u.email }))} 
        initialData={donation}
        action={updateAdminDonationAction}
      />
    </div>
  );
}
