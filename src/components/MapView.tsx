import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CONCERTS, concertStatus, type Concert } from "@/lib/demo-data";
import { useApp, type MapStyle } from "@/lib/store";

const raster = (tiles: string[], attribution: string): StyleSpecification => ({
  version: 8,
  sources: { base: { type: "raster", tiles, tileSize: 256, attribution } },
  layers: [{ id: "base", type: "raster", source: "base" }],
});

const STYLES: Record<MapStyle, StyleSpecification | string> = {
  default: "https://tiles.openfreemap.org/styles/liberty",
  satellite: raster(["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], "© Esri"),
  fanmap: "https://tiles.openfreemap.org/styles/dark",
};

export default function MapView({ onSelect, flyTo }: { onSelect: (c: Concert) => void; flyTo?: [number, number] | null }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const style = useApp((s) => s.mapStyle);
  const stamps = useApp((s) => s.stamps);
  const tickets = useApp((s) => s.tickets);

  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({ container: el.current, style: STYLES[useApp.getState().mapStyle], center: [-76.5, 42.8], zoom: 4.6, attributionControl: { compact: true } });
    m.addControl(new maplibregl.NavigationControl({ showZoom: false }), "bottom-right");
    m.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), "bottom-right");
    map.current = m;
    const render = () => drawMarkers();
    m.on("zoomend", render);
    return () => m.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // style switch keeps camera + markers (markers are DOM overlays)
  useEffect(() => {
    map.current?.setStyle(STYLES[style]);
  }, [style]);

  useEffect(() => {
    if (flyTo) map.current?.flyTo({ center: flyTo, zoom: 13, speed: 1.4 });
  }, [flyTo]);

  function drawMarkers() {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((x) => x.remove());
    markers.current = [];
    const { stamps, tickets } = useApp.getState();
    const visible = CONCERTS.filter((c) => {
      const st = concertStatus(c);
      return st === "today" || stamps.some((s) => s.concertId === c.id) || tickets.includes(c.id) || st === "upcoming";
    });
    // simple pixel clustering at low zoom
    const groups: { pt: maplibregl.Point; items: Concert[] }[] = [];
    visible.forEach((c) => {
      const pt = m.project([c.lng, c.lat]);
      const g = m.getZoom() < 4 ? groups.find((g) => g.pt.dist(pt) < 40) : undefined;
      if (g) g.items.push(c);
      else groups.push({ pt, items: [c] });
    });
    groups.forEach((g) => {
      const div = document.createElement("div");
      if (g.items.length > 1) {
        div.className = "fm-cluster";
        div.textContent = String(g.items.length);
        const c = g.items[0]!;
        div.onclick = () => m.flyTo({ center: [c.lng, c.lat], zoom: m.getZoom() + 2 });
        markers.current.push(new maplibregl.Marker({ element: div }).setLngLat([c.lng, c.lat]).addTo(m));
      } else {
        const c = g.items[0]!;
        const st = concertStatus(c);
        const attended = stamps.some((s) => s.concertId === c.id);
        div.className = "fm-marker " + (st === "today" ? "today" : attended || st === "past" ? "past" : "upcoming");
        div.setAttribute("aria-label", c.venue);
        div.onclick = (e) => {
          e.stopPropagation();
          onSelect(c);
        };
        markers.current.push(new maplibregl.Marker({ element: div }).setLngLat([c.lng, c.lat]).addTo(m));
      }
    });
  }

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (m.loaded()) drawMarkers();
    else m.once("load", drawMarkers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamps, tickets]);

  return <div className="absolute inset-0"><div ref={el} className="h-full w-full" /></div>;
}
