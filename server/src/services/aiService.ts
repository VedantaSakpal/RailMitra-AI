import { GoogleGenAI, Type } from "@google/genai";
import { PrismaClient } from "@prisma/client";
import { calculateRailwayDistance } from "./distanceService";
import { calculateFare, CoachClass } from "../utils/fareCalculator";

const prisma = new PrismaClient();
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ GEMINI_API_KEY is not defined in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const SYSTEM_PROMPT = `
You are RailMitra AI, an intelligent and helpful assistant for the Mumbai Local Railway system.
You help users find train routes, understand train schedules, calculate fares, provide information about stations on the Central, Western, Harbour, and Trans-Harbour lines, and offer guidance on ticketing and passes.

RULES:
- Keep your answers concise, friendly, and structured. Use markdown formatting where appropriate.
- If a user asks a question unrelated to the Mumbai Local Railway or transportation, politely redirect them back to railway topics.
- DO NOT invent or guess fares or distances. Always use the provided tools to get accurate data.
- If a user asks to plan a journey or wants to know the distance/fare, ALWAYS use the calculate_route_and_fare tool.
- If a user asks about their tickets, use the get_my_tickets tool.
- Never output raw JSON from the tools to the user. Interpret the tool output and present it nicely in a friendly way.
- Respond in the same language as the user (English, Hindi, or Marathi).
`;

const tools = [
  {
    name: "calculate_route_and_fare",
    description: "Calculates the railway distance, route, and fare between two Mumbai Local stations. Use this whenever the user asks about journeys, distances, or fares.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        origin_station_name: {
          type: Type.STRING,
          description: "The name or code of the origin station (e.g., 'CSMT', 'Dombivli', 'Kalyan').",
        },
        dest_station_name: {
          type: Type.STRING,
          description: "The name or code of the destination station.",
        },
        coach_class: {
          type: Type.STRING,
          description: "Class of travel: 'SECOND', 'FIRST', or 'AC'. Defaults to 'SECOND'.",
        },
        is_return: {
          type: Type.BOOLEAN,
          description: "Whether it is a return journey. Defaults to false.",
        },
        passengers: {
          type: Type.NUMBER,
          description: "Number of passengers. Defaults to 1.",
        },
      },
      required: ["origin_station_name", "dest_station_name"],
    },
  },
  {
    name: "get_station_info",
    description: "Gets information about a specific Mumbai Local station including its line, zone, and facilities.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_name: {
          type: Type.STRING,
          description: "The name or code of the station.",
        },
      },
      required: ["station_name"],
    },
  },
  {
    name: "get_my_tickets",
    description: "Retrieves the authenticated user's active tickets.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

async function resolveStation(nameOrCode: string) {
  return prisma.station.findFirst({
    where: {
      OR: [
        { code: { equals: nameOrCode, mode: "insensitive" } },
        { name: { contains: nameOrCode, mode: "insensitive" } },
      ],
    },
    include: { line: true },
  });
}

async function callFunction(name: string, args: any, userId?: string): Promise<any> {
  if (name === "calculate_route_and_fare") {
    const { origin_station_name, dest_station_name, coach_class = "SECOND", is_return = false, passengers = 1 } = args;
    const origin = await resolveStation(origin_station_name);
    const dest = await resolveStation(dest_station_name);
    if (!origin) return { error: `Could not find station: "${origin_station_name}"` };
    if (!dest) return { error: `Could not find station: "${dest_station_name}"` };
    if (origin.id === dest.id) return { error: "Origin and destination are the same." };
    const { distanceKm, routeDescription } = await calculateRailwayDistance(origin.id, dest.id);
    const farePerPerson = calculateFare({ distanceKm, isReturn: is_return, coachClass: coach_class as CoachClass });
    return {
      route: `${origin.name} (${origin.code}) → ${dest.name} (${dest.code})`,
      distance_km: distanceKm,
      route_description: routeDescription,
      fare_per_person: farePerPerson,
      total_fare: farePerPerson * passengers,
      class: coach_class,
      is_return,
      passengers,
      origin_line: origin.line.name,
      dest_line: dest.line.name,
    };
  }

  if (name === "get_station_info") {
    const station = await resolveStation(args.station_name);
    if (!station) return { error: `Could not find station: "${args.station_name}"` };
    return {
      name: station.name,
      code: station.code,
      line: station.line.name,
      zone: station.zone,
      is_terminal: station.isTerminal,
      has_parking: station.hasParking,
      has_lift: station.hasLift,
    };
  }

  if (name === "get_my_tickets") {
    if (!userId) return { error: "You must be logged in to view tickets." };
    const tickets = await prisma.ticket.findMany({
      where: { userId, status: "ACTIVE" },
      include: { originStation: true, destStation: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    if (tickets.length === 0) return { message: "You have no active tickets." };
    return tickets.map((t) => ({
      ticket_number: t.ticketNumber,
      route: `${t.originStation.name} → ${t.destStation.name}`,
      passengers: t.passengerCount,
      fare: t.fare,
      valid_until: t.validUntil.toISOString(),
    }));
  }

  return { error: `Unknown function: ${name}` };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendWithRetry(chat: any, message: any, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await chat.sendMessage({ message });
    } catch (err: any) {
      const errStr = typeof err === 'string' ? err : JSON.stringify(err);
      const is503 = errStr.includes('"code":503') || errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand');
      if (is503 && attempt < maxRetries - 1) {
        const wait = (attempt + 1) * 3000; // 3s, 6s, 9s
        console.log(`Rate limited, retrying in ${wait / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
}

export const generateAIResponse = async (
  userMessage: string,
  chatHistory: any[] = [],
  userId?: string
): Promise<string> => {
  if (!apiKey) {
    return "I'm currently undergoing maintenance. (Error: Gemini API Key is missing on the server).";
  }

  try {
    const history = chatHistory
      .filter((m: any) => m.text || m.parts?.[0]?.text)
      .map((msg: any) => ({
        role: msg.role === "ai" || msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.text || msg.parts?.[0]?.text || "" }],
      }));

    const chat = ai.chats.create({
      model: "gemini-3.8-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: tools as any }],
      },
      history,
    });

    let response = await sendWithRetry(chat, userMessage);

    // Tool-calling loop (max 3 rounds)
    let loops = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && loops < 3) {
      const call = response.functionCalls[0];
      let result: any;
      try {
        result = await callFunction(call.name || "", call.args || {}, userId);
      } catch (err: any) {
        result = { error: err.message };
      }

      response = await sendWithRetry(chat, [{ functionResponse: { name: call.name || "", response: result } }]);
      loops++;
    }

    return response.text || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error: any) {
    const errStr = typeof error === 'string' ? error : JSON.stringify(error);
    console.error("AI Service Error:", errStr);

    if (errStr.includes('"code":503') || errStr.includes('"status":503') || errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE')) {
      return "⚠️ The AI is currently busy due to high demand on Google's servers. Your free-tier API key has a limit of **5 requests/minute** and **20 requests/day**. Please wait a moment and try again.";
    }
    if (errStr.includes('"code":429') || errStr.includes('"status":429') || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
      return "⚠️ You've reached your daily AI quota (20 requests/day on the free tier). The limit resets at midnight. Consider upgrading your Gemini API plan for higher limits.";
    }
    if (errStr.includes('"code":404') || errStr.includes('"status":404') || errStr.includes('404') || errStr.includes('NOT_FOUND')) {
      return "⚠️ AI model configuration error. Please contact support.";
    }

    return "I'm sorry, I'm having trouble connecting to the AI right now. Please try again in a moment.";
  }
};
