import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/AppShell";
import { CONCERTS, PHOTOS, artistOf } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/photos")({
  head: () => ({
    meta: [
      { title: "Photos — FanMap" },
      { name: "description", content: "Your concert memories, grouped by show." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Photos — FanMap" },
      { property: "og:description", content: "Your concert memories, grouped by show." },
    ],
  }),
  component: Photos,
});

function Photos() {
  const stamps = useApp((s) => s.stamps);
  const attended = CONCERTS.filter((c) => stamps.some((s) => s.concertId === c.id));
  return (
    <Page title="Photos" subtitle="Memories from concerts you attended.">
      {attended.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Check in at a concert to unlock its photo collection.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {attended.map((c) => (
            <section key={c.id}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-medium">{artistOf(c).name}</h2>
                <span className="text-xs text-muted-foreground">{c.city} · {new Date(c.date).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PHOTOS.filter((p) => p.concertId === c.id).map((p) => (
                  <img key={p.id} src={p.src} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
