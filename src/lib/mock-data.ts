// LocStr lets each text field be either a plain string (English) or a
// bilingual object { en, ar } as returned by the API.
import type { LocStr } from "@/lib/i18n-data";

export interface Project {
  id: string;
  code: string;
  name: LocStr;
  client: LocStr;
  city: LocStr;
  engineer: LocStr;
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
  location: LocStr;
  sampledBy: LocStr;
  status: "pending" | "in_test" | "completed";
}

export interface Test {
  id: string;
  code: string;
  name: LocStr;
  category: Sample["type"];
  standard: string;
  sampleId: string;
  projectId: string;
  testDate: string;
  technician: LocStr;
  status: "draft" | "submitted" | "reviewed" | "approved";
  passFail: "pass" | "fail" | "pending";
  primaryResult?: { value: number; unit: string; label: LocStr };
}

export interface Equipment {
  id: string;
  code: string;
  name: LocStr;
  manufacturer: string; // brand name — kept as-is
  model: string;        // model number — kept as-is
  serial: string;
  calibrationDue: string;
  status: "active" | "calibration_due" | "out_of_service";
}

const bi = (en: string, ar: string) => ({ en, ar });

export const projects: Project[] = [
  {
    id: "p1",
    code: "PRJ-2026-001",
    name:     bi("NEOM The Line — Module 4 Foundations",       "ذا لاين نيوم — أساسات الوحدة 4"),
    client:   bi("NEOM Co.",                                    "شركة نيوم"),
    city:     bi("Tabuk",                                       "تبوك"),
    engineer: bi("Eng. Khalid Al-Otaibi",                       "م. خالد العتيبي"),
    status: "active",
    startDate: "2025-09-01",
    endDate: "2027-12-31",
    contractValue: 48_500_000,
  },
  {
    id: "p2",
    code: "PRJ-2026-002",
    name:     bi("Red Sea Coral Bloom — Resort Substructures",  "البحر الأحمر كورال بلوم — هياكل المنتجع"),
    client:   bi("Red Sea Global",                              "البحر الأحمر العالمية"),
    city:     bi("Umluj",                                       "أملج"),
    engineer: bi("Eng. Sarah Mansour",                          "م. سارة منصور"),
    status: "active",
    startDate: "2025-06-15",
    endDate: "2026-12-30",
    contractValue: 22_300_000,
  },
  {
    id: "p3",
    code: "PRJ-2026-003",
    name:     bi("Qiddiya Speed Park — Pavement",               "قدية سبيد بارك — رصف"),
    client:   bi("Qiddiya Investment",                          "قدية للاستثمار"),
    city:     bi("Riyadh",                                      "الرياض"),
    engineer: bi("Eng. Faisal Al-Shehri",                       "م. فيصل الشهري"),
    status: "active",
    startDate: "2025-11-01",
    endDate: "2026-08-15",
    contractValue: 9_800_000,
  },
  {
    id: "p4",
    code: "PRJ-2025-187",
    name:     bi("Diriyah Gate Heritage District",              "بوابة الدرعية التراثية"),
    client:   bi("Diriyah Company",                             "شركة الدرعية"),
    city:     bi("Riyadh",                                      "الرياض"),
    engineer: bi("Eng. Layla Hashem",                           "م. ليلى هاشم"),
    status: "on_hold",
    startDate: "2025-02-01",
    endDate: "2026-06-30",
    contractValue: 14_750_000,
  },
];

