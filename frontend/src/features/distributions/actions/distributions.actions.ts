import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export async function createDistributionAction(formData: FormData): Promise<ActionResult> {
  const result = await asAction(api.post("/distributions", Object.fromEntries(formData.entries())));
  if ("success" in result) {
    queryClient.invalidateQueries({ queryKey: ["distributions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
    queryClient.invalidateQueries({ queryKey: ["programs"] });
    queryClient.invalidateQueries({ queryKey: ["lembaga-me"] });
  }
  return result;
}
