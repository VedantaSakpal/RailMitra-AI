import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateFare, CoachClass } from '../utils/fareCalculator';
import { calculateRailwayDistance } from '../services/distanceService';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ─── Estimate (no auth required) ───────────────────────────────────────────
export const estimateTicket = async (req: any, res: Response) => {
  try {
    const { originStationId, destStationId, passengerCount = 1, isReturn = false, coachClass = 'SECOND' } = req.body;

    if (!originStationId || !destStationId) {
      return res.status(400).json({ success: false, message: 'Origin and destination required' });
    }
    if (originStationId === destStationId) {
      return res.status(400).json({ success: false, message: 'Origin and destination cannot be the same' });
    }

    const [origin, dest] = await Promise.all([
      prisma.station.findUnique({ where: { id: originStationId } }),
      prisma.station.findUnique({ where: { id: destStationId } }),
    ]);

    if (!origin || !dest) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    const { distanceKm, routeDescription } = await calculateRailwayDistance(originStationId, destStationId);
    const farePerPerson = calculateFare({ distanceKm, isReturn, coachClass: coachClass as CoachClass });
    const totalFare = farePerPerson * Number(passengerCount);

    // Base one-way fare for display
    const baseFare = calculateFare({ distanceKm, isReturn: false, coachClass: 'SECOND' });

    return res.json({
      success: true,
      data: {
        originStation: origin,
        destStation: dest,
        distanceKm,
        routeDescription,
        baseFare,
        farePerPerson,
        totalFare,
        passengerCount: Number(passengerCount),
        isReturn,
        coachClass,
      },
    });
  } catch (err) {
    console.error('Estimate error:', err);
    return res.status(500).json({ success: false, message: 'Failed to estimate fare' });
  }
};

// ─── Book Ticket ────────────────────────────────────────────────────────────
export const bookTicket = async (req: AuthRequest, res: Response) => {
  try {
    const {
      originStationId,
      destStationId,
      passengerCount = 1,
      isReturn = false,
      coachClass = 'SECOND',
      paymentMethod = 'MOCK_UPI',
    } = req.body;

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!originStationId || !destStationId) {
      return res.status(400).json({ success: false, message: 'Origin and destination required' });
    }
    if (originStationId === destStationId) {
      return res.status(400).json({ success: false, message: 'Origin and destination cannot be the same' });
    }

    const validClasses = ['SECOND', 'FIRST', 'AC'];
    if (!validClasses.includes(coachClass)) {
      return res.status(400).json({ success: false, message: 'Invalid coach class' });
    }

    // Fetch stations
    const [origin, dest] = await Promise.all([
      prisma.station.findUnique({ where: { id: originStationId } }),
      prisma.station.findUnique({ where: { id: destStationId } }),
    ]);

    if (!origin || !dest) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    // SERVER-SIDE distance + fare calculation (never trust frontend values)
    const { distanceKm } = await calculateRailwayDistance(originStationId, destStationId);
    const farePerPerson = calculateFare({ distanceKm, isReturn, coachClass: coachClass as CoachClass });
    const totalFare = farePerPerson * Number(passengerCount);

    // Create mock payment
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: totalFare,
        status: 'COMPLETED',
        method: paymentMethod,
        transactionId: `mock_${crypto.randomUUID()}`,
      },
    });

    // Ticket validity: 24 hours from booking
    const bookedAt = new Date();
    const validUntil = new Date(bookedAt.getTime() + 24 * 60 * 60 * 1000);

    const ticketNumber = `RM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const qrCodeData = `RAILMITRA:${ticketNumber}:${userId}:${isReturn ? 'RETURN' : 'ONEWAY'}:${coachClass}:${Math.round(distanceKm)}km`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        userId,
        originStationId,
        destStationId,
        passengerCount: Number(passengerCount),
        fare: totalFare,
        status: 'ACTIVE',
        qrCode: qrCodeData,
        travelDate: bookedAt,
        validUntil,
        paymentId: payment.id,
      },
      include: {
        originStation: true,
        destStation: true,
        payment: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        ticket,
        payment,
        meta: { distanceKm, farePerPerson, totalFare, coachClass, isReturn },
      },
    });
  } catch (err) {
    console.error('Book Ticket Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to book ticket' });
  }
};

// ─── Get User Tickets ───────────────────────────────────────────────────────
export const getUserTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: { originStation: true, destStation: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    console.error('Get User Tickets Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
};
