import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export async function createUserAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.post("/users", Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["users"] });
  return result;
}

export async function updateUserAction(id: string, formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.patch(`/users/${id}`, Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["users"] });
  return result;
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const result = await asAction(api.delete(`/users/${id}`));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["users"] });
  return result;
}
