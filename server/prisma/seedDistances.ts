import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper to parse markdown table strings
// Note: We're doing a basic parser here, but we can also hardcode the distances based on the user's file.
// I'll hardcode them since it's a fixed list and parsing markdown tables robustly is prone to edge cases.
const DISTANCE_DATA = [
  // 1. CENTRAL - MAIN
  { line: "CENTRAL", from: "CSMT", to: "MSD", dist: 1 },
  { line: "CENTRAL", from: "MSD", to: "SNRD", dist: 1 },
  { line: "CENTRAL", from: "SNRD", to: "BY", dist: 2 },
  { line: "CENTRAL", from: "BY", to: "CCP", dist: 1 },
  { line: "CENTRAL", from: "CCP", to: "CRD", dist: 1 },
  { line: "CENTRAL", from: "CRD", to: "PR", dist: 2 },
  { line: "CENTRAL", from: "PR", to: "DR", dist: 1 },
  { line: "CENTRAL", from: "DR", to: "MTN", dist: 1 },
  { line: "CENTRAL", from: "MTN", to: "SIN", dist: 3 },
  { line: "CENTRAL", from: "SIN", to: "CLA", dist: 3 },
  { line: "CENTRAL", from: "CLA", to: "VDL", dist: 2 },
  { line: "CENTRAL", from: "VDL", to: "G", dist: 1 },
  { line: "CENTRAL", from: "G", to: "VK", dist: 4 },
  { line: "CENTRAL", from: "VK", to: "KJRD", dist: 2 },
  { line: "CENTRAL", from: "KJRD", to: "BND", dist: 2 },
  { line: "CENTRAL", from: "BND", to: "NHU", dist: 1 },
  { line: "CENTRAL", from: "NHU", to: "MLND", dist: 3 },
  { line: "CENTRAL", from: "MLND", to: "TNA", dist: 2 },
  { line: "CENTRAL", from: "TNA", to: "KLVA", dist: 3 },
  { line: "CENTRAL", from: "KLVA", to: "MBQ", dist: 4 },
  { line: "CENTRAL", from: "MBQ", to: "DIVA", dist: 3 },
  { line: "CENTRAL", from: "DIVA", to: "KOPR", dist: 4 },
  { line: "CENTRAL", from: "KOPR", to: "DI", dist: 1 },
  { line: "CENTRAL", from: "DI", to: "THK", dist: 2 },
  { line: "CENTRAL", from: "THK", to: "KYN", dist: 4 },

  // 2. CENTRAL - KASARA
  { line: "CENTRAL", from: "KYN", to: "SHAD", dist: 3 },
  { line: "CENTRAL", from: "SHAD", to: "ABY", dist: 4 },
  { line: "CENTRAL", from: "ABY", to: "TLA", dist: 4 },
  { line: "CENTRAL", from: "TLA", to: "KDV", dist: 8 },
  { line: "CENTRAL", from: "KDV", to: "VSD", dist: 8 },
  { line: "CENTRAL", from: "VSD", to: "ASO", dist: 6 },
  { line: "CENTRAL", from: "ASO", to: "ATH", dist: 9 },
  { line: "CENTRAL", from: "ATH", to: "THS", dist: 6 },
  { line: "CENTRAL", from: "THS", to: "KHPI", dist: 6 },
  { line: "CENTRAL", from: "KHPI", to: "UM", dist: 7 },
  { line: "CENTRAL", from: "UM", to: "KSRA", dist: 7 },

  // 3. CENTRAL - KHOPOLI
  { line: "CENTRAL", from: "KYN", to: "VLDI", dist: 2 },
  { line: "CENTRAL", from: "VLDI", to: "ULNR", dist: 2 },
  { line: "CENTRAL", from: "ULNR", to: "ABH", dist: 2 },
  { line: "CENTRAL", from: "ABH", to: "BUD", dist: 8 },
  { line: "CENTRAL", from: "BUD", to: "VGI", dist: 11 },
  { line: "CENTRAL", from: "VGI", to: "SHLU", dist: 4 },
  { line: "CENTRAL", from: "SHLU", to: "NRL", dist: 4 },
  { line: "CENTRAL", from: "NRL", to: "BVS", dist: 6 },
  { line: "CENTRAL", from: "BVS", to: "KJT", dist: 7 },
  { line: "CENTRAL", from: "KJT", to: "PDI", dist: 3 },
  { line: "CENTRAL", from: "PDI", to: "KLY", dist: 5 },
  { line: "CENTRAL", from: "KLY", to: "DL", dist: 1 },
  { line: "CENTRAL", from: "DL", to: "LWJ", dist: 3 },
  { line: "CENTRAL", from: "LWJ", to: "KHPO", dist: 2 },

  // 4. WESTERN
  { line: "WESTERN", from: "CCG", to: "MEL", dist: 1 },
  { line: "WESTERN", from: "MEL", to: "CYR", dist: 1 },
  { line: "WESTERN", from: "CYR", to: "GTR", dist: 2 },
  { line: "WESTERN", from: "GTR", to: "BCT", dist: 1 },
  { line: "WESTERN", from: "BCT", to: "MX", dist: 1 },
  { line: "WESTERN", from: "MX", to: "PL", dist: 2 },
  { line: "WESTERN", from: "PL", to: "PBHD", dist: 1 },
  { line: "WESTERN", from: "PBHD", to: "DR-W", dist: 2 },
  { line: "WESTERN", from: "DR-W", to: "MRU", dist: 1 },
  { line: "WESTERN", from: "MRU", to: "MM", dist: 1 },
  { line: "WESTERN", from: "MM", to: "BA", dist: 2 },
  { line: "WESTERN", from: "BA", to: "KHAR", dist: 1 },
  { line: "WESTERN", from: "KHAR", to: "STC", dist: 2 },
  { line: "WESTERN", from: "STC", to: "VLP", dist: 2 },
  { line: "WESTERN", from: "VLP", to: "ADH", dist: 2 },
  { line: "WESTERN", from: "ADH", to: "JOS", dist: 2 },
  { line: "WESTERN", from: "JOS", to: "RMAR", dist: 1 },
  { line: "WESTERN", from: "RMAR", to: "GMN", dist: 2 },
  { line: "WESTERN", from: "GMN", to: "MDD", dist: 2 },
  { line: "WESTERN", from: "MDD", to: "KILE", dist: 2 },
  { line: "WESTERN", from: "KILE", to: "BVI", dist: 3 },
  { line: "WESTERN", from: "BVI", to: "DIC", dist: 2 },
  { line: "WESTERN", from: "DIC", to: "MIRA", dist: 4 },
  { line: "WESTERN", from: "MIRA", to: "BYR", dist: 3 },
  { line: "WESTERN", from: "BYR", to: "NIG", dist: 5 },
  { line: "WESTERN", from: "NIG", to: "BSR", dist: 4 },
  { line: "WESTERN", from: "BSR", to: "NSP", dist: 4 },
  { line: "WESTERN", from: "NSP", to: "VR", dist: 4 },
  { line: "WESTERN", from: "VR", to: "VTN", dist: 9 },
  { line: "WESTERN", from: "VTN", to: "SAH", dist: 7 },
  { line: "WESTERN", from: "SAH", to: "KLV", dist: 7 },
  { line: "WESTERN", from: "KLV", to: "PLG", dist: 8 },
  { line: "WESTERN", from: "PLG", to: "UOI", dist: 7 },
  { line: "WESTERN", from: "UOI", to: "BOR", dist: 4 },
  { line: "WESTERN", from: "BOR", to: "VGN", dist: 10 },
  { line: "WESTERN", from: "VGN", to: "DRD", dist: 12 },

  // 5. HARBOUR MAIN
  { line: "HARBOUR", from: "CSMT-H", to: "MSD-H", dist: 1 },
  { line: "HARBOUR", from: "MSD-H", to: "SNRD-H", dist: 1 },
  { line: "HARBOUR", from: "SNRD-H", to: "DKRD", dist: 1 },
  { line: "HARBOUR", from: "DKRD", to: "RRD", dist: 1 },
  { line: "HARBOUR", from: "RRD", to: "CTGN", dist: 1 },
  { line: "HARBOUR", from: "CTGN", to: "SVE", dist: 2 },
  { line: "HARBOUR", from: "SVE", to: "VDLR", dist: 2 },
  { line: "HARBOUR", from: "VDLR", to: "GTBN", dist: 3 },
  { line: "HARBOUR", from: "GTBN", to: "CHF", dist: 1 },
  { line: "HARBOUR", from: "CHF", to: "CLA-H", dist: 2 },
  { line: "HARBOUR", from: "CLA-H", to: "TKNR", dist: 2 },
  { line: "HARBOUR", from: "TKNR", to: "CMBR", dist: 1 },
  { line: "HARBOUR", from: "CMBR", to: "GV", dist: 1 },
  { line: "HARBOUR", from: "GV", to: "MNKD", dist: 3 },
  { line: "HARBOUR", from: "MNKD", to: "VSH", dist: 7 },
  { line: "HARBOUR", from: "VSH", to: "SNCR", dist: 1 },
  { line: "HARBOUR", from: "SNCR", to: "JNJ", dist: 2 },
  { line: "HARBOUR", from: "JNJ", to: "NEU", dist: 2 },
  { line: "HARBOUR", from: "NEU", to: "SWDV", dist: 2 },
  { line: "HARBOUR", from: "SWDV", to: "BEPR", dist: 2 },
  { line: "HARBOUR", from: "BEPR", to: "KHAG", dist: 3 },
  { line: "HARBOUR", from: "KHAG", to: "MANR", dist: 2 },
  { line: "HARBOUR", from: "MANR", to: "KNDS", dist: 2 },
  { line: "HARBOUR", from: "KNDS", to: "PNVL", dist: 4 },

  // 6. HARBOUR - GOREGAON
  { line: "HARBOUR", from: "VDLR", to: "KCE", dist: 2 },
  { line: "HARBOUR", from: "KCE", to: "MM-H", dist: 2 },
  { line: "HARBOUR", from: "MM-H", to: "BA-H", dist: 1 },
  { line: "HARBOUR", from: "BA-H", to: "KHAR-H", dist: 2 },
  { line: "HARBOUR", from: "KHAR-H", to: "STC-H", dist: 2 },
  { line: "HARBOUR", from: "STC-H", to: "VLP-H", dist: 2 },
  { line: "HARBOUR", from: "VLP-H", to: "ADH-H", dist: 2 },

  // 7. TRANS-HARBOUR
  { line: "TRANS_HARBOUR", from: "TNA-TH", to: "DIGH", dist: 4 },
  { line: "TRANS_HARBOUR", from: "DIGH", to: "AIRL", dist: 2 },
  { line: "TRANS_HARBOUR", from: "AIRL", to: "RABE", dist: 2 },
  { line: "TRANS_HARBOUR", from: "RABE", to: "GNSL", dist: 3 },
  { line: "TRANS_HARBOUR", from: "GNSL", to: "KPHN", dist: 1 },
  { line: "TRANS_HARBOUR", from: "KPHN", to: "TURB", dist: 3 },
  { line: "TRANS_HARBOUR", from: "TURB", to: "JNJ-TH", dist: 3 },
  { line: "TRANS_HARBOUR", from: "JNJ-TH", to: "NEU-TH", dist: 2 },
  { line: "TRANS_HARBOUR", from: "NEU-TH", to: "SWDV-TH", dist: 1 },
  { line: "TRANS_HARBOUR", from: "SWDV-TH", to: "BEPR-TH", dist: 3 },
  { line: "TRANS_HARBOUR", from: "BEPR-TH", to: "KHAG-TH", dist: 2 },
  { line: "TRANS_HARBOUR", from: "KHAG-TH", to: "MANR-TH", dist: 3 },
  { line: "TRANS_HARBOUR", from: "MANR-TH", to: "KNDS-TH", dist: 2 },
  { line: "TRANS_HARBOUR", from: "KNDS-TH", to: "PNVL-TH", dist: 3 },
];

async function main() {
  console.log('\n🚂 RailMitra — Station Distance Master Seed');
  console.log('═══════════════════════════════════════════\n');

  let successCount = 0;
  let missingCount = 0;

  for (const entry of DISTANCE_DATA) {
    const fromStn = await prisma.station.findUnique({ where: { code: entry.from } });
    const toStn = await prisma.station.findUnique({ where: { code: entry.to } });

    if (!fromStn || !toStn) {
      console.warn(`⚠ Missing station for relationship: ${entry.from} -> ${entry.to}`);
      missingCount++;
      continue;
    }

    // Upsert the distance record
    await prisma.stationDistance.upsert({
      where: {
        lineCode_fromStationId_toStationId: {
          lineCode: entry.line,
          fromStationId: fromStn.id,
          toStationId: toStn.id
        }
      },
      update: { distanceKm: entry.dist },
      create: {
        lineCode: entry.line,
        fromStationId: fromStn.id,
        toStationId: toStn.id,
        distanceKm: entry.dist
      }
    });

    successCount++;
  }

  console.log(`\n✅ Added/Updated ${successCount} distance relationships.`);
  if (missingCount > 0) {
    console.warn(`⚠ ${missingCount} relationships failed due to missing stations in DB.`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
