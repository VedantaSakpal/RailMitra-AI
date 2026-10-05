import { PrismaClient, LineType, TrainType, TrainDirection, TrainStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed for Phase 5...');

  // 1. Clear existing railway data
  console.log('Clearing old data...');
  await prisma.stationStop.deleteMany();
  await prisma.trainSchedule.deleteMany();
  await prisma.trainRoute.deleteMany();
  await prisma.train.deleteMany();
  await prisma.station.deleteMany();
  await prisma.railwayLine.deleteMany();

  // 2. Create Lines
  console.log('Creating Railway Lines...');
  const central = await prisma.railwayLine.create({
    data: { name: 'Central Line', type: LineType.CENTRAL, color: '#dc2626', description: 'CSMT to Kalyan / Karjat / Kasara' },
  });

  const western = await prisma.railwayLine.create({
    data: { name: 'Western Line', type: LineType.WESTERN, color: '#16a34a', description: 'Churchgate to Dahanu Road' },
  });

  const harbour = await prisma.railwayLine.create({
    data: { name: 'Harbour Line', type: LineType.HARBOUR, color: '#ca8a04', description: 'CSMT to Panvel / Goregaon' },
  });

  // 3. Create Stations
  console.log('Creating Stations...');
  const centralStationsData = [
    { name: 'CSMT', code: 'CSTM', zone: 1, seq: 1 },
    { name: 'Byculla', code: 'BY', zone: 1, seq: 2 },
    { name: 'Dadar (Central)', code: 'DR-C', zone: 1, seq: 3 },
    { name: 'Kurla (Central)', code: 'CLA-C', zone: 2, seq: 4 },
    { name: 'Ghatkopar', code: 'GC', zone: 2, seq: 5 },
    { name: 'Thane', code: 'TNA', zone: 3, seq: 6 },
    { name: 'Dombivli', code: 'DI', zone: 4, seq: 7 },
    { name: 'Kalyan', code: 'KYN', zone: 4, seq: 8 },
  ];

  const westernStationsData = [
    { name: 'Churchgate', code: 'CCG', zone: 1, seq: 1 },
    { name: 'Mumbai Central', code: 'BCT', zone: 1, seq: 2 },
    { name: 'Dadar (Western)', code: 'DDR-W', zone: 1, seq: 3 },
    { name: 'Bandra', code: 'BA', zone: 2, seq: 4 },
    { name: 'Andheri', code: 'ADH', zone: 2, seq: 5 },
    { name: 'Borivali', code: 'BVI', zone: 3, seq: 6 },
    { name: 'Bhayandar', code: 'BYR', zone: 4, seq: 7 },
    { name: 'Virar', code: 'VR', zone: 5, seq: 8 },
  ];

  const harbourStationsData = [
    { name: 'CSMT (Harbour)', code: 'CSTM-H', zone: 1, seq: 1 },
    { name: 'Vadala Road', code: 'VDLR', zone: 1, seq: 2 },
    { name: 'Kurla (Harbour)', code: 'CLA-H', zone: 2, seq: 3 },
    { name: 'Chembur', code: 'CMBR', zone: 2, seq: 4 },
    { name: 'Vashi', code: 'VSH', zone: 3, seq: 5 },
    { name: 'Nerul', code: 'NU', zone: 4, seq: 6 },
    { name: 'Panvel', code: 'PNVL', zone: 5, seq: 7 },
  ];

  const createdCentral: Record<string, any> = {};
  for (const st of centralStationsData) {
    createdCentral[st.code] = await prisma.station.create({
      data: { name: st.name, code: st.code, lineId: central.id, zone: st.zone, sequence: st.seq },
    });
  }

  const createdWestern: Record<string, any> = {};
  for (const st of westernStationsData) {
    createdWestern[st.code] = await prisma.station.create({
      data: { name: st.name, code: st.code, lineId: western.id, zone: st.zone, sequence: st.seq },
    });
  }

  const createdHarbour: Record<string, any> = {};
  for (const st of harbourStationsData) {
    createdHarbour[st.code] = await prisma.station.create({
      data: { name: st.name, code: st.code, lineId: harbour.id, zone: st.zone, sequence: st.seq },
    });
  }

  // 4. Create Trains & Schedules
  console.log('Creating Trains, Routes, and Schedules...');

  // --- Central Fast Local (CSMT -> Kalyan) ---
  const cFast = await prisma.train.create({
    data: {
      number: '97001',
      name: 'CSMT - Kalyan Fast Local',
      lineId: central.id,
      type: TrainType.FAST,
      direction: TrainDirection.DOWN,
    },
  });

  const cFastRoute = await prisma.trainRoute.create({
    data: { trainId: cFast.id, routeName: 'CSMT to Kalyan (Fast)' },
  });

  const cFastStops = [
    { code: 'CSTM', arr: '08:00', dep: '08:00', dist: 0 },
    { code: 'BY', arr: '08:08', dep: '08:09', dist: 4.0 },
    { code: 'DR-C', arr: '08:16', dep: '08:17', dist: 9.0 },
    { code: 'CLA-C', arr: '08:26', dep: '08:27', dist: 15.0 },
    { code: 'GC', arr: '08:32', dep: '08:33', dist: 19.0 },
    { code: 'TNA', arr: '08:47', dep: '08:48', dist: 33.0 },
    { code: 'DI', arr: '09:02', dep: '09:03', dist: 48.0 },
    { code: 'KYN', arr: '09:14', dep: '09:14', dist: 54.0 },
  ];

  for (let i = 0; i < cFastStops.length; i++) {
    const s = cFastStops[i];
    await prisma.stationStop.create({
      data: {
        routeId: cFastRoute.id,
        stationId: createdCentral[s.code].id,
        stopSequence: i + 1,
        arrivalTime: s.arr,
        departureTime: s.dep,
        distance: s.dist,
      },
    });
  }

  await prisma.trainSchedule.create({
    data: {
      trainId: cFast.id,
      departureTime: '08:00',
      arrivalTime: '09:14',
      runningDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      status: TrainStatus.ON_TIME,
    },
  });

  // --- Central Slow Local (CSMT -> Thane) ---
  const cSlow = await prisma.train.create({
    data: {
      number: '97015',
      name: 'CSMT - Thane Slow Local',
      lineId: central.id,
      type: TrainType.SLOW,
      direction: TrainDirection.DOWN,
    },
  });

  const cSlowRoute = await prisma.trainRoute.create({
    data: { trainId: cSlow.id, routeName: 'CSMT to Thane (Slow)' },
  });

  const cSlowStops = [
    { code: 'CSTM', arr: '08:15', dep: '08:15', dist: 0 },
    { code: 'BY', arr: '08:25', dep: '08:26', dist: 4.0 },
    { code: 'DR-C', arr: '08:35', dep: '08:36', dist: 9.0 },
    { code: 'CLA-C', arr: '08:48', dep: '08:49', dist: 15.0 },
    { code: 'GC', arr: '08:56', dep: '08:57', dist: 19.0 },
    { code: 'TNA', arr: '09:15', dep: '09:15', dist: 33.0 },
  ];

  for (let i = 0; i < cSlowStops.length; i++) {
    const s = cSlowStops[i];
    await prisma.stationStop.create({
      data: {
        routeId: cSlowRoute.id,
        stationId: createdCentral[s.code].id,
        stopSequence: i + 1,
        arrivalTime: s.arr,
        departureTime: s.dep,
        distance: s.dist,
      },
    });
  }

  await prisma.trainSchedule.create({
    data: {
      trainId: cSlow.id,
      departureTime: '08:15',
      arrivalTime: '09:15',
      runningDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      status: TrainStatus.ON_TIME,
    },
  });

  // --- Western Fast Local (Churchgate -> Virar) ---
  const wFast = await prisma.train.create({
    data: {
      number: '90101',
      name: 'Churchgate - Virar Fast Local',
      lineId: western.id,
      type: TrainType.FAST,
      direction: TrainDirection.DOWN,
    },
  });

  const wFastRoute = await prisma.trainRoute.create({
    data: { trainId: wFast.id, routeName: 'Churchgate to Virar (Fast)' },
  });

  const wFastStops = [
    { code: 'CCG', arr: '08:25', dep: '08:25', dist: 0 },
    { code: 'BCT', arr: '08:34', dep: '08:35', dist: 6.0 },
    { code: 'DDR-W', arr: '08:42', dep: '08:43', dist: 10.0 },
    { code: 'BA', arr: '08:50', dep: '08:51', dist: 15.0 },
    { code: 'ADH', arr: '09:01', dep: '09:02', dist: 22.0 },
    { code: 'BVI', arr: '09:17', dep: '09:18', dist: 34.0 },
    { code: 'BYR', arr: '09:30', dep: '09:31', dist: 43.0 },
    { code: 'VR', arr: '09:48', dep: '09:48', dist: 60.0 },
  ];

  for (let i = 0; i < wFastStops.length; i++) {
    const s = wFastStops[i];
    await prisma.stationStop.create({
      data: {
        routeId: wFastRoute.id,
        stationId: createdWestern[s.code].id,
        stopSequence: i + 1,
        arrivalTime: s.arr,
        departureTime: s.dep,
        distance: s.dist,
      },
    });
  }

  await prisma.trainSchedule.create({
    data: {
      trainId: wFast.id,
      departureTime: '08:25',
      arrivalTime: '09:48',
      runningDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      status: TrainStatus.ON_TIME,
    },
  });

  // --- Western Slow Local (Dadar -> Borivali) ---
  const wSlow = await prisma.train.create({
    data: {
      number: '90125',
      name: 'Dadar - Borivali Slow Local',
      lineId: western.id,
      type: TrainType.SLOW,
      direction: TrainDirection.DOWN,
    },
  });

  const wSlowRoute = await prisma.trainRoute.create({
    data: { trainId: wSlow.id, routeName: 'Dadar to Borivali (Slow)' },
  });

  const wSlowStops = [
    { code: 'DDR-W', arr: '08:30', dep: '08:30', dist: 10.0 },
    { code: 'BA', arr: '08:39', dep: '08:40', dist: 15.0 },
    { code: 'ADH', arr: '08:52', dep: '08:53', dist: 22.0 },
    { code: 'BVI', arr: '09:12', dep: '09:12', dist: 34.0 },
  ];

  for (let i = 0; i < wSlowStops.length; i++) {
    const s = wSlowStops[i];
    await prisma.stationStop.create({
      data: {
        routeId: wSlowRoute.id,
        stationId: createdWestern[s.code].id,
        stopSequence: i + 1,
        arrivalTime: s.arr,
        departureTime: s.dep,
        distance: s.dist,
      },
    });
  }

  await prisma.trainSchedule.create({
    data: {
      trainId: wSlow.id,
      departureTime: '08:30',
      arrivalTime: '09:12',
      runningDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      status: TrainStatus.ON_TIME,
    },
  });

  // --- Harbour Local (CSMT -> Panvel via Kurla) ---
  const hLocal = await prisma.train.create({
    data: {
      number: '98001',
      name: 'CSMT - Panvel Harbour Local',
      lineId: harbour.id,
      type: TrainType.LOCAL,
      direction: TrainDirection.DOWN,
    },
  });

  const hLocalRoute = await prisma.trainRoute.create({
    data: { trainId: hLocal.id, routeName: 'CSMT to Panvel via Kurla' },
  });

  const hLocalStops = [
    { code: 'CSTM-H', arr: '08:10', dep: '08:10', dist: 0 },
    { code: 'VDLR', arr: '08:28', dep: '08:29', dist: 9.0 },
    { code: 'CLA-H', arr: '08:38', dep: '08:39', dist: 15.0 },
    { code: 'CMBR', arr: '08:44', dep: '08:45', dist: 18.0 },
    { code: 'VSH', arr: '09:00', dep: '09:01', dist: 28.0 },
    { code: 'NU', arr: '09:12', dep: '09:13', dist: 37.0 },
    { code: 'PNVL', arr: '09:30', dep: '09:30', dist: 49.0 },
  ];

  for (let i = 0; i < hLocalStops.length; i++) {
    const s = hLocalStops[i];
    await prisma.stationStop.create({
      data: {
        routeId: hLocalRoute.id,
        stationId: createdHarbour[s.code].id,
        stopSequence: i + 1,
        arrivalTime: s.arr,
        departureTime: s.dep,
        distance: s.dist,
      },
    });
  }

  await prisma.trainSchedule.create({
    data: {
      trainId: hLocal.id,
      departureTime: '08:10',
      arrivalTime: '09:30',
      runningDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      status: TrainStatus.ON_TIME,
    },
  });

  console.log('Seed completed successfully for Phase 5!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
