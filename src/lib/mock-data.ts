export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  city: string;
  engineer: string;
  status: "active" | "on_hold" | "completed";
  startDate: string;
  endDate: string;
  contractValue: number;
}

export interface Sample {
  id: string;
  code: string;
  type: "concrete" | "soil" | "aggregate" | "asphalt" | "steel" | "cement" | "masonry" | "water";
  projectId: string;
  date: string;
  location: string;
  sampledBy: string;
  status: "pending" | "in_test" | "completed";
}

export interface Test {
  id: string;
  code: string;
  name: string;
  category: Sample["type"];
  standard: string;
  sampleId: string;
  projectId: string;
  testDate: string;
  technician: string;
  status: "draft" | "submitted" | "reviewed" | "approved";
  passFail: "pass" | "fail" | "pending";
  primaryResult?: { value: number; unit: string; label: string };
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  manufacturer: string;
  model: string;
  serial: string;
  calibrationDue: string;
  status: "active" | "calibration_due" | "out_of_service";
}

export const projects: Project[] = [
  {
    id: "p1",
    code: "PRJ-2026-001",
    name: "NEOM The Line — Module 4 Foundations",
    client: "NEOM Co.",
    city: "Tabuk",
    engineer: "Eng. Khalid Al-Otaibi",
    status: "active",
    startDate: "2025-09-01",
    endDate: "2027-12-31",
    contractValue: 48_500_000,
  },
  {
    id: "p2",
    code: "PRJ-2026-002",
    name: "Red Sea Coral Bloom — Resort Substructures",
    client: "Red Sea Global",
    city: "Umluj",
    engineer: "Eng. Sarah Mansour",
    status: "active",
    startDate: "2025-06-15",
    endDate: "2026-12-30",
    contractValue: 22_300_000,
  },
  {
    id: "p3",
    code: "PRJ-2026-003",
    name: "Qiddiya Speed Park — Pavement",
    client: "Qiddiya Investment",
    city: "Riyadh",
    engineer: "Eng. Faisal Al-Shehri",
    status: "active",
    startDate: "2025-11-01",
    endDate: "2026-08-15",
    contractValue: 9_800_000,
  },
  {
    id: "p4",
    code: "PRJ-2025-187",
    name: "Diriyah Gate Heritage District",
    client: "Diriyah Company",
    city: "Riyadh",
    engineer: "Eng. Layla Hashem",
    status: "on_hold",
    startDate: "2025-02-01",
    endDate: "2026-06-30",
    contractValue: 14_750_000,
  },
];

export const samples: Sample[] = [
  { id: "s1", code: "S-26-04-1042", type: "concrete", projectId: "p1", date: "2026-04-26", location: "Pile cap PC-14", sampledBy: "T. Ahmed", status: "in_test" },
  { id: "s2", code: "S-26-04-1043", type: "concrete", projectId: "p1", date: "2026-04-26", location: "Slab S2-B", sampledBy: "T. Ahmed", status: "in_test" },
  { id: "s3", code: "S-26-04-1044", type: "water", projectId: "p1", date: "2026-04-27", location: "Mixing plant tank 3", sampledBy: "Eng. Sarah", status: "pending" },
  { id: "s4", code: "S-26-04-1045", type: "soil", projectId: "p2", date: "2026-04-25", location: "Borehole BH-08 @ 4.5m", sampledBy: "T. Yousef", status: "completed" },
  { id: "s5", code: "S-26-04-1046", type: "aggregate", projectId: "p3", date: "2026-04-24", location: "Crusher stockpile A", sampledBy: "T. Mahmoud", status: "completed" },
  { id: "s6", code: "S-26-04-1047", type: "asphalt", projectId: "p3", date: "2026-04-27", location: "Plant batch B-217", sampledBy: "T. Mahmoud", status: "in_test" },
  { id: "s7", code: "S-26-04-1048", type: "steel", projectId: "p1", date: "2026-04-22", location: "Rebar bundle RB-118 (Ø20)", sampledBy: "T. Ahmed", status: "completed" },
  { id: "s8", code: "S-26-04-1049", type: "concrete", projectId: "p2", date: "2026-04-27", location: "Column CL-42", sampledBy: "T. Yousef", status: "in_test" },
  { id: "s9", code: "S-26-04-1050", type: "cement", projectId: "p4", date: "2026-04-20", location: "Cement silo 2", sampledBy: "T. Ali", status: "completed" },
];

