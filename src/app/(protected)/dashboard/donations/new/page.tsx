import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { AdminDonationForm } from "@/features/donations/components/AdminDonationForm";
import { programsRepository } from "@/features/programs/repositories/programs.repository";
import { usersService } from "@/features/users/services/users.service";

export const metadata = {
  title: "Tambah Donasi Manual",
};

export default async function NewDonationPage() {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.DONATIONS_CREATE)) {
    redirect("/dashboard/donations");
  }

  // Fetch all programs (in reality we should limit to active ones or provide a search API)
  const lazId = session.user.roleName === "SUPER_ADMIN" ? undefined : session.user.lazId;
  const { items: programs } = await programsRepository.findMany(1, 100, undefined, lazId);
  
  // Fetch users (in a real big app, this should be an async searchable combobox)
  const { items: users } = await usersService.getUsers(1, 200, undefined, lazId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Donasi Manual"
        description="Catat donasi offline yang masuk secara manual ke dalam sistem."
      />
      
      <AdminDonationForm 
        programs={programs} 
        users={users.map(u => ({ id: u.id, name: u.name, email: u.email }))} 
      />
    </div>
  );
}
