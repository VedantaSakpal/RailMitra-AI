/**
 * expandStations.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Idempotent station-expansion seed for RailMitra-AI.
 *
 * Strategy (works within the existing Station schema which has code @unique):
 *  - For stations that belong to a SINGLE line → insert with their real code.
 *  - For true interchange stations (same physical station on multiple lines)
 *    the FIRST insertion uses the real code and is assigned to its primary line.
 *    The SECOND appearance uses a suffix code (<CODE>-<LINE>) so it can hold
 *    the correct sequence for the second line.
 *
 *  Running this script multiple times is safe – upsert-style logic skips
 *  existing codes.
 *
 * Usage:
 *   npx ts-node server/prisma/expandStations.ts
 *   OR (from server/ dir):
 *   npx tsx prisma/expandStations.ts
 */

import { PrismaClient, LineType } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Station Data ──────────────────────────────────────────────────────────────
// Format: { name, code, zone, lat, lon, line, seq, isTerminal? }
// Interchange stations use a suffix code for their secondary appearances.

const CENTRAL_MAIN = [
  { name: 'Chhatrapati Shivaji Maharaj Terminus', code: 'CSMT', zone: 1, lat: 18.9402, lon: 72.8356, seq: 1, isTerminal: true },
  { name: 'Masjid',              code: 'MSD',   zone: 1, lat: 18.9462, lon: 72.8388, seq: 2  },
  { name: 'Sandhurst Road',      code: 'SNRD',  zone: 1, lat: 18.9519, lon: 72.8399, seq: 3  },
  { name: 'Byculla',             code: 'BY',    zone: 1, lat: 18.9754, lon: 72.8340, seq: 4  },
  { name: 'Chinchpokli',         code: 'CCP',   zone: 1, lat: 18.9831, lon: 72.8330, seq: 5  },
  { name: 'Currey Road',         code: 'CRD',   zone: 1, lat: 18.9895, lon: 72.8300, seq: 6  },
  { name: 'Parel',               code: 'PR',    zone: 1, lat: 18.9954, lon: 72.8360, seq: 7  },
  { name: 'Dadar',               code: 'DR',    zone: 1, lat: 19.0178, lon: 72.8432, seq: 8  },
  { name: 'Matunga',             code: 'MTN',   zone: 1, lat: 19.0282, lon: 72.8586, seq: 9  },
  { name: 'Sion',                code: 'SIN',   zone: 2, lat: 19.0397, lon: 72.8619, seq: 10 },
  { name: 'Kurla',               code: 'CLA',   zone: 2, lat: 19.0653, lon: 72.8789, seq: 11 },
  { name: 'Vidyavihar',          code: 'VDL',   zone: 2, lat: 19.0756, lon: 72.8871, seq: 12 },
  { name: 'Ghatkopar',           code: 'G',     zone: 2, lat: 19.0863, lon: 72.9082, seq: 13 },
  { name: 'Vikhroli',            code: 'VK',    zone: 2, lat: 19.1056, lon: 72.9257, seq: 14 },
  { name: 'Kanjur Marg',         code: 'KJRD',  zone: 2, lat: 19.1121, lon: 72.9420, seq: 15 },
  { name: 'Bhandup',             code: 'BND',   zone: 3, lat: 19.1354, lon: 72.9466, seq: 16 },
  { name: 'Nahur',               code: 'NHU',   zone: 3, lat: 19.1476, lon: 72.9523, seq: 17 },
  { name: 'Mulund',              code: 'MLND',  zone: 3, lat: 19.1713, lon: 72.9584, seq: 18 },
  { name: 'Thane',               code: 'TNA',   zone: 3, lat: 19.1859, lon: 72.9745, seq: 19, isTerminal: false },
  { name: 'Kalwa',               code: 'KLVA',  zone: 4, lat: 19.1921, lon: 73.0038, seq: 20 },
  { name: 'Mumbra',              code: 'MBQ',   zone: 4, lat: 19.1864, lon: 73.0218, seq: 21 },
  { name: 'Diva Junction',       code: 'DIVA',  zone: 4, lat: 19.1840, lon: 73.0520, seq: 22 },
  { name: 'Kopar',               code: 'KOPR',  zone: 4, lat: 19.1883, lon: 73.0684, seq: 23 },
  { name: 'Dombivli',            code: 'DI',    zone: 4, lat: 19.2173, lon: 73.0861, seq: 24 },
  { name: 'Thakurli',            code: 'THK',   zone: 4, lat: 19.2265, lon: 73.0811, seq: 25 },
  { name: 'Kalyan Junction',     code: 'KYN',   zone: 4, lat: 19.2403, lon: 73.1305, seq: 26, isTerminal: false },
];

