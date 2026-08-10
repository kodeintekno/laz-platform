"use server";

import { api, asAction } from "@/lib/api-client";
import type { JournalInput, VoidJournalInput } from "@shared/validations/journal.schema";

export async function createJournalAction(data: JournalInput, lembagaId?: string) {
  const qs = lembagaId ? `?lembagaId=${lembagaId}` : "";
  return asAction(api.post<{ message: string }>(`/journal${qs}`, data));
}


export async function voidJournalAction(id: string, data: VoidJournalInput, lembagaId?: string) {
  const qs = lembagaId ? `?lembagaId=${lembagaId}` : "";
  return asAction(api.post<{ message: string }>(`/journal/${id}/void${qs}`, data));
}
