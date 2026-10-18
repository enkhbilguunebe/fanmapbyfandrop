import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { artistAudience, sendAnnouncement } from "@/lib/fanmap.functions";
import { useAccount } from "@/lib/account";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate, TopBar } from "@/components/AppShell";
import { toast } from "sonner";
import { BadgeCheck, Star } from "lucide-react";
import { CONCERTS, CRM_FANS, concertStatus } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { usePresentationDemo } from "@/lib/presentation-demo";

export const Route = createFileRoute("/artist")({
  head: () => ({
    meta: [
      { title: "Artist Command Center — FanMap" },
      {
        name: "description",
        content:
          "Understand your verified audience, moderate fan activities and message loyal fans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Artist Command Center — FanMap" },
      {
        property: "og:description",
        content: "Verified audience insights and loyalty CRM for artists.",
      },
    ],
  }),
  component: Artist,
});

const SECTIONS = ["Overview", "Tour map", "Fans", "Messaging", "Letters", "Reels"] as const;
const ArtistTourMap = lazy(() => import("@/components/ArtistTourMap"));
// Fictional demo attendance per show (labeled in UI)
const DEMO_ATTENDED: Record<string, number> = { "c-toronto": 214, "c-montreal": 1840, "c-nyc": 3125, "c-pittsburgh": 962 };