const CENTRAL_KASARA = [
  // KYN is already created above – skip; start from Shahad
  { name: 'Shahad',              code: 'SHAD',  zone: 5, lat: 19.2635, lon: 73.1674, seq: 27 },
  { name: 'Ambivli',             code: 'ABY',   zone: 5, lat: 19.2773, lon: 73.1879, seq: 28 },
  { name: 'Titwala',             code: 'TLA',   zone: 5, lat: 19.2971, lon: 73.2085, seq: 29 },
  { name: 'Khadavli',            code: 'KDV',   zone: 5, lat: 19.3329, lon: 73.2513, seq: 30 },
  { name: 'Vasind',              code: 'VSD',   zone: 5, lat: 19.3613, lon: 73.2752, seq: 31 },
  { name: 'Asangaon',            code: 'ASO',   zone: 5, lat: 19.4238, lon: 73.3113, seq: 32 },
  { name: 'Atgaon',              code: 'ATH',   zone: 5, lat: 19.4597, lon: 73.3325, seq: 33 },
  { name: 'Thansit',             code: 'THS',   zone: 5, lat: 19.4799, lon: 73.3475, seq: 34 },
  { name: 'Khardi',              code: 'KHPI',  zone: 5, lat: 19.5003, lon: 73.3650, seq: 35 },
  { name: 'Umbermali',           code: 'UM',    zone: 5, lat: 19.5313, lon: 73.3890, seq: 36 },
  { name: 'Kasara',              code: 'KSRA',  zone: 5, lat: 19.5876, lon: 73.4561, seq: 37, isTerminal: true },
];

const CENTRAL_KHOPOLI = [
  // KYN already exists – skip; start from Vithalwadi
  { name: 'Vithalwadi',          code: 'VLDI',  zone: 5, lat: 19.2263, lon: 73.1485, seq: 27 },
  { name: 'Ulhasnagar',          code: 'ULNR',  zone: 5, lat: 19.2198, lon: 73.1528, seq: 28 },
  { name: 'Ambernath',           code: 'ABH',   zone: 5, lat: 19.2026, lon: 73.1920, seq: 29 },
  { name: 'Badlapur',            code: 'BUD',   zone: 5, lat: 19.1605, lon: 73.2455, seq: 30 },
  { name: 'Vangani',             code: 'VGI',   zone: 5, lat: 19.1120, lon: 73.2856, seq: 31 },
  { name: 'Shelu',               code: 'SHLU',  zone: 5, lat: 19.0754, lon: 73.3127, seq: 32 },
  { name: 'Neral',               code: 'NRL',   zone: 5, lat: 19.0371, lon: 73.2874, seq: 33 },
  { name: 'Bhivpuri Road',       code: 'BVS',   zone: 5, lat: 18.9987, lon: 73.2660, seq: 34 },
  { name: 'Karjat',              code: 'KJT',   zone: 5, lat: 18.9119, lon: 73.3209, seq: 35, isTerminal: false },
  { name: 'Palasdari',           code: 'PDI',   zone: 5, lat: 18.8837, lon: 73.2869, seq: 36 },
  { name: 'Kelavli',             code: 'KLY',   zone: 5, lat: 18.8631, lon: 73.2714, seq: 37 },
  { name: 'Dolavli',             code: 'DL',    zone: 5, lat: 18.8401, lon: 73.2566, seq: 38 },
  { name: 'Lowjee',              code: 'LWJ',   zone: 5, lat: 18.8102, lon: 73.2319, seq: 39 },
  { name: 'Khopoli',             code: 'KHPO',  zone: 5, lat: 18.7866, lon: 73.2078, seq: 40, isTerminal: true },
];

