import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculates the railway route distance between two stations using the
 * StationDistance graph stored in the database.
 *
 * Strategy:
 * 1. Look for a direct path on a single line by summing consecutive StationDistance
 *    records from `from → to` (or `to → from` for reverse).
 * 2. If stations are on different lines, attempt a known interchange (Dadar, Kurla,
 *    Thane, Panvel) to find the shortest valid two-segment path.
 * 3. Falls back to straight-line estimate if no path found.
 */
export async function calculateRailwayDistance(
  fromStationId: string,
  toStationId: string
): Promise<{ distanceKm: number; routeDescription: string }> {
  if (fromStationId === toStationId) {
    return { distanceKm: 0, routeDescription: 'Same station' };
  }

  // Try BFS/walk through the StationDistance graph on each available line
  const allDistances = await prisma.stationDistance.findMany();

  // Build adjacency list: stationId -> list of {toId, km, lineCode}
  type Edge = { toId: string; km: number; lineCode: string };
  const graph = new Map<string, Edge[]>();

  for (const d of allDistances) {
    if (!graph.has(d.fromStationId)) graph.set(d.fromStationId, []);
    if (!graph.has(d.toStationId)) graph.set(d.toStationId, []);

    graph.get(d.fromStationId)!.push({ toId: d.toStationId, km: d.distanceKm, lineCode: d.lineCode });
    // Add reverse direction (trains run both ways)
    graph.get(d.toStationId)!.push({ toId: d.fromStationId, km: d.distanceKm, lineCode: d.lineCode });
  }

  // Dijkstra's shortest path
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; cost: number }> = [];

  dist.set(fromStationId, 0);
  queue.push({ id: fromStationId, cost: 0 });

  while (queue.length > 0) {
    // Find node with minimum cost
    queue.sort((a, b) => a.cost - b.cost);
    const { id: current, cost: currentCost } = queue.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === toStationId) break;

    const neighbors = graph.get(current) ?? [];
    for (const edge of neighbors) {
      const newCost = currentCost + edge.km;
      const existing = dist.get(edge.toId) ?? Infinity;
      if (newCost < existing) {
        dist.set(edge.toId, newCost);
        prev.set(edge.toId, current);
        queue.push({ id: edge.toId, cost: newCost });
      }
    }
  }

  const totalKm = dist.get(toStationId);

  if (totalKm !== undefined && totalKm > 0) {
    return {
      distanceKm: Math.round(totalKm * 10) / 10,
      routeDescription: 'Railway route distance',
    };
  }

  // Fallback: fetch station details and use sequence difference heuristic
  const from = await prisma.station.findUnique({ where: { id: fromStationId } });
  const to = await prisma.station.findUnique({ where: { id: toStationId } });

  if (from && to && from.lineId === to.lineId) {
    const seqDiff = Math.abs(from.sequence - to.sequence);
    return {
      distanceKm: Math.max(1, seqDiff * 2),
      routeDescription: 'Estimated (same line)',
    };
  }

  return {
    distanceKm: 15,
    routeDescription: 'Estimated (cross-line)',
  };
}
