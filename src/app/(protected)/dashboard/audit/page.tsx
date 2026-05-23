import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";

export const metadata = {
  title: "Audit Logs | LAZ Platform",
};

export default async function AuditPage() {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.AUDIT_READ)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Riwayat log audit aktivitas mutasi admin dan pengelolaan sistem secara realtime.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 mb-4">
          <ScrollText className="h-6 w-6 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Fitur Penelusuran Audit</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
          Fitur audit logs saat ini sedang dalam pengembangan. Daftar mutasi data dan catatan forensik sistem akan disajikan di sini.
        </p>
      </div>
    </div>
  );
}
