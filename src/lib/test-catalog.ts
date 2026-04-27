export interface CatalogEntry {
  code: string;
  name: string;
  category: "concrete" | "soil" | "aggregate" | "asphalt" | "steel" | "cement" | "masonry" | "water";
  standard: string;
  saudiSpecific?: boolean;
  description: string;
  formRoute?: string;
}

const r = (code: string) => `/tests/new/${code}`;

export const catalog: CatalogEntry[] = [
  // Concrete (16)
  { code: "A1",  name: "Compressive Strength of Concrete", category: "concrete", standard: "SASO GSO ASTM C39 / C94", saudiSpecific: true, description: "150 mm cubes per SBC 304. Auto L/D correction for cylinders.", formRoute: r("A1") },
  { code: "A2",  name: "Concrete Slump Test", category: "concrete", standard: "ASTM C143", description: "Workability of fresh concrete using slump cone.", formRoute: r("A2") },
  { code: "A3",  name: "Concrete Air Content (Pressure)", category: "concrete", standard: "ASTM C231", saudiSpecific: true, description: "Air content in fresh concrete via pressure method.", formRoute: r("A3") },
  { code: "A4",  name: "Placement Temperature (SBC 304)", category: "concrete", standard: "SBC 304 / ASTM C1064", saudiSpecific: true, description: "Mandatory hot-weather placement monitoring. ≤ 35 °C.", formRoute: r("A4") },
  { code: "A5",  name: "Concrete Density / Unit Weight", category: "concrete", standard: "ASTM C138", description: "Density and yield of fresh concrete.", formRoute: r("A5") },
  { code: "A6",  name: "Concrete Setting Time", category: "concrete", standard: "ASTM C403", description: "Initial and final set by penetration resistance.", formRoute: r("A6") },
  { code: "A7",  name: "Maturity Method", category: "concrete", standard: "ASTM C1074", description: "In-place strength via temperature-time factor.", formRoute: r("A7") },
  { code: "A8",  name: "Chloride Content (Acid-Soluble)", category: "concrete", standard: "ASTM C1152 / SBC 304", saudiSpecific: true, description: "≤ 0.25% Cl by weight of cement (reinforced).", formRoute: r("A8") },
  { code: "A9",  name: "Sulfate Content (SO₃)", category: "concrete", standard: "ASTM C114 / SBC 304", saudiSpecific: true, description: "≤ 4% SO₃ by weight of cement.", formRoute: r("A9") },
  { code: "A10", name: "Splitting Tensile Strength", category: "concrete", standard: "ASTM C496", description: "Tensile strength via diametral splitting.", formRoute: r("A10") },
  { code: "A11", name: "Flexural Strength (MOR)", category: "concrete", standard: "ASTM C78", description: "Modulus of rupture by third-point loading.", formRoute: r("A11") },
  { code: "A12", name: "Modulus of Elasticity", category: "concrete", standard: "ASTM C469", description: "Static chord modulus and Poisson's ratio.", formRoute: r("A12") },
  { code: "A13", name: "Rapid Chloride Permeability", category: "concrete", standard: "ASTM C1202", saudiSpecific: true, description: "Charge passed in coulombs over 6h. Coastal exposure.", formRoute: r("A13") },
  { code: "A14", name: "Carbonation Depth", category: "concrete", standard: "SBC 304", saudiSpecific: true, description: "Phenolphthalein indicator. High-CO₂ environments.", formRoute: r("A14") },
  { code: "A15", name: "Concrete Resistivity", category: "concrete", standard: "AASHTO TP 95", description: "Electrical resistivity for corrosion risk.", formRoute: r("A15") },
  { code: "A16", name: "Pullout Test", category: "concrete", standard: "ASTM C900", description: "In-situ strength using pullout inserts.", formRoute: r("A16") },

  // Soil (14)
  { code: "B1",  name: "Soil Classification (USCS)", category: "soil", standard: "ASTM D2487", description: "Unified Soil Classification from Atterberg + gradation.", formRoute: r("B1") },
  { code: "B2",  name: "Visual Soil Classification", category: "soil", standard: "ASTM D2488", description: "Field classification by inspection.", formRoute: r("B2") },
  { code: "B3",  name: "Standard Proctor", category: "soil", standard: "ASTM D698", description: "Moisture-density compaction (standard effort).", formRoute: r("B3") },
  { code: "B4",  name: "Modified Proctor", category: "soil", standard: "ASTM D1557", description: "Moisture-density compaction (modified effort).", formRoute: r("B4") },
  { code: "B5",  name: "Liquid Limit (Casagrande)", category: "soil", standard: "ASTM D4318", description: "Plastic-to-liquid transition water content.", formRoute: r("B5") },
  { code: "B6",  name: "Plastic Limit", category: "soil", standard: "ASTM D4318", description: "Crumbling water content at 3.2 mm thread.", formRoute: r("B6") },
  { code: "B7",  name: "California Bearing Ratio (CBR)", category: "soil", standard: "ASTM D1883", description: "Penetration resistance for pavement design.", formRoute: r("B7") },
  { code: "B8",  name: "Field Density (Sand Cone)", category: "soil", standard: "ASTM D1556", description: "In-place density by sand replacement.", formRoute: r("B8") },
  { code: "B9",  name: "Field Density (Nuclear Gauge)", category: "soil", standard: "ASTM D6938", description: "In-place density and moisture by nuclear method.", formRoute: r("B9") },
  { code: "B10", name: "Permeability (Constant Head)", category: "soil", standard: "ASTM D2434", description: "k for granular soils.", formRoute: r("B10") },
  { code: "B11", name: "Permeability (Falling Head)", category: "soil", standard: "ASTM D5084", description: "k for fine-grained soils.", formRoute: r("B11") },
  { code: "B12", name: "Consolidation (Oedometer)", category: "soil", standard: "ASTM D2435", description: "Cc, Cr, preconsolidation pressure.", formRoute: r("B12") },
  { code: "B13", name: "Direct Shear Test", category: "soil", standard: "ASTM D3080", description: "Shear strength c, φ.", formRoute: r("B13") },
  { code: "B14", name: "Plate Load Test", category: "soil", standard: "ASTM D1196", description: "In-situ bearing capacity and ks.", formRoute: r("B14") },

  // Aggregate (12)
  { code: "C1",  name: "Sieve Analysis", category: "aggregate", standard: "ASTM C117 / C136", description: "Particle size distribution.", formRoute: r("C1") },
  { code: "C2",  name: "Clay Lumps & Friable Particles", category: "aggregate", standard: "ASTM C142 / 09-SAMSS-088", saudiSpecific: true, description: "≤ 5% coarse, ≤ 3% fine.", formRoute: r("C2") },
  { code: "C3",  name: "Los Angeles Abrasion", category: "aggregate", standard: "ASTM C131 / C535", saudiSpecific: true, description: "Resistance to abrasion. ≤ 40%.", formRoute: r("C3") },
  { code: "C4",  name: "Specific Gravity (Coarse)", category: "aggregate", standard: "ASTM C127", description: "Bulk, SSD, apparent SG and absorption.", formRoute: r("C4") },
  { code: "C5",  name: "Specific Gravity (Fine)", category: "aggregate", standard: "ASTM C128", description: "SG and absorption of fine aggregate.", formRoute: r("C5") },
  { code: "C6",  name: "Sulfate Soundness", category: "aggregate", standard: "ASTM C88", saudiSpecific: true, description: "Resistance to disintegration in sulfate.", formRoute: r("C6") },
  { code: "C7",  name: "Flat & Elongated Particles", category: "aggregate", standard: "ASTM D4791", description: "Particle shape limits.", formRoute: r("C7") },
  { code: "C8",  name: "Sand Equivalent", category: "aggregate", standard: "ASTM D2419", description: "Fines vs sand proportion.", formRoute: r("C8") },
  { code: "C9",  name: "Acid-Soluble Chlorides", category: "aggregate", standard: "ASTM C1152 / 09-SAMSS-088", saudiSpecific: true, description: "≤ 0.03% (coarse) / ≤ 0.06% (fine).", formRoute: r("C9") },
  { code: "C10", name: "Aggregate Crushing Value", category: "aggregate", standard: "BS 812-110", description: "Crushing resistance.", formRoute: r("C10") },
  { code: "C11", name: "Organic Impurities", category: "aggregate", standard: "ASTM C40", description: "Color comparison vs standard.", formRoute: r("C11") },
  { code: "C12", name: "Lightweight Pieces", category: "aggregate", standard: "ASTM C123", description: "≤ 0.5% by mass for structural.", formRoute: r("C12") },

  // Asphalt (10)
  { code: "D1",  name: "Marshall Stability & Flow", category: "asphalt", standard: "ASTM D6927 / SAES-Q-006", saudiSpecific: true, description: "Stability ≥ 8 kN (light) / 12 kN (heavy).", formRoute: r("D1") },
  { code: "D2",  name: "Asphalt Content (Ignition)", category: "asphalt", standard: "ASTM D6307", description: "Binder content via ignition oven.", formRoute: r("D2") },
  { code: "D3",  name: "Penetration", category: "asphalt", standard: "ASTM D5", description: "Binder consistency.", formRoute: r("D3") },
  { code: "D4",  name: "Softening Point", category: "asphalt", standard: "ASTM D36", description: "Ring-and-ball method.", formRoute: r("D4") },
  { code: "D5",  name: "Ductility", category: "asphalt", standard: "ASTM D113", description: "Elongation at break.", formRoute: r("D5") },
  { code: "D6",  name: "Specific Gravity (Binder)", category: "asphalt", standard: "ASTM D70", description: "Pycnometer method.", formRoute: r("D6") },
  { code: "D7",  name: "Theoretical Max SG (Rice)", category: "asphalt", standard: "ASTM D2041", description: "Gmm of mixture.", formRoute: r("D7") },
  { code: "D8",  name: "Bulk Specific Gravity (Compacted)", category: "asphalt", standard: "ASTM D2726", description: "Gmb of compacted specimens.", formRoute: r("D8") },
  { code: "D9",  name: "Air Voids Content", category: "asphalt", standard: "ASTM D3203", description: "Va in compacted mix (target 3-5%).", formRoute: r("D9") },
  { code: "D10", name: "Voids in Mineral Aggregate (VMA)", category: "asphalt", standard: "ASTM D6997", description: "VMA and VFA.", formRoute: r("D10") },

  // Steel (7)
  { code: "E1",  name: "Tensile Test (Rebar)", category: "steel", standard: "SASO SSA 2 / ASTM A615", saudiSpecific: true, description: "Yield, tensile, elongation per Saudi grades.", formRoute: r("E1") },
  { code: "E2",  name: "Bend Test", category: "steel", standard: "ASTM A615", description: "Ductility around specified pin.", formRoute: r("E2") },
  { code: "E3",  name: "Rebend Test", category: "steel", standard: "ASTM A615", description: "Reverse bend simulating field.", formRoute: r("E3") },
  { code: "E4",  name: "Epoxy Coating Thickness", category: "steel", standard: "ASTM A775", description: "Thickness, holidays, adhesion.", formRoute: r("E4") },
  { code: "E5",  name: "Chemical Composition", category: "steel", standard: "ASTM A615 / SASO SSA 2", description: "C, Mn, P, S, Si, Ceq.", formRoute: r("E5") },
  { code: "E6",  name: "Mechanical Coupler Test", category: "steel", standard: "ACI 318 / ICC-ES AC133", description: "Type 2 mechanical splice strength.", formRoute: r("E6") },
  { code: "E7",  name: "Weight per Meter", category: "steel", standard: "SASO SSA 2", description: "Mass tolerance check.", formRoute: r("E7") },

  // Cement (9)
  { code: "F1",  name: "Fineness (Blaine)", category: "cement", standard: "ASTM C204 / SASO SSA 1", saudiSpecific: true, description: "Specific surface ≥ 280 m²/kg (OPC).", formRoute: r("F1") },
  { code: "F2",  name: "Normal Consistency", category: "cement", standard: "ASTM C187", description: "Water for standard paste.", formRoute: r("F2") },
  { code: "F3",  name: "Initial & Final Set Time", category: "cement", standard: "ASTM C191", saudiSpecific: true, description: "Vicat needle. Initial ≥ 45 min.", formRoute: r("F3") },
  { code: "F4",  name: "Mortar Cube Compressive Strength", category: "cement", standard: "ASTM C109 / SASO SSA 1", saudiSpecific: true, description: "50 mm cubes at 3, 7, 28 days.", formRoute: r("F4") },
  { code: "F5",  name: "Soundness (Le Chatelier)", category: "cement", standard: "ASTM C151", description: "Expansion ≤ 10 mm.", formRoute: r("F5") },
  { code: "F6",  name: "Autoclave Expansion", category: "cement", standard: "ASTM C151", description: "Severe soundness check.", formRoute: r("F6") },
  { code: "F7",  name: "Air Content (Mortar)", category: "cement", standard: "ASTM C185", description: "Air content of mortar.", formRoute: r("F7") },
  { code: "F8",  name: "Cement Density", category: "cement", standard: "ASTM C188", description: "3.00-3.20 g/cm³ (OPC).", formRoute: r("F8") },
  { code: "F9",  name: "Heat of Hydration", category: "cement", standard: "ASTM C186", saudiSpecific: true, description: "Mass concrete. ≤ 250 J/g @ 7d.", formRoute: r("F9") },

  // Masonry (7)
  { code: "G1", name: "Compressive Strength (Blocks)", category: "masonry", standard: "ASTM C140", description: "Hollow / solid / cellular blocks.", formRoute: r("G1") },
  { code: "G2", name: "Block Absorption", category: "masonry", standard: "ASTM C140", description: "Water absorption.", formRoute: r("G2") },
  { code: "G3", name: "Block Moisture Content", category: "masonry", standard: "ASTM C140", description: "At delivery.", formRoute: r("G3") },
  { code: "G4", name: "Unit Weight", category: "masonry", standard: "ASTM C140", description: "Density of block units.", formRoute: r("G4") },
  { code: "G5", name: "Mortar Compressive Strength", category: "masonry", standard: "ASTM C109", description: "Type M/S/N/O.", formRoute: r("G5") },
  { code: "G6", name: "Grout Compressive Strength", category: "masonry", standard: "ASTM C1019", description: "Grout for masonry.", formRoute: r("G6") },
  { code: "G7", name: "Prism Test", category: "masonry", standard: "ASTM C1314", description: "Block + mortar assemblage.", formRoute: r("G7") },

  // Water (10)
  { code: "H1",  name: "Potable Water Analysis", category: "water", standard: "SASO 1494", saudiSpecific: true, description: "Full pH, TDS, metals, microbiology panel.", formRoute: r("H1") },
  { code: "H2",  name: "Concrete Mixing Water", category: "water", standard: "ASTM C1602 / SBC 304", saudiSpecific: true, description: "Cl, SO₄, TDS, organics for mixing.", formRoute: r("H2") },
  { code: "H3",  name: "Wastewater Effluent", category: "water", standard: "GSO 1914", saudiSpecific: true, description: "BOD, COD, TSS for discharge compliance.", formRoute: r("H3") },
  { code: "H4",  name: "Groundwater Monitoring", category: "water", standard: "MEWA Guidelines", description: "Dewatering quality.", formRoute: r("H4") },
  { code: "H5",  name: "Recreational Water", category: "water", standard: "SASO 1494 App.", description: "Pool / camp facility water.", formRoute: r("H5") },
  { code: "H6",  name: "Cooling Tower Water", category: "water", standard: "ASHRAE", description: "Includes Legionella check.", formRoute: r("H6") },
  { code: "H7",  name: "Irrigation Water", category: "water", standard: "FAO / MEWA", description: "EC, SAR, salinity hazard.", formRoute: r("H7") },
  { code: "H8",  name: "Construction Dewatering", category: "water", standard: "GSO 1914", description: "Pumped excavation water.", formRoute: r("H8") },
  { code: "H9",  name: "Bottled Water Quality", category: "water", standard: "SASO 1494", description: "On-site bottled water.", formRoute: r("H9") },
  { code: "H10", name: "Seawater Analysis", category: "water", standard: "ASTM C114 / SBC 304", saudiSpecific: true, description: "Marine concrete applications.", formRoute: r("H10") },
];

export const categoryMeta: Record<CatalogEntry["category"], { label: string; tone: string; ring: string; }> = {
  concrete: { label: "Concrete",  tone: "from-sky-500 to-blue-600",       ring: "ring-sky-500/20" },
  soil:     { label: "Soil",      tone: "from-amber-500 to-orange-600",   ring: "ring-amber-500/20" },
  aggregate:{ label: "Aggregate", tone: "from-stone-500 to-stone-700",    ring: "ring-stone-500/20" },
  asphalt:  { label: "Asphalt",   tone: "from-slate-700 to-slate-900",    ring: "ring-slate-500/20" },
  steel:    { label: "Steel",     tone: "from-zinc-500 to-zinc-700",      ring: "ring-zinc-500/20" },
  cement:   { label: "Cement",    tone: "from-neutral-400 to-neutral-600",ring: "ring-neutral-400/20" },
  masonry:  { label: "Masonry",   tone: "from-orange-600 to-rose-700",    ring: "ring-orange-500/20" },
  water:    { label: "Water",     tone: "from-cyan-500 to-teal-600",      ring: "ring-cyan-500/20" },
};