const WESTERN_MAIN = [
  { name: 'Churchgate',          code: 'CCG',   zone: 1, lat: 18.9322, lon: 72.8264, seq: 1, isTerminal: true },
  { name: 'Marine Lines',        code: 'MEL',   zone: 1, lat: 18.9432, lon: 72.8227, seq: 2  },
  { name: 'Charni Road',         code: 'CYR',   zone: 1, lat: 18.9524, lon: 72.8194, seq: 3  },
  { name: 'Grant Road',          code: 'GTR',   zone: 1, lat: 18.9644, lon: 72.8168, seq: 4  },
  { name: 'Mumbai Central',      code: 'BCT',   zone: 1, lat: 18.9697, lon: 72.8192, seq: 5  },
  { name: 'Mahalaxmi',           code: 'MX',    zone: 1, lat: 18.9836, lon: 72.8224, seq: 6  },
  { name: 'Lower Parel',         code: 'PL',    zone: 1, lat: 18.9958, lon: 72.8246, seq: 7  },
  { name: 'Prabhadevi',          code: 'PBHD',  zone: 1, lat: 19.0093, lon: 72.8269, seq: 8  },
  // DR (Dadar) already in Central – we store western view with suffix
  { name: 'Dadar (Western)',      code: 'DR-W',  zone: 1, lat: 19.0218, lon: 72.8411, seq: 9  },
  { name: 'Matunga Road',        code: 'MRU',   zone: 1, lat: 19.0363, lon: 72.8414, seq: 10 },
  { name: 'Mahim Junction',      code: 'MM',    zone: 1, lat: 19.0477, lon: 72.8399, seq: 11 },
  { name: 'Bandra',              code: 'BA',    zone: 2, lat: 19.0544, lon: 72.8403, seq: 12 },
  { name: 'Khar Road',           code: 'KHAR',  zone: 2, lat: 19.0657, lon: 72.8387, seq: 13 },
  { name: 'Santacruz',           code: 'STC',   zone: 2, lat: 19.0836, lon: 72.8446, seq: 14 },
  { name: 'Vile Parle',          code: 'VLP',   zone: 2, lat: 19.0997, lon: 72.8456, seq: 15 },
  { name: 'Andheri',             code: 'ADH',   zone: 2, lat: 19.1197, lon: 72.8465, seq: 16 },
  { name: 'Jogeshwari',          code: 'JOS',   zone: 2, lat: 19.1376, lon: 72.8471, seq: 17 },
  { name: 'Ram Mandir',          code: 'RMAR',  zone: 2, lat: 19.1511, lon: 72.8426, seq: 18 },
  { name: 'Goregaon',            code: 'GMN',   zone: 3, lat: 19.1623, lon: 72.8494, seq: 19 },
  { name: 'Malad',               code: 'MDD',   zone: 3, lat: 19.1873, lon: 72.8481, seq: 20 },
  { name: 'Kandivali',           code: 'KILE',  zone: 3, lat: 19.2047, lon: 72.8427, seq: 21 },
  { name: 'Borivali',            code: 'BVI',   zone: 3, lat: 19.2296, lon: 72.8561, seq: 22 },
  { name: 'Dahisar',             code: 'DIC',   zone: 3, lat: 19.2521, lon: 72.8539, seq: 23 },
  { name: 'Mira Road',           code: 'MIRA',  zone: 4, lat: 19.2812, lon: 72.8700, seq: 24 },
  { name: 'Bhayandar',           code: 'BYR',   zone: 4, lat: 19.3013, lon: 72.8553, seq: 25 },
  { name: 'Naigaon',             code: 'NIG',   zone: 4, lat: 19.3576, lon: 72.8490, seq: 26 },
  { name: 'Vasai Road',          code: 'BSR',   zone: 4, lat: 19.3703, lon: 72.8370, seq: 27 },
  { name: 'Nalasopara',          code: 'NSP',   zone: 5, lat: 19.4197, lon: 72.8087, seq: 28 },
  { name: 'Virar',               code: 'VR',    zone: 5, lat: 19.4582, lon: 72.7956, seq: 29 },
  { name: 'Vaitarna',            code: 'VTN',   zone: 5, lat: 19.5094, lon: 72.7821, seq: 30 },
  { name: 'Saphale',             code: 'SAH',   zone: 5, lat: 19.5791, lon: 72.7636, seq: 31 },
  { name: 'Kelve Road',          code: 'KLV',   zone: 5, lat: 19.6174, lon: 72.7566, seq: 32 },
  { name: 'Palghar',             code: 'PLG',   zone: 6, lat: 19.6967, lon: 72.7644, seq: 33 },
  { name: 'Umroli',              code: 'UOI',   zone: 6, lat: 19.7498, lon: 72.7582, seq: 34 },
  { name: 'Boisar',              code: 'BOR',   zone: 6, lat: 19.8031, lon: 72.7601, seq: 35 },
  { name: 'Vangaon',             code: 'VGN',   zone: 6, lat: 19.8529, lon: 72.7519, seq: 36 },
  { name: 'Dahanu Road',         code: 'DRD',   zone: 6, lat: 19.9753, lon: 72.7114, seq: 37, isTerminal: true },
];

