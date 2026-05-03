"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldHalf, Save, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { useApp } from "@/store/app-store";
import { toast } from "@/components/ui/toast";
import { apiFetch, isBackendActive } from "@/lib/api-client";
import { api } from "@/server/api";
import {
  PAGES,
  PAGE_ACTIONS,
  PAGE_MODULES,
  type PageAction,
  type RolePagePermissions,
  defaultRolePermissions,
  fullRolePermissions,
} from "@/lib/page-catalog";
import { cn } from "@/lib/utils";

// Only Super Admin renders as a non-editable "owner" — Tenant Admin can be
// restricted just like any other role, matching the runtime store behaviour.
const OWNER_ROLES = ["Super Admin"] as const;

export default function PagePermissionsPage() {
  const tt = useT();
  const canEdit = useCan("security:update");

  const stored = useApp((s) => s.pagePermissions);
  const setRolePagePermissions = useApp((s) => s.setRolePagePermissions);
  const resetRolePagePermissions = useApp((s) => s.resetRolePagePermissions);

  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Load the tenant's role catalogue from /v1/roles so the picker reflects
  // whatever this tenant has defined (built-in templates + custom roles).
  useEffect(() => {
    let cancelled = false;
    api.roles
      .list()
      .then((items) => {
        if (cancelled) return;
        const names = items.map((r) => r.name);
        setRoleNames(names);
        const first = names.find((n) => !OWNER_ROLES.includes(n as never)) ?? names[0] ?? "";
        setSelectedRole((cur) => cur || first);
      })
      .catch(() => { /* silent — picker just stays empty */ });
    return () => { cancelled = true; };
  }, []);
  const [activeModule, setActiveModule] = useState<string>(PAGE_MODULES[0] ?? "Dashboard");

  const isOwner = (OWNER_ROLES as readonly string[]).includes(selectedRole);

  // Working copy of the matrix for the selected role.
  const [draft, setDraft] = useState<RolePagePermissions>(() => seed(selectedRole, stored));
  const [dirty, setDirty] = useState(false);

  // Re-seed when the selected role changes.
  const onRoleChange = (role: string) => {
    if (dirty && !confirm(tt("Discard unsaved changes?"))) return;
    setSelectedRole(role);
    setDraft(seed(role, stored));
    setDirty(false);
  };

  const pagesInModule = useMemo(
    () => PAGES.filter((p) => p.module === activeModule),
    [activeModule]
  );

  const togglePage = (pageId: string, action: PageAction, value: boolean) => {
    if (!canEdit || isOwner) return;
    setDraft((prev) => ({
      ...prev,
      [pageId]: { ...prev[pageId], [action]: value },
    }));
    setDirty(true);
  };

  const allPages = PAGES;

  const allSelected = useMemo(
    () => allPages.every((p) => PAGE_ACTIONS.every((a) => draft[p.id]?.[a])),
    [allPages, draft]
  );

  const moduleAllSelected = useMemo(
    () => pagesInModule.every((p) => PAGE_ACTIONS.every((a) => draft[p.id]?.[a])),
    [pagesInModule, draft]
  );

  const setAll = (value: boolean) => {
    if (!canEdit || isOwner) return;
    setDraft((prev) => {
      const next = { ...prev };
      for (const p of allPages) {
        next[p.id] = {
          view: value, create: value, edit: value, delete: value,
        };
      }
      return next;
    });
    setDirty(true);
  };

  const setModuleAll = (value: boolean) => {
    if (!canEdit || isOwner) return;
    setDraft((prev) => {
      const next = { ...prev };
      for (const p of pagesInModule) {
        next[p.id] = {
          view: value, create: value, edit: value, delete: value,
        };
      }
      return next;
    });
    setDirty(true);
  };

  const setPageAll = (pageId: string, value: boolean) => {
    if (!canEdit || isOwner) return;
    setDraft((prev) => ({
      ...prev,
      [pageId]: { view: value, create: value, edit: value, delete: value },
    }));
    setDirty(true);
  };

  const save = async () => {
    // Always update the local store first so the sidebar reflects changes
    // even when the backend is offline.
    setRolePagePermissions(selectedRole, draft);
    setDirty(false);

    if (!isBackendActive()) {
      toast.success(tt(`Permissions saved for ${selectedRole} (local only — backend offline)`));
      return;
    }
    try {
      const pages = PAGES.map((p) => ({
        pageId: p.id,
        view:   !!draft[p.id]?.view,
        create: !!draft[p.id]?.create,
        edit:   !!draft[p.id]?.edit,
        delete: !!draft[p.id]?.delete,
      }));
      await apiFetch(`/v1/role-permissions/${encodeURIComponent(selectedRole)}`, {
        method: "PUT",
        body: { pages },
      });
      toast.success(tt(`Permissions saved for ${selectedRole}`));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save permissions";
      toast.error(msg);
      // Re-mark as dirty so the user can retry.
      setDirty(true);
    }
  };

  const resetToDefault = () => {
    if (!confirm(tt("Reset this role's permissions to view-only on every page?"))) return;
    resetRolePagePermissions(selectedRole);
    const fresh = defaultRolePermissions();
    setDraft(fresh);
    setDirty(false);
    toast.success(tt(`${selectedRole} reset to view-only defaults`));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page permissions"
        description="For each role, choose which pages they can view, create, edit, or delete. Pages with no view access are hidden from that role's sidebar."
      />

      {/* Role selector + global actions */}
      <div className="card p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <ShieldHalf className="w-4 h-4 text-brand-600 shrink-0" />
          <label className="text-sm font-semibold whitespace-nowrap">{tt("Role")}</label>
          <select
            className="input min-w-[220px]"
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
          >
            {roleNames.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {isOwner && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300">
              {tt("Owner role — full access, not editable")}
            </span>
          )}
          {dirty && !isOwner && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {tt("Unsaved changes")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => setAll(!allSelected)}
            disabled={!canEdit || isOwner}
          >
            {allSelected ? tt("Deselect all permissions") : tt("Select all permissions")}
          </button>
          <button
            type="button"
            className="btn btn-outline text-sm"
            onClick={resetToDefault}
            disabled={!canEdit || isOwner}
            title={tt("Reset to view-only on every page")}
          >
            <RotateCcw className="w-4 h-4" /> {tt("Reset")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
            disabled={!canEdit || isOwner || !dirty}
          >
            <Save className="w-4 h-4" /> {tt("Save")}
          </button>
        </div>
      </div>

      {/* Module tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="border-b border-[rgb(var(--border))] flex flex-wrap gap-1 px-2 pt-2 overflow-x-auto">
          {PAGE_MODULES.map((m) => {
            const active = m === activeModule;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveModule(m)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap border-b-2 -mb-px",
                  active
                    ? "border-brand-600 text-brand-700 dark:text-brand-300"
                    : "border-transparent text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Per-module select-all bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[rgb(var(--bg-soft))] border-b border-[rgb(var(--border))]">
          <span className="text-xs text-[rgb(var(--muted))]">
            {pagesInModule.length} {tt("pages in")} <span className="font-semibold">{activeModule}</span>
          </span>
          <button
            type="button"
            className="text-xs text-brand-600 hover:underline"
            onClick={() => setModuleAll(!moduleAllSelected)}
            disabled={!canEdit || isOwner}
          >
            {moduleAllSelected
              ? tt(`Deselect all in ${activeModule}`)
              : tt(`Select all in ${activeModule}`)}
          </button>
        </div>

        {/* Page cards */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {pagesInModule.map((p) => {
            const row = draft[p.id] ?? { view: false, create: false, edit: false, delete: false };
            const allOn = PAGE_ACTIONS.every((a) => row[a]);
            return (
              <div
                key={p.id}
                className="rounded-xl border border-[rgb(var(--border))] p-4 hover:bg-[rgb(var(--bg-soft))]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{p.label}</div>
                    <div className="text-xs text-[rgb(var(--muted))] font-mono">{p.href}</div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-brand-600 hover:underline shrink-0"
                    onClick={() => setPageAll(p.id, !allOn)}
                    disabled={!canEdit || isOwner}
                  >
                    {allOn ? tt("Clear") : tt("All")}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAGE_ACTIONS.map((action) => {
                    const checked = isOwner ? true : !!row[action];
                    return (
                      <label
                        key={action}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm capitalize",
                          checked
                            ? "border-brand-500/50 bg-brand-500/5"
                            : "border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-soft))]",
                          (!canEdit || isOwner) && "cursor-not-allowed opacity-70"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => togglePage(p.id, action, e.target.checked)}
                          disabled={!canEdit || isOwner}
                        />
                        <span>{action}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!canEdit && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          {tt("Read-only — you need the security:update permission to edit page permissions.")}
        </div>
      )}
    </div>
  );
}

// Build the working draft for a role: prefer stored, else view-only defaults
// (or full defaults for owner roles).
function seed(role: string, stored: Record<string, RolePagePermissions>): RolePagePermissions {
  if ((OWNER_ROLES as readonly string[]).includes(role)) return fullRolePermissions();
  if (stored[role]) {
    // Make sure every page id exists in the row even if the catalog has grown.
    const merged = { ...defaultRolePermissions(), ...stored[role] };
    return merged;
  }
  return defaultRolePermissions();
}
