// Locomotive Model & Builder Database
// Used in The Roundhouse upload form

export const BUILDERS = [
  { id: 'EMD', name: 'EMD (Electro-Motive)' },
  { id: 'GE', name: 'GE (General Electric)' },
  { id: 'Wabtec', name: 'Wabtec / GE Transportation' },
  { id: 'ALCO', name: 'ALCO (American Locomotive Co.)' },
  { id: 'Baldwin', name: 'Baldwin Locomotive Works' },
  { id: 'Lima', name: 'Lima Locomotive Works' },
  { id: 'Bombardier', name: 'Bombardier' },
  { id: 'Siemens', name: 'Siemens Mobility' },
  { id: 'MPI', name: 'MotivePower Industries' },
  { id: 'MLW', name: 'Montreal Locomotive Works' },
  { id: 'Other', name: 'Other / Unknown' },
];

export const LOCO_MODELS = [
  // ── EMD Modern ──
  { model: 'SD70ACe', builder: 'EMD', type: 'diesel', era: 'modern' },
  { model: 'SD70ACe-T4', builder: 'EMD', type: 'diesel', era: 'modern' },
  { model: 'SD70MAC', builder: 'EMD', type: 'diesel', era: 'modern' },
  { model: 'SD70M', builder: 'EMD', type: 'diesel', era: 'modern' },
  { model: 'SD70M-2', builder: 'EMD', type: 'diesel', era: 'modern' },
  { model: 'SD90MAC', builder: 'EMD', type: 'diesel', era: 'modern' },
  { model: 'SD80MAC', builder: 'EMD', type: 'diesel', era: 'modern' },

  // ── EMD Classic ──
  { model: 'SD60', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD60M', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD60I', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD50', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD50S', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD45', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD45-2', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD45T-2', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD40-2', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD40T-2', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD40N', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD40', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD38', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SD35', builder: 'EMD', type: 'diesel', era: 'classic' },

  // ── EMD GP Series ──
  { model: 'GP60', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP59', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP50', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP40-2', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP40', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP38-2', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP38', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP35', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP30', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP20', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP18', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP15-1', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'GP9', builder: 'EMD', type: 'diesel', era: 'vintage' },
  { model: 'GP7', builder: 'EMD', type: 'diesel', era: 'vintage' },

  // ── EMD Switchers & Other ──
  { model: 'SW1500', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'SW1200', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'MP15DC', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'MP15AC', builder: 'EMD', type: 'diesel', era: 'classic' },

  // ── EMD Cab Units ──
  { model: 'F40PH', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'F40PH-2', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'F40PH-3C', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'F59PH', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'F59PHI', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'F45', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'FP45', builder: 'EMD', type: 'diesel', era: 'classic' },
  { model: 'E8', builder: 'EMD', type: 'diesel', era: 'vintage' },
  { model: 'E9', builder: 'EMD', type: 'diesel', era: 'vintage' },
  { model: 'F3', builder: 'EMD', type: 'diesel', era: 'vintage' },
  { model: 'F7', builder: 'EMD', type: 'diesel', era: 'vintage' },
  { model: 'F9', builder: 'EMD', type: 'diesel', era: 'vintage' },
  { model: 'FP7', builder: 'EMD', type: 'diesel', era: 'vintage' },
  { model: 'FL9', builder: 'EMD', type: 'diesel', era: 'vintage' },
  { model: 'BL2', builder: 'EMD', type: 'diesel', era: 'vintage' },
  { model: 'DDA40X', builder: 'EMD', type: 'diesel', era: 'vintage' },

  // ── GE / Wabtec Modern ──
  { model: 'ET44AC', builder: 'Wabtec', type: 'diesel', era: 'modern' },
  { model: 'ET44C4', builder: 'Wabtec', type: 'diesel', era: 'modern' },
  { model: 'ES44AC', builder: 'GE', type: 'diesel', era: 'modern' },
  { model: 'ES44DC', builder: 'GE', type: 'diesel', era: 'modern' },
  { model: 'ES44C4', builder: 'GE', type: 'diesel', era: 'modern' },
  { model: 'ES40DC', builder: 'GE', type: 'diesel', era: 'modern' },
  { model: 'AC6000CW', builder: 'GE', type: 'diesel', era: 'modern' },
  { model: 'AC4400CW', builder: 'GE', type: 'diesel', era: 'modern' },

  // ── GE Dash Series ──
  { model: 'C44-9W (Dash 9)', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'C40-9W', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'C40-8W (Dash 8)', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'C40-8', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'B40-8W', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'B40-8', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'C39-8', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'C36-7', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'B36-7', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'C30-7', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'C30-7A', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'B30-7', builder: 'GE', type: 'diesel', era: 'classic' },
  { model: 'B23-7', builder: 'GE', type: 'diesel', era: 'classic' },

  // ── GE Universal Series ──
  { model: 'U36C', builder: 'GE', type: 'diesel', era: 'vintage' },
  { model: 'U33C', builder: 'GE', type: 'diesel', era: 'vintage' },
  { model: 'U30C', builder: 'GE', type: 'diesel', era: 'vintage' },
  { model: 'U30B', builder: 'GE', type: 'diesel', era: 'vintage' },
  { model: 'U25B', builder: 'GE', type: 'diesel', era: 'vintage' },
  { model: 'U23B', builder: 'GE', type: 'diesel', era: 'vintage' },

  // ── GE Passenger ──
  { model: 'P42DC (Genesis)', builder: 'GE', type: 'diesel', era: 'modern' },
  { model: 'P40DC', builder: 'GE', type: 'diesel', era: 'modern' },
  { model: 'P32-8WH', builder: 'GE', type: 'diesel', era: 'modern' },

  // ── ALCO ──
  { model: 'RS-3', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'RS-11', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'RS-32', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'C-420', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'C-424', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'C-425', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'C-628', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'C-630', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'C-636', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'PA-1', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'FA-1', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'FA-2', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'S-1', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'S-2', builder: 'ALCO', type: 'diesel', era: 'vintage' },
  { model: 'S-4', builder: 'ALCO', type: 'diesel', era: 'vintage' },

  // ── Siemens / Bombardier / Modern Passenger ──
  { model: 'ACS-64 (Sprinter)', builder: 'Siemens', type: 'electric', era: 'modern' },
  { model: 'SC-44 (Charger)', builder: 'Siemens', type: 'diesel', era: 'modern' },
  { model: 'ALC-42', builder: 'Siemens', type: 'diesel', era: 'modern' },
  { model: 'ALP-45DP', builder: 'Bombardier', type: 'dual-mode', era: 'modern' },
  { model: 'PL42AC', builder: 'GE', type: 'diesel', era: 'modern' },

  // ── Steam ──
  { model: 'Big Boy 4-8-8-4', builder: 'ALCO', type: 'steam', era: 'steam' },
  { model: 'Challenger 4-6-6-4', builder: 'ALCO', type: 'steam', era: 'steam' },
  { model: 'Berkshire 2-8-4', builder: 'Lima', type: 'steam', era: 'steam' },
  { model: 'Hudson 4-6-4', builder: 'ALCO', type: 'steam', era: 'steam' },
  { model: 'Pacific 4-6-2', builder: 'Various', type: 'steam', era: 'steam' },
  { model: 'Mikado 2-8-2', builder: 'Various', type: 'steam', era: 'steam' },
  { model: '2-6-0 Mogul', builder: 'Various', type: 'steam', era: 'steam' },
  { model: '4-4-0 American', builder: 'Various', type: 'steam', era: 'steam' },
  { model: '0-6-0 Switcher', builder: 'Various', type: 'steam', era: 'steam' },
  { model: '2-10-4 Texas', builder: 'Various', type: 'steam', era: 'steam' },

  // ── Other ──
  { model: 'Other / Unknown', builder: 'Other', type: 'other', era: 'other' },
];

// Grouped by builder for display
export function getModelsByBuilder() {
  const grouped = {};
  for (const b of BUILDERS) {
    const models = LOCO_MODELS.filter(m => m.builder === b.id);
    if (models.length) grouped[b.id] = { label: b.name, models };
  }
  return grouped;
}

// Search models
export function searchModels(query) {
  if (!query) return LOCO_MODELS;
  const q = query.toLowerCase();
  return LOCO_MODELS.filter(m =>
    m.model.toLowerCase().includes(q) ||
    m.builder.toLowerCase().includes(q) ||
    m.type.toLowerCase().includes(q)
  );
}
