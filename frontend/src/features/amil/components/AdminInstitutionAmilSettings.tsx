import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInstitutionAmilSettings, updateInstitutionAmilSettingByAdmin } from "../actions/amil.actions";
import { useToastStore } from "@/stores/toast.store";
import { Settings2, Save, X, Edit3, ShieldAlert } from "lucide-react";
import { formatProgramCategory } from "@/lib/program-category";
import { parseAmilPercentage } from "../amil-percentage";

interface AdminInstitutionAmilSettingsProps {
  lembagaId: string;
}

export function AdminInstitutionAmilSettings({ lembagaId }: AdminInstitutionAmilSettingsProps) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({ institutionPercentage: "", platformPercentage: "", maxTotalPercentage: "" });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["institutionAmilSettings", lembagaId],
    queryFn: () => getInstitutionAmilSettings(lembagaId),
    enabled: !!lembagaId,
  });

  const mutation = useMutation({
    mutationFn: (dataToUpdate: { category: string; institutionPercentage: number; platformPercentage: number }) => 
      updateInstitutionAmilSettingByAdmin(lembagaId, dataToUpdate),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["institutionAmilSettings", lembagaId] });
        setEditingCategory(null);
        addToast("Override pengaturan amil lembaga berhasil disimpan!", "success");
      } else {
        addToast(result.error || "Gagal menyimpan pengaturan", "error");
      }
    },
    onError: (err: any) => {
      addToast(err.message || "Terjadi kesalahan sistem", "error");
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl border border-slate-200"></div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100">
        <ShieldAlert className="h-6 w-6" />
        <span className="font-medium">Gagal memuat data pengaturan amil lembaga.</span>
      </div>
    );
  }

  const handleEdit = (setting: any) => {
    setEditingCategory(setting.category);
    setFormData({
      institutionPercentage: String(setting.institutionPercentage),
      platformPercentage: String(setting.platformPercentage),
      maxTotalPercentage: String(setting.maxTotalPercentage),
    });
  };

  const handleSave = () => {
    if (!editingCategory) return;
    const institution = parseAmilPercentage(formData.institutionPercentage, "Porsi amil lembaga");
    const platform = parseAmilPercentage(formData.platformPercentage, "Porsi amil platform");
    const maximum = parseAmilPercentage(formData.maxTotalPercentage, "Batas maksimum total amil");
    if (institution.error || platform.error || maximum.error) {
      addToast(institution.error ?? platform.error ?? maximum.error!, "warning");
      return;
    }
    const total = institution.value + platform.value;
    if (total > maximum.value) {
      addToast(`Total persentase (${total.toFixed(2)}%) melebihi batas maksimum (${maximum.value.toFixed(2)}%)`, "warning");
      return;
    }

    mutation.mutate({
      category: editingCategory,
      institutionPercentage: institution.value,
      platformPercentage: platform.value,
    });
  };

  const settingsList = data?.data || [];

  if (settingsList.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
        <Settings2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-800">Belum ada pengaturan</h3>
        <p className="text-slate-500 mt-1">Data pengaturan amil lembaga ini kosong.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingsList.map((setting: any) => {
            const isEditing = editingCategory === setting.category;
            const totalAmil = Number(setting.maxTotalPercentage);
            const instAmil = isEditing ? Number(formData.institutionPercentage) : Number(setting.institutionPercentage);
            const platAmil = isEditing ? Number(formData.platformPercentage) : Number(setting.platformPercentage);
            
            return (
              <div 
                key={setting.category} 
                className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                  isEditing 
                    ? "bg-white border-amber-200 shadow-md ring-2 ring-amber-50" 
                    : "bg-white border-slate-200 hover:border-amber-200 hover:shadow-sm"
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-800 tracking-tight">{formatProgramCategory(setting.category)}</h3>
                      <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">Maks: {totalAmil.toFixed(2)}%</span>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => handleEdit(setting)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                        title="Override Pengaturan"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Porsi Lembaga (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium text-slate-800 text-sm"
                            value={formData.institutionPercentage}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
                                val = val.replace(/^0+/, "");
                              }
                              setFormData({ ...formData, institutionPercentage: val });
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Porsi Platform (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium text-slate-800 text-sm"
                            value={formData.platformPercentage}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
                                val = val.replace(/^0+/, "");
                              }
                              setFormData({ ...formData, platformPercentage: val });
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs font-medium text-slate-500">Total Alokasi</span>
                        <span className={`text-sm font-bold ${(Number(formData.institutionPercentage) + Number(formData.platformPercentage)) > Number(formData.maxTotalPercentage) ? 'text-red-600' : 'text-slate-800'}`}>
                          {(Number(formData.institutionPercentage) + Number(formData.platformPercentage)).toFixed(2)}%
                        </span>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={mutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {mutation.isPending ? "Menyimpan..." : (
                            <>
                              <Save className="h-3.5 w-3.5" /> Simpan
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          disabled={mutation.isPending}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-xs font-medium text-emerald-700">Porsi Lembaga</span>
                        <span className="text-sm font-bold text-emerald-800">{instAmil.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="text-xs font-medium text-amber-700">Porsi Platform</span>
                        <span className="text-sm font-bold text-amber-800">{platAmil.toFixed(2)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
