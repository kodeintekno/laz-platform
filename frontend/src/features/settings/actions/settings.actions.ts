import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.patch("/settings/profile", Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  return result;
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.post("/settings/password", Object.fromEntries(formData.entries())));
  return result;
}

export async function updateNotificationsAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.patch("/settings/notifications", Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  return result;
}
