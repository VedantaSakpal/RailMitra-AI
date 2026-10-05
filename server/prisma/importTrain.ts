import { PrismaClient, LineType, TrainType, TrainDirection, TrainStatus } from '@prisma/client';
import { railradarService } from '../src/services/railradar';

const prisma = new PrismaClient();

// Helper to convert minutes from midnight to HH:mm
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

async function main() {
  const trainNumber = '99437'; // Thane - Vashi Slow Local
  const today = new Date().toISOString().split('T')[0];

  console.log(`Fetching timetable for train ${trainNumber} on ${today}...`);
  const data = await railradarService.getTrainTimetable(trainNumber, today);
  
  if (!data || !data.data || !data.data.train) {
    console.error('Invalid response from RailRadar API', data);
    return;
  }

  const { train, route } = data.data;
  console.log(`Found train: ${train.trainName} (${train.trainNumber})`);

  // 1. Create or get RailwayLine
  // We'll map by some basic string matching for demo purposes
  let line = await prisma.railwayLine.findFirst({
    where: { name: 'Trans-Harbour Line' }
  });
  if (!line) {
    line = await prisma.railwayLine.create({
      data: {
        name: 'Trans-Harbour Line',
        type: LineType.HARBOUR,
        color: '#ca8a04',
      }
    });
  }

  // 2. Create Train
  let dbTrain = await prisma.train.findUnique({ where: { number: train.trainNumber } });
  if (!dbTrain) {
    dbTrain = await prisma.train.create({
      data: {
        number: train.trainNumber,
        name: train.trainName,
        lineId: line.id,
        type: train.trainName.toLowerCase().includes('fast') ? TrainType.FAST : TrainType.SLOW,
        direction: TrainDirection.DOWN, // simple default
      }
    });
  }

  // 3. Create TrainRoute
  let dbRoute = await prisma.trainRoute.findFirst({ where: { trainId: dbTrain.id } });
  if (!dbRoute) {
    dbRoute = await prisma.trainRoute.create({
      data: {
        trainId: dbTrain.id,
        routeName: `${train.sourceStationCode} to ${train.destinationStationCode}`,
      }
    });
  }

  // 4. Process Stops
  // Clear old stops for this route
  await prisma.stationStop.deleteMany({ where: { routeId: dbRoute.id } });

  let sequence = 1;
  const halts = route.filter((r: any) => r.isHalt === 1);
  
  for (const stop of halts) {
    // Upsert Station
    let station = await prisma.station.findUnique({ where: { code: stop.stationCode } });
    if (!station) {
      station = await prisma.station.create({
        data: {
          code: stop.stationCode,
          name: stop.stationName,
          lineId: line.id,
          zone: 1, // default
          sequence: sequence,
        }
      });
    }

    // Create StationStop
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

  // 5. Create Schedule
  const firstStop = halts[0];
  const lastStop = halts[halts.length - 1];
  
  const existingSchedule = await prisma.trainSchedule.findFirst({ where: { trainId: dbTrain.id } });
  if (!existingSchedule) {
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

  console.log(`Successfully imported train ${train.trainNumber} and its ${halts.length} stops!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
