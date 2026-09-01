import { api } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Withdrawal {
  id: string;
  amount: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVERSED";
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  rejectionReason?: string;
  createdAt: string;
  lembaga?: { name: string; slug: string };
  requestedBy?: { name: string; email: string };
  approvedBy?: { name: string; email: string };
}

export interface LembagaBankAccount {
  id: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  label?: string | null;
  isDefault: boolean;
  chartOfAccount: { id: string; code: string; name: string };
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => (await api.get<LembagaBankAccount[]>("/withdrawals/bank-accounts")).data,
  });
}

export function useSaveBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<LembagaBankAccount> & {
      id?: string; bankCode: string; accountNumber: string; accountHolder: string;
    }) => id
      ? (await api.patch<LembagaBankAccount>(`/withdrawals/bank-accounts/${id}`, data)).data
      : (await api.post<LembagaBankAccount>("/withdrawals/bank-accounts", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["coa"] });
      queryClient.invalidateQueries({ queryKey: ["lembaga-me"] });
    },
  });
}

export function useDeactivateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/withdrawals/bank-accounts/${id}/deactivate`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["coa"] });
      queryClient.invalidateQueries({ queryKey: ["lembaga-me"] });
    },
  });
}

export function useGetMyWithdrawals(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["my-withdrawals", page, limit],
    queryFn: async () => {
      const { data, meta } = await api.get<Withdrawal[]>("/withdrawals/mine", { page, limit });
      return { data, meta };
    },
  });
}

export function useGetAllWithdrawals(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["all-withdrawals", status, page, limit],
    queryFn: async () => {
      const { data, meta } = await api.get<Withdrawal[]>("/withdrawals", { status, page, limit });
      return { data, meta };
    },
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ amount, bankAccountId }: { amount: number; bankAccountId: string }) => {
      const { data } = await api.post("/withdrawals", { amount, bankAccountId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-withdrawals"] });
    },
  });
}

export function useApproveWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/withdrawals/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-withdrawals"] });
    },
  });
}

export function useRejectWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api.post(`/withdrawals/${id}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-withdrawals"] });
    },
  });
}

export function useRetryPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/withdrawals/${id}/retry-payout`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-withdrawals"] });
    },
  });
}
