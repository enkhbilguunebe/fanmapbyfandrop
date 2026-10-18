import { useEffect, useRef, memo } from "react";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CONCERTS, concertStatus, type Concert } from "@/lib/demo-data";
import { useApp, type MapStyle } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";

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

function MapView({ onSelect, flyTo }: { onSelect: (c: Concert) => void; flyTo?: [number, number] | null }) {
  const latestSelect=useRef(onSelect);
  latestSelect.current=onSelect;
  const activeStyle=useRef(useApp.getState().mapStyle);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const friendMarkers = useRef<maplibregl.Marker[]>([]);
  const { user } = useAccount();
  const style = useApp((s) => s.mapStyle);
  const stamps = useApp((s) => s.stamps);
  const tickets = useApp((s) => s.tickets);

  useEffect(() => {
    if (!el.current) return;
    const camera=useApp.getState().camera;
    const m = new maplibregl.Map({ container: el.current, style: STYLES[useApp.getState().mapStyle], center: camera?[camera.lng,camera.lat]:[-76.5, 42.8], zoom: camera?.zoom??4.6, attributionControl: { compact: true } });
    m.addControl(new maplibregl.NavigationControl({ showZoom: false }), "bottom-right");
    m.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), "bottom-right");
    map.current = m;
    const render = () => drawMarkers();
    m.on("zoomend", render);
    const saveCamera=()=>{const c=m.getCenter();useApp.setState({camera:{lng:c.lng,lat:c.lat,zoom:m.getZoom()}})};
    m.on("moveend",saveCamera);
    return () => { saveCamera();m.off("moveend",saveCamera);m.off("zoomend",render);markers.current.forEach(x=>x.remove());markers.current=[];map.current=null;m.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // style switch keeps camera + markers (markers are DOM overlays)
  useEffect(() => {
    if(activeStyle.current===style)return;
    activeStyle.current=style;
    map.current?.setStyle(STYLES[style]);
  }, [style]);

  useEffect(() => {
    if (flyTo) map.current?.flyTo({ center: flyTo, zoom: 13, speed: 1.4, essential: false });
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
        const c = g.items[0];
        if(!c)return;
        div.onclick = () => m.flyTo({ center: [c.lng, c.lat], zoom: m.getZoom() + 2 });
        markers.current.push(new maplibregl.Marker({ element: div }).setLngLat([c.lng, c.lat]).addTo(m));
      } else {
        const c = g.items[0];
        if(!c)return;
        const st = concertStatus(c);
        const attended = stamps.some((s) => s.concertId === c.id);
        div.className = "fm-marker " + (st === "today" ? "today" : attended || st === "past" ? "past" : "upcoming");
        div.setAttribute("aria-label", c.venue);
        div.onclick = (e) => {
          e.stopPropagation();
          latestSelect.current(c);
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
    return()=>{m.off("load",drawMarkers);};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamps, tickets]);

  useEffect(() => {
    let disposed = false;
    let generation = 0;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    const clear = () => { friendMarkers.current.forEach((m) => m.remove()); friendMarkers.current = []; };
    const refresh = async () => {
      const m = map.current;
      if (!m) return;
      const current = ++generation;
      const { data } = await supabase.from("location_positions").select("*");
      const { data: sessions } = await supabase.from("location_sessions").select("id,expires_at").eq("status", "active");
      if (disposed || current !== generation) return;
      clear();
      for (const p of data ?? []) {
        const session = sessions?.find((s) => s.id === p.session_id);
        if (!session?.expires_at || Date.parse(session.expires_at) <= Date.now()) continue;
        const element = document.createElement("div");
        element.className = "fm-friend-marker";
        element.textContent = p.user_id === user?.id ? "Y" : "F";
        if (Date.now() - Date.parse(p.updated_at) > 30000) element.classList.add("stale");
        element.setAttribute("aria-label", "Shared friend location");
        const popup = new maplibregl.Popup({ offset: 14 }).setText(`${Date.now() - Date.parse(p.updated_at) > 30000 ? "Stale" : "Shared location"} · accuracy ${Math.round(p.accuracy)} m`);
        friendMarkers.current.push(new maplibregl.Marker({ element }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(m));
      }
      if (expiry) clearTimeout(expiry);
      const deadlines = (sessions ?? []).flatMap((s) => s.expires_at ? [Date.parse(s.expires_at) - Date.now()] : []).filter((n) => n > 0);
      if (deadlines.length) expiry = setTimeout(() => { clear(); void refresh(); }, Math.min(...deadlines));
    };
    void refresh();
    const onRefresh = () => { void refresh(); };
    window.addEventListener("fanmap-location-refresh", onRefresh);
    const channel = supabase.channel("map-friend-locations")
      .on("postgres_changes", { event: "*", schema: "public", table: "location_positions" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "location_sessions" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => void refresh())
      .subscribe();
    return () => { disposed = true; window.removeEventListener("fanmap-location-refresh", onRefresh); if (expiry) clearTimeout(expiry); clear(); void supabase.removeChannel(channel); };
  }, [user?.id]);

  return <div className="absolute inset-0"><div ref={el} className="h-full w-full" /></div>;
}

export default memo(MapView);