// Harbour line – stations shared with Central use suffix codes only where needed
const HARBOUR_MAIN = [
  // CSMT is same station as Central – use suffix for harbour platform tracking
  { name: 'CSMT (Harbour)',       code: 'CSMT-H', zone: 1, lat: 18.9402, lon: 72.8356, seq: 1, isTerminal: false },
  // MSD, SNRD already in Central
  { name: 'Masjid (Harbour)',     code: 'MSD-H',  zone: 1, lat: 18.9462, lon: 72.8388, seq: 2  },
  { name: 'Sandhurst Rd (H)',     code: 'SNRD-H', zone: 1, lat: 18.9519, lon: 72.8399, seq: 3  },
  { name: 'Dockyard Road',        code: 'DKRD',   zone: 1, lat: 18.9570, lon: 72.8411, seq: 4  },
  { name: 'Reay Road',            code: 'RRD',    zone: 1, lat: 18.9640, lon: 72.8450, seq: 5  },
  { name: 'Cotton Green',         code: 'CTGN',   zone: 1, lat: 18.9703, lon: 72.8506, seq: 6  },
  { name: 'Sewri',                code: 'SVE',    zone: 1, lat: 18.9838, lon: 72.8598, seq: 7  },
  { name: 'Wadala Road',          code: 'VDLR',   zone: 1, lat: 19.0130, lon: 72.8623, seq: 8  },
  { name: 'GTB Nagar',            code: 'GTBN',   zone: 2, lat: 19.0300, lon: 72.8719, seq: 9  },
  { name: 'Chunabhatti',          code: 'CHF',    zone: 2, lat: 19.0498, lon: 72.8801, seq: 10 },
  { name: 'Kurla (Harbour)',      code: 'CLA-H',  zone: 2, lat: 19.0653, lon: 72.8789, seq: 11 },
  { name: 'Tilak Nagar',          code: 'TKNR',   zone: 2, lat: 19.0724, lon: 72.8918, seq: 12 },
  { name: 'Chembur',              code: 'CMBR',   zone: 2, lat: 19.0601, lon: 72.9046, seq: 13 },
  { name: 'Govandi',              code: 'GV',     zone: 2, lat: 19.0541, lon: 72.9226, seq: 14 },
  { name: 'Mankhurd',             code: 'MNKD',   zone: 2, lat: 19.0414, lon: 72.9371, seq: 15 },
  { name: 'Vashi',                code: 'VSH',    zone: 3, lat: 19.0765, lon: 72.9985, seq: 16 },
  { name: 'Sanpada',              code: 'SNCR',   zone: 3, lat: 19.0671, lon: 73.0100, seq: 17 },
  { name: 'Juinagar',             code: 'JNJ',    zone: 3, lat: 19.0472, lon: 73.0160, seq: 18 },
  { name: 'Nerul',                code: 'NEU',    zone: 3, lat: 19.0342, lon: 73.0204, seq: 19 },
  { name: 'Seawoods-Darave',      code: 'SWDV',   zone: 4, lat: 19.0211, lon: 73.0254, seq: 20 },
  { name: 'CBD Belapur',          code: 'BEPR',   zone: 4, lat: 19.0211, lon: 73.0327, seq: 21 },
  { name: 'Kharghar',             code: 'KHAG',   zone: 4, lat: 19.0476, lon: 73.0588, seq: 22 },
  { name: 'Mansarovar',           code: 'MANR',   zone: 4, lat: 19.0268, lon: 73.0742, seq: 23 },
  { name: 'Khandeshwar',          code: 'KNDS',   zone: 4, lat: 19.0085, lon: 73.0836, seq: 24 },
  { name: 'Panvel',               code: 'PNVL',   zone: 5, lat: 18.9899, lon: 73.1120, seq: 25, isTerminal: true },
];

