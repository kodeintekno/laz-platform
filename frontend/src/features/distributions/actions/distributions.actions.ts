import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export async function createDistributionAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.post("/distributions", Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["distributions"] });
  return result;
}

export async function approveDistributionAction(id: string): Promise<ActionResult> {
  const result = await asAction(api.post(`/distributions/${id}/approve`));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["distributions"] });
  return result;
}

export async function rejectDistributionAction(id: string): Promise<ActionResult> {
  const result = await asAction(api.post(`/distributions/${id}/reject`));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["distributions"] });
  return result;
}
