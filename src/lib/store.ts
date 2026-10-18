import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CONCERTS, SEED_LETTERS, SEED_REELS, LEVELS, type Letter, type Reel } from "./demo-data";

export type Role = "visitor" | "fan" | "returning" | "artist";
export type MapStyle = "default" | "satellite" | "fanmap";
export type Message = { id: string; thread: string; from: "me" | "them" | "artist"; text: string; at: string };

type State = {
  role: Role;
  tickets: string[]; // concert ids with verified ticket
  stamps: { concertId: string; at: string; id: string }[]; // verified attendance
  predictions: Record<string, Record<string, string>>;
  locked: Record<string, boolean>;
  letters: Letter[];
  likedLetters: string[];
  reels: Reel[];
  votes: Record<string, string>; // concertId -> reelId
  messages: Message[];
  mapStyle: MapStyle;
  audit: { at: string; event: string }[];
  setRole: (r: Role) => void;
  setMapStyle: (s: MapStyle) => void;
  verifyTicket: (code: string) => string | null;
  checkIn: (code: string) => string | null;
  setPrediction: (cid: string, q: string, a: string) => void;
  lockPredictions: (cid: string) => void;
  addLetter: (cid: string, text: string, showCount: boolean) => void;
  deleteLetter: (id: string) => void;
  toggleLike: (id: string) => void;
  featureLetter: (id: string) => void;
  replyLetter: (id: string, text: string) => void;
  submitReel: (cid: string, poster: string, caption: string) => void;
  moderateReel: (id: string) => void;
  vote: (cid: string, rid: string) => void;
  sendMessage: (thread: string, text: string, from?: Message["from"]) => void;
};

const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

const RETURNING_STAMPS = ["c-montreal", "c-nyc", "c-chicago", "c-boston"].map((c) => ({ concertId: c, at: now(), id: "ATT-" + c.slice(2).toUpperCase() }));

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      role: "returning",
      tickets: ["c-toronto", "c-ottawa"],
      stamps: RETURNING_STAMPS,
      predictions: {},
      locked: {},
      letters: SEED_LETTERS,
      likedLetters: [],
      reels: SEED_REELS,
      votes: {},
      messages: [
        { id: "m1", thread: "artist-nova", from: "artist", text: "Toronto, tonight's the night. Doors at 7. See you there.", at: now() },
        { id: "m2", thread: "f1", from: "them", text: "Are you going tonight?!", at: now() },
      ],
      mapStyle: "fanmap",
      audit: [],
      setRole: (role) =>
        set(() => {
          if (role === "visitor") return { role, tickets: [], stamps: [] };
          if (role === "fan") return { role, tickets: ["c-toronto"], stamps: [] };
          return { role, tickets: ["c-toronto", "c-ottawa"], stamps: RETURNING_STAMPS };
        }),
      setMapStyle: (mapStyle) => set({ mapStyle }),
      verifyTicket: (code) => {
        const c = CONCERTS.find((x) => x.ticketCode === code.trim().toUpperCase());
        if (!c) return "Ticket not recognised.";
        if (get().tickets.includes(c.id)) return "This ticket is already linked.";
        set((s) => ({ tickets: [...s.tickets, c.id], audit: [...s.audit, { at: now(), event: `ticket ${code}` }] }));
        return null;
      },
      checkIn: (code) => {
        const c = CONCERTS.find((x) => x.checkinCode === code.trim().toUpperCase());
        if (!c) return "Invalid or expired venue code.";
        const s = get();
        if (!s.tickets.includes(c.id)) return "Verify your ticket for this concert first.";
        if (s.stamps.some((x) => x.concertId === c.id)) return "Already checked in — duplicate claim blocked.";
        if (new Date(c.date).toDateString() !== new Date().toDateString()) return "Check-in only opens on the concert day.";
        set((st) => ({ stamps: [...st.stamps, { concertId: c.id, at: now(), id: "ATT-" + uid().toUpperCase() }], audit: [...st.audit, { at: now(), event: `checkin ${c.id}` }] }));
        return null;
      },
      setPrediction: (cid, q, a) => {
        if (get().locked[cid]) return;
        set((s) => ({ predictions: { ...s.predictions, [cid]: { ...s.predictions[cid], [q]: a } } }));
      },
      lockPredictions: (cid) => set((s) => ({ locked: { ...s.locked, [cid]: true } })),
      addLetter: (cid, text, showCount) =>
        set((s) => ({ letters: [{ id: uid(), concertId: cid, author: "You", text, likes: 0, createdAt: now(), mine: true, showCount }, ...s.letters] })),
      deleteLetter: (id) => set((s) => ({ letters: s.letters.filter((l) => l.id !== id) })),
      toggleLike: (id) =>
        set((s) => {
          const liked = s.likedLetters.includes(id);
          return {
            likedLetters: liked ? s.likedLetters.filter((x) => x !== id) : [...s.likedLetters, id],
            letters: s.letters.map((l) => (l.id === id ? { ...l, likes: l.likes + (liked ? -1 : 1) } : l)),
          };
        }),
      featureLetter: (id) => set((s) => ({ letters: s.letters.map((l) => (l.id === id ? { ...l, featured: !l.featured } : l)) })),
      replyLetter: (id, text) => set((s) => ({ letters: s.letters.map((l) => (l.id === id ? { ...l, artistReply: text } : l)) })),
      submitReel: (cid, poster, caption) =>
        set((s) => ({ reels: [...s.reels, { id: uid(), concertId: cid, author: "You", poster, caption, status: "pending" }] })),
      moderateReel: (id) => set((s) => ({ reels: s.reels.map((r) => (r.id === id ? { ...r, status: "approved" } : r)) })),
      vote: (cid, rid) => {
        if (get().votes[cid]) return;
        set((s) => ({ votes: { ...s.votes, [cid]: rid } }));
      },
      sendMessage: (thread, text, from = "me") => set((s) => ({ messages: [...s.messages, { id: uid(), thread, from, text, at: now() }] })),
    }),
    { name: "fanmap-demo-v1", skipHydration: true, partialize: ({ audit: _a, ...rest }) => rest },
  ),
);

export function levelFor(count: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => count >= l.min && (idx = i));
  const next = LEVELS[idx + 1];
  return { level: LEVELS[idx]!, next, progress: next ? (count - LEVELS[idx]!.min) / (next.min - LEVELS[idx]!.min) : 1 };
}
