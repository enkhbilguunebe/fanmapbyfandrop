import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { concertStatus, type Concert } from "@/lib/demo-data";

export type TourStop = { concert: Concert; attended: number };

export default function ArtistTourMap({ stops }: { stops: TourStop[] }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({ container: el.current, style: "https://tiles.openfreemap.org/styles/liberty", center: [-77, 42.5], zoom: 4.3, attributionControl: { compact: true } });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    const markers = stops.map(({ concert: c, attended }) => {
      const st = concertStatus(c);
      const div = document.createElement("div");
      div.className = "fm-tour-pin " + st;
      div.textContent = st === "upcoming" ? "Soon" : String(attended);
      div.setAttribute("aria-label", `${c.city} ${st}`);
      const date = new Date(c.date).toLocaleDateString();
      const text = st === "upcoming" ? `${c.city} · ${c.venue}\nUpcoming · ${date}` : `${c.city} · ${c.venue}\n${attended} verified fans attended · ${date}`;
      return new maplibregl.Marker({ element: div }).setLngLat([c.lng, c.lat]).setPopup(new maplibregl.Popup({ offset: 18 }).setText(text)).addTo(m);
    });
    return () => { markers.forEach((x) => x.remove()); m.remove(); };
  }, [stops]);
  return <div ref={el} className="h-full w-full" />;
}
