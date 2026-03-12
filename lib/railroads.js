// Comprehensive Railroad Database — Active, Fallen Flags, Regional, Passenger
// Used across The Roundhouse, Sightings, and Heritage Detection

export const RAILROAD_CATEGORIES = [
  { id: 'class1', label: 'Class I Railroads' },
  { id: 'passenger', label: 'Passenger' },
  { id: 'fallen_class1', label: 'Fallen Flags — Former Class I' },
  { id: 'fallen_eastern', label: 'Fallen Flags — Eastern' },
  { id: 'fallen_western', label: 'Fallen Flags — Western' },
  { id: 'fallen_southern', label: 'Fallen Flags — Southern' },
  { id: 'fallen_midwest', label: 'Fallen Flags — Midwest' },
  { id: 'regional', label: 'Regional & Shortline' },
  { id: 'other', label: 'Other / Unknown' },
];

export const RAILROADS = [
  // ── ACTIVE CLASS I ──
  { mark: 'BNSF', name: 'BNSF Railway', category: 'class1', color: '#FF6600', textColor: '#fff' },
  { mark: 'CN', name: 'Canadian National', category: 'class1', color: '#E21836', textColor: '#fff' },
  { mark: 'CPKC', name: 'Canadian Pacific Kansas City', category: 'class1', color: '#E21836', textColor: '#fff' },
  { mark: 'CSX', name: 'CSX Transportation', category: 'class1', color: '#0033A0', textColor: '#fff' },
  { mark: 'KCS', name: 'Kansas City Southern', category: 'class1', color: '#006747', textColor: '#fff' },
  { mark: 'NS', name: 'Norfolk Southern', category: 'class1', color: '#1a1a1a', textColor: '#fff' },
  { mark: 'UP', name: 'Union Pacific', category: 'class1', color: '#FFD100', textColor: '#000' },

  // ── PASSENGER ──
  { mark: 'AMTK', name: 'Amtrak', category: 'passenger', color: '#1B3A6B', textColor: '#fff' },
  { mark: 'VIA', name: 'VIA Rail Canada', category: 'passenger', color: '#FFD100', textColor: '#000' },
  { mark: 'MBTA', name: 'MBTA Commuter Rail', category: 'passenger', color: '#8B4BB5', textColor: '#fff' },
  { mark: 'METX', name: 'Metra', category: 'passenger', color: '#005DAA', textColor: '#fff' },
  { mark: 'MNRR', name: 'Metro-North Railroad', category: 'passenger', color: '#0039A6', textColor: '#fff' },
  { mark: 'NJT', name: 'NJ Transit', category: 'passenger', color: '#003DA5', textColor: '#fff' },
  { mark: 'LIRR', name: 'Long Island Rail Road', category: 'passenger', color: '#0039A6', textColor: '#fff' },
  { mark: 'SEPTA', name: 'SEPTA Regional Rail', category: 'passenger', color: '#F37021', textColor: '#fff' },
  { mark: 'MARC', name: 'MARC Train', category: 'passenger', color: '#C8102E', textColor: '#fff' },
  { mark: 'TREX', name: 'Trinity Railway Express', category: 'passenger', color: '#1B3A6B', textColor: '#fff' },
  { mark: 'BBRX', name: 'Brightline', category: 'passenger', color: '#FFCC00', textColor: '#000' },
  { mark: 'CDTX', name: 'Caltrain', category: 'passenger', color: '#E31837', textColor: '#fff' },
  { mark: 'SOUNDER', name: 'Sounder', category: 'passenger', color: '#006937', textColor: '#fff' },

  // ── FALLEN FLAGS — FORMER CLASS I (merged into today's big 7) ──
  { mark: 'CR', name: 'Conrail (Consolidated Rail Corp)', category: 'fallen_class1', color: '#0055A4', textColor: '#fff', mergedInto: 'CSX/NS' },
  { mark: 'BN', name: 'Burlington Northern', category: 'fallen_class1', color: '#2E8B57', textColor: '#fff', mergedInto: 'BNSF' },
  { mark: 'ATSF', name: 'Atchison, Topeka & Santa Fe', category: 'fallen_class1', color: '#0033A0', textColor: '#fff', mergedInto: 'BNSF' },
  { mark: 'SP', name: 'Southern Pacific', category: 'fallen_class1', color: '#B22222', textColor: '#fff', mergedInto: 'UP' },
  { mark: 'MP', name: 'Missouri Pacific', category: 'fallen_class1', color: '#003DA5', textColor: '#fff', mergedInto: 'UP' },
  { mark: 'SOU', name: 'Southern Railway', category: 'fallen_class1', color: '#006400', textColor: '#fff', mergedInto: 'NS' },
  { mark: 'NW', name: 'Norfolk & Western', category: 'fallen_class1', color: '#1a1a1a', textColor: '#fff', mergedInto: 'NS' },
  { mark: 'PC', name: 'Penn Central', category: 'fallen_class1', color: '#2F4F4F', textColor: '#fff', mergedInto: 'CR' },
  { mark: 'ICG', name: 'Illinois Central Gulf', category: 'fallen_class1', color: '#2E8B57', textColor: '#fff', mergedInto: 'CN' },
  { mark: 'IC', name: 'Illinois Central', category: 'fallen_class1', color: '#2E8B57', textColor: '#fff', mergedInto: 'CN' },
  { mark: 'MILW', name: 'Milwaukee Road (CMStP&P)', category: 'fallen_class1', color: '#FF6600', textColor: '#fff', mergedInto: 'SOO/CP' },
  { mark: 'RI', name: 'Rock Island (CRI&P)', category: 'fallen_class1', color: '#B22222', textColor: '#fff', mergedInto: 'Various' },
  { mark: 'SLSF', name: 'Frisco (St. Louis–San Francisco)', category: 'fallen_class1', color: '#FF4500', textColor: '#fff', mergedInto: 'BN' },
  { mark: 'SOO', name: 'Soo Line', category: 'fallen_class1', color: '#B22222', textColor: '#fff', mergedInto: 'CP' },
  { mark: 'WM', name: 'Western Maryland', category: 'fallen_class1', color: '#1a1a1a', textColor: '#fff', mergedInto: 'CSX' },

  // ── FALLEN FLAGS — EASTERN ──
  { mark: 'PRR', name: 'Pennsylvania Railroad', category: 'fallen_eastern', color: '#8B0000', textColor: '#fff', mergedInto: 'PC → CR → CSX/NS' },
  { mark: 'NYC', name: 'New York Central', category: 'fallen_eastern', color: '#696969', textColor: '#fff', mergedInto: 'PC → CR → CSX/NS' },
  { mark: 'BO', name: 'Baltimore & Ohio', category: 'fallen_eastern', color: '#0033A0', textColor: '#fff', mergedInto: 'CSX' },
  { mark: 'CO', name: 'Chesapeake & Ohio', category: 'fallen_eastern', color: '#FFD100', textColor: '#000', mergedInto: 'CSX' },
  { mark: 'EL', name: 'Erie Lackawanna', category: 'fallen_eastern', color: '#8B0000', textColor: '#fff', mergedInto: 'CR → CSX/NS' },
  { mark: 'ERIE', name: 'Erie Railroad', category: 'fallen_eastern', color: '#8B4513', textColor: '#fff', mergedInto: 'EL → CR' },
  { mark: 'DLW', name: 'Lackawanna (DL&W)', category: 'fallen_eastern', color: '#8B0000', textColor: '#fff', mergedInto: 'EL → CR' },
  { mark: 'RDG', name: 'Reading Company', category: 'fallen_eastern', color: '#006400', textColor: '#fff', mergedInto: 'CR → CSX/NS' },
  { mark: 'LV', name: 'Lehigh Valley', category: 'fallen_eastern', color: '#8B0000', textColor: '#fff', mergedInto: 'CR → CSX/NS' },
  { mark: 'CNJ', name: 'Central Railroad of New Jersey', category: 'fallen_eastern', color: '#003DA5', textColor: '#fff', mergedInto: 'CR → CSX/NS' },
  { mark: 'NH', name: 'New Haven (NY, NH & Hartford)', category: 'fallen_eastern', color: '#FF4500', textColor: '#fff', mergedInto: 'PC → CR' },
  { mark: 'BM', name: 'Boston & Maine', category: 'fallen_eastern', color: '#0033A0', textColor: '#fff', mergedInto: 'Various' },
  { mark: 'DH', name: 'Delaware & Hudson', category: 'fallen_eastern', color: '#1a1a1a', textColor: '#fff', mergedInto: 'CP' },
  { mark: 'LHR', name: 'Lehigh & Hudson River', category: 'fallen_eastern', color: '#555', textColor: '#fff', mergedInto: 'CR' },
  { mark: 'PLE', name: 'Pittsburgh & Lake Erie', category: 'fallen_eastern', color: '#2F4F4F', textColor: '#fff', mergedInto: 'CSX' },
  { mark: 'LVRR', name: 'Lehigh & New England', category: 'fallen_eastern', color: '#555', textColor: '#fff', mergedInto: 'CR' },
  { mark: 'RUT', name: 'Rutland Railroad', category: 'fallen_eastern', color: '#006400', textColor: '#fff', mergedInto: 'Abandoned' },
  { mark: 'NYO', name: 'New York, Ontario & Western', category: 'fallen_eastern', color: '#555', textColor: '#fff', mergedInto: 'Abandoned' },

  // ── FALLEN FLAGS — WESTERN ──
  { mark: 'WP', name: 'Western Pacific', category: 'fallen_western', color: '#FF6600', textColor: '#fff', mergedInto: 'UP' },
  { mark: 'DRGW', name: 'Denver & Rio Grande Western', category: 'fallen_western', color: '#FFD100', textColor: '#000', mergedInto: 'UP' },
  { mark: 'CNW', name: 'Chicago & North Western', category: 'fallen_western', color: '#006400', textColor: '#fff', mergedInto: 'UP' },
  { mark: 'MKT', name: 'Katy (Missouri-Kansas-Texas)', category: 'fallen_western', color: '#006400', textColor: '#fff', mergedInto: 'UP' },
  { mark: 'GN', name: 'Great Northern', category: 'fallen_western', color: '#FF6600', textColor: '#fff', mergedInto: 'BN → BNSF' },
  { mark: 'NP', name: 'Northern Pacific', category: 'fallen_western', color: '#1a1a1a', textColor: '#fff', mergedInto: 'BN → BNSF' },
  { mark: 'CBQ', name: 'Chicago, Burlington & Quincy', category: 'fallen_western', color: '#1a1a1a', textColor: '#fff', mergedInto: 'BN → BNSF' },
  { mark: 'SPS', name: 'Spokane, Portland & Seattle', category: 'fallen_western', color: '#006400', textColor: '#fff', mergedInto: 'BN → BNSF' },
  { mark: 'SSW', name: 'Cotton Belt (St. Louis Southwestern)', category: 'fallen_western', color: '#B22222', textColor: '#fff', mergedInto: 'SP → UP' },
  { mark: 'SLSW', name: 'St. Louis Southwestern', category: 'fallen_western', color: '#B22222', textColor: '#fff', mergedInto: 'SP → UP' },
  { mark: 'TPWR', name: 'Texas & Pacific', category: 'fallen_western', color: '#003DA5', textColor: '#fff', mergedInto: 'MP → UP' },
  { mark: 'DSS', name: 'Duluth, South Shore & Atlantic', category: 'fallen_western', color: '#555', textColor: '#fff', mergedInto: 'SOO → CP' },

  // ── FALLEN FLAGS — SOUTHERN ──
  { mark: 'ACL', name: 'Atlantic Coast Line', category: 'fallen_southern', color: '#8B0000', textColor: '#fff', mergedInto: 'SCL → CSX' },
  { mark: 'SAL', name: 'Seaboard Air Line', category: 'fallen_southern', color: '#006400', textColor: '#fff', mergedInto: 'SCL → CSX' },
  { mark: 'SCL', name: 'Seaboard Coast Line', category: 'fallen_southern', color: '#8B0000', textColor: '#fff', mergedInto: 'CSX' },
  { mark: 'LN', name: 'Louisville & Nashville', category: 'fallen_southern', color: '#0033A0', textColor: '#fff', mergedInto: 'CSX' },
  { mark: 'CG', name: 'Central of Georgia', category: 'fallen_southern', color: '#006400', textColor: '#fff', mergedInto: 'SOU → NS' },
  { mark: 'VGN', name: 'Virginian Railway', category: 'fallen_southern', color: '#1a1a1a', textColor: '#fff', mergedInto: 'NW → NS' },
  { mark: 'CRR', name: 'Clinchfield Railroad', category: 'fallen_southern', color: '#8B4513', textColor: '#fff', mergedInto: 'CSX' },
  { mark: 'NCS', name: 'Nashville, Chattanooga & St. Louis', category: 'fallen_southern', color: '#555', textColor: '#fff', mergedInto: 'LN → CSX' },
  { mark: 'SA', name: 'Savannah & Atlanta', category: 'fallen_southern', color: '#555', textColor: '#fff', mergedInto: 'SOU → NS' },
  { mark: 'AGS', name: 'Atlanta & West Point / Georgia RR', category: 'fallen_southern', color: '#555', textColor: '#fff', mergedInto: 'CSX' },
  { mark: 'FEC', name: 'Florida East Coast', category: 'fallen_southern', color: '#FFD100', textColor: '#000', mergedInto: 'Active (Regional)' },
  { mark: 'GM&O', name: 'Gulf, Mobile & Ohio', category: 'fallen_southern', color: '#B22222', textColor: '#fff', mergedInto: 'ICG → CN' },
  { mark: 'MONON', name: 'Monon Route', category: 'fallen_southern', color: '#B22222', textColor: '#fff', mergedInto: 'LN → CSX' },
  { mark: 'INT', name: 'Interstate Railroad', category: 'fallen_southern', color: '#555', textColor: '#fff', mergedInto: 'NS' },

  // ── FALLEN FLAGS — MIDWEST ──
  { mark: 'WAB', name: 'Wabash Railroad', category: 'fallen_midwest', color: '#003DA5', textColor: '#fff', mergedInto: 'NW → NS' },
  { mark: 'NKP', name: 'Nickel Plate Road (NYC&StL)', category: 'fallen_midwest', color: '#1a1a1a', textColor: '#fff', mergedInto: 'NW → NS' },
  { mark: 'CGW', name: 'Chicago Great Western', category: 'fallen_midwest', color: '#B22222', textColor: '#fff', mergedInto: 'CNW → UP' },
  { mark: 'IT', name: 'Illinois Terminal', category: 'fallen_midwest', color: '#006400', textColor: '#fff', mergedInto: 'NW → NS' },
  { mark: 'MSTL', name: 'Minneapolis & St. Louis', category: 'fallen_midwest', color: '#B22222', textColor: '#fff', mergedInto: 'CNW → UP' },
  { mark: 'DSSA', name: 'Detroit, Toledo & Ironton', category: 'fallen_midwest', color: '#555', textColor: '#fff', mergedInto: 'GT → CN' },
  { mark: 'GT', name: 'Grand Trunk Western', category: 'fallen_midwest', color: '#006400', textColor: '#fff', mergedInto: 'CN' },
  { mark: 'AA', name: 'Ann Arbor Railroad', category: 'fallen_midwest', color: '#555', textColor: '#fff', mergedInto: 'Various' },
  { mark: 'TP&W', name: 'Toledo, Peoria & Western', category: 'fallen_midwest', color: '#555', textColor: '#fff', mergedInto: 'Various' },
  { mark: 'CBIG', name: 'Chicago & Illinois Midland', category: 'fallen_midwest', color: '#555', textColor: '#fff', mergedInto: 'Various' },
  { mark: 'PM', name: 'Pere Marquette', category: 'fallen_midwest', color: '#555', textColor: '#fff', mergedInto: 'CO → CSX' },

  // ── REGIONAL & SHORTLINE (notable ones) ──
  { mark: 'BPRR', name: 'Buffalo & Pittsburgh', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'FEC', name: 'Florida East Coast', category: 'regional', color: '#FFD100', textColor: '#000' },
  { mark: 'FWWR', name: 'Fort Worth & Western', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'GFRR', name: 'Georgia & Florida Railway', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'GNRR', name: 'Georgia Northeastern', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'IORY', name: 'Indiana & Ohio Railway', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'NYSW', name: 'New York, Susquehanna & Western', category: 'regional', color: '#FFD100', textColor: '#000' },
  { mark: 'OHC', name: 'Ohio Central', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'PAR', name: 'Pan Am Railways', category: 'regional', color: '#003DA5', textColor: '#fff' },
  { mark: 'PW', name: 'Providence & Worcester', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'RJCR', name: 'R.J. Corman', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'WE', name: 'Wheeling & Lake Erie', category: 'regional', color: '#FF6600', textColor: '#fff' },
  { mark: 'WSOR', name: 'Wisconsin & Southern', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'WATCO', name: 'Watco Companies', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'GWR', name: 'Genesee & Wyoming', category: 'regional', color: '#FFD100', textColor: '#000' },
  { mark: 'PRLX', name: 'Progress Rail Leasing', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'HLCX', name: 'Helm Financial', category: 'regional', color: '#555', textColor: '#fff' },
  { mark: 'CEFX', name: 'CIT Financial (CEFX)', category: 'regional', color: '#555', textColor: '#fff' },

  // ── OTHER ──
  { mark: 'OTHER', name: 'Other / Unknown', category: 'other', color: '#444', textColor: '#fff' },
];

// Helper: Get railroad by mark
export function getRailroad(mark) {
  return RAILROADS.find(r => r.mark === mark) || { mark, name: mark, category: 'other', color: '#444', textColor: '#fff' };
}

// Helper: Get railroad color
export function getRailroadColor(mark) {
  const rr = getRailroad(mark);
  return { bg: rr.color, text: rr.textColor, glow: `${rr.color}66` };
}

// Helper: Get all railroads grouped by category
export function getRailroadsByCategory() {
  const grouped = {};
  for (const cat of RAILROAD_CATEGORIES) {
    grouped[cat.id] = RAILROADS.filter(r => r.category === cat.id);
  }
  return grouped;
}

// Helper: Search railroads by name or mark
export function searchRailroads(query) {
  if (!query) return RAILROADS;
  const q = query.toLowerCase();
  return RAILROADS.filter(r =>
    r.mark.toLowerCase().includes(q) ||
    r.name.toLowerCase().includes(q) ||
    (r.mergedInto && r.mergedInto.toLowerCase().includes(q))
  );
}

// Simple list for backward compatibility (just the marks)
export const RAILROAD_MARKS = RAILROADS.map(r => r.mark);