export const tests: Test[] = [
  {
    id: "t1", code: "T-26-04-3201", name: "Compressive Strength of Concrete", category: "concrete",
    standard: "SASO GSO ASTM C39", sampleId: "s1", projectId: "p1",
    testDate: "2026-04-27", technician: "Eng. Fahad",
    status: "approved", passFail: "pass",
    primaryResult: { value: 38.7, unit: "MPa", label: "f'c @ 28d" },
  },
  {
    id: "t2", code: "T-26-04-3202", name: "Concrete Placement Temperature", category: "concrete",
    standard: "SBC 304 / ASTM C1064", sampleId: "s2", projectId: "p1",
    testDate: "2026-04-27", technician: "T. Ahmed",
    status: "reviewed", passFail: "pass",
    primaryResult: { value: 32.4, unit: "°C", label: "Placement T" },
  },
  {
    id: "t3", code: "T-26-04-3203", name: "Potable Water Analysis", category: "water",
    standard: "SASO 1494", sampleId: "s3", projectId: "p1",
    testDate: "2026-04-27", technician: "Eng. Sarah",
    status: "submitted", passFail: "pending",
  },
  {
    id: "t4", code: "T-26-04-3204", name: "California Bearing Ratio", category: "soil",
    standard: "ASTM D1883", sampleId: "s4", projectId: "p2",
    testDate: "2026-04-26", technician: "Eng. Sarah",
    status: "approved", passFail: "pass",
    primaryResult: { value: 28.4, unit: "%", label: "CBR" },
  },
  {
    id: "t5", code: "T-26-04-3205", name: "Sieve Analysis (Coarse Aggregate)", category: "aggregate",
    standard: "ASTM C136", sampleId: "s5", projectId: "p3",
    testDate: "2026-04-25", technician: "T. Mahmoud",
    status: "approved", passFail: "pass",
    primaryResult: { value: 6.78, unit: "FM", label: "Fineness modulus" },
  },
  {
    id: "t6", code: "T-26-04-3206", name: "Marshall Stability & Flow", category: "asphalt",
    standard: "ASTM D6927 / SAES-Q-006", sampleId: "s6", projectId: "p3",
    testDate: "2026-04-27", technician: "T. Mahmoud",
    status: "draft", passFail: "pending",
  },
  {
    id: "t7", code: "T-26-04-3207", name: "Tensile Test (Rebar Ø20)", category: "steel",
    standard: "SASO SSA 2 / ASTM A615", sampleId: "s7", projectId: "p1",
    testDate: "2026-04-23", technician: "Eng. Fahad",
    status: "approved", passFail: "pass",
    primaryResult: { value: 612, unit: "MPa", label: "Yield strength" },
  },
  {
    id: "t8", code: "T-26-04-3208", name: "Compressive Strength of Concrete", category: "concrete",
    standard: "SASO GSO ASTM C39", sampleId: "s8", projectId: "p2",
    testDate: "2026-04-27", technician: "Eng. Sarah",
    status: "submitted", passFail: "fail",
    primaryResult: { value: 18.2, unit: "MPa", label: "f'c @ 7d" },
  },
  {
    id: "t9", code: "T-26-04-3209", name: "Cement Compressive Strength (Mortar)", category: "cement",
    standard: "ASTM C109 / SASO SSA 1", sampleId: "s9", projectId: "p4",
    testDate: "2026-04-25", technician: "T. Ali",
    status: "approved", passFail: "pass",
    primaryResult: { value: 34.6, unit: "MPa", label: "28d strength" },
  },
];

export const equipment: Equipment[] = [
  { id: "e1", code: "EQ-CMP-01", name: "Compression Machine 3000 kN", manufacturer: "Forney", model: "VFD F-505", serial: "FV-9921", calibrationDue: "2026-09-12", status: "active" },
  { id: "e2", code: "EQ-CMP-02", name: "Compression Machine 2000 kN", manufacturer: "Controls", model: "Automax Pro", serial: "CG-77321", calibrationDue: "2026-05-04", status: "calibration_due" },
  { id: "e3", code: "EQ-UTM-01", name: "Universal Testing Machine 600 kN", manufacturer: "Instron", model: "8802", serial: "INS-44521", calibrationDue: "2026-11-22", status: "active" },
  { id: "e4", code: "EQ-OVN-01", name: "Ignition Oven", manufacturer: "InstroTek", model: "NCAT 3200", serial: "IT-2299", calibrationDue: "2026-08-01", status: "active" },
  { id: "e5", code: "EQ-NCG-01", name: "Nuclear Density Gauge", manufacturer: "Troxler", model: "3440", serial: "TX-77822", calibrationDue: "2026-04-29", status: "calibration_due" },
  { id: "e6", code: "EQ-PHM-01", name: "pH / TDS Meter", manufacturer: "HACH", model: "HQ40d", serial: "HC-1187", calibrationDue: "2026-07-19", status: "active" },
];

export function projectById(id: string) { return projects.find((p) => p.id === id); }
export function sampleById(id: string) { return samples.find((s) => s.id === id); }
export function testById(id: string) { return tests.find((t) => t.id === id); }
