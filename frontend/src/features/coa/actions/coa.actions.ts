import { api, asAction, type ActionResult } from "@/lib/api-client";

export async function provisionCoaAction(
  lembagaId?: string,
): Promise<ActionResult> {
  return asAction(
    api.post("/coa/provision", lembagaId ? { lembagaId } : undefined)
  );
}
