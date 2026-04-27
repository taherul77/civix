export interface AuditEntry {
  id: string;
  ts: string;
  user: string;
  action: "create" | "update" | "submit" | "review" | "approve" | "delete" | "login" | "calibration";
  entity: string;
  entityId: string;
  diff?: { field: string; from: string; to: string }[];
  ip: string;
}

export const audit: AuditEntry[] = [
  { id: "a1", ts: "2026-04-28 14:21:11", user: "Eng. Fahad",     action: "approve", entity: "Test",   entityId: "T-26-04-3201", ip: "10.4.21.7" },
  { id: "a2", ts: "2026-04-28 14:18:02", user: "Eng. M. Hamzah", action: "review",  entity: "Test",   entityId: "T-26-04-3201", ip: "10.4.21.4" },
  { id: "a3", ts: "2026-04-28 13:55:48", user: "Ahmed Hassan",   action: "submit",  entity: "Test",   entityId: "T-26-04-3208", ip: "10.4.21.9", diff: [
    { field: "max_load_kn", from: "—", to: "412" }, { field: "status", from: "draft", to: "submitted" },
  ]},
  { id: "a4", ts: "2026-04-28 12:08:14", user: "Sarah Mansour",  action: "create",  entity: "Sample", entityId: "S-26-04-1049", ip: "10.4.21.11" },
  { id: "a5", ts: "2026-04-28 11:01:52", user: "Eng. Fahad",     action: "update",  entity: "Test",   entityId: "T-26-04-3202", ip: "10.4.21.7", diff: [
    { field: "concrete_temperature_c", from: "34.1", to: "32.4" },
  ]},
  { id: "a6", ts: "2026-04-28 10:42:33", user: "system",         action: "calibration", entity: "Equipment", entityId: "EQ-CMP-02", ip: "—" },
  { id: "a7", ts: "2026-04-28 09:30:00", user: "Yousef Al-Harbi",action: "login",   entity: "Auth",   entityId: "—", ip: "37.45.21.44" },
  { id: "a8", ts: "2026-04-27 18:11:22", user: "Eng. Fahad",     action: "approve", entity: "Test",   entityId: "T-26-04-3207", ip: "10.4.21.7" },
];

export interface Notification {
  id: string;
  level: "info" | "warn" | "error" | "success";
  title: string;
  body: string;
  ts: string;
  href?: string;
  read?: boolean;
}

export const notifications: Notification[] = [
  { id: "n1", level: "error", title: "Calibration overdue", body: "EQ-NCG-01 (Troxler 3440) calibration is 1 day overdue. Tests using this equipment cannot be approved.", ts: "10 min ago", href: "/equipment", read: false },
  { id: "n2", level: "warn", title: "Test failed", body: "T-26-04-3208 — Compressive strength 18.2 MPa < 0.85 × f'c. Action required.", ts: "1 h ago", href: "/tests/t8", read: false },
  { id: "n3", level: "warn", title: "Concrete placement T near limit", body: "Project NEOM Module 4 — placement T = 33 °C. SBC 304 limit 35 °C.", ts: "3 h ago", href: "/tests/new/A4", read: false },
  { id: "n4", level: "info", title: "3 tests pending your review", body: "Quality Manager queue updated.", ts: "5 h ago", href: "/tests?status=submitted", read: true },
  { id: "n5", level: "success", title: "Report approved", body: "RPT-2026-3201 has been digitally signed and released to client.", ts: "yesterday", href: "/tests/t1/report", read: true },
];

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: "test" | "calibration" | "sampling";
  title: string;
  who?: string;
  href?: string;
}

export const events: CalendarEvent[] = [
  { id: "e1", date: "2026-04-28", type: "test",        title: "f'c @ 28d — pile cap PC-14",    who: "Eng. Fahad", href: "/tests/t1" },
  { id: "e2", date: "2026-04-29", type: "calibration", title: "EQ-NCG-01 — Nuclear gauge cal." },
  { id: "e3", date: "2026-04-29", type: "test",        title: "Marshall Stability — B-217",    who: "T. Mahmoud" },
  { id: "e4", date: "2026-04-30", type: "sampling",    title: "Borehole BH-12 @ Diriyah",      who: "T. Yousef" },
  { id: "e5", date: "2026-05-02", type: "test",        title: "RCPT — coastal slabs",          who: "Eng. Sarah" },
  { id: "e6", date: "2026-05-04", type: "calibration", title: "EQ-CMP-02 — Compression cal." },
  { id: "e7", date: "2026-05-06", type: "test",        title: "Tensile — Ø25 rebar",            who: "Eng. Fahad" },
  { id: "e8", date: "2026-05-08", type: "sampling",    title: "Mixing water — plant 4",         who: "T. Ahmed" },
];

export interface SiteSample {
  id: string;
  code: string;
  type: string;
  lat: number;
  lng: number;
  city: string;
  date: string;
}

export const sitesGeo: SiteSample[] = [
  { id: "g1", code: "S-26-04-1042", type: "Concrete",  lat: 28.0, lng: 35.4, city: "Tabuk (NEOM)",   date: "2026-04-26" },
  { id: "g2", code: "S-26-04-1044", type: "Water",     lat: 28.0, lng: 35.4, city: "Tabuk (NEOM)",   date: "2026-04-27" },
  { id: "g3", code: "S-26-04-1045", type: "Soil",      lat: 25.4, lng: 37.3, city: "Umluj (Red Sea)",date: "2026-04-25" },
  { id: "g4", code: "S-26-04-1046", type: "Aggregate", lat: 24.7, lng: 46.7, city: "Riyadh (Qiddiya)", date: "2026-04-24" },
  { id: "g5", code: "S-26-04-1048", type: "Concrete",  lat: 25.4, lng: 37.3, city: "Umluj",          date: "2026-04-27" },
  { id: "g6", code: "S-26-04-1049", type: "Cement",    lat: 24.6, lng: 46.7, city: "Diriyah",        date: "2026-04-20" },
  { id: "g7", code: "S-26-04-1041", type: "Concrete",  lat: 21.5, lng: 39.2, city: "Jeddah",         date: "2026-04-22" },
  { id: "g8", code: "S-26-04-1050", type: "Aggregate", lat: 26.4, lng: 50.1, city: "Dammam",         date: "2026-04-23" },
];