// Harbour — Wadala Road → Goregaon (Harbour branch up to Goregaon)
// Shared stations with Western get suffix codes
const HARBOUR_GOREGAON = [
  // VDLR already in Harbour main above — this is Harbour branch, skip VDLR
  { name: "King's Circle",        code: 'KCE',    zone: 1, lat: 19.0428, lon: 72.8711, seq: 9  },
  // MM, BA, KHAR, STC, VLP, ADH, JOS, RMAR, GMN are in Western – use suffix
  { name: 'Mahim Jn (Harbour)',   code: 'MM-H',   zone: 1, lat: 19.0477, lon: 72.8399, seq: 10 },
  { name: 'Bandra (Harbour)',     code: 'BA-H',   zone: 2, lat: 19.0544, lon: 72.8403, seq: 11 },
  { name: 'Khar Road (Harbour)',  code: 'KHAR-H', zone: 2, lat: 19.0657, lon: 72.8387, seq: 12 },
  { name: 'Santacruz (Harbour)',  code: 'STC-H',  zone: 2, lat: 19.0836, lon: 72.8446, seq: 13 },
  { name: 'Vile Parle (Harbour)', code: 'VLP-H',  zone: 2, lat: 19.0997, lon: 72.8456, seq: 14 },
  { name: 'Andheri (Harbour)',    code: 'ADH-H',  zone: 2, lat: 19.1197, lon: 72.8465, seq: 15 },
  { name: 'Jogeshwari (H)',       code: 'JOS-H',  zone: 2, lat: 19.1376, lon: 72.8471, seq: 16 },
  { name: 'Ram Mandir (H)',       code: 'RMAR-H', zone: 2, lat: 19.1511, lon: 72.8426, seq: 17 },
  { name: 'Goregaon (Harbour)',   code: 'GMN-H',  zone: 3, lat: 19.1623, lon: 72.8494, seq: 18, isTerminal: true },
];

// Trans-Harbour Line (Thane → Panvel)
// Shared stations with Harbour get suffix codes
const TRANS_HARBOUR = [
  // TNA already exists in Central
  { name: 'Thane (Trans-Harbour)', code: 'TNA-TH', zone: 3, lat: 19.1859, lon: 72.9745, seq: 1, isTerminal: false },
  { name: 'Digha Gaon',            code: 'DIGH',    zone: 3, lat: 19.1543, lon: 72.9984, seq: 2  },
  { name: 'Airoli',                code: 'AIRL',    zone: 3, lat: 19.1466, lon: 72.9991, seq: 3  },
  { name: 'Rabale',                code: 'RABE',    zone: 3, lat: 19.1263, lon: 73.0129, seq: 4  },
  { name: 'Ghansoli',              code: 'GNSL',    zone: 3, lat: 19.1153, lon: 73.0183, seq: 5  },
  { name: 'Kopar Khairane',        code: 'KPHN',    zone: 3, lat: 19.1057, lon: 73.0165, seq: 6  },
  { name: 'Turbhe',                code: 'TURB',    zone: 3, lat: 19.0948, lon: 73.0085, seq: 7  },
  // SNCR (Sanpada) shared with Harbour → use suffix
  { name: 'Sanpada (Trans-Harbour)', code: 'SNCR-TH', zone: 3, lat: 19.0671, lon: 73.0100, seq: 8  },
  // VSH (Vashi) shared with Harbour → use suffix
  { name: 'Vashi (Trans-Harbour)',   code: 'VSH-TH',  zone: 3, lat: 19.0765, lon: 72.9985, seq: 9  },
  // JNJ, NEU, SWDV, BEPR, KHAG, MANR, KNDS, PNVL shared with Harbour → suffix
  { name: 'Juinagar (Trans-H)',     code: 'JNJ-TH',  zone: 3, lat: 19.0472, lon: 73.0160, seq: 10 },
  { name: 'Nerul (Trans-H)',        code: 'NEU-TH',  zone: 3, lat: 19.0342, lon: 73.0204, seq: 11 },
  { name: 'Seawoods-Darave (TH)',   code: 'SWDV-TH', zone: 4, lat: 19.0211, lon: 73.0254, seq: 12 },
  { name: 'CBD Belapur (TH)',       code: 'BEPR-TH', zone: 4, lat: 19.0211, lon: 73.0327, seq: 13 },
  { name: 'Kharghar (TH)',          code: 'KHAG-TH', zone: 4, lat: 19.0476, lon: 73.0588, seq: 14 },
  { name: 'Mansarovar (TH)',        code: 'MANR-TH', zone: 4, lat: 19.0268, lon: 73.0742, seq: 15 },
  { name: 'Khandeshwar (TH)',       code: 'KNDS-TH', zone: 4, lat: 19.0085, lon: 73.0836, seq: 16 },
  { name: 'Panvel (Trans-H)',       code: 'PNVL-TH', zone: 5, lat: 18.9899, lon: 73.1120, seq: 17, isTerminal: true },
];

