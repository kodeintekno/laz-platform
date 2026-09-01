import React, { useState } from "react";
import { ChevronRight, ChevronDown, Layers, BookOpen, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { provisionCoaAction } from "../actions/coa.actions";
import { toast } from "@/stores/toast.store";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CoaAccount {
  id: string;
  code: string;
  name: string;
  accountType: "ASSET" | "LIABILITY" | "FUND" | "REVENUE" | "EXPENSE";
  normalBalance: "DEBIT" | "CREDIT";
  isHeader: boolean;
  parentCode: string | null;
  level: number;
  isSystem: boolean;
  isEditable: boolean;
  isDeletable: boolean;
  isActive: boolean;
}

interface CoaTreeNode extends CoaAccount {
  children: CoaTreeNode[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildTree(accounts: CoaAccount[]): CoaTreeNode[] {
  const byCode = new Map<string, CoaTreeNode>();
  for (const acc of accounts) {
    byCode.set(acc.code, { ...acc, children: [] });
  }
  const roots: CoaTreeNode[] = [];
  for (const node of byCode.values()) {
    if (!node.parentCode) {
      roots.push(node);
    } else {
      const parent = byCode.get(node.parentCode);
      if (parent) parent.children.push(node);
      else roots.push(node); // orphan fallback
    }
  }
  return roots;
}

// ─── Labels & Colours ─────────────────────────────────────────────────────────

const ACCOUNT_TYPE_LABEL: Record<CoaAccount["accountType"], string> = {
  ASSET: "Aset",
  LIABILITY: "Kewajiban",
  FUND: "Dana",
  REVENUE: "Penerimaan",
  EXPENSE: "Beban",
};

const ACCOUNT_TYPE_COLOR: Record<
  CoaAccount["accountType"],
  { bg: string; text: string; border: string; dot: string }
> = {
  ASSET:     { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500" },
  LIABILITY: { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500" },
  FUND:      { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  REVENUE:   { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",dot: "bg-emerald-500" },
  EXPENSE:   { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
};

// ─── AccountRow ───────────────────────────────────────────────────────────────

interface AccountRowProps {
  node: CoaTreeNode;
  depth: number;
  defaultOpen?: boolean;
  lembagaId?: string;
}

function AccountRow({ node, depth, defaultOpen = false, lembagaId }: AccountRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const queryClient = useQueryClient();
  const hasChildren = node.children.length > 0;
  const color = ACCOUNT_TYPE_COLOR[node.accountType];

  const indentPx = depth * 20;

  const renameAccount = async () => {
    const name = window.prompt("Nama akun baru", node.name)?.trim();
    if (!name || name === node.name) return;
    try {
      await api.patch(`/coa/accounts/${node.id}`, { name, lembagaId });
      toast.success("Nama akun berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["coa"] });
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengubah akun");
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm(`Hapus akun ${node.code} — ${node.name}?`)) return;
    try {
      const query = lembagaId ? `?lembagaId=${encodeURIComponent(lembagaId)}` : "";
      await api.delete(`/coa/accounts/${node.id}${query}`);
      toast.success("Akun berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["coa"] });
    } catch (error: any) {
      toast.error(error?.message || "Akun tidak dapat dihapus");
    }
  };

  return (
    <div>
      <div
        className={`
          group flex items-center gap-3 px-4 py-2.5
          border-b border-border/40 transition-colors duration-100
          ${node.isHeader
            ? "bg-surface-soft/60 hover:bg-surface-soft"
            : "hover:bg-surface-muted/50"}
          ${!node.isActive ? "opacity-50" : ""}
        `}
        style={{ paddingLeft: `${16 + indentPx}px` }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          className={`w-5 h-5 flex items-center justify-center flex-shrink-0 rounded transition-colors ${
            hasChildren
              ? "text-secondary hover:text-primary cursor-pointer"
              : "cursor-default text-transparent"
          }`}
          onClick={() => hasChildren && setOpen((o) => !o)}
          aria-label={open ? "Collapse" : "Expand"}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren &&
            (open ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            ))}
        </button>

        {/* Icon */}
        <span
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded ${color.bg}`}
        >
          {node.isHeader ? (
            <Layers className={`w-3 h-3 ${color.text}`} />
          ) : (
            <BookOpen className={`w-3 h-3 ${color.text}`} />
          )}
        </span>

        {/* Code */}
        <span
          className={`font-mono text-sm flex-shrink-0 w-14 ${
            node.isHeader ? "font-bold text-primary" : "font-medium text-secondary"
          }`}
        >
          {node.code}
        </span>

        {/* Name */}
        <span
          className={`flex-1 text-sm truncate ${
            node.isHeader ? "font-semibold text-primary" : "text-primary"
          }`}
        >
          {node.name}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Type badge — only on level-1 root accounts */}
          {node.level === 1 && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${color.bg} ${color.text} ${color.border}`}
            >
              {ACCOUNT_TYPE_LABEL[node.accountType]}
            </span>
          )}

          {/* Header indicator */}
          {node.isHeader && (
            <Badge intent="muted" className="text-[10px] py-0 px-1.5">
              Header
            </Badge>
          )}

          {/* Normal balance */}
          {!node.isHeader && (
            <Badge
              intent={node.normalBalance === "DEBIT" ? "info" : "success"}
              className="text-[10px] py-0 px-1.5 font-mono"
            >
              {node.normalBalance === "DEBIT" ? "D" : "K"}
            </Badge>
          )}
          {node.isEditable && (
            <button type="button" className="text-secondary hover:text-primary" onClick={renameAccount} title="Ubah nama">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {node.isDeletable && (
            <button type="button" className="text-secondary hover:text-destructive" onClick={deleteAccount} title="Hapus akun">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <AccountRow
              key={child.code}
              node={child}
              depth={depth + 1}
              defaultOpen={child.level <= 2}
              lembagaId={lembagaId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CoaTree (public export) ──────────────────────────────────────────────────

interface CoaTreeProps {
  accounts: CoaAccount[];
}

export function CoaTree({ accounts }: CoaTreeProps) {
  const [searchParams] = useSearchParams();
  const lembagaId = searchParams.get("lembagaId") ?? undefined;
  const queryClient = useQueryClient();

  const { mutate: provision, isPending } = useMutation({
    mutationFn: () => provisionCoaAction(lembagaId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Chart of Accounts berhasil dibuat");
        queryClient.invalidateQueries({ queryKey: ["coa"] });
      } else {
        toast.error(res.error || "Gagal membuat Chart of Accounts");
      }
    },
    onError: () => toast.error("Terjadi kesalahan sistem"),
  });

  const roots = buildTree(accounts);

  if (roots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Layers className="w-12 h-12 text-secondary/40 mb-4" />
        <p className="text-secondary mb-6">Belum ada akun COA untuk lembaga ini.</p>
        <Button onClick={() => provision()} disabled={isPending}>
          {isPending ? "Sedang Membuat..." : "Buat Template COA Sekarang"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      {/* Table header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-surface-soft border-b border-border text-xs font-semibold text-secondary uppercase tracking-wide">
        <span className="w-5" />
        <span className="w-5" />
        <span className="w-14">Kode</span>
        <span className="flex-1">Nama Akun</span>
        <span className="w-28 text-right">Keterangan</span>
      </div>

      {/* Rows */}
      <div>
        {roots.map((root) => (
          <AccountRow
            key={root.code}
            node={root}
            depth={0}
            defaultOpen={true}
            lembagaId={lembagaId}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-border bg-surface-soft text-xs text-secondary">
        <span className="font-semibold">Keterangan:</span>
        <span className="flex items-center gap-1.5">
          <Badge intent="info" className="text-[10px] py-0 px-1.5 font-mono">D</Badge>
          Saldo Normal Debit
        </span>
        <span className="flex items-center gap-1.5">
          <Badge intent="success" className="text-[10px] py-0 px-1.5 font-mono">K</Badge>
          Saldo Normal Kredit
        </span>
        <span className="flex items-center gap-1.5">
          <Badge intent="muted" className="text-[10px] py-0 px-1.5">Header</Badge>
          Akun grouping, tidak untuk jurnal
        </span>
      </div>
    </div>
  );
}
