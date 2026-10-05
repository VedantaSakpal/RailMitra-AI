import axios, { AxiosError } from 'axios';

const BASE_URL = 'https://api.railradar.in/v1';

// ─── Auth uses: Authorization: Bearer <key> ──────────────────────────────────
const getApiKey = (): string => {
  const key = process.env.RAILRADAR_API_KEY;
  if (!key) {
    throw new Error('RAILRADAR_API_KEY is not set in environment variables.');
  }
  return key;
};

const makeClient = () =>
  axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

// ─── Typed error shapes ───────────────────────────────────────────────────────
export class RailRadarError extends Error {
  constructor(public httpStatus: number, message: string) {
    super(message);
    this.name = 'RailRadarError';
  }
}

const handleAxiosError = (error: unknown, context: string): never => {
  if (axios.isAxiosError(error)) {
    const ae = error as AxiosError;
    const status = ae.response?.status ?? 0;
    switch (status) {
      case 401:
        throw new RailRadarError(401, 'RailRadar authentication failed. Please check the API key.');
      case 404:
        throw new RailRadarError(404, 'Station not found in RailRadar.');
      case 429:
        throw new RailRadarError(429, 'RailRadar API limit reached. Please try again later.');
      case 503:
        throw new RailRadarError(503, 'Live railway data is temporarily unavailable.');
      default:
        throw new RailRadarError(status, `Unable to connect to RailRadar (${context}).`);
    }
  }
  throw new RailRadarError(0, `Unable to connect to RailRadar (${context}).`);
};

// ─── Mapped train shape returned to Express controller ───────────────────────
export interface MappedTrain {
  number: string;
  name: string;
  source: string;
  destination: string;
  status: string;              // 'upcoming' | 'at-station' | 'departed' | 'scheduled'
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  expectedTime: string | null; // live.expectedDepartureTime
  platform: string | null;
  delayMinutes: number;
}

// ─── Map raw RailRadar train entry → MappedTrain ─────────────────────────────
function mapTrain(entry: any): MappedTrain {
  return {
    number:               entry?.train?.number   ?? '',
    name:                 entry?.train?.name      ?? 'Unknown Train',
    source:               entry?.train?.source    ?? '',
    destination:          entry?.train?.destination ?? '',
    status:               entry?.live?.type        ?? 'scheduled',
    scheduledArrival:     entry?.stop?.arrival     ?? null,
    scheduledDeparture:   entry?.stop?.departure   ?? null,
    expectedTime:         entry?.live?.expectedDepartureTime ?? null,
    platform:             entry?.live?.platform    != null ? String(entry.live.platform) : null,
    delayMinutes:         entry?.live?.delayMinutes ?? 0,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────
export const railradarService = {
  // 1. Live Station Board (primary feature for this fix)
  async getLiveStationBoard(stationCode: string): Promise<{
    station: { code: string; name: string };
    trains: MappedTrain[];
    count: number;
    lastUpdated: string;
  }> {
    const code = stationCode.toUpperCase();
    const client = makeClient();

    console.log(`[RailRadar] → GET /stations/${code}/live?hours=4`);

    let raw: any;
    try {
      const response = await client.get(`/stations/${code}/live?hours=4`);
      console.log(`[RailRadar] ← HTTP ${response.status} for station ${code}`);
      raw = response.data;
    } catch (error) {
      handleAxiosError(error, `getLiveStationBoard(${code})`);
    }

    // Log safe debugging info (never logs the API key)
    console.log(`[RailRadar] station:     `, raw?.data?.station);
    console.log(`[RailRadar] train count: `, raw?.data?.count);
    console.log(`[RailRadar] trains[0]:   `, JSON.stringify(raw?.data?.trains?.[0], null, 2));

    const rawTrains: any[] = raw?.data?.trains ?? [];

    // Filter to relevant statuses only (exclude 'departed')
    const relevant = rawTrains.filter(
      (t: any) => t?.live?.type !== 'departed'
    );

    // Sort by expectedDepartureTime ascending (earliest first)
    relevant.sort((a: any, b: any) => {
      const tA = a?.live?.expectedDepartureTime ?? a?.stop?.departure ?? '';
      const tB = b?.live?.expectedDepartureTime ?? b?.stop?.departure ?? '';
      return tA.localeCompare(tB);
    });

    const mapped = relevant.map(mapTrain);

    const stationInfo = raw?.data?.station ?? {};

    return {
      station: {
        code:  stationInfo.code ?? code,
        name:  stationInfo.name ?? code,
      },
      trains: mapped,
      count:  mapped.length,
      lastUpdated: new Date().toISOString(),
    };
  },

  // 2. Mumbai Suburban Trains Lookup
  async getMumbaiLocalTrains() {
    const client = makeClient();
    try {
      const response = await client.get('/lookup/trains/local?city=Mumbai');
      return response.data;
    } catch (error) {
      handleAxiosError(error, 'getMumbaiLocalTrains');
    }
  },

  // 3. Train Details & Timetable
  async getTrainTimetable(trainNumber: string, journeyDate: string) {
    const client = makeClient();
    try {
      const response = await client.get(`/legacy/trains/${trainNumber}?journeyDate=${journeyDate}`);
      return response.data;
    } catch (error) {
      handleAxiosError(error, `getTrainTimetable(${trainNumber})`);
    }
  },

  // 4. Live Train Running Status
  async getLiveTrainStatus(trainNumber: string, date: string) {
    const client = makeClient();
    try {
      const response = await client.get(`/trains/${trainNumber}/live?date=${date}`);
      return response.data;
    } catch (error) {
      handleAxiosError(error, `getLiveTrainStatus(${trainNumber})`);
    }
  },

  // 5. Station Autocomplete
  async searchStations(query: string) {
    const client = makeClient();
    try {
      const response = await client.get(`/lookup/search/stations?q=${query}`);
      return response.data;
    } catch (error) {
      handleAxiosError(error, `searchStations(${query})`);
    }
  },
};
