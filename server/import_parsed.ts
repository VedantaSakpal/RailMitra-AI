import { PrismaClient, LineType, TrainType, TrainDirection, TrainStatus } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data import for Central Line parsed data...');

  // 1. Get or create the Central Line
  let centralLine = await prisma.railwayLine.findUnique({ where: { type: LineType.CENTRAL } });
  if (!centralLine) {
    centralLine = await prisma.railwayLine.create({
      data: {
        name: 'Central Line',
        type: LineType.CENTRAL,
        color: '#dc2626',
        description: 'CSMT to Kalyan / Karjat / Kasara'
      }
    });
  }

  // 2. Read and parse stations_clean.csv
  const stationsCsv = fs.readFileSync(String.raw`c:\Users\VARAD\Desktop\RailMitra-AI\centerTt\stations_clean.csv`, 'utf8');
  const stationLines = stationsCsv.trim().split('\n').slice(1);
  const stationMap: Record<string, any> = {};

  for (const line of stationLines) {
    if (!line) continue;
    const [seqStr, ...nameParts] = line.split(',');
    const name = nameParts.join(',').trim();
    const seq = parseInt(seqStr);
    
    // Generate a semi-unique code
    let code = name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5);
    code = `C_${code}_${seq}`;

    // check if exists
    let st = await prisma.station.findFirst({
        where: { lineId: centralLine.id, sequence: seq }
    });

    if (!st) {
        st = await prisma.station.create({
            data: {
                name,
                code,
                lineId: centralLine.id,
                zone: Math.ceil(seq / 10),
                sequence: seq
            }
        });
    }
    stationMap[name] = st;
  }
  console.log(`Loaded ${Object.keys(stationMap).length} stations.`);

  // 3. Read and parse trains.csv
  const trainsCsv = fs.readFileSync(String.raw`c:\Users\VARAD\Desktop\RailMitra-AI\centerTt\trains.csv`, 'utf8');
  const trainLines = trainsCsv.trim().split('\n').slice(1);
  const trainMap: Record<string, any> = {};

  for (const line of trainLines) {
      if (!line) continue;
      const parts = line.split(',');
      const trainNo = parts[0];
      const flags = parts[2] || '';
      
      let tType = TrainType.SLOW;
      if (flags.includes('AC')) tType = TrainType.LOCAL; 
      if (flags.includes('F') || flags.includes('FAST')) tType = TrainType.FAST;
      
      let tr = await prisma.train.findUnique({ where: { number: trainNo } });
      if (!tr) {
          tr = await prisma.train.create({
              data: {
                  number: trainNo,
                  name: `Train ${trainNo}`,
                  lineId: centralLine.id,
                  type: tType,
                  direction: TrainDirection.DOWN
              }
          });
      }
      
      let trRoute = await prisma.trainRoute.findFirst({ where: { trainId: tr.id } });
      if (!trRoute) {
          trRoute = await prisma.trainRoute.create({
              data: { trainId: tr.id, routeName: `Route for ${trainNo}` }
          });
      }

      let trSchedule = await prisma.trainSchedule.findFirst({ where: { trainId: tr.id } });
      if (!trSchedule) {
          await prisma.trainSchedule.create({
              data: {
                  trainId: tr.id,
                  departureTime: '00:00',
                  arrivalTime: '00:00',
                  runningDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
                  status: TrainStatus.ON_TIME
              }
          });
      }

      trainMap[trainNo] = { train: tr, route: trRoute };
  }
  console.log(`Loaded ${Object.keys(trainMap).length} trains.`);

  // 4. Read and parse stop_times_clean.csv
  const stopsCsv = fs.readFileSync(String.raw`c:\Users\VARAD\Desktop\RailMitra-AI\centerTt\stop_times_clean.csv`, 'utf8');
  const stopLines = stopsCsv.trim().split('\n').slice(1);
  
  let stopCount = 0;
  const chunkArray = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
  
  const stopChunks = chunkArray(stopLines, 200); // 200 at a time
  for (const chunk of stopChunks) {
      const stopPromises = chunk.map(async (line) => {
          if (!line) return;
          const [trainNo, ...rest] = line.split(',');
          const time = rest.pop() as string;
          const stationName = rest.join(',').trim();
          
          const tInfo = trainMap[trainNo];
          const sInfo = stationMap[stationName];
          if (tInfo && sInfo) {
             const existing = await prisma.stationStop.findFirst({
                 where: { routeId: tInfo.route.id, stationId: sInfo.id }
             });
             if (!existing) {
                 await prisma.stationStop.create({
                     data: {
                         routeId: tInfo.route.id,
                         stationId: sInfo.id,
                         stopSequence: sInfo.sequence,
                         arrivalTime: time,
                         departureTime: time,
                         distance: sInfo.sequence * 2.0 
                     }
                 });
                 stopCount++;
             }
          }
      });
      await Promise.all(stopPromises);
  }
  console.log(`Total stops inserted: ${stopCount}`);
  console.log('Import completed successfully!');
}

main()
  .catch(e => {
      console.error(e);
      process.exit(1);
  })
  .finally(async () => {
      await prisma.$disconnect();
  });
