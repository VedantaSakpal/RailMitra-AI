import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { io } from '../index';

export const getLines = async (req: Request, res: Response) => {
  try {
    const lines = await prisma.railwayLine.findMany({
      include: {
        stations: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
    res.json({ success: true, data: lines });
  } catch (error: any) {
    console.error('Error fetching railway lines:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getStations = async (req: Request, res: Response) => {
  try {
    const { lineId } = req.query;
    const filter = lineId ? { lineId: String(lineId) } : {};

    const stations = await prisma.station.findMany({
      where: filter,
      include: {
        line: true,
      },
      orderBy: {
        sequence: 'asc',
      },
    });
    res.json({ success: true, data: stations });
  } catch (error: any) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getTrains = async (req: Request, res: Response) => {
  try {
    const { lineId } = req.query;
    const filter = lineId ? { lineId: String(lineId) } : {};

    const trains = await prisma.train.findMany({
      where: filter,
      include: {
        line: true,
        routes: {
          include: {
            stationStops: {
              include: {
                station: true,
              },
              orderBy: {
                stopSequence: 'asc',
              },
            },
          },
        },
        schedules: true,
      },
    });
    res.json({ success: true, data: trains });
  } catch (error: any) {
    console.error('Error fetching trains:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Convert HH:mm to total minutes from midnight for easy duration math
const timeToMinutes = (timeStr?: string | null): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Convert total minutes to HH:mm
const minutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
};

export const searchTrains = async (req: Request, res: Response) => {
  try {
    const { fromStationId, toStationId, trainType, lineId } = req.query;

    if (!fromStationId || !toStationId) {
      return res.status(400).json({
        success: false,
        message: 'fromStationId and toStationId are required parameters',
      });
    }

    const stations = await prisma.station.findMany({ include: { line: true } });
    const fromStation = stations.find((s) => s.id === String(fromStationId));
    const toStation = stations.find((s) => s.id === String(toStationId));

    if (!fromStation || !toStation) {
      return res.status(404).json({
        success: false,
        message: 'Source or Destination station not found',
      });
    }

    const stationMap: Record<string, typeof fromStation> = {};
    stations.forEach((s) => (stationMap[s.code] = s));

    // RailRadar occasionally uses different station codes than our database
    const rrCodeMap: Record<string, string> = {
      'KHPI': 'KHPO',
      'CSTM': 'CSMT',
    };

    const doesTrainStopAt = (destCode: string, origin: typeof fromStation, target: typeof fromStation) => {
      const mappedCode = rrCodeMap[destCode] || destCode;
      const destSt = stationMap[mappedCode];
      if (!destSt) return false;
      if (destSt.lineId !== target.lineId) return false;
      if (origin.sequence < target.sequence) {
        return destSt.sequence >= target.sequence;
      } else {
        return destSt.sequence <= target.sequence;
      }
    };

    const formatTime = (isoOrTime: string) => {
      if (!isoOrTime) return '00:00';
      if (isoOrTime.includes('T') || isoOrTime.includes('+')) {
        return new Date(isoOrTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return isoOrTime;
    };

    const getExpectedMins = (iso: string) => {
      if (!iso) return Date.now();
      if (iso.includes('T')) return new Date(iso).getTime();
      const [h, m] = iso.split(':');
      const d = new Date();
      d.setHours(+h, +m, 0);
      return d.getTime();
    };

    const searchResults: any[] = [];

    // 1. Fetch real RailRadar Live Board for origin
    const board = await railradarService.getLiveStationBoard(fromStation.code);
    const liveTrains = board.trains;

    // Filter by trainType manually if required by UI
    for (const tr of liveTrains) {
      const mappedTrDest = rrCodeMap[tr.destination] || tr.destination;
      if (mappedTrDest === toStation.code || doesTrainStopAt(tr.destination, fromStation, toStation)) {
        const diffSeq = Math.abs(fromStation.sequence - toStation.sequence);
        const durationMins = diffSeq * 3 || 5;
        const depTimeMs = getExpectedMins(tr.expectedTime || tr.scheduledDeparture || '');
        const arrDate = new Date(depTimeMs + durationMins * 60000);

        searchResults.push({
          id: `direct-${tr.number}-${Date.now()}`,
          isDirect: true,
          trainNumber: tr.number,
          trainName: tr.name,
          trainType: 'LOCAL',
          line: fromStation.line,
          departureTime: formatTime(tr.expectedTime || tr.scheduledDeparture || ''),
          arrivalTime: formatTime(arrDate.toISOString()),
          durationMinutes: durationMins,
          stopsCount: diffSeq,
          stopsList: [],
          status: tr.delayMinutes > 0 ? 'DELAYED' : 'ON_TIME',
          delayMinutes: tr.delayMinutes,
        });
      }
    }

    // 2. Interchanges (If none found or lines are different)
    if (searchResults.length === 0 || fromStation.lineId !== toStation.lineId) {
      const junctions = ['CLA', 'DR', 'TNA']; // Kurla, Dadar, Thane
      for (const juncCode of junctions) {
        const jSt = stationMap[juncCode];
        if (!jSt) continue;

        const leg1Trains = liveTrains.filter(
          (tr) => {
            const mappedTrDest = rrCodeMap[tr.destination] || tr.destination;
            return mappedTrDest === juncCode || doesTrainStopAt(tr.destination, fromStation, jSt);
          }
        );

        if (leg1Trains.length > 0) {
          try {
            const jBoard = await railradarService.getLiveStationBoard(juncCode);
            const leg2Trains = jBoard.trains.filter(
              (tr) => {
                const mappedTrDest = rrCodeMap[tr.destination] || tr.destination;
                return mappedTrDest === toStation.code || doesTrainStopAt(tr.destination, jSt, toStation);
              }
            );

            if (leg2Trains.length > 0) {
              const r1 = leg1Trains[0];
              const r2 = leg2Trains[0];
              const diff1 = Math.abs(fromStation.sequence - jSt.sequence);
              const diff2 = Math.abs(jSt.sequence - toStation.sequence);
              const durationMins = diff1 * 3 + diff2 * 3 + 10;
              const depTimeMs = getExpectedMins(r1.expectedTime || r1.scheduledDeparture || '');
              const leg1ArrMs = depTimeMs + diff1 * 3 * 60000;
              const leg2DepMs = leg1ArrMs + 10 * 60000;
              const arrDateMs = depTimeMs + durationMins * 60000;

              searchResults.push({
                id: `interchange-${juncCode}-${r1.number}-${r2.number}`,
                isDirect: false,
                interchangeStation: `${jSt.name} Junction`,
                interchangeLineChange: `${fromStation.line.name} ➔ ${toStation.line.name}`,
                leg1: {
                  trainName: r1.name,
                  line: fromStation.line,
                  departureTime: formatTime(r1.expectedTime || r1.scheduledDeparture || ''),
                  arrivalTime: formatTime(new Date(leg1ArrMs).toISOString()),
                },
                leg2: {
                  trainName: r2.name,
                  line: toStation.line,
                  departureTime: formatTime(new Date(leg2DepMs).toISOString()),
                  arrivalTime: formatTime(new Date(arrDateMs).toISOString()),
                },
                trainNumber: `${r1.number} / ${r2.number}`,
                trainName: `Transfer via ${jSt.name}`,
                trainType: 'CONNECTING',
                line: fromStation.line,
                departureTime: formatTime(r1.expectedTime || r1.scheduledDeparture || ''),
                arrivalTime: formatTime(new Date(arrDateMs).toISOString()),
                durationMinutes: durationMins,
                stopsCount: diff1 + diff2,
                stopsList: [],
                status: r1.delayMinutes > 0 || r2.delayMinutes > 0 ? 'DELAYED' : 'ON_TIME',
                delayMinutes: Math.max(r1.delayMinutes, r2.delayMinutes),
              });
              break;
            }
          } catch (e) {
            console.error('Error fetching junction board for', juncCode);
          }
        }
      }
    }

    res.json({
      success: true,
      count: searchResults.length,
      data: searchResults,
    });
  } catch (error: any) {
    console.error('Error searching trains:', error);
    res.status(500).json({ success: false, message: 'Server Error searching trains' });
  }
};

import { railradarService, RailRadarError } from '../services/railradar';

export const getLiveTrainStatus = async (req: Request, res: Response) => {
  try {
    const { trainNumber } = req.params;
    const { date } = req.query;
    const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];
    const data = await railradarService.getLiveTrainStatus(trainNumber, targetDate);
    res.json({ success: true, data });
  } catch (error: any) {
    if (error instanceof RailRadarError) {
      const httpCode = error.httpStatus >= 100 && error.httpStatus < 600 ? error.httpStatus : 502;
      return res.status(httpCode).json({ success: false, message: error.message });
    }
    console.error('Error fetching live train status:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching live status' });
  }
};

export const getLiveStationBoard = async (req: Request, res: Response) => {
  try {
    const { stationCode } = req.params;
    const data = await railradarService.getLiveStationBoard(stationCode);
    res.json({ success: true, data });
  } catch (error: any) {
    if (error instanceof RailRadarError) {
      const httpCode = error.httpStatus >= 100 && error.httpStatus < 600 ? error.httpStatus : 502;
      return res.status(httpCode).json({ success: false, message: error.message });
    }
    console.error('Error fetching live station board:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching station board' });
  }
};

export const simulateLiveUpdate = async (req: Request, res: Response) => {
  try {
    const { trainNumber, currentStationId, status, delayMinutes } = req.body;
    
    const updatePayload = {
      trainNumber,
      currentStationId,
      status,
      delayMinutes,
      timestamp: new Date().toISOString()
    };

    // Emit to all connected clients
    io.emit('train_location_update', updatePayload);
    
    res.json({ success: true, message: 'Simulated update emitted via websocket', data: updatePayload });
  } catch (error: any) {
    console.error('Error simulating live update:', error);
    res.status(500).json({ success: false, message: 'Server Error simulating update' });
  }
};
