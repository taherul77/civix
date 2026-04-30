"use client";

import { useState } from "react";
import { Plug, Unplug, RefreshCw, Upload, AlertTriangle } from "lucide-react";
import { useData } from "@/store/data-store";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { toast } from "@/components/ui/toast";
import { SUPPORTED_VENDORS, type EquipmentVendor } from "@/server/equipment-adapters";
import { useCan } from "@/lib/auth-context";

export function IntegrationPanel({ equipmentId }: { equipmentId: string }) {
  const conn = useData((s) => s.equipmentConnections[equipmentId]);
  const canEdit = useCan("equipment:calibrate");

  const [vendor, setVendor] = useState<EquipmentVendor>(SUPPORTED_VENDORS[0].vendor);
  const [endpoint, setEndpoint] = useState("https://lab.example/api/v2");
  const [apiKey, setApiKey] = useState("");
  const [interval, setInterval] = useState(60);

  const selected = SUPPORTED_VENDORS.find((v) => v.vendor === vendor);

  const onConnect = async () => {
    await mutate(
      () => api.equipment.connect(equipmentId, {
        vendor,
        endpoint: selected?.requiresEndpoint ? endpoint : undefined,
        apiKey: selected?.requiresEndpoint ? apiKey : undefined,
        pollIntervalSeconds: interval,
      }),
      `Connected ${selected?.label}`
    );
  };

  const onDisconnect = async () => {
    await mutate(() => api.equipment.disconnect(equipmentId), "Disconnected");
  };

  const onPoll = async () => {
    const r = await mutate(() => api.equipment.pollAdapter(equipmentId));
    if (r) toast.success(`+${r.added} reading(s) captured`);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = (file.name.toLowerCase().endsWith(".xml") ? "xml-generic" : "csv-generic") as EquipmentVendor;
    const r = await mutate(() => api.equipment.importFile(equipmentId, v, file));
    if (r) toast.success(`+${r.added} reading(s) imported from ${file.name}`);
    e.target.value = "";
  };

  if (!canEdit) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
          <AlertTriangle className="w-4 h-4" /> Lab Engineer or Tenant Admin role required to manage integrations.
        </div>
      </div>
    );
  }

  if (conn) {
    return (
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Plug className="w-4 h-4 text-emerald-600" /> Connected — {conn.vendor}
          </h3>
          <button onClick={onDisconnect} className="btn btn-outline text-sm">
            <Unplug className="w-4 h-4" /> Disconnect
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-[rgb(var(--muted))]">Endpoint</dt>
          <dd className="font-mono text-xs break-all">{conn.endpoint ?? "(file import only)"}</dd>
          <dt className="text-[rgb(var(--muted))]">Auth</dt>
          <dd>{conn.apiKey ? "API key configured" : "—"}</dd>
          <dt className="text-[rgb(var(--muted))]">Last poll</dt>
          <dd>{conn.lastPolledAt ?? "never"}</dd>
        </dl>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-[rgb(var(--border))]">
          <button onClick={onPoll} className="btn btn-primary">
            <RefreshCw className="w-4 h-4" /> Poll for new readings
          </button>
          <label className="btn btn-outline cursor-pointer">
            <Upload className="w-4 h-4" /> Import file (CSV/XML)
            <input type="file" accept=".csv,.xml" onChange={onImportFile} className="hidden" />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Unplug className="w-4 h-4" /> No integration configured
      </h3>
      <p className="text-sm text-[rgb(var(--muted))]">
        Connect this machine to its REST endpoint, or import a CSV/XML export from a legacy system.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[rgb(var(--muted))]">Vendor</span>
          <select className="input" value={vendor} onChange={(e) => setVendor(e.target.value as EquipmentVendor)}>
            {SUPPORTED_VENDORS.map((v) => (
              <option key={v.vendor} value={v.vendor}>{v.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[rgb(var(--muted))]">Poll interval (s)</span>
          <input type="number" className="input" value={interval} onChange={(e) => setInterval(Number(e.target.value))} />
        </label>
        {selected?.requiresEndpoint && (
          <>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs font-medium text-[rgb(var(--muted))]">Endpoint URL</span>
              <input className="input" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs font-medium text-[rgb(var(--muted))]">API key</span>
              <input className="input font-mono" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="•••••" />
            </label>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-[rgb(var(--border))]">
        <button onClick={onConnect} className="btn btn-primary">
          <Plug className="w-4 h-4" /> Connect
        </button>
        {!selected?.requiresEndpoint && (
          <label className="btn btn-outline cursor-pointer">
            <Upload className="w-4 h-4" /> Import file
            <input type="file" accept=".csv,.xml" onChange={onImportFile} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
}
