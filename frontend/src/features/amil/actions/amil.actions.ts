import { api } from "@/lib/api-client";
import { asAction } from "@/lib/api-client";

export async function getGlobalAmilSettings() {
  const result = await api.get<{ category: string; maxTotalPercentage: string; defaultPlatformPercentage: string }[]>("/amil/global-settings");
  return { success: true, data: result.data };
}

export async function updateGlobalAmilSetting(data: { category: string; maxTotalPercentage: number; defaultPlatformPercentage: number }) {
  return asAction(api.put("/amil/global-settings", data));
}

export async function getInstitutionAmilSettings(lembagaId: string) {
  const result = await api.get<{ category: string; maxTotalPercentage: number; platformPercentage: number; institutionPercentage: number }[]>(`/amil/institution-settings/${lembagaId}`);
  return { success: true, data: result.data };
}

export async function updateInstitutionAmilSettingByAdmin(lembagaId: string, data: { category: string; institutionPercentage: number; platformPercentage: number }) {
  return asAction(api.put(`/amil/institution-settings/${lembagaId}`, data));
}

export async function getMyInstitutionAmilSettings() {
  const result = await api.get<{ category: string; maxTotalPercentage: number; platformPercentage: number; institutionPercentage: number }[]>("/amil/my-settings");
  return { success: true, data: result.data };
}

export async function updateMyInstitutionAmilSetting(data: { category: string; institutionPercentage: number }) {
  return asAction(api.put("/amil/my-settings", data));
}
