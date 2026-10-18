import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type TourStop = { id: string; city: string; venue: string; lng: number; lat: number; date: string; attended: number; status: "past" | "today" | "upcoming" };

export const crowdTier = (n: number) => (n >= 3000 ? "high" : n >= 1500 ? "mid" : "low");

export default function ArtistTourMap({ stops }: { stops: TourStop[] }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({ container: el.current, style: "https://tiles.openfreemap.org/styles/liberty", center: [-85, 41], zoom: 3.4, attributionControl: { compact: true } });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    const markers = stops.map((s) => {
      const div = document.createElement("div");
      div.className = "fm-tour-pin " + (s.status === "past" ? crowdTier(s.attended) : s.status);
      div.textContent = s.status === "past" ? (s.attended >= 1000 ? (s.attended / 1000).toFixed(1) + "k" : String(s.attended)) : s.status === "today" ? "Today" : "Soon";
      div.setAttribute("aria-label", `${s.city} ${s.status}`);
      const date = new Date(s.date).toLocaleDateString();
      const text = s.status === "past" ? `${s.city} · ${s.venue}\n${s.attended.toLocaleString()} verified fans · ${date}` : `${s.city} · ${s.venue}\n${s.status === "today" ? "Tonight" : "Upcoming"} · ${date}`;
      return new maplibregl.Marker({ element: div }).setLngLat([s.lng, s.lat]).setPopup(new maplibregl.Popup({ offset: 18 }).setText(text)).addTo(m);
    });
    return () => { markers.forEach((x) => x.remove()); m.remove(); };
  }, [stops]);
  return <div ref={el} className="h-full w-full" />;
}
