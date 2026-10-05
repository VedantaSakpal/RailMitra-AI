import { PrismaClient, LineType, TrainType, TrainDirection, TrainStatus } from '@prisma/client';
import { railradarService } from '../src/services/railradar';

const prisma = new PrismaClient();

// Helper to convert minutes from midnight to HH:mm
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simple heuristic for line guessing based on station or train name
function guessLine(trainName: string, sourceCode: string, destCode: string) {
  const t = trainName.toLowerCase();
  if (t.includes('harbour') || t.includes('vashi') || t.includes('panvel') || t.includes('nerul') || t.includes('belapur') || t.includes('uran')) {
    return { name: 'Harbour / Trans-Harbour Line', type: LineType.HARBOUR, color: '#ca8a04' };
  }
  if (t.includes('western') || t.includes('churchgate') || t.includes('virar') || t.includes('borivali') || t.includes('dahanu') || t.includes('bhayandar') || t.includes('andheri')) {
    return { name: 'Western Line', type: LineType.WESTERN, color: '#16a34a' };
  }
  // Default to Central
  return { name: 'Central Line', type: LineType.CENTRAL, color: '#dc2626' };
}

async function main() {
  const today = new Date().toISOString().split('T')[0];

  console.log('Fetching list of all Mumbai Local trains from RailRadar...');
  const lookupData = await railradarService.getMumbaiLocalTrains();
  
  if (!lookupData || !lookupData.data) {
    console.error('Failed to get train list', lookupData);
    return;
  }

  const trainKeys = Object.keys(lookupData.data);
  console.log(`Found ${trainKeys.length} trains to import. Starting import (7s delay between requests to respect rate limit)...`);

  const keysToImport = trainKeys;
  console.log(`Importing all ${keysToImport.length} trains...`);

  for (const trainNumber of keysToImport) {
    try {
      console.log(`Fetching timetable for train ${trainNumber}...`);
      const data = await railradarService.getTrainTimetable(trainNumber, today);
      
      if (!data || !data.data || !data.data.train) {
        console.warn(`Invalid data for train ${trainNumber}, skipping.`);
        continue;
      }

      const { train, route } = data.data;

      const lineInfo = guessLine(train.trainName, train.sourceStationCode, train.destinationStationCode);
      let line = await prisma.railwayLine.findFirst({ where: { name: lineInfo.name } });
      if (!line) {
        line = await prisma.railwayLine.create({
          data: { name: lineInfo.name, type: lineInfo.type as any, color: lineInfo.color }
        });
      }

      let dbTrain = await prisma.train.findUnique({ where: { number: train.trainNumber } });
      if (!dbTrain) {
        dbTrain = await prisma.train.create({
          data: {
            number: train.trainNumber,
            name: train.trainName,
            lineId: line.id,
            type: train.trainName.toLowerCase().includes('fast') ? TrainType.FAST : TrainType.SLOW,
            direction: TrainDirection.DOWN,
          }
        });
      }

      let dbRoute = await prisma.trainRoute.findFirst({ where: { trainId: dbTrain.id } });
      if (!dbRoute) {
        dbRoute = await prisma.trainRoute.create({
          data: {
            trainId: dbTrain.id,
            routeName: `${train.sourceStationCode} to ${train.destinationStationCode}`,
          }
        });
      }

      await prisma.stationStop.deleteMany({ where: { routeId: dbRoute.id } });

      let sequence = 1;
      const halts = route.filter((r: any) => r.isHalt === 1);
      
      for (const stop of halts) {
        let station = await prisma.station.findUnique({ where: { code: stop.stationCode } });
        if (!station) {
          station = await prisma.station.create({
            data: {
              code: stop.stationCode,
              name: stop.stationName,
              lineId: line.id,
              zone: 1, 
              sequence: sequence,
            }
          });
        }

        await prisma.stationStop.create({
          data: {
            routeId: dbRoute.id,
            stationId: station.id,
            stopSequence: stop.sequence,
            arrivalTime: stop.scheduledArrival != null ? minutesToTime(stop.scheduledArrival) : null,
            departureTime: stop.scheduledDeparture != null ? minutesToTime(stop.scheduledDeparture) : null,
            distance: stop.distanceFromSourceKm,
          }
        });
        sequence++;
      }

      const firstStop = halts[0];
      const lastStop = halts[halts.length - 1];
      
      const existingSchedule = await prisma.trainSchedule.findFirst({ where: { trainId: dbTrain.id } });
      if (!existingSchedule && firstStop && lastStop) {
        await prisma.trainSchedule.create({
          data: {
            trainId: dbTrain.id,
            departureTime: minutesToTime(firstStop.scheduledDeparture),
            arrivalTime: minutesToTime(lastStop.scheduledArrival || lastStop.scheduledDeparture),
            runningDays: train.runningDays.days.map((d: string) => d.toUpperCase()),
            status: TrainStatus.ON_TIME,
          }
        });
      }

      console.log(`✅ Imported ${train.trainNumber}: ${train.trainName}`);
      await delay(7000); // 7s delay = ~8 req/min, safely under the 10 req/min limit
    } catch (err: any) {
      console.error(`❌ Error importing ${trainNumber}:`, err.message);
    }
  }

  console.log('Finished bulk import!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
