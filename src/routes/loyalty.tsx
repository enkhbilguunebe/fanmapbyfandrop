import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { Page } from "@/components/AppShell";
import { ARTISTS, CONCERTS, LEVELS } from "@/lib/demo-data";
import { levelFor, useApp } from "@/lib/store";

export const Route = createFileRoute("/loyalty")({
  head: () => ({
    meta: [
      { title: "Loyalty & Passport — FanMap" },
      { name: "description", content: "Your verified concert passport, fan level and artist loyalty." },
      { property: "og:title", content: "Loyalty & Passport — FanMap" },
      { property: "og:description", content: "Your verified concert passport, fan level and artist loyalty." },
    ],
  }),
  component: Loyalty,
});

function Loyalty() {
  const stamps = useApp((s) => s.stamps);
  const attended = stamps.map((s) => ({ ...s, c: CONCERTS.find((c) => c.id === s.concertId)! })).sort((a, b) => b.c.date.localeCompare(a.c.date));
  const { level, next, progress } = levelFor(attended.length);
  const cities = new Set(attended.map((a) => a.c.city)).size;
  const perArtist = ARTISTS.map((a) => ({ a, n: attended.filter((x) => x.c.artistId === a.id).length })).filter((x) => x.n > 0);

  return (
    <Page title="Loyalty" subtitle="Only verified check-ins count.">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Fan level</p>
        <p className="mt-1 text-2xl font-semibold">{level.name}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} /></div>
        <p className="mt-2 text-xs text-muted-foreground">{next ? `${next.min - attended.length} more to ${next.name}` : "Top level reached"}</p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[["Concerts", attended.length], ["Artists", perArtist.length], ["Cities", cities]].map(([l, v]) => (
            <div key={l as string}><p className="text-xl font-semibold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </div>

      {perArtist.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">By artist</h2>
          {perArtist.map(({ a, n }) => (
            <div key={a.id} className="flex items-center justify-between border-b border-border py-3 text-sm"><span>{a.name}</span><span className="text-primary">{n}×</span></div>
          ))}
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Concert passport</h2>
        {attended.length === 0 && <p className="text-sm text-muted-foreground">Verify a ticket, then scan the venue code on concert day to earn your first stamp.</p>}
        <div className="grid grid-cols-2 gap-3">
          {attended.map(({ c, id }) => (
            <div key={id} className="rounded-2xl border border-dashed border-primary/40 bg-card p-4">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-medium">{ARTISTS.find((a) => a.id === c.artistId)!.name}</p>
              <p className="text-xs text-muted-foreground">{c.venue}</p>
              <p className="text-xs text-muted-foreground">{c.city} · {new Date(c.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">{id}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-xs text-muted-foreground">Levels: {LEVELS.map((l) => `${l.name} (${l.min}+)`).join(" · ")}</p>
    </Page>
  );
}
