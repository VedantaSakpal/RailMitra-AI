import { Router } from 'express';
import { getLines, getStations, getTrains, searchTrains, getLiveTrainStatus, getLiveStationBoard, simulateLiveUpdate } from '../controllers/railwayController';

const router = Router();

router.get('/lines', getLines);
router.get('/stations', getStations);
router.get('/trains', getTrains);
router.get('/search', searchTrains);
router.get('/live-status/:trainNumber', getLiveTrainStatus);
router.get('/live-board/:stationCode', getLiveStationBoard);

// Mock/Admin Route for WebSockets
router.post('/admin/simulate-update', simulateLiveUpdate);

export default router;
