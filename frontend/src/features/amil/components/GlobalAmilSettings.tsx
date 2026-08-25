import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGlobalAmilSettings, updateGlobalAmilSetting } from "../actions/amil.actions";
import { useAuth } from "@/auth/AuthProvider";
import { useToastStore } from "@/stores/toast.store";
import { Info, Settings2, Save, X, Edit3, ShieldAlert } from "lucide-react";

export function GlobalAmilSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({ maxTotalPercentage: "", defaultPlatformPercentage: "" });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["globalAmilSettings"],
    queryFn: getGlobalAmilSettings,
  });

  const mutation = useMutation({
    mutationFn: updateGlobalAmilSetting,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["globalAmilSettings"] });
        setEditingCategory(null);
        addToast("Pengaturan amil global berhasil diperbarui!", "success");
      } else {
        addToast(result.error || "Gagal menyimpan pengaturan", "error");
      }
    },
    onError: (err: any) => {
      addToast(err.message || "Terjadi kesalahan sistem", "error");
    }
  });

  if (user?.roleName !== "SUPER_ADMIN") {
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100">
        <ShieldAlert className="h-6 w-6" />
        <span className="font-medium">Akses ditolak. Halaman ini khusus untuk Super Admin Platform.</span>
      </div>
    );
  }

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
      maxTotalPercentage: String(setting.maxTotalPercentage),
      defaultPlatformPercentage: String(setting.defaultPlatformPercentage),
    });
  };

  const handleSave = () => {
    if (!editingCategory) return;
    if (Number(formData.defaultPlatformPercentage) > Number(formData.maxTotalPercentage)) {
      addToast("Platform percentage tidak boleh lebih besar dari Total percentage.", "warning");
      return;
    }
    mutation.mutate({
      category: editingCategory,
      maxTotalPercentage: Number(formData.maxTotalPercentage),
      defaultPlatformPercentage: Number(formData.defaultPlatformPercentage),
    });
  };

  const settingsList = data?.data || [];

  if (settingsList.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
        <Settings2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-800">Belum ada pengaturan</h3>
        <p className="text-slate-500 mt-1">Data pengaturan amil global kosong.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {settingsList.map((setting: any) => {
        const isEditing = editingCategory === setting.category;
        const totalAmil = Number(setting.maxTotalPercentage);
        const platformAmil = Number(setting.defaultPlatformPercentage);

        return (
          <div
            key={setting.category}
            className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${isEditing
                ? "bg-white border-blue-200 shadow-md ring-2 ring-blue-50"
                : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm"
              }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800 tracking-tight">{setting.category}</h3>
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
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maksimum Total Amil (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm"
                        value={formData.maxTotalPercentage}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
                            val = val.replace(/^0+/, "");
                          }
                          setFormData({ ...formData, maxTotalPercentage: val });
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Default Platform (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm"
                        value={formData.defaultPlatformPercentage}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
                            val = val.replace(/^0+/, "");
                          }
                          setFormData({ ...formData, defaultPlatformPercentage: val });
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
                    </div>
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
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-500">Maksimum Total</span>
                    <span className="text-sm font-bold text-slate-800">{totalAmil.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-500">Default Platform</span>
                    <span className="text-sm font-bold text-slate-800">{platformAmil.toFixed(2)}%</span>
                  </div>

                  <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 bg-white">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <p>Sisa maksimal untuk lembaga adalah {(totalAmil - platformAmil).toFixed(2)}%.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
