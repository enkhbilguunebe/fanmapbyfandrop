import c1 from "@/assets/c1.jpg";
import c2 from "@/assets/c2.jpg";
import c3 from "@/assets/c3.jpg";
import harbor from "@/assets/harbor.jpg";
import mira from "@/assets/mira.jpg";
import june from "@/assets/june.jpg";
import atlas from "@/assets/atlas.jpg";

// DEMO DATA — fictional artists and fans. Not real ticketing or attendance data.

export type Artist = { id: string; name: string; genre: string };
export type Concert = {
  id: string;
  artistId: string;
  tour: string;
  venue: string;
  city: string;
  lng: number;
  lat: number;
  date: string; // ISO
  cover: string;
  ticketCode: string; // demo ticket
  checkinCode: string; // demo venue QR token
};

export const ARTISTS: Artist[] = [
  { id: "nova", name: "Jasper Vale", genre: "Alt-pop" },
  { id: "harbor", name: "The Harbor Lights", genre: "Indie rock" },
  { id: "mira", name: "Mira Sol", genre: "Soul" },
  { id: "june", name: "June Park", genre: "Indie folk" },
  { id: "atlas", name: "Atlas Reed", genre: "Electronic" },
];

const today = new Date("2026-10-18T12:00:00Z");
const d = (days: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + days);
  x.setHours(20, 0, 0, 0);
  return x.toISOString();
};

export const CONCERTS: Concert[] = [
  { id: "c-toronto", artistId: "nova", tour: "Afterglow Tour", venue: "Scotiabank Arena", city: "Toronto", lng: -79.3791, lat: 43.6435, date: d(0), cover: c1, ticketCode: "DEMO-TOR-001", checkinCode: "VENUE-TOR-QR" },
  { id: "c-montreal", artistId: "nova", tour: "Afterglow Tour", venue: "Bell Centre", city: "Montreal", lng: -73.5693, lat: 45.4961, date: d(-40), cover: c2, ticketCode: "DEMO-MTL-001", checkinCode: "VENUE-MTL-QR" },
  { id: "c-nyc", artistId: "nova", tour: "Afterglow Tour", venue: "Madison Square Garden", city: "New York", lng: -73.9934, lat: 40.7505, date: d(-120), cover: c1, ticketCode: "DEMO-NYC-001", checkinCode: "VENUE-NYC-QR" },
  { id: "c-chicago", artistId: "harbor", tour: "Low Tide", venue: "United Center", city: "Chicago", lng: -87.6742, lat: 41.8807, date: d(-200), cover: harbor, ticketCode: "DEMO-CHI-001", checkinCode: "VENUE-CHI-QR" },
  { id: "c-boston", artistId: "mira", tour: "Golden Hour", venue: "House of Blues", city: "Boston", lng: -71.0955, lat: 42.3473, date: d(-90), cover: mira, ticketCode: "DEMO-BOS-001", checkinCode: "VENUE-BOS-QR" },
  { id: "c-ottawa", artistId: "nova", tour: "Afterglow Tour", venue: "Canadian Tire Centre", city: "Ottawa", lng: -75.927, lat: 45.2969, date: d(14), cover: c3, ticketCode: "DEMO-OTT-001", checkinCode: "VENUE-OTT-QR" },
  { id: "c-philly", artistId: "harbor", tour: "Low Tide", venue: "The Fillmore", city: "Philadelphia", lng: -75.1335, lat: 39.9659, date: d(30), cover: harbor, ticketCode: "DEMO-PHL-001", checkinCode: "VENUE-PHL-QR" },
  { id: "c-detroit", artistId: "june", tour: "Wildflower", venue: "Fox Theatre", city: "Detroit", lng: -83.0528, lat: 42.3385, date: d(-150), cover: june, ticketCode: "DEMO-DET-001", checkinCode: "VENUE-DET-QR" },
  { id: "c-cleveland", artistId: "atlas", tour: "Daybreak", venue: "Rocket Arena", city: "Cleveland", lng: -81.688, lat: 41.496, date: d(-180), cover: atlas, ticketCode: "DEMO-CLE-001", checkinCode: "VENUE-CLE-QR" },
  { id: "c-pittsburgh", artistId: "nova", tour: "Afterglow Tour", venue: "PPG Paints Arena", city: "Pittsburgh", lng: -79.989, lat: 40.439, date: d(-210), cover: c3, ticketCode: "DEMO-PIT-001", checkinCode: "VENUE-PIT-QR" },
];

