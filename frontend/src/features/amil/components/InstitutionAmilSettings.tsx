import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyInstitutionAmilSettings, updateMyInstitutionAmilSetting } from "../actions/amil.actions";
import { useToastStore } from "@/stores/toast.store";
import { Settings2, Save, X, Edit3, ShieldAlert } from "lucide-react";

export function InstitutionAmilSettings() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({ institutionPercentage: "", platformPercentage: "", maxTotalPercentage: "" });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["myInstitutionAmilSettings"],
    queryFn: getMyInstitutionAmilSettings,
  });

  const mutation = useMutation({
    mutationFn: updateMyInstitutionAmilSetting,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["myInstitutionAmilSettings"] });
        setEditingCategory(null);
        addToast("Pengaturan amil lembaga berhasil diperbarui!", "success");
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
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl border border-slate-200"></div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100">
        <ShieldAlert className="h-6 w-6" />
        <span className="font-medium">Gagal memuat data pengaturan. Silakan muat ulang halaman.</span>
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
    
    const total = Number(formData.institutionPercentage) + Number(formData.platformPercentage);
    if (total > Number(formData.maxTotalPercentage)) {
      addToast(`Total persentase (${total.toFixed(2)}%) melebihi batas maksimum (${Number(formData.maxTotalPercentage).toFixed(2)}%)`, "warning");
      return;
    }

    mutation.mutate({
      category: editingCategory,
      institutionPercentage: Number(formData.institutionPercentage),
    });
  };

  const settingsList = data?.data || [];

  if (settingsList.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
        <Settings2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-800">Belum ada pengaturan</h3>
        <p className="text-slate-500 mt-1">Data pengaturan amil lembaga kosong.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Default Porsi Amil Lembaga</h2>
          <p className="text-slate-500 mt-1 text-sm">Nilai ini menjadi default program baru dan tidak mengubah snapshot program yang sudah dibuat.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
        <div className="mt-0.5"><Settings2 className="h-5 w-5 text-blue-600" /></div>
        <div>
          <h4 className="font-semibold text-sm mb-1">Panduan Singkat</h4>
          <p className="text-sm text-blue-700/80 leading-relaxed">
            Di sini Anda dapat menentukan default dana operasional untuk program baru lembaga Anda.
            Setiap donasi tunduk pada <strong>Batas Maksimal Total</strong>, di mana sebagian sudah dialokasikan otomatis untuk <strong>Platform</strong>.
            Anda hanya bisa mengatur porsi lembaga hingga sisa batas maksimal yang tersedia. Program lama tidak ikut berubah.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsList.map((setting: any) => {
          const isEditing = editingCategory === setting.category;
          const totalAmil = Number(setting.maxTotalPercentage);
          const platformAmil = Number(setting.platformPercentage);
          const instAmil = isEditing ? Number(formData.institutionPercentage) : Number(setting.institutionPercentage);
          
          return (
            <div 
              key={setting.category} 
              className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                isEditing 
                  ? "bg-white border-blue-200 shadow-md ring-2 ring-blue-50" 
                  : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm"
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">{setting.category}</h3>
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">Maks: {totalAmil.toFixed(2)}%</span>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleEdit(setting)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit Pengaturan"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                        <span>Porsi Lembaga (%)</span>
                        <span className="text-blue-600">Sisa maks: {(totalAmil - platformAmil).toFixed(2)}%</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          max={totalAmil - platformAmil}
                          min="0"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm"
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

                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-500">Porsi Platform (Tetap)</span>
                      <span className="text-sm font-bold text-slate-800">{platformAmil.toFixed(2)}%</span>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={mutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
                      <span className="text-xs font-semibold text-emerald-700">Porsi Lembaga</span>
                      <span className="text-sm font-black text-emerald-800">{instAmil.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                      <span className="text-xs font-medium text-amber-700">Porsi Platform (Tetap)</span>
                      <span className="text-xs font-bold text-amber-800">{platformAmil.toFixed(2)}%</span>
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
