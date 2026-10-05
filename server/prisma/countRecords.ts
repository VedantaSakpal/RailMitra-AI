import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const [trains, stations, stops] = await Promise.all([
    p.train.count(),
    p.station.count(),
    p.stationStop.count(),
  ]);
  console.log(`Trains:        ${trains}`);
  console.log(`Stations:      ${stations}`);
  console.log(`Station Stops: ${stops}`);
}
main().catch(console.error).finally(() => p.$disconnect());
