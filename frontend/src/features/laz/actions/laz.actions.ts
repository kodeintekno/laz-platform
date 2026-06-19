import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export async function createLazAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.post("/laz", Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["laz"] });
  return result;
}

export async function EditLazAction(id: string, formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.patch(`/laz/${id}`, Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["laz"] });
  return result;
}

export async function deleteLazAction(id: string): Promise<ActionResult> {
  const result = await asAction(api.delete(`/laz/${id}`));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["laz"] });
  return result;
}
