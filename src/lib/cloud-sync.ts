import { supabase } from "@/integrations/supabase/client";
import { useApp } from "./store";
let generation = 0;
export function clearCloudState() {
  generation++;
  useApp.setState({ role: "visitor", tickets: [], stamps: [], letters: [], reels: [], messages: [], predictions: {}, locked: {}, votes: {}, likedLetters: [] });
}
export async function syncCloud() {
  const current = ++generation;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    useApp.setState({
      role: "visitor",
      tickets: [],
      stamps: [],
      letters: [],
      reels: [],
      messages: [],
      predictions: {},
      locked: {},
      votes: {},
    });
    return;
  }
  const [role, tickets, attendance, letters, likes, reels, predictions, votes, deliveries] =
    await Promise.all([
      supabase.from("user_roles").select("*").eq("user_id", user.id).single(),
      supabase.from("tickets").select("*"),
      supabase.from("attendance").select("*").eq("user_id", user.id),
      supabase.from("letters").select("*").order("created_at", { ascending: false }),
      supabase.from("letter_likes").select("*"),
      supabase.from("reels").select("*"),
      supabase.from("predictions").select("*"),
      supabase.from("reel_votes").select("*"),
      supabase.from("deliveries").select("*").order("created_at"),
    ]);
  const playable = await Promise.all(
    (reels.data ?? []).map(async (r) => {
      const { data } = await supabase.storage.from("fanmap-media").createSignedUrl(r.path, 60);
      return { ...r, url: data?.signedUrl };
    }),
  );
  const { data: session } = await supabase.auth.getSession();
  if (current !== generation || session.session?.user.id !== user.id) return;
  useApp.setState({
    role:
      role.data?.role === "artist"
        ? "artist"
        : (attendance.data?.length ?? 0) > 0
          ? "returning"
          : "fan",
    tickets: (tickets.data ?? []).map((t) => t.event_id),
    stamps: (attendance.data ?? []).map((a) => ({
      concertId: a.event_id,
      at: a.attended_at,
      id: a.id,
    })),
    letters: (letters.data ?? []).map((l) => ({
      id: l.id,
      concertId: l.event_id,
      author: l.user_id === user.id ? "You" : "Verified fan",
      text: l.text,
      likes: (likes.data ?? []).filter((x) => x.letter_id === l.id).length,
      createdAt: l.created_at,
      featured: l.featured,
      artistReply: l.artist_reply ?? undefined,
      mine: l.user_id === user.id,
      showCount: l.show_count,
    })),
    likedLetters: (likes.data ?? []).filter((l) => l.user_id === user.id).map((l) => l.letter_id),
    reels: playable.map((r) => ({
      id: r.id,
      concertId: r.event_id,
      author: r.user_id === user.id ? "You" : "Verified fan",
      poster: "",
      caption: r.caption,
      status: r.status === "approved" ? "approved" : "pending",
      video: r.url,
    })),
    predictions: Object.fromEntries(
      (predictions.data ?? []).map((p) => [p.event_id, p.answers as Record<string, string>]),
    ),
    locked: Object.fromEntries((predictions.data ?? []).map((p) => [p.event_id, p.locked])),
    votes: Object.fromEntries((votes.data ?? []).map((v) => [v.event_id, v.reel_id])),
    messages: (deliveries.data ?? []).map((d) => ({
      id: d.id,
      thread: "artist-" + d.artist_id,
      from: "artist",
      text: d.text,
      at: d.created_at,
      mediaPath: d.media_path ?? undefined,
      mediaType: d.media_type ?? undefined,
    })),
  });
}
