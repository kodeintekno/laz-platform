"use client";

import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { journalSchema } from "@shared/validations/journal.schema";
import { createJournalAction } from "@/features/journal/actions/journal.actions";
import { Button, Card, CardContent, CardFooter, FormField, FormError, Select } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { Plus, Trash2 } from "lucide-react";
import { formatThousands, parseThousands } from "@/lib/utils";
import { JournalBalanceSummary } from "./JournalBalanceSummary";

export interface JournalFormProps {
  accounts: any[]; // Flat array of COA accounts from API
  programs: any[]; // Optional programs array
  lembagaId?: string; // If super admin is creating for a specific lembaga
}

export function JournalForm({ accounts, programs, lembagaId }: JournalFormProps) {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const detailAccounts = accounts.filter(a => !a.isHeader);

  // Map options for Select components
  const accountOptions = detailAccounts.map(a => ({
    label: `${a.code} - ${a.name}`,
    value: a.id
  }));

  const programOptions = [
    { label: "-- Tanpa Program --", value: "" },
    ...programs.map(p => ({ label: p.title, value: p.id }))
  ];

  // Prepare initial values
  const defaultValues: any = {
    journalDate: new Date().toISOString().split('T')[0],
    description: "",
    programId: "",
    details: [
      { accountId: "", debit: 0, credit: 0, description: "" },
      { accountId: "", debit: 0, credit: 0, description: "" },
    ]
  };

  const methods = useForm<any>({
    resolver: zodResolver(journalSchema),
    defaultValues,
    mode: "onChange",
  });

  const { control, handleSubmit, watch, formState: { errors } } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "details"
  });

  // Watch for balance calculations
  const details = watch("details") || [];
  const totalDebit = details.reduce((sum: number, d: any) => sum + (Number(d?.debit) || 0), 0);
  const totalCredit = details.reduce((sum: number, d: any) => sum + (Number(d?.credit) || 0), 0);

  const onSubmit = (data: any) => {
    setError(null);
    startTransition(async () => {
      // Clean up empty optional programId
      const submitData = { ...data, programId: data.programId || null };

      const result = await createJournalAction(submitData, lembagaId);

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        toast.success("Jurnal berhasil disimpan dan diposting");
        navigate("/dashboard/journal");
      }
    });
  };

  return (
    <Card>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="journalDate"
                label="Tanggal Jurnal"
                type="input"
                inputType="date"
                disabled={isPending}
              />
              <FormField
                name="programId"
                label="Terkait Program (Opsional)"
                type="select"
                options={programOptions}
                disabled={isPending}
              />
            </div>

            <FormField
              name="description"
              label="Keterangan / Deskripsi Jurnal"
              type="textarea"
              rows={2}
              disabled={isPending}
            />

            <hr className="border-border" />

            {/* Details Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary">Baris Jurnal (Details)</h3>
                <Button
                  type="button"
                  intent="secondary"
                  size="sm"
                  onClick={() => append({ accountId: "", debit: 0, credit: 0, description: "" })}
                  disabled={isPending}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Tambah Baris
                </Button>
              </div>

              <div className="rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-surface-soft border-b border-border text-xs uppercase text-secondary">
                    <tr>
                      <th className="px-4 py-3 min-w-[250px]">Akun COA</th>
                      <th className="px-4 py-3 min-w-[200px]">Keterangan</th>
                      <th className="px-4 py-3 w-40 text-right">Debit (Rp)</th>
                      <th className="px-4 py-3 w-40 text-right">Kredit (Rp)</th>
                      <th className="px-4 py-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {fields.map((field, index) => {
                      const errs = (errors.details as any)?.[index];
                      return (
                        <tr key={field.id} className="align-top hover:bg-surface-muted/30">
                          <td className="px-4 py-3">
                            <Controller
                              name={`details.${index}.accountId`}
                              control={control}
                              render={({ field: f, fieldState }) => (
                                <Select
                                  {...f}
                                  value={f.value || ""}
                                  disabled={isPending}
                                  className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                                >
                                  <option value="">Pilih Akun</option>
                                  {accountOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                              )}
                            />
                            {errs?.accountId && (
                              <p className="text-[10px] text-destructive mt-1">{errs.accountId.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Controller
                              name={`details.${index}.description`}
                              control={control}
                              render={({ field: f }) => (
                                <input
                                  {...f}
                                  value={f.value || ""}
                                  type="text"
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Opsional"
                                  disabled={isPending}
                                />
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Controller
                              name={`details.${index}.debit`}
                              control={control}
                              render={({ field: f, fieldState }) => (
                                <input
                                  {...f}
                                  value={f.value === 0 ? "" : formatThousands(f.value)}
                                  type="text"
                                  className={`flex h-9 w-full text-right font-mono rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                  disabled={isPending}
                                  onChange={e => f.onChange(parseThousands(e.target.value))}
                                />
                              )}
                            />
                             {errs?.debit && (
                              <p className="text-[10px] text-destructive mt-1">{errs.debit.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Controller
                              name={`details.${index}.credit`}
                              control={control}
                              render={({ field: f, fieldState }) => (
                                <input
                                  {...f}
                                  value={f.value === 0 ? "" : formatThousands(f.value)}
                                  type="text"
                                  className={`flex h-9 w-full text-right font-mono rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                  disabled={isPending}
                                  onChange={e => f.onChange(parseThousands(e.target.value))}
                                />
                              )}
                            />
                            {errs?.credit && (
                              <p className="text-[10px] text-destructive mt-1">{errs.credit.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="w-8 h-9 inline-flex items-center justify-center text-muted hover:text-destructive transition-colors disabled:opacity-50"
                              disabled={isPending || fields.length <= 2}
                              title="Hapus baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {(errors as any).details?.root && (
                <FormError message={(errors as any).details.root.message} className="mt-2" />
              )}
              
              {error && (
                <FormError message={error} className="mt-4 p-3 bg-destructive/10 rounded-md border border-destructive/20" />
              )}
            </div>

            {/* Balance Indicator */}
            <JournalBalanceSummary totalDebit={totalDebit} totalCredit={totalCredit} />

          </CardContent>

          <CardFooter className="flex items-center justify-end gap-x-4 border-t border-border pt-4">
            <Button
              type="button"
              intent="secondary"
              onClick={() => navigate("/dashboard/journal")}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              intent="primary"
              isLoading={isPending}
              disabled={isPending || Math.abs(totalDebit - totalCredit) >= 0.01 || totalDebit === 0}
            >
              Simpan Jurnal
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