export const samples: Sample[] = [
  { id: "s1", code: "S-26-04-1042", type: "concrete",  projectId: "p1", date: "2026-04-26",
    location: bi("Pile cap PC-14",        "هامة الركيزة PC-14"),
    sampledBy: bi("T. Ahmed",             "ف. أحمد"),  status: "in_test" },
  { id: "s2", code: "S-26-04-1043", type: "concrete",  projectId: "p1", date: "2026-04-26",
    location: bi("Slab S2-B",             "بلاطة S2-B"),
    sampledBy: bi("T. Ahmed",             "ف. أحمد"),  status: "in_test" },
  { id: "s3", code: "S-26-04-1044", type: "water",     projectId: "p1", date: "2026-04-27",
    location: bi("Mixing plant tank 3",   "خزان محطة الخلط 3"),
    sampledBy: bi("Eng. Sarah",           "م. سارة"),   status: "pending" },
  { id: "s4", code: "S-26-04-1045", type: "soil",      projectId: "p2", date: "2026-04-25",
    location: bi("Borehole BH-08 @ 4.5m", "حفرة BH-08 على عمق 4.5 م"),
    sampledBy: bi("T. Yousef",            "ف. يوسف"),   status: "completed" },
  { id: "s5", code: "S-26-04-1046", type: "aggregate", projectId: "p3", date: "2026-04-24",
    location: bi("Crusher stockpile A",   "مخزون الكسارة A"),
    sampledBy: bi("T. Mahmoud",           "ف. محمود"),  status: "completed" },
  { id: "s6", code: "S-26-04-1047", type: "asphalt",   projectId: "p3", date: "2026-04-27",
    location: bi("Plant batch B-217",     "دفعة المحطة B-217"),
    sampledBy: bi("T. Mahmoud",           "ف. محمود"),  status: "in_test" },
  { id: "s7", code: "S-26-04-1048", type: "steel",     projectId: "p1", date: "2026-04-22",
    location: bi("Rebar bundle RB-118 (Ø20)", "حزمة حديد RB-118 (Ø20)"),
    sampledBy: bi("T. Ahmed",             "ف. أحمد"),   status: "completed" },
  { id: "s8", code: "S-26-04-1049", type: "concrete",  projectId: "p2", date: "2026-04-27",
    location: bi("Column CL-42",          "عمود CL-42"),
    sampledBy: bi("T. Yousef",            "ف. يوسف"),   status: "in_test" },
  { id: "s9", code: "S-26-04-1050", type: "cement",    projectId: "p4", date: "2026-04-20",
    location: bi("Cement silo 2",         "صومعة الإسمنت 2"),
    sampledBy: bi("T. Ali",               "ف. علي"),    status: "completed" },
];

export const tests: Test[] = [
  {
    id: "t1", code: "T-26-04-3201",
    name: bi("Compressive Strength of Concrete", "مقاومة الانضغاط للخرسانة"),
    category: "concrete", standard: "SASO GSO ASTM C39", sampleId: "s1", projectId: "p1",
    testDate: "2026-04-27", technician: bi("Eng. Fahad", "م. فهد"),
    status: "approved", passFail: "pass",
    primaryResult: { value: 38.7, unit: "MPa", label: bi("f'c @ 28d", "f'c بعد 28 يومًا") },
  },
  {
    id: "t2", code: "T-26-04-3202",
    name: bi("Concrete Placement Temperature", "حرارة صب الخرسانة"),
    category: "concrete", standard: "SBC 304 / ASTM C1064", sampleId: "s2", projectId: "p1",
    testDate: "2026-04-27", technician: bi("T. Ahmed", "ف. أحمد"),
    status: "reviewed", passFail: "pass",
    primaryResult: { value: 32.4, unit: "°C", label: bi("Placement T", "حرارة الصب") },
  },
  {
    id: "t3", code: "T-26-04-3203",
    name: bi("Potable Water Analysis", "تحليل مياه الشرب"),
    category: "water", standard: "SASO 1494", sampleId: "s3", projectId: "p1",
    testDate: "2026-04-27", technician: bi("Eng. Sarah", "م. سارة"),
    status: "submitted", passFail: "pending",
  },
  {
    id: "t4", code: "T-26-04-3204",
    name: bi("California Bearing Ratio", "نسبة تحمل كاليفورنيا"),
    category: "soil", standard: "ASTM D1883", sampleId: "s4", projectId: "p2",
    testDate: "2026-04-26", technician: bi("Eng. Sarah", "م. سارة"),
    status: "approved", passFail: "pass",
    primaryResult: { value: 28.4, unit: "%", label: bi("CBR", "CBR") },
  },
  {
    id: "t5", code: "T-26-04-3205",
    name: bi("Sieve Analysis (Coarse Aggregate)", "تحليل المنخل (ركام خشن)"),
    category: "aggregate", standard: "ASTM C136", sampleId: "s5", projectId: "p3",
    testDate: "2026-04-25", technician: bi("T. Mahmoud", "ف. محمود"),
    status: "approved", passFail: "pass",
    primaryResult: { value: 6.78, unit: "FM", label: bi("Fineness modulus", "معامل النعومة") },
  },
  {
    id: "t6", code: "T-26-04-3206",
    name: bi("Marshall Stability & Flow", "ثبات وتدفق مارشال"),
    category: "asphalt", standard: "ASTM D6927 / SAES-Q-006", sampleId: "s6", projectId: "p3",
    testDate: "2026-04-27", technician: bi("T. Mahmoud", "ف. محمود"),
    status: "draft", passFail: "pending",
  },
  {
    id: "t7", code: "T-26-04-3207",
    name: bi("Tensile Test (Rebar Ø20)", "اختبار الشد (حديد Ø20)"),
    category: "steel", standard: "SASO SSA 2 / ASTM A615", sampleId: "s7", projectId: "p1",
    testDate: "2026-04-23", technician: bi("Eng. Fahad", "م. فهد"),
    status: "approved", passFail: "pass",
    primaryResult: { value: 612, unit: "MPa", label: bi("Yield strength", "إجهاد الخضوع") },
  },
  {
    id: "t8", code: "T-26-04-3208",
    name: bi("Compressive Strength of Concrete", "مقاومة الانضغاط للخرسانة"),
    category: "concrete", standard: "SASO GSO ASTM C39", sampleId: "s8", projectId: "p2",
    testDate: "2026-04-27", technician: bi("Eng. Sarah", "م. سارة"),
    status: "submitted", passFail: "fail",
    primaryResult: { value: 18.2, unit: "MPa", label: bi("f'c @ 7d", "f'c بعد 7 أيام") },
  },
  {
    id: "t9", code: "T-26-04-3209",
    name: bi("Cement Compressive Strength (Mortar)", "مقاومة انضغاط الإسمنت (مونة)"),
    category: "cement", standard: "ASTM C109 / SASO SSA 1", sampleId: "s9", projectId: "p4",
    testDate: "2026-04-25", technician: bi("T. Ali", "ف. علي"),
    status: "approved", passFail: "pass",
    primaryResult: { value: 34.6, unit: "MPa", label: bi("28d strength", "مقاومة 28 يومًا") },
  },
];