function Artist() {
  const { account, user } = useAccount();
  const fetchAudience = useServerFn(artistAudience);
  const announce = useServerFn(sendAnnouncement);
  const [audience, setAudience] = useState<
    { id: string; name: string; count: number; optIn: boolean }[]
  >([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (account?.role?.role === "artist")
      void fetchAudience()
        .then(setAudience)
        .catch((e) => toast.error(e.message));
  }, [account?.role?.role]);
  const [sec, setSec] = useState<(typeof SECTIONS)[number]>("Overview");
  const [min, setMin] = useState(1);
  const [msg, setMsg] = useState("");
  const { letters: savedLetters, reels, moderateReel, sendMessage } = useApp();
  const demo = usePresentationDemo();
  const letters = [...savedLetters, ...(account?.profile.is_demo ? demo.letters : [])];
  const featureLetter = (id: string) => id.startsWith("demo-") ? demo.patchLetter(id, { featured: !demo.letters.find(l => l.id === id)?.featured }) : useApp.getState().featureLetter(id);
  const replyLetter = (id: string, text: string) => id.startsWith("demo-") ? demo.patchLetter(id, { artistReply: text }) : useApp.getState().replyLetter(id, text);
  const [letterSort, setLetterSort] = useState<"liked" | "new">("liked");
  const novaConcerts = CONCERTS.filter((c) => c.artistId === "nova");
  const tourStops = useMemo(() => novaConcerts.map((c) => ({ concert: c, attended: concertStatus(c) === "upcoming" ? 0 : (DEMO_ATTENDED[c.id] ?? 0) })), []);
  const segment = audience.filter((f) => f.count >= min && f.optIn);
  const novaLetters = letters.filter((l) => novaConcerts.some((c) => c.id === l.concertId));

  if (account && account.role?.role !== "artist")
    return (
      <AuthGate>
        <main className="p-10">
          <h1>Artist permission required</h1>
          <Link to="/">Back to FanMap</Link>
        </main>
      </AuthGate>
    );
  return (
    <AuthGate>
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-secondary p-5 md:block">
          <p className="text-lg font-semibold">FanMap</p>
          <p className="text-xs text-muted-foreground">Jasper Vale · Demo artist</p>
          <nav className="mt-8 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSec(s)}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-sm",
                  sec === s ? "bg-card text-foreground" : "text-muted-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </nav>
          <Link to="/" className="mt-8 block text-xs text-primary">
            ← Back to fan app
          </Link>
        </aside>
        <main className="flex-1 p-6 md:p-10">
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSec(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm",
                  sec === s ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <TopBar />
          <p className="mt-5 text-xs uppercase tracking-wider text-gold">
            Demo artist · Jasper Vale
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{sec}</h1>

          {sec === "Overview" && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  ["Verified fans", audience.length],
                  ["Repeat attendees", audience.filter((f) => f.count > 1).length],
                  ["Opted in", audience.filter((f) => f.optIn).length],
                  ["Letters", novaLetters.length],
                ].map(([l, v]) => (
                  <div key={l as string} className="rounded-2xl border border-border bg-card p-5">
                    <p className="text-xs text-muted-foreground">{l}</p>
                    <p className="mt-2 text-3xl font-semibold">{v}</p>
                  </div>
                ))}
              </div>
              <h2 className="mt-10 text-sm font-medium text-muted-foreground">Events</h2>
              <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
                {novaConcerts.map((c) => (
                  <div key={c.id} className="flex justify-between px-5 py-3 text-sm">
                    <span>
                      {c.venue}, {c.city}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(c.date).toLocaleDateString()} · {concertStatus(c)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {sec === "Tour map" && (
            <div className="mt-6">
              <p className="text-xs text-gold">Fictional demo attendance numbers.</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary" />Past show · fans attended</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-gold" />Today</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-dashed border-primary" />Upcoming</span>
              </div>
              <div className="relative mt-3 h-[420px] overflow-hidden rounded-2xl border border-border bg-card">
                <ClientOnly fallback={null}>
                  <Suspense fallback={null}><ArtistTourMap stops={tourStops} /></Suspense>
                </ClientOnly>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {tourStops.map(({ concert: c, attended }) => {
                  const st = concertStatus(c);
                  return (
                    <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                      <div><p className="font-medium">{c.city}</p><p className="text-xs text-muted-foreground">{c.venue} · {new Date(c.date).toLocaleDateString()}</p></div>
                      <span className={cn("text-sm font-semibold", st === "upcoming" ? "text-muted-foreground" : "text-primary")}>{st === "upcoming" ? "Upcoming" : `${attended.toLocaleString()} fans`}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sec === "Fans" && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-4">Fan</th>
                    <th>City</th>
                    <th>Jasper Vale shows</th>
                    <th>Opt-in</th>
                  </tr>
                </thead>
                <tbody>
                  {[...audience]
                    .sort((a, b) => b.count - a.count)
                    .map((f) => (
                      <tr key={f.name} className="border-t border-border">
                        <td className="flex items-center gap-1 p-4">
                          {f.name}
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                        </td>
                        <td>—</td>
                        <td className="text-primary">{f.count}×</td>
                        <td className="text-muted-foreground">{f.optIn ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {sec === "Messaging" && (
            <div className="mt-6 max-w-xl space-y-4">
              <div className="flex items-center gap-3 text-sm">
                Attended at least
                {[1, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMin(n)}
                    className={cn(
                      "rounded-full border px-3 py-1",
                      min === n
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {n}+
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {segment.length} opted-in fans match: {segment.map((f) => f.name).join(", ") || "—"}
              </p>
              <Textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Write a message to this segment"
                className="bg-card"
              />
              <label className="block text-xs text-muted-foreground">
                Exclusive audio or video
                <input
                  aria-label="Exclusive media"
                  type="file"
                  accept="audio/*,video/*"
                  className="mt-2 block w-full"
                  onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                />
              </label>
              <Button
                disabled={sending || !msg.trim() || !segment.length}
                onClick={async () => {
                  if (!user) return;
                  setSending(true);
                  try {
                    let path: string | null = null;
                    if (attachment) {
                      path = user.id + "/exclusive/" + crypto.randomUUID() + "-" + attachment.name;
                      const { error } = await supabase.storage
                        .from("fanmap-media")
                        .upload(path, attachment);
                      if (error) throw error;
                    }
                    const result = await announce({
                      data: { text: msg, min, path, type: attachment?.type ?? null },
                    });
                    toast.success(`Sent to ${result.count} eligible opted-in fans.`);
                    setMsg("");
                    setAttachment(null);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Unable to send");
                  } finally {
                    setSending(false);
                  }
                }}
              >
                {sending ? "Sending…" : "Send to segment"}
              </Button>
            </div>
          )}

          {sec === "Letters" && (
            <div className="mt-6 max-w-2xl space-y-4">
              <p className="text-sm text-muted-foreground">
                Popularity helps discovery, but likes never auto-award prizes.
              </p>
              {account?.profile.is_demo && <p className="text-xs text-gold">Fictional demo letters and sample likes · Demo replies stay in this session.</p>}
              <div className="flex gap-2"><Button size="sm" variant={letterSort === "liked" ? "default" : "secondary"} onClick={() => setLetterSort("liked")}>Most liked</Button><Button size="sm" variant={letterSort === "new" ? "default" : "secondary"} onClick={() => setLetterSort("new")}>Newest</Button></div>
              {[...novaLetters]
                .sort((a, b) => letterSort === "liked" ? b.likes - a.likes : b.createdAt.localeCompare(a.createdAt))
                .map((l) => (
                  <div key={l.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{l.author}</span>
                      <span className="text-muted-foreground">
                        {l.likes} likes · {CONCERTS.find((c) => c.id === l.concertId)?.city}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{l.text}</p>
                    {l.artistReply && <p className="mt-2 text-sm text-primary">{l.artistReply}</p>}
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => featureLetter(l.id)}>
                        <Star className="h-3.5 w-3.5" />
                        {l.featured ? "Unfeature" : "Feature"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const t = prompt("Reply as Jasper Vale");
                          if (t) replyLetter(l.id, t);
                        }}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {sec === "Reels" && (
            <div className="mt-6 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-3">
              {reels.map((r) => (
                <div
                  key={r.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  {r.video ? <video controls src={r.video} className="aspect-[4/5] w-full object-contain" /> : <img src={CONCERTS.find((c) => c.id === r.concertId)?.cover} alt={r.caption} className="aspect-[4/5] w-full object-cover" />}
                  <div className="p-3 text-sm">
                    <p className="font-medium">{r.caption}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.author} · {r.status}
                    </p>
                    {r.status === "pending" && (
                      <Button size="sm" className="mt-2 w-full" onClick={() => moderateReel(r.id)}>
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGate>
  );
}
