import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { BottomNav, DemoSwitcher, TopBar, AuthGate } from "@/components/AppShell";
import { ConcertSheet } from "@/components/ConcertSheet";
import { CONCERTS, artistOf, type Concert } from "@/lib/demo-data";
import { useApp, type MapStyle } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LocationPanel } from "@/components/LocationPanel";
import { cn } from "@/lib/utils";

const MapView = lazy(() => import("@/components/MapView"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FanMap — Music brings us closer" },
      { name: "description", content: "Explore concerts on the map, collect verified passport stamps and connect with artists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "FanMap — Music brings us closer" },
      { property: "og:description", content: "A location-based concert memory and fan engagement platform." },
    ],
  }),
  component: MapScreen,
});

function MapScreen() {
  const [selected, setSelected] = useState<Concert | null>(null);
  const [fly, setFly] = useState<[number, number] | null>(null);
  const [q, setQ] = useState("");
  const style = useApp((s) => s.mapStyle);
  const setStyle = useApp((s) => s.setMapStyle);
  const [debounced, setDebounced] = useState("");
  const [locations,setLocations] = useState(false);
  useEffect(()=>{const timer=setTimeout(()=>setDebounced(q),250);return()=>clearTimeout(timer)},[q]);
  const results = debounced ? CONCERTS.filter((c) => `${c.city} ${c.venue} ${artistOf(c).name}`.toLowerCase().includes(debounced.toLowerCase())) : [];

  const pick = useCallback((c: Concert) => { setSelected(c); setFly([c.lng, c.lat]); setQ(""); }, []);

  return (
    <AuthGate><div className="fixed inset-0 overflow-hidden bg-background">
      <ClientOnly fallback={<div className="absolute inset-0 bg-background" />}>
        <Suspense fallback={null}><MapView onSelect={pick} flyTo={fly} /></Suspense>
      </ClientOnly>

      <div className="absolute inset-x-0 top-0 z-20 space-y-2 px-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="mx-auto max-w-xl"><TopBar /></div>
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <div className="glass shadow-float flex flex-1 items-center gap-2 rounded-2xl border border-border px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artist, venue, city" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </div>
        {results.length > 0 && (
          <div className="glass mx-auto max-w-xl overflow-hidden rounded-2xl border border-border">
            {results.map((c) => (
              <Button variant="ghost" key={c.id} onClick={() => pick(c)} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-card">
                {artistOf(c).name} <span className="text-muted-foreground">· {c.venue}, {c.city}</span>
              </Button>
            ))}
          </div>
        )}
        <div className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-2">
          <DemoSwitcher />
          <div className="glass flex rounded-full border border-border p-1 text-[11px]">
            {(["default", "satellite", "fanmap"] as MapStyle[]).map((s) => (
              <Button variant="ghost" size="sm" key={s} onClick={() => setStyle(s)} className={cn("rounded-full px-2.5 py-1 capitalize", style === s ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                {s === "fanmap" ? "FanMap" : s}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {selected && <ConcertSheet key={selected.id} concert={selected} onClose={() => setSelected(null)} />}
      <div className="absolute bottom-28 left-4 z-20"><Button variant="secondary" onClick={()=>setLocations(true)}>Find friends</Button></div>
      <LocationPanel open={locations} onClose={()=>setLocations(false)}/>
      <BottomNav />
    </div></AuthGate>
  );
}
