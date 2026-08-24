import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export interface CreateDonationData {
  donationId: string;
  paymentMethod: string;
  amount: number;
  qrString: string | null;
  vaNumber: string | null;
  expiresAt: string;
}

export interface DonationStatusData {
  donationId: string;
  donationStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  amount: number;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED" | null;
  paymentMethod: string | null;
  expiresAt: string | null;
  paidAt: string | null;
}

/**
 * Creates a public donation and returns Xendit payment instructions.
 * Returns donationId + QRIS string or VA number to display to donor.
 */
export async function createDonationAction(
  body: Record<string, unknown>,
): Promise<ActionResult<CreateDonationData>> {
  const result = await asAction(
    api.post<CreateDonationData>("/donations/public", body),
    (data) => ({
      donationId: data.donationId,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      qrString: data.qrString,
      vaNumber: data.vaNumber,
      expiresAt: data.expiresAt,
    }),
  );
  if (result.success) {
    queryClient.invalidateQueries({ queryKey: ["donations"] });
  }
  return result;
}

/**
 * Polls the backend for current payment status.
 * Frontend MUST NOT use this to self-determine payment success —
 * it only displays the status returned from the backend.
 */
export async function getDonationStatusAction(
  donationId: string,
): Promise<DonationStatusData | null> {
  try {
    const { data } = await api.get<DonationStatusData>(`/donations/public/${donationId}/status`);
    return data;
  } catch {
    return null;
  }
}

export async function createAdminDonationAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.post("/donations", Object.fromEntries(formData.entries())));
  if (result.success) queryClient.invalidateQueries({ queryKey: ["donations"] });
  return result;
}