export const artistOf = (c: Concert) => ARTISTS.find((a) => a.id === c.artistId) ?? { id: c.artistId, name: "Artist", genre: "Live music" };

export type ConcertStatus = "past" | "today" | "upcoming";
export function concertStatus(c: Concert, now = new Date()): ConcertStatus {
  const t = new Date(c.date);
  if (t.toDateString() === now.toDateString()) return "today";
  return t < now ? "past" : "upcoming";
}

export const PREDICTION_QUESTIONS = [
  { id: "q1", q: "Opening song?", options: ["Afterglow", "Paper Moons", "Static Hearts", "Northbound"] },
  { id: "q2", q: "Surprise guest?", options: ["Yes", "No"] },
  { id: "q3", q: "Encore song?", options: ["Northbound", "Halo Street", "Paper Moons"] },
  { id: "q4", q: "Opening outfit color?", options: ["Black", "White", "Blue", "Red"] },
];

// Organizer-entered outcomes for past concerts (demo)
export const OUTCOMES: Record<string, Record<string, string>> = {
  "c-montreal": { q1: "Afterglow", q2: "Yes", q3: "Northbound", q4: "White" },
  "c-nyc": { q1: "Static Hearts", q2: "No", q3: "Halo Street", q4: "Black" },
};

export const LEVELS = [
  { name: "New Fan", min: 0 },
  { name: "Concert Explorer", min: 2 },
  { name: "Stage Crew", min: 4 },
  { name: "Headliner", min: 7 },
  { name: "Tour Legend", min: 12 },
];

export type Letter = { id: string; concertId: string; author: string; text: string; likes: number; createdAt: string; featured?: boolean; artistReply?: string | undefined; mine?: boolean; showCount?: boolean };
export const SEED_LETTERS: Letter[] = [
  { id: "l1", concertId: "c-montreal", author: "Camille R.", text: "Paper Moons got me through my first winter away from home. Hearing it live in Montreal felt like closing a chapter.", likes: 214, createdAt: d(-39), featured: true, artistReply: "Camille, this means the world. Thank you for being there. — Nova" },
  { id: "l2", concertId: "c-montreal", author: "Dev P.", text: "Third show this year. The acoustic bridge in Northbound was unreal.", likes: 88, createdAt: d(-38) },
  { id: "l3", concertId: "c-toronto", author: "Aiko T.", text: "Hometown show tonight! Thank you for coming back to Toronto.", likes: 41, createdAt: d(-1) },
  { id: "l4", concertId: "c-nyc", author: "Marcus L.", text: "MSG was my first concert ever. My dad took me. We still talk about it.", likes: 132, createdAt: d(-118) },
];

export type Reel = { id: string; concertId: string; author: string; poster: string; caption: string; status: "approved" | "pending"; video?: string | undefined };
export const SEED_REELS: Reel[] = [
  { id: "r1", concertId: "c-toronto", author: "Aiko T.", poster: c1, caption: "Lights drop on Afterglow", status: "approved" },
  { id: "r2", concertId: "c-toronto", author: "Jordan K.", poster: c2, caption: "Whole arena singing", status: "approved" },
  { id: "r3", concertId: "c-toronto", author: "Sam W.", poster: c3, caption: "Front row acoustic", status: "approved" },
];

export const FRIENDS = [
  { id: "f1", name: "Aiko T.", concerts: ["c-toronto", "c-montreal"] },
  { id: "f2", name: "Jordan K.", concerts: ["c-nyc", "c-chicago"] },
  { id: "f3", name: "Camille R.", concerts: ["c-montreal"] },
];

export const PHOTOS = [
  { id: "p1", concertId: "c-montreal", src: c2 },
  { id: "p2", concertId: "c-montreal", src: c1 },
  { id: "p3", concertId: "c-nyc", src: c1 },
  { id: "p4", concertId: "c-boston", src: c3 },
  { id: "p5", concertId: "c-chicago", src: c2 },
  { id: "p6", concertId: "c-toronto", src: c3 },
];

// Demo CRM audience (fictional)
export const CRM_FANS = [
  { name: "Camille R.", city: "Montreal", nova: 5, optIn: true },
  { name: "Dev P.", city: "Toronto", nova: 3, optIn: true },
  { name: "Aiko T.", city: "Toronto", nova: 2, optIn: true },
  { name: "Marcus L.", city: "New York", nova: 1, optIn: false },
  { name: "Lena S.", city: "Ottawa", nova: 4, optIn: true },
  { name: "Omar H.", city: "Boston", nova: 1, optIn: true },
];
