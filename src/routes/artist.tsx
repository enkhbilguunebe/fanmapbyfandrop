import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Star } from "lucide-react";
import { CONCERTS, CRM_FANS, concertStatus } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/artist")({
  head: () => ({
    meta: [
      { title: "Artist Command Center — FanMap" },
      { name: "description", content: "Understand your verified audience, moderate fan activities and message loyal fans." },
      { property: "og:title", content: "Artist Command Center — FanMap" },
      { property: "og:description", content: "Verified audience insights and loyalty CRM for artists." },
    ],
  }),
  component: Artist,
});

const SECTIONS = ["Overview", "Fans", "Messaging", "Letters", "Reels"] as const;

function Artist() {
  const [sec, setSec] = useState<(typeof SECTIONS)[number]>("Overview");
  const [min, setMin] = useState(1);
  const [msg, setMsg] = useState("");
  const { letters, reels, featureLetter, replyLetter, moderateReel, sendMessage } = useApp();
  const novaConcerts = CONCERTS.filter((c) => c.artistId === "nova");
  const segment = CRM_FANS.filter((f) => f.nova >= min && f.optIn);
  const novaLetters = letters.filter((l) => novaConcerts.some((c) => c.id === l.concertId));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-secondary p-5 md:block">
        <p className="text-lg font-semibold">FanMap</p>
        <p className="text-xs text-muted-foreground">Nova Lane · Demo artist</p>
        <nav className="mt-8 space-y-1">
          {SECTIONS.map((s) => <button key={s} onClick={() => setSec(s)} className={cn("block w-full rounded-lg px-3 py-2 text-left text-sm", sec === s ? "bg-card text-foreground" : "text-muted-foreground")}>{s}</button>)}
        </nav>
        <Link to="/" className="mt-8 block text-xs text-primary">← Back to fan app</Link>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
          {SECTIONS.map((s) => <button key={s} onClick={() => setSec(s)} className={cn("rounded-full px-3 py-1 text-sm", sec === s ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{s}</button>)}
        </div>
        <p className="text-xs uppercase tracking-wider text-gold">Demo data</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{sec}</h1>

        {sec === "Overview" && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[["Verified fans", CRM_FANS.length], ["Repeat attendees", CRM_FANS.filter((f) => f.nova > 1).length], ["Opted in", CRM_FANS.filter((f) => f.optIn).length], ["Letters", novaLetters.length]].map(([l, v]) => (
                <div key={l as string} className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-2 text-3xl font-semibold">{v}</p></div>
              ))}
            </div>
            <h2 className="mt-10 text-sm font-medium text-muted-foreground">Events</h2>
            <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
              {novaConcerts.map((c) => <div key={c.id} className="flex justify-between px-5 py-3 text-sm"><span>{c.venue}, {c.city}</span><span className="text-muted-foreground">{new Date(c.date).toLocaleDateString()} · {concertStatus(c)}</span></div>)}
            </div>
          </>
        )}

        {sec === "Fans" && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th className="p-4">Fan</th><th>City</th><th>Nova Lane shows</th><th>Opt-in</th></tr></thead>
              <tbody>{[...CRM_FANS].sort((a, b) => b.nova - a.nova).map((f) => <tr key={f.name} className="border-t border-border"><td className="flex items-center gap-1 p-4">{f.name}<BadgeCheck className="h-3.5 w-3.5 text-primary" /></td><td>{f.city}</td><td className="text-primary">{f.nova}×</td><td className="text-muted-foreground">{f.optIn ? "Yes" : "No"}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {sec === "Messaging" && (
          <div className="mt-6 max-w-xl space-y-4">
            <div className="flex items-center gap-3 text-sm">Attended at least
              {[1, 2, 3, 5].map((n) => <button key={n} onClick={() => setMin(n)} className={cn("rounded-full border px-3 py-1", min === n ? "border-primary text-primary" : "border-border text-muted-foreground")}>{n}+</button>)}
            </div>
            <p className="text-sm text-muted-foreground">{segment.length} opted-in fans match: {segment.map((f) => f.name).join(", ") || "—"}</p>
            <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a message to this segment" className="bg-card" />
            <Button disabled={!msg.trim() || !segment.length} onClick={() => { sendMessage("artist-nova", msg.trim(), "artist"); setMsg(""); toast.success(`Sent to ${segment.length} fans.`); }}>Send to segment</Button>
          </div>
        )}

        {sec === "Letters" && (
          <div className="mt-6 max-w-2xl space-y-4">
            <p className="text-sm text-muted-foreground">Popularity helps discovery, but likes never auto-award prizes.</p>
            {[...novaLetters].sort((a, b) => b.likes - a.likes).map((l) => (
              <div key={l.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex justify-between text-sm"><span className="font-medium">{l.author}</span><span className="text-muted-foreground">{l.likes} likes · {CONCERTS.find((c) => c.id === l.concertId)?.city}</span></div>
                <p className="mt-2 text-sm">{l.text}</p>
                {l.artistReply && <p className="mt-2 text-sm text-primary">{l.artistReply}</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => featureLetter(l.id)}><Star className="h-3.5 w-3.5" />{l.featured ? "Unfeature" : "Feature"}</Button>
                  <Button size="sm" variant="secondary" onClick={() => { const t = prompt("Reply as Nova Lane"); if (t) replyLetter(l.id, t); }}>Reply</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sec === "Reels" && (
          <div className="mt-6 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-3">
            {reels.map((r) => (
              <div key={r.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <img src={r.poster} alt="" className="aspect-[4/5] w-full object-cover" />
                <div className="p-3 text-sm"><p className="font-medium">{r.caption}</p><p className="text-xs text-muted-foreground">{r.author} · {r.status}</p>
                  {r.status === "pending" && <Button size="sm" className="mt-2 w-full" onClick={() => moderateReel(r.id)}>Approve</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
