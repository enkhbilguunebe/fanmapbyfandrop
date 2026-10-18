import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Award, Music2, MapPin, Star, Ticket, Lock } from "lucide-react";
import { Page } from "@/components/AppShell";
import { ARTISTS, CONCERTS, LEVELS } from "@/lib/demo-data";
import { useAccount } from "@/lib/account";
import { Progress } from "@/components/ui/progress";
import { levelFor, useApp } from "@/lib/store";

export const Route = createFileRoute("/loyalty")({
  head: () => ({
    meta: [
      { title: "Loyalty & Passport — FanMap" },
      {
        name: "description",
        content: "Your verified concert passport, fan level and artist loyalty.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Loyalty & Passport — FanMap" },
      {
        property: "og:description",
        content: "Your verified concert passport, fan level and artist loyalty.",
      },
    ],
  }),
  component: Loyalty,
});

function Loyalty() {
  const { account } = useAccount();
  const stamps = useApp((s) => s.stamps);
  const attended = stamps
    .flatMap((s) => {
      const c = CONCERTS.find((c) => c.id === s.concertId);
      return c ? [{ ...s, c }] : [];
    })
    .sort((a, b) => b.c.date.localeCompare(a.c.date));
  const { level, next, progress } = levelFor(attended.length);
  const cities = new Set(attended.map((a) => a.c.city)).size;
  const perArtist = ARTISTS.map((a) => ({
    a,
    n: attended.filter((x) => x.c.artistId === a.id).length,
  })).filter((x) => x.n > 0);

  return (
    <Page title="Loyalty" subtitle="Only verified check-ins count.">
      <div className="border-b border-border pb-7">
        <div className="mb-5 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gold/10 text-2xl text-gold">
            {account?.profile.display_name[0]}
          </div>
          <div>
            <p className="flex items-center gap-2 text-xl font-semibold">
              {account?.profile.display_name}
              <BadgeCheck className="h-5 w-5 text-success" />
            </p>
            <p className="text-xs text-muted-foreground">
              @{account?.profile.username} · Concert passport
            </p>
          </div>
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Fan level</p>
        <p className="mt-1 text-2xl font-semibold">{level.name}</p>
        <Progress value={progress * 100} className="mt-4" />
        <p className="mt-2 text-xs text-muted-foreground">
          {next ? `${next.min - attended.length} more to ${next.name}` : "Top level reached"}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            ["Concerts", attended.length],
            ["Artists", perArtist.length],
            ["Cities", cities],
          ].map(([l, v]) => (
            <div key={l as string}>
              <p className="text-xl font-semibold">{v}</p>
              <p className="text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {perArtist.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">By artist</h2>
          {perArtist.map(({ a, n }) => (
            <div
              key={a.id}
              className="flex items-center justify-between border-b border-border py-3 text-sm"
            >
              <span>{a.name}</span>
              <span className="text-primary">{n}×</span>
            </div>
          ))}
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Concert passport</h2>
        {attended.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Verify a ticket, then scan the venue code on concert day to earn your first stamp.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {attended.map(({ c, id }) => (
            <div key={id} className="overflow-hidden rounded-lg border border-primary/20 bg-card">
              <img
                src={c.cover}
                alt={c.venue}
                loading="lazy"
                className="h-24 w-full object-cover"
              />
              <div className="p-4">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-medium">
                  {ARTISTS.find((a) => a.id === c.artistId)?.name}
                </p>
                <p className="text-xs text-muted-foreground">{c.venue}</p>
                <p className="text-xs text-muted-foreground">
                  {c.city} ·{" "}
                  {new Date(c.date).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  {id.slice(0, 12)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 font-semibold">Milestones</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            ["First Concert", 1],
            ["Explorer", 2],
            ["Returning Fan", 4],
            ["Superfan", 7],
            ["Tour Legend", 12],
          ].map(([label, n]) => (
            <div
              key={label}
              className={
                attended.length >= Number(n)
                  ? "rounded-lg border border-gold/30 bg-card p-3 text-center"
                  : "rounded-lg border border-border bg-card/60 p-3 text-center"
              }
            >
              <div className="relative mx-auto grid h-10 w-10 place-items-center">
                <Award
                  className={
                    attended.length >= Number(n)
                      ? "text-gold"
                      : "text-muted-foreground/40"
                  }
                />
              <p className="mt-2 text-xs">{label}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {attended.length >= Number(n) ? "Unlocked" : `${n} concerts`}
              </p>
            </div>
          ))}
        </div>
      </section>
      <p className="mt-8 text-xs text-muted-foreground">
        Levels: {LEVELS.map((l) => `${l.name} (${l.min}+)`).join(" · ")}
      </p>
    </Page>
  );
}
