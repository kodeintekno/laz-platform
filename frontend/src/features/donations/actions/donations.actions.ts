import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export async function createDonationAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const result = await asAction(
    api.post<{ id: string }>("/donations/public", Object.fromEntries(formData.entries())),
    (data) => ({ id: data.id }),
  );
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["donations"] });
  return result;
}

export async function createAdminDonationAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.post("/donations/admin", Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["donations"] });
  return result;
}

export async function updateAdminDonationAction(id: string, formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.patch(`/donations/${id}`, Object.fromEntries(formData.entries())));
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["donations"] });
  return result;
}

export async function generateMockWebhookPayloadAction(donationId: string): Promise<ActionResult<{ payload: unknown }>> {
  const result = await asAction(
    api.post<{ payload: unknown }>(`/donations/${donationId}/mock-webhook`),
    (data) => ({ payload: data.payload }),
  );
  return result;
}
