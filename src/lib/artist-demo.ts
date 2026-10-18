// FICTIONAL demo tour history for Jasper Vale's artist dashboard (presentation only).
import { CONCERTS, concertStatus } from "@/lib/demo-data";
import type { TourStop } from "@/components/ArtistTourMap";

const base = new Date("2026-10-18T12:00:00Z");
const d = (days: number) => { const x = new Date(base); x.setDate(x.getDate() + days); x.setHours(20, 0, 0, 0); return x.toISOString(); };

const EXTRA: Omit<TourStop, "status">[] = [
  { id: "t-boston", city: "Boston", venue: "TD Garden", lng: -71.0621, lat: 42.3662, date: d(-260), attended: 3480 },
  { id: "t-philly", city: "Philadelphia", venue: "Wells Fargo Center", lng: -75.172, lat: 39.9012, date: d(-240), attended: 2210 },
  { id: "t-dc", city: "Washington, DC", venue: "Capital One Arena", lng: -77.0209, lat: 38.8981, date: d(-230), attended: 1290 },
  { id: "t-chicago", city: "Chicago", venue: "United Center", lng: -87.6742, lat: 41.8807, date: d(-190), attended: 4120 },
  { id: "t-detroit", city: "Detroit", venue: "Little Caesars Arena", lng: -83.0552, lat: 42.3411, date: d(-170), attended: 980 },
  { id: "t-cleveland", city: "Cleveland", venue: "Rocket Arena", lng: -81.688, lat: 41.496, date: d(-160), attended: 1640 },
  { id: "t-nashville", city: "Nashville", venue: "Bridgestone Arena", lng: -86.7785, lat: 36.1592, date: d(-100), attended: 2870 },
  { id: "t-atlanta", city: "Atlanta", venue: "State Farm Arena", lng: -84.3963, lat: 33.7573, date: d(-80), attended: 3650 },
  { id: "t-quebec", city: "Quebec City", venue: "Videotron Centre", lng: -71.2486, lat: 46.8317, date: d(-60), attended: 740 },
  { id: "t-buffalo", city: "Buffalo", venue: "KeyBank Center", lng: -78.8764, lat: 42.875, date: d(-25), attended: 1180 },
  { id: "t-minneapolis", city: "Minneapolis", venue: "Target Center", lng: -93.2761, lat: 44.9795, date: d(21), attended: 0 },
  { id: "t-denver", city: "Denver", venue: "Ball Arena", lng: -105.0077, lat: 39.7487, date: d(35), attended: 0 },
  { id: "t-vancouver", city: "Vancouver", venue: "Rogers Arena", lng: -123.1088, lat: 49.2778, date: d(48), attended: 0 },
  { id: "t-la", city: "Los Angeles", venue: "Crypto.com Arena", lng: -118.2673, lat: 34.043, date: d(60), attended: 0 },
  { id: "t-miami", city: "Miami", venue: "Kaseya Center", lng: -80.187, lat: 25.7814, date: d(75), attended: 0 },
];

const ATTENDED: Record<string, number> = { "c-toronto": 0, "c-montreal": 2940, "c-nyc": 5120, "c-pittsburgh": 1420 };

export const TOUR_STOPS: TourStop[] = [
  ...CONCERTS.filter((c) => c.artistId === "nova").map((c) => ({ id: c.id, city: c.city, venue: c.venue, lng: c.lng, lat: c.lat, date: c.date, attended: ATTENDED[c.id] ?? 0 })),
  ...EXTRA,
].map((s) => {
  const c = CONCERTS.find((x) => x.id === s.id);
  const status = c ? concertStatus(c) : (Date.parse(s.date) < Date.now() ? "past" : "upcoming");
  return { ...s, status } as TourStop;
}).sort((a, b) => a.date.localeCompare(b.date));

const past = TOUR_STOPS.filter((s) => s.status === "past");
export const OVERVIEW_STATS = {
  verified: past.reduce((n, s) => n + s.attended, 0),
  repeat: 4862,
  optIn: 21430,
  newThisMonth: 1318,
  pastShows: past.length,
  upcoming: TOUR_STOPS.filter((s) => s.status !== "past").length,
  avgCrowd: Math.round(past.reduce((n, s) => n + s.attended, 0) / Math.max(1, past.length)),
  topCity: [...past].sort((a, b) => b.attended - a.attended)[0]?.city ?? "—",
};