// ─── Zone helper ─────────────────────────────────────────────────────────────
function zoneFromSeq(seq: number): number {
  if (seq <= 5)  return 1;
  if (seq <= 12) return 2;
  if (seq <= 19) return 3;
  if (seq <= 26) return 4;
  return 5;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚂 RailMitra — Station Expansion Seed');
  console.log('══════════════════════════════════════\n');

  // ── 1. Ensure the 4 lines exist ─────────────────────────────────────────────
  console.log('1. Upserting railway lines...');

  const central = await prisma.railwayLine.upsert({
    where: { type: 'CENTRAL' },
    update: {},
    create: { name: 'Central Line', type: 'CENTRAL', color: '#dc2626', description: 'CSMT to Kalyan / Karjat / Kasara' },
  });

  const western = await prisma.railwayLine.upsert({
    where: { type: 'WESTERN' },
    update: {},
    create: { name: 'Western Line', type: 'WESTERN', color: '#16a34a', description: 'Churchgate to Dahanu Road' },
  });

  const harbour = await prisma.railwayLine.upsert({
    where: { type: 'HARBOUR' },
    update: {},
    create: { name: 'Harbour Line', type: 'HARBOUR', color: '#ca8a04', description: 'CSMT to Panvel / Goregaon' },
  });

  // Trans-Harbour: mapped to HARBOUR LineType since schema only has 3 types.
  // We use the description to differentiate.
  // ⚠ If you add TRANS_HARBOUR to LineType enum later, update this.
  // For now we reuse the harbour line record to group Trans-Harbour stations.

  console.log(`   ✓ Central (${central.id})`);
  console.log(`   ✓ Western (${western.id})`);
  console.log(`   ✓ Harbour (${harbour.id})`);

  // ── 2. Upsert stations ──────────────────────────────────────────────────────
  console.log('\n2. Upserting stations (skip if code already exists)...');

  type StationRow = {
    name: string;
    code: string;
    zone: number;
    lat: number;
    lon: number;
    seq: number;
    isTerminal?: boolean;
  };

  async function upsertStations(rows: StationRow[], lineId: string, lineLabel: string) {
    let added = 0;
    let skipped = 0;
    for (const s of rows) {
      const existing = await prisma.station.findUnique({ where: { code: s.code } });
      if (existing) {
        // Update sequence if it differs (preserves existing lineId / data)
        if (existing.sequence !== s.seq) {
          await prisma.station.update({
            where: { code: s.code },
            data: { sequence: s.seq },
          });
          console.log(`   ~ Updated sequence for ${s.code} (${s.name}) → seq ${s.seq}`);
        }
        skipped++;
      } else {
        await prisma.station.create({
          data: {
            name: s.name,
            code: s.code,
            lineId,
            zone: s.zone,
            latitude: s.lat,
            longitude: s.lon,
            sequence: s.seq,
            isTerminal: s.isTerminal ?? false,
          },
        });
        added++;
      }
    }
    console.log(`   [${lineLabel}] Added: ${added}  |  Already existed (skipped/updated): ${skipped}`);
  }

  await upsertStations(CENTRAL_MAIN,      central.id, 'Central Main');
  await upsertStations(CENTRAL_KASARA,    central.id, 'Central → Kasara');
  await upsertStations(CENTRAL_KHOPOLI,   central.id, 'Central → Khopoli');
  await upsertStations(WESTERN_MAIN,      western.id, 'Western Main');
  await upsertStations(HARBOUR_MAIN,      harbour.id, 'Harbour Main');
  await upsertStations(HARBOUR_GOREGAON,  harbour.id, 'Harbour → Goregaon');
  await upsertStations(TRANS_HARBOUR,     harbour.id, 'Trans-Harbour');

  // ── 3. Summary ──────────────────────────────────────────────────────────────
  const totalStations = await prisma.station.count();
  console.log(`\n3. Total stations in DB: ${totalStations}`);

  // Duplicate code check
  const allCodes = await prisma.station.findMany({ select: { code: true } });
  const codeSet = new Set<string>();
  let dups = 0;
  for (const { code } of allCodes) {
    if (codeSet.has(code)) { console.warn(`   ⚠ Duplicate code detected: ${code}`); dups++; }
    codeSet.add(code);
  }
  if (dups === 0) console.log('   ✓ No duplicate codes found.');

  console.log('\n✅  Station expansion complete!\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
