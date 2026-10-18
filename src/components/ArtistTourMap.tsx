import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type TourStop = { id: string; city: string; venue: string; lng: number; lat: number; date: string; attended: number; status: "past" | "today" | "upcoming" };

export const crowdTier = (n: number) => (n >= 3000 ? "high" : n >= 1500 ? "mid" : "low");

const SATELLITE: StyleSpecification = {
  version: 8,
  sources: { base: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "© Esri" } },
  layers: [{ id: "base", type: "raster", source: "base" }],
};

export default function ArtistTourMap({ stops }: { stops: TourStop[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const activeStyle = useRef<"map" | "satellite">("map");
  const [style, setStyle] = useState<"map" | "satellite">("map");

  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({ container: el.current, style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", center: [-85, 41], zoom: 3.4, attributionControl: { compact: true } });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.current = m;
    return () => { map.current = null; m.remove(); };
  }, []);

  // style switch keeps camera + markers (markers are DOM overlays)
  useEffect(() => {
    if (activeStyle.current === style) return;
    activeStyle.current = style;
    map.current?.setStyle(style === "satellite" ? SATELLITE : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json");
  }, [style]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const markers: maplibregl.Marker[] = stops.map((s) => {
      const div = document.createElement("div");
      div.className = "fm-tour-pin " + (s.status === "past" ? crowdTier(s.attended) : s.status);
      div.textContent = s.status === "past" ? (s.attended >= 1000 ? (s.attended / 1000).toFixed(1) + "k" : String(s.attended)) : s.status === "today" ? "Today" : "Soon";
      div.setAttribute("aria-label", `${s.city} ${s.status}`);
      const date = new Date(s.date).toLocaleDateString();
      const text = s.status === "past" ? `${s.city} · ${s.venue}\n${s.attended.toLocaleString()} verified fans · ${date}` : `${s.city} · ${s.venue}\n${s.status === "today" ? "Tonight" : "Upcoming"} · ${date}`;
      return new maplibregl.Marker({ element: div }).setLngLat([s.lng, s.lat]).setPopup(new maplibregl.Popup({ offset: 18 }).setText(text)).addTo(m);
    });
    if (m.loaded()) markers.forEach((x) => x.addTo(m));
    else {
      const onLoad = () => markers.forEach((x) => x.addTo(m));
      m.once("load", onLoad);
    }
    return () => { markers.forEach((x) => x.remove()); };
  }, [stops, style]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="h-full w-full" />
      <div className="absolute right-2 top-2 z-10 flex overflow-hidden rounded-full border border-border bg-card/90 shadow-sm backdrop-blur">
        <button type="button" onClick={() => setStyle("map")} className={"px-3 py-1.5 text-xs font-semibold " + (style === "map" ? "bg-primary text-primary-foreground" : "text-foreground")}>Map</button>
        <button type="button" onClick={() => setStyle("satellite")} className={"px-3 py-1.5 text-xs font-semibold " + (style === "satellite" ? "bg-primary text-primary-foreground" : "text-foreground")}>Satellite</button>
      </div>
    </div>
  );
}
