import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Mumbai Local pass fares (approximate, based on zone & type)
// Zone covers ~10 stations per zone (1-6)
const PASS_FARES: Record<string, Record<number, number>> = {
  DAILY:     { 1: 25,  2: 35,  3: 45,  4: 55,  5: 65,  6: 75 },
  MONTHLY:   { 1: 300, 2: 420, 3: 550, 4: 680, 5: 800, 6: 950 },
  QUARTERLY: { 1: 800, 2: 1100, 3: 1450, 4: 1800, 5: 2100, 6: 2500 },
  YEARLY:    { 1: 2800, 2: 3800, 3: 5000, 4: 6200, 5: 7300, 6: 8700 },
};

const PASS_VALIDITY_DAYS: Record<string, number> = {
  DAILY: 1,
  MONTHLY: 30,
  QUARTERLY: 90,
  YEARLY: 365,
};

export const buyPass = async (req: AuthRequest, res: Response) => {
  try {
    const { type, zone, isFirstClass = false, coachClass } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const validTypes = ['DAILY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
    const validZones = [1, 2, 3, 4, 5, 6];
    const validClasses = ['SECOND', 'FIRST', 'AC'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid pass type' });
    }
    if (!validZones.includes(Number(zone))) {
      return res.status(400).json({ success: false, message: 'Zone must be 1-6' });
    }

    const resolvedClass: string = coachClass ?? (isFirstClass ? 'FIRST' : 'SECOND');
    if (!validClasses.includes(resolvedClass)) {
      return res.status(400).json({ success: false, message: 'Invalid coach class. Use SECOND, FIRST, or AC' });
    }

    const baseFare = PASS_FARES[type][Number(zone)];
    let fareMultiplier = 1;
    if (resolvedClass === 'FIRST') fareMultiplier = 10;
    if (resolvedClass === 'AC')    fareMultiplier = 20;
    const fare = baseFare * fareMultiplier;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + PASS_VALIDITY_DAYS[type]);

    // Create mock payment
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: fare,
        status: 'COMPLETED',
        method: 'MOCK_UPI',
        transactionId: `mock_pass_${Date.now()}`
      }
    });

    const passNumber = `PASS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const qrCodeData = `RAILMITRA:${passNumber}:${userId}:${type}:ZONE${zone}:${resolvedClass}`;

    const pass = await prisma.pass.create({
      data: {
        passNumber,
        userId,
        type: type as any,
        status: 'ACTIVE',
        zone: Number(zone),
        fare,
        startDate,
        endDate,
        qrCode: qrCodeData,
        paymentId: payment.id
      }
    });

    return res.status(201).json({ success: true, data: { pass, payment } });
  } catch (error) {
    console.error('Buy Pass Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to purchase pass' });
  }
};

export const getUserPasses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const passes = await prisma.pass.findMany({
      where: { userId },
      include: { payment: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: passes });
  } catch (error) {
    console.error('Get User Passes Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch passes' });
  }
};
