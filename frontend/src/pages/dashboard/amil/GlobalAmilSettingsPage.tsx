import React, { useState } from "react";
import { GlobalAmilSettings } from "@/features/amil/components/GlobalAmilSettings";
import { AdminInstitutionAmilSettings } from "@/features/amil/components/AdminInstitutionAmilSettings";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Globe, Building2 } from "lucide-react";

export function GlobalAmilSettingsPage() {
  const [activeTab, setActiveTab] = useState<"global" | "overrides">("global");
  const [selectedLembagaId, setSelectedLembagaId] = useState<string>("");

  const { data: lembagaResult, isLoading: isLoadingLembaga } = useQuery({
    queryKey: ["lembaga-list-all"],
    queryFn: () => api.get<any>("/lembaga?limit=1000"), // Fetch enough to populate the dropdown
  });

  const lembagaList = lembagaResult?.data || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan Amil Platform</h1>
          <p className="text-slate-500 mt-1">Kelola porsi dana amil (operasional) secara global maupun spesifik per lembaga.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
        <div className="mt-0.5"><Globe className="h-5 w-5 text-blue-600" /></div>
        <div>
          <h4 className="font-semibold text-sm mb-1">Panduan Singkat</h4>
          <p className="text-sm text-blue-700/80 leading-relaxed">
            Halaman ini digunakan untuk mengatur potongan dana operasional (amil) dari setiap donasi. 
            Gunakan tab <strong>Default Global</strong> untuk mengatur standar yang berlaku untuk semua lembaga. 
            Gunakan tab <strong>Pengecualian Per Lembaga</strong> jika ada lembaga tertentu yang butuh persentase berbeda dari standar.
          </p>
        </div>
      </div>

      <div className="inline-flex p-1.5 bg-slate-100 rounded-xl border border-slate-200/60">
        <button
          onClick={() => setActiveTab("global")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "global"
              ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Globe className="h-4 w-4" />
          Default Global
        </button>
        <button
          onClick={() => setActiveTab("overrides")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "overrides"
              ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Pengecualian Per Lembaga
        </button>
      </div>

      <div className="w-full">
        {activeTab === "global" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <GlobalAmilSettings />
          </div>
        )}

        {activeTab === "overrides" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Pilih Lembaga:</label>
              <div className="flex-1">
                <select
                  value={selectedLembagaId}
                  onChange={(e) => setSelectedLembagaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm"
                  disabled={isLoadingLembaga}
                >
                  <option value="">-- Silakan Pilih Lembaga --</option>
                  {lembagaList.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                {isLoadingLembaga && <p className="text-xs text-slate-500 mt-1">Memuat daftar lembaga...</p>}
              </div>
            </div>

            {selectedLembagaId ? (
              <AdminInstitutionAmilSettings lembagaId={selectedLembagaId} />
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 mt-6">
                <Building2 className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-medium text-slate-800">Belum ada lembaga terpilih</h3>
                <p className="text-sm text-slate-500 mt-1">Pilih lembaga dari menu dropdown di atas untuk melihat atau mengatur persentase amil khusus.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
