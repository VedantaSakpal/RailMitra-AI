import api from '../api';

export interface RailwayLine {
  id: string;
  name: string;
  type: 'CENTRAL' | 'WESTERN' | 'HARBOUR';
  color: string;
  description?: string;
  isActive: boolean;
  stations: Station[];
}

export interface Station {
  id: string;
  name: string;
  code: string;
  lineId: string;
  zone: number;
  latitude?: number;
  longitude?: number;
  sequence: number;
  isActive: boolean;
  line?: RailwayLine;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  lineId: string;
  type: 'FAST' | 'SEMI_FAST' | 'SLOW' | 'LOCAL' | 'EXPRESS';
  direction: 'UP' | 'DOWN';
  isActive: boolean;
  capacity: number;
  line?: RailwayLine;
  routes: any[];
  schedules: any[];
}

export interface TrainSearchResult {
  id: string;
  isDirect: boolean;
  interchangeStation?: string;
  interchangeLineChange?: string;
  leg1?: {
    trainName: string;
    line: RailwayLine;
    departureTime?: string;
    arrivalTime?: string;
  };
  leg2?: {
    trainName: string;
    line: RailwayLine;
    departureTime?: string;
    arrivalTime?: string;
  };
  trainNumber: string;
  trainName: string;
  trainType: string;
  line: RailwayLine;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stopsCount: number;
  stopsList: Array<{
    stationName: string;
    stationCode?: string;
    arrivalTime?: string;
    departureTime?: string;
  }>;
  status: 'ON_TIME' | 'DELAYED' | 'CANCELLED';
  delayMinutes: number;
}

export const getLines = async (): Promise<RailwayLine[]> => {
  const response = await api.get('/railway/lines');
  return response.data.data;
};

export const getStations = async (lineId?: string): Promise<Station[]> => {
  const response = await api.get('/railway/stations', {
    params: { lineId },
  });
  return response.data.data;
};

export const getTrains = async (lineId?: string): Promise<Train[]> => {
  const response = await api.get('/railway/trains', {
    params: { lineId },
  });
  return response.data.data;
};

export const searchTrains = async (
  fromStationId: string,
  toStationId: string,
  lineId?: string,
  trainType?: string
): Promise<TrainSearchResult[]> => {
  const response = await api.get('/railway/search', {
    params: { fromStationId, toStationId, lineId, trainType },
  });
  return response.data.data;
};

export const getLiveTrainStatus = async (trainNumber: string, date?: string) => {
  const response = await api.get(`/railway/live-status/${trainNumber}`, {
    params: { date }
  });
  return response.data.data;
};

export const getLiveStationBoard = async (stationCode: string) => {
  // response.data = { success, data: { station, trains[], count, lastUpdated } }
  const response = await api.get(`/railway/live-board/${stationCode}`);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch station board');
  }
  return response.data.data; // { station, trains, count, lastUpdated }
};
