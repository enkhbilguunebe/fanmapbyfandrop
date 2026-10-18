import { create } from "zustand";
import { CONCERTS, type Letter } from "./demo-data";

export const DEMO_PASSWORD = "fanmap";
export const DEMO_ATTENDANCE = ["c-montreal", "c-nyc", "c-chicago", "c-boston", "c-detroit", "c-cleveland", "c-pittsburgh"];
export const DEMO_FRIENDS = [
  { id: "demo-aiko", name: "Aiko Tanaka", initials: "AT", place: "Union Station plaza", lat: 43.6453, lng: -79.3806 },
  { id: "demo-jordan", name: "Jordan Kim", initials: "JK", place: "Scotiabank Arena entrance", lat: 43.6435, lng: -79.3791 },
  { id: "demo-camille", name: "Camille Roy", initials: "CR", place: "Roundhouse Park", lat: 43.6417, lng: -79.3853 },
  { id: "demo-dev", name: "Dev Patel", initials: "DP", place: "Harbourfront Centre", lat: 43.6389, lng: -79.3818 },
  { id: "demo-lena", name: "Lena Santos", initials: "LS", place: "Bremner Boulevard", lat: 43.6427, lng: -79.382 },
];
const AUTHORS = ["Camille Roy", "Dev Patel", "Aiko Tanaka", "Marcus Lee", "Lena Santos", "Jordan Kim", "Omar Hassan", "Sofia Martin"];
const STORIES = [
  "I moved to a new city this year. Singing along with a room full of strangers made it feel like home for the first time. Thank you for that.",
  "That stripped-back bridge was my favourite moment. No big production, just your voice and everyone listening. Still thinking about it.",
  "Brought my little sister to her first show. She knew every word and hasn't stopped talking about the encore!",
  "We took the train in and made a whole day of it. The concert was the perfect ending. Already planning our next trip.",
  "Your songs have been my study soundtrack all semester. Finally hearing them live with my friends felt like a reward for all those late nights.",
  "Seven different shows in my passport now, but this night has its own special place. The crowd was incredible.",
  "I came on my own and left with new friends. Music really does bring people together. Thank you for an unforgettable night.",
  "The final chorus gave me goosebumps. My favourite part was watching everyone put their phones down and just be there.",
];
export const DEMO_LETTERS: Letter[] = CONCERTS.flatMap((c, ci) => AUTHORS.map((author, i) => ({
  id: `demo-letter-${c.id}-${i}`, concertId: c.id, author, text: STORIES[(i + ci) % STORIES.length] ?? "An unforgettable night!",
  likes: [214, 88, 67, 132, 41, 26, 12, 3][i] ?? 0,
  createdAt: new Date(Date.UTC(2026, 9, 18, 15 - i, 20)).toISOString(),
  featured: i === 0, artistReply: i === 0 ? "Thank you for sharing this. So glad you were part of the night!" : undefined,
})));
export function demoFriendRows(userId: string) {
  return DEMO_FRIENDS.map(f => ({ id: f.id, sender_id: userId, receiver_id: f.id, status: "accepted", person: { display_name: f.name } }));
}
export function demoChatRows(userId: string) {
  return DEMO_FRIENDS.flatMap((f, i) => [
    { id: `${f.id}-1`, friendship_id: f.id, sender_id: f.id, text: ["Are you coming to Toronto tonight?", "Still thinking about that encore in Montreal!", "I saved our concert photos. They turned out so well!", "Want to meet the group before the show?", "June Park was amazing — what's our next concert?"][i], created_at: "2026-10-18T14:05:00Z" },
    { id: `${f.id}-2`, friendship_id: f.id, sender_id: userId, text: "Yes! Let's meet before doors open. I'll bring the others too 🎶", created_at: "2026-10-18T14:12:00Z" },
    { id: `${f.id}-3`, friendship_id: f.id, sender_id: f.id, text: ["Perfect! I'm by Union Station. Find me on the map 💚", "Let's get a photo together this time!", "Sending you my favourite one after the show 📸", "Meet at the plaza? We can walk over together.", "Mira Sol next? That live piano set looks incredible."][i], created_at: "2026-10-18T15:25:00Z" },
  ]);
}
export const DEMO_DELIVERIES = [
  { id: "demo-artist-1", artist_id: "nova", text: "Olivia, thank you for being part of the Afterglow journey. Seeing familiar faces in the crowd means everything. — Jasper", created_at: "2026-10-17T17:30:00Z" },
  { id: "demo-artist-2", artist_id: "nova", text: "Toronto, tonight is yours! We've added an acoustic surprise to the set. Can't wait to sing with you all. 🎶", created_at: "2026-10-18T13:00:00Z" },
  { id: "demo-artist-3", artist_id: "nova", text: "Here's a little thank-you to our returning fans: share your favourite tour memory in Letters. We are reading them backstage. 💚", created_at: "2026-10-18T15:10:00Z" },
];
type DemoState = { letters: Letter[]; liked: string[]; chat: ReturnType<typeof demoChatRows>; patchLetter: (id: string, change: Partial<Letter>) => void; like: (id: string) => void; addLetter: (concertId: string, text: string) => void; send: (friendshipId: string, userId: string, text: string) => void };
export const usePresentationDemo = create<DemoState>((set) => ({
  letters: DEMO_LETTERS, liked: [], chat: [],
  patchLetter: (id, change) => set(s => ({ letters: s.letters.map(l => l.id === id ? { ...l, ...change } : l) })),
  like: id => set(s => ({ liked: s.liked.includes(id) ? s.liked.filter(x => x !== id) : [...s.liked, id], letters: s.letters.map(l => l.id === id ? { ...l, likes: l.likes + (s.liked.includes(id) ? -1 : 1) } : l) })),
  addLetter: (concertId, text) => set(s => ({ letters: [{ id: `demo-letter-new-${crypto.randomUUID()}`, concertId, text, author: "You", likes: 0, createdAt: new Date().toISOString(), mine: true }, ...s.letters] })),
  send: (friendshipId, userId, text) => set(s => ({ chat: [...s.chat, { id: crypto.randomUUID(), friendship_id: friendshipId, sender_id: userId, text, created_at: new Date().toISOString() }] })),
}));