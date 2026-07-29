import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export async function createLembagaAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.post("/lembaga", Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["lembaga"] });
  return result;
}

export async function editLembagaAction(id: string, formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.patch(`/lembaga/${id}`, Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["lembaga"] });
  return result;
}

export async function deleteLembagaAction(id: string): Promise<ActionResult> {
  const result = await asAction(api.delete(`/lembaga/${id}`));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["lembaga"] });
  return result;
}

export async function approveLembagaAction(id: string): Promise<ActionResult> {
  const result = await asAction(api.patch(`/lembaga/${id}/approve`));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["lembaga"] });
  return result;
}

export async function rejectLembagaAction(id: string, reason: string): Promise<ActionResult> {
  const result = await asAction(api.patch(`/lembaga/${id}/reject`, { reason }));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["lembaga"] });
  return result;
}