export const equipment: Equipment[] = [
  { id: "e1", code: "EQ-CMP-01", name: bi("Compression Machine 3000 kN",      "آلة انضغاط 3000 ك.ن"),
    manufacturer: "Forney",    model: "VFD F-505",   serial: "FV-9921",  calibrationDue: "2026-09-12", status: "active" },
  { id: "e2", code: "EQ-CMP-02", name: bi("Compression Machine 2000 kN",      "آلة انضغاط 2000 ك.ن"),
    manufacturer: "Controls",  model: "Automax Pro", serial: "CG-77321", calibrationDue: "2026-05-04", status: "calibration_due" },
  { id: "e3", code: "EQ-UTM-01", name: bi("Universal Testing Machine 600 kN", "آلة اختبار شاملة 600 ك.ن"),
    manufacturer: "Instron",   model: "8802",        serial: "INS-44521", calibrationDue: "2026-11-22", status: "active" },
  { id: "e4", code: "EQ-OVN-01", name: bi("Ignition Oven",                    "فرن الاشتعال"),
    manufacturer: "InstroTek", model: "NCAT 3200",   serial: "IT-2299",  calibrationDue: "2026-08-01", status: "active" },
  { id: "e5", code: "EQ-NCG-01", name: bi("Nuclear Density Gauge",            "مقياس كثافة نووي"),
    manufacturer: "Troxler",   model: "3440",        serial: "TX-77822", calibrationDue: "2026-04-29", status: "calibration_due" },
  { id: "e6", code: "EQ-PHM-01", name: bi("pH / TDS Meter",                   "جهاز قياس pH / المواد الذائبة"),
    manufacturer: "HACH",      model: "HQ40d",       serial: "HC-1187",  calibrationDue: "2026-07-19", status: "active" },
];

export function projectById(id: string) { return projects.find((p) => p.id === id); }
export function sampleById(id: string) { return samples.find((s) => s.id === id); }
export function testById(id: string) { return tests.find((t) => t.id === id); }
