import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export async function createProgramAction(formData: FormData): Promise<ActionResult<{ slug: string }>> {
  const result = await asAction(
    api.post<{ slug: string }>("/programs", Object.fromEntries(formData.entries())),
    (data) => ({ slug: data.slug }),
  );
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["programs"] });
  return result;
}

export async function updateProgramAction(id: string, formData: FormData): Promise<ActionResult<{ slug: string }>> {
  const result = await asAction(
    api.patch<{ slug: string }>(`/programs/${id}`, Object.fromEntries(formData.entries())),
    (data) => ({ slug: data.slug }),
  );
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["programs"] });
  return result;
}

export async function deleteProgramAction(id: string): Promise<ActionResult> {
  const result = await asAction(api.delete(`/programs/${id}`));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["programs"] });
  return result;
}

export async function approveProgramAction(id: string): Promise<ActionResult> {
  const result = await asAction(api.patch(`/programs/${id}/approve`));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["programs"] });
  return result;
}

export async function rejectProgramAction(id: string, reason: string): Promise<ActionResult> {
  const result = await asAction(api.patch(`/programs/${id}/reject`, { reason }));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["programs"] });
  return result;
}

export async function setFeaturedProgramAction(id: string, isFeatured: boolean): Promise<ActionResult> {
  const result = await asAction(api.patch(`/programs/${id}/feature`, { isFeatured }));
  if ("success" in result) {
    queryClient.invalidateQueries({ queryKey: ["programs"] });
    queryClient.invalidateQueries({ queryKey: ["public", "programs"] });
  }
  return result;
}
