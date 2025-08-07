import { PrismaClient } from '@prisma/client';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const MTA_GTFS_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs";
const AIR_QUALITY_URL = `https://api.airvisual.com/v2/city?city=New York City&state=New York&country=USA&key=${process.env.IQAIR_API_KEY}`;

// POST function
export async function POST(req) {
    try {
        let data = await req.json();

        // Fetch subway data if requested
        if (!data.subwayStatus || data.subwayStatus === 'live') {
            const res = await fetch(MTA_GTFS_URL);
            const buffer = await res.arrayBuffer();
            const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
            const trainRoutes = feed.entity
                .filter(e => e.tripUpdate)
                .slice(0, 10)
                .map(e => e.tripUpdate.trip.routeId)
                .join(', ');
            data.subwayStatus = `Active train lines (sample): ${trainRoutes}`;
        }

        // Fetch air quality if requested
        if (!data.airQuality || data.airQuality === 'live') {
            const airRes = await fetch(AIR_QUALITY_URL);
            const airData = await airRes.json();
            data.airQuality = airData.data?.current?.pollution
                ? `AQI (US): ${airData.data.current.pollution.aqius}`
                : 'Unavailable';
        }

        // Save to DB
        const newSnapshot = await prisma.dailySnapshot.create({
            data: {
                subwayStatus: data.subwayStatus,
                airQuality: data.airQuality,
                eventInfo: data.eventInfo,
                userNote: data.userNote || '',
            },
        });

        return new Response(JSON.stringify(newSnapshot), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// GET function (move outside POST)
export async function GET() {
    try {
        const snapshots = await prisma.dailySnapshot.findMany({
            orderBy: { date: 'desc' },
            take: 20,
        });
        return new Response(JSON.stringify(snapshots), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
