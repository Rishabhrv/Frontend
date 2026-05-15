"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { 
  Users, UserCheck, UserMinus, Activity, MapPin, Clock, TrendingUp, Globe
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Source = "all" | "apgh" | "agclassics";
export type Period = "all" | "week" | "month";

interface AnalyticsComponentProps {
  source: Source;
  period: Period;
}

interface RawRow { country: string; state: string; knownUsers: number; unknownUsers: number; }
interface CountryData { name: string; known: number; unknown: number; }
interface CountryMeta { lat: number; lon: number; flag: string; short: string; }
interface TooltipState { name: string; known: number; unknown: number; x: number; y: number; }
interface SpikeMesh { mesh: THREE.Mesh; country: string; }
interface StatCardProps { label: string; value: number; sub?: string; icon: React.ReactNode; }
interface CountryRowProps { data: CountryData; maxTotal: number; rank: number; active: boolean; onHover: (name: string | null) => void; }
interface LiveTopCountry { country: string; count: number; }
interface LiveData { onlineNow: number; activeLast30m: number; todayUnique: number; newVisitors: number; returningVisitors: number; topLiveCountries: LiveTopCountry[]; peakToday: number; }

// ── Raw data (fallback) ────────────────────────────────────────────────────────
const MOCK_DATA: RawRow[] = [
  { country: "United States", state: "California",  knownUsers: 4821, unknownUsers: 1203 },
  { country: "India",         state: "Maharashtra", knownUsers: 2340, unknownUsers: 980  },
];
const MOCK_LIVE: LiveData = {
  onlineNow: 47, activeLast30m: 134, todayUnique: 1820, newVisitors: 310, returningVisitors: 1510, topLiveCountries: [{ country: "United States", count: 18 }], peakToday: 93,
};

// ── Country Metadata ───────────────────────────────────────────────────────────
const COUNTRY_META: Record<string, CountryMeta> = {
  "United States":          { lat: 37.09,   lon: -95.71,  flag: "🇺🇸", short: "US" },
  "India":                  { lat: 20.59,   lon: 78.96,   flag: "🇮🇳", short: "IN" },
  "Germany":                { lat: 51.17,   lon: 10.45,   flag: "🇩🇪", short: "DE" },
  "United Kingdom":         { lat: 55.38,   lon: -3.44,   flag: "🇬🇧", short: "GB" },
  "Brazil":                 { lat: -14.24,  lon: -51.93,  flag: "🇧🇷", short: "BR" },
  "Canada":                 { lat: 56.13,   lon: -106.35, flag: "🇨🇦", short: "CA" },
  "Australia":              { lat: -25.27,  lon: 133.77,  flag: "🇦🇺", short: "AU" },
  "France":                 { lat: 46.23,   lon: 2.21,    flag: "🇫🇷", short: "FR" },
  "Japan":                  { lat: 36.20,   lon: 138.25,  flag: "🇯🇵", short: "JP" },
  // Map standard ISO codes as well just in case
  "US": { lat: 37.09,   lon: -95.71,  flag: "🇺🇸", short: "US" },
  "IN": { lat: 20.59,   lon: 78.96,   flag: "🇮🇳", short: "IN" },
};

const ISO_TO_NAME: Record<string, string> = {
  US:"United States", IN:"India", DE:"Germany", GB:"United Kingdom",
};

function displayName(raw: string): string {
  return ISO_TO_NAME[raw.toUpperCase()] ?? raw;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3( -r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeTopoArcs(topo: any, objectName: string, radius: number): Float32Array {
  const { scale, translate } = topo.transform as { scale: [number,number]; translate: [number,number] };
  const decodedArcs: [number, number][][] = (topo.arcs as number[][][]).map(arc => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]] as [number, number]; });
  });
  const positions: number[] = [];
  function ringToSegments(arcIndices: number[]) {
    const ring: [number, number][] = [];
    arcIndices.forEach(idx => {
      const rev = idx < 0; const arc = decodedArcs[rev ? ~idx : idx];
      const pts  = rev ? [...arc].reverse() : arc;
      if (ring.length === 0) ring.push(...pts); else ring.push(...pts.slice(1));
    });
    for (let i = 0; i < ring.length - 1; i++) {
      const v1 = latLonToVec3(ring[i][1], ring[i][0], radius);
      const v2 = latLonToVec3(ring[i+1][1], ring[i+1][0], radius);
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (topo.objects[objectName].geometries as any[]).forEach(geom => {
    if (!geom.arcs) return;
    if (geom.type === "Polygon") { (geom.arcs as number[][]).forEach(ring => ringToSegments(ring)); } 
    else if (geom.type === "MultiPolygon") { (geom.arcs as number[][][]).forEach(poly => poly.forEach(ring => ringToSegments(ring))); }
  });
  return new Float32Array(positions);
}

function useCountUp(target: number, duration = 1200): number {
  const [v, setV] = useState<number>(0);
  useEffect(() => {
    let s: number | null = null;
    let frameId: number;
    const step = (ts: number) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);
  return v;
}

// ── Components ────────────────────────────────────────────────────────────────
function LiveBanner({ live }: { live: LiveData }) {
  const animNow = useCountUp(live.onlineNow); const anim30m = useCountUp(live.activeLast30m);
  const animPeak = useCountUp(live.peakToday); const animNew = useCountUp(live.newVisitors); const animReturn = useCountUp(live.returningVisitors);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center gap-6 shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-3 shrink-0 border-r border-gray-100 pr-6">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-green-600 font-bold uppercase">Live Now</div>
          <div className="text-3xl font-bold text-gray-900 leading-none mt-1 tracking-tight">{animNow.toLocaleString()}</div>
        </div>
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        {[
          { label: "Last 30 min",  val: anim30m,    icon: <Clock size={14} className="text-blue-500" /> },
          { label: "Peak Today",   val: animPeak,   icon: <TrendingUp size={14} className="text-amber-500" /> },
          { label: "New Today",    val: animNew,    icon: <UserCheck size={14} className="text-purple-500" /> },
          { label: "Returning",    val: animReturn, icon: <Users size={14} className="text-emerald-500" /> },
        ].map(({ label, val, icon }) => (
          <div key={label} className="shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">{icon} {label}</div>
            <div className="text-xl font-bold text-gray-900">{val.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block w-px h-10 bg-gray-100 shrink-0 ml-auto" />
      <div className="shrink-0 lg:ml-0 ml-auto">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Hot Right Now</div>
        <div className="flex gap-2">
          {live.topLiveCountries.slice(0, 4).map(({ country, count }) => {
            const meta = COUNTRY_META[country];
            return (
              <div key={country} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                <span className="text-sm">{meta?.flag || "🌐"}</span><span className="text-xs font-bold text-gray-700">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: StatCardProps) {
  const anim = useCountUp(value);
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 flex-1 min-w-[150px]">
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span></div>
      <p className="text-3xl font-bold text-gray-900 leading-none">{anim.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-600 mt-2">{sub}</p>}
    </div>
  );
}

function CountryRow({ data, maxTotal, rank, active, onHover }: CountryRowProps) {
  const total = data.known + data.unknown;
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const knownPct = total > 0 ? (data.known / total) * 100 : 0;
  const meta = COUNTRY_META[data.name];

  return (
    <div onMouseEnter={() => onHover(data.name)} onMouseLeave={() => onHover(null)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-default ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}>
      <div className="text-xs text-gray-600 font-mono w-5 text-right shrink-0 font-medium">{String(rank).padStart(2, "0")}</div>
      <div className="text-base shrink-0 shadow-sm rounded-sm bg-white overflow-hidden leading-none">{meta?.flag || "🌐"}</div>
      <div className={`flex-[0_0_100px] text-xs font-medium truncate ${active ? 'text-blue-700' : 'text-gray-700'}`}>{displayName(data.name)}</div>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="flex h-full rounded-full overflow-hidden transition-all duration-1000 ease-out" style={{ width: `${pct}%` }}>
          <div className="bg-blue-500 h-full" style={{ width: `${knownPct}%` }} /><div className="bg-blue-200 h-full flex-1" />
        </div>
      </div>
      <div className="text-xs text-gray-700 font-mono w-12 text-right shrink-0 font-medium">{total.toLocaleString()}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnalyticsComponent({ source, period }: AnalyticsComponentProps) {
  const mountRef      = useRef<HTMLDivElement>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const spikesRef     = useRef<SpikeMesh[]>([]);
  const frameRef      = useRef<number | null>(null);
  const mouseState    = useRef({ dragging: false, prev: { x: 0, y: 0 }, vel: { x: 0, y: 0 } });
  const raycaster     = useRef(new THREE.Raycaster());
  const mouse2D       = useRef(new THREE.Vector2(-9, -9));
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);

  const [data, setData]               = useState<RawRow[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [tooltip, setTooltip]         = useState<TooltipState | null>(null);
  const [highlight, setHighlight]     = useState<string | null>(null);
  const [liveData, setLiveData]       = useState<LiveData>(MOCK_LIVE);
  const [liveLoaded, setLiveLoaded]   = useState(false);

  // ── Fetch location data (re-runs on period & source prop change) ──────────────
  const fetchLocations = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/analytics/locations?period=${period}&source=${source}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success) { setData(json.data); setLoading(false); return; }
    } catch {}
    setTimeout(() => { setData(MOCK_DATA); setLoading(false); }, 400);
  }, [period, source]);

  useEffect(() => {
    setLoading(true);
    fetchLocations();
  }, [fetchLocations]);

  // ── Fetch live data (initial + every 30 s) ────────────────────────────────
  const fetchLive = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/analytics/live?source=${source}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success) {
        setLiveData({
          onlineNow: json.onlineNow, activeLast30m: json.activeLast30m, todayUnique: json.todayUnique,
          newVisitors: json.newVisitors, returningVisitors: json.returningVisitors,
          topLiveCountries: json.topLiveCountries, peakToday: json.peakToday,
        });
        setLiveLoaded(true);
        return;
      }
    } catch {}
    setLiveLoaded(true); // keep mock
  }, [source]);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30_000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  // ── Aggregate ─────────────────────────────────────────────────────────────
  const countries = useMemo<CountryData[]>(() => {
    const map: Record<string, CountryData> = {};
    data.forEach(r => {
      const k = r.country;
      if (!map[k]) map[k] = { name: k, known: 0, unknown: 0 };
      map[k].known   += r.knownUsers;
      map[k].unknown += r.unknownUsers;
    });
    return Object.values(map)
      .filter(c => c.name !== "Unknown" && COUNTRY_META[c.name])
      .sort((a, b) => (b.known + b.unknown) - (a.known + a.unknown));
  }, [data]);

  const totals = useMemo(() => {
    let k = 0, u = 0;
    data.forEach(r => { k += r.knownUsers; u += r.unknownUsers; });
    return { known: k, unknown: u, total: k + u };
  }, [data]);

  const maxTotal = useMemo(() => Math.max(...countries.map(c => c.known + c.unknown), 1), [countries]);

  // ── Sync spike highlighting ────────────────────────────────────────────────
  useEffect(() => {
    spikesRef.current.forEach(({ mesh, country }) => {
      const mat = mesh.material as THREE.MeshPhongMaterial;
      const isHighlighted = highlight === country || highlight === null;
      mat.opacity = isHighlighted ? 0.95 : 0.2;
      mat.emissiveIntensity = highlight === country ? 2 : 0.4;
    });
  }, [highlight]);

  // ── Three.js setup (runs once data is loaded) ─────────────────────────────
  useEffect(() => {
    if (loading || !mountRef.current) return;

    const container = mountRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;
    const GLOBE_R = 1.9;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
    camera.position.set(0, 0.5, 6.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    globeGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_R, 72, 72),
      new THREE.MeshPhongMaterial({ color: 0xf4f7fc, emissive: 0xe8eef8, specular: 0xd0ddf0, shininess: 40 })
    ));

    const gridMat = new THREE.LineBasicMaterial({ color: 0xd4dff0, transparent: true, opacity: 0.7 });
    for (let lat = -80; lat <= 80; lat += 20) {
      const pts: THREE.Vector3[] = [];
      for (let lon = 0; lon <= 360; lon += 3) pts.push(latLonToVec3(lat, lon - 180, GLOBE_R + 0.002));
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let lon = 0; lon < 360; lon += 20) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 3) pts.push(latLonToVec3(lat, lon, GLOBE_R + 0.002));
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    let fetchAborted = false;
    (async () => {
      try {
        const res  = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
        const topo = await res.json();
        if (fetchAborted) return;

        const countryPositions = decodeTopoArcs(topo, "countries", GLOBE_R + 0.006);
        const countryGeo = new THREE.BufferGeometry();
        countryGeo.setAttribute("position", new THREE.BufferAttribute(countryPositions, 3));
        globeGroup.add(new THREE.LineSegments(countryGeo, new THREE.LineBasicMaterial({ color: 0x7a9dbf, transparent: true, opacity: 0.55 })));
      } catch (e) {
        console.warn("Country borders unavailable:", e);
      }
    })();

    const spikeMeshes: SpikeMesh[] = [];
    countries.forEach((country) => {
      const meta = COUNTRY_META[country.name];
      if (!meta) return;
      const total = country.known + country.unknown;
      const norm  = total / maxTotal;
      const spikeH = 0.08 + norm * 1.4;
      const spikeR = 0.013 + norm * 0.022;
      const col = new THREE.Color().setHSL(0.60 - norm * 0.05, 0.75, 0.42 + norm * 0.22);

      const geo = new THREE.CylinderGeometry(0, spikeR, spikeH, 8, 1);
      geo.translate(0, spikeH / 2, 0);
      const mat = new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.35), transparent: true, opacity: 0.92, emissiveIntensity: 0.4 });
      const spike = new THREE.Mesh(geo, mat);
      const surfacePos = latLonToVec3(meta.lat, meta.lon, GLOBE_R);
      spike.position.copy(surfacePos);
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfacePos.clone().normalize());
      spike.userData = { country: country.name, known: country.known, unknown: country.unknown };
      globeGroup.add(spike);
      spikeMeshes.push({ mesh: spike, country: country.name });
    });
    spikesRef.current = spikeMeshes;

    scene.add(new THREE.AmbientLight(0xf0f4ff, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(6, 4, 5); scene.add(sun);
    
    const ms = mouseState.current;
    const onDown = (e: MouseEvent) => { ms.dragging = true; ms.prev = { x: e.clientX, y: e.clientY }; ms.vel = { x: 0, y: 0 }; };
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse2D.current.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse2D.current.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      if (!ms.dragging) return;
      const dx = e.clientX - ms.prev.x;
      const dy = e.clientY - ms.prev.y;
      ms.vel = { x: dy * 0.004, y: dx * 0.004 };
      if (globeGroupRef.current) { globeGroupRef.current.rotation.x += ms.vel.x; globeGroupRef.current.rotation.y += ms.vel.y; }
      ms.prev = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { ms.dragging = false; };
    container.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    const onResize = () => {
      const nW = container.clientWidth, nH = container.clientHeight;
      camera.aspect = nW / nH; camera.updateProjectionMatrix(); renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    let frame = 0;
    let lastHoveredName: string | null = null;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      frame++;
      if (!ms.dragging) {
        globeGroup.rotation.y += 0.0018;
        ms.vel.x *= 0.92; ms.vel.y *= 0.92;
        globeGroup.rotation.x += ms.vel.x; globeGroup.rotation.y += ms.vel.y;
      }
      globeGroup.rotation.x = Math.max(-0.9, Math.min(0.9, globeGroup.rotation.x));
      spikeMeshes.forEach(({ mesh }, i) => { const s = 1 + 0.06 * Math.sin(frame * 0.025 + i * 1.1); mesh.scale.set(s, 1, s); });
      raycaster.current.setFromCamera(mouse2D.current, camera);
      const hits = raycaster.current.intersectObjects(spikeMeshes.map(s => s.mesh));
      if (hits.length > 0) {
        const ud = hits[0].object.userData as { country: string; known: number; unknown: number };
        if (ud.country !== lastHoveredName) {
          lastHoveredName = ud.country;
          const wp = new THREE.Vector3(); hits[0].object.getWorldPosition(wp); wp.project(camera);
          const rect = container.getBoundingClientRect();
          setTooltip({ name: ud.country, known: ud.known, unknown: ud.unknown, x: ((wp.x + 1) / 2) * rect.width, y: ((-wp.y + 1) / 2) * rect.height });
        }
        container.style.cursor = "pointer";
      } else {
        if (lastHoveredName !== null) { lastHoveredName = null; setTooltip(null); }
        container.style.cursor = "grab";
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      fetchAborted = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      container.removeEventListener("mousedown", onDown); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [loading]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center gap-5 py-20">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
      <div className="text-gray-500 text-xs tracking-widest uppercase font-semibold">Loading Intelligence</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* ── Live Banner ─────────────────────────────────────────────────── */}
      {liveLoaded && <LiveBanner live={liveData} />}

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <StatCard label="Total Users"    value={totals.total}         icon={<Users size={16} className="text-blue-500" />} sub={`${countries.length} countries mapped`} />
        <StatCard label="Identified"     value={totals.known}         icon={<UserCheck size={16} className="text-green-500" />} sub={`${totals.total > 0 ? ((totals.known / totals.total)*100).toFixed(1) : 0}% verification rate`} />
        <StatCard label="Anonymous"      value={totals.unknown}       icon={<UserMinus size={16} className="text-gray-600" />} sub={`${totals.total > 0 ? ((totals.unknown / totals.total)*100).toFixed(1) : 0}% of total volume`} />
        <StatCard label="Today Unique"   value={liveData.todayUnique} icon={<Activity size={16} className="text-purple-500" />} sub="active sessions today" />
      </div>

      {/* ── Main Grid: Globe + Panel ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 flex-1 min-h-[480px]">

        {/* Globe Canvas */}
        <div className="relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-gray-100 rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[480px]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,_#c8d8ee_1px,_transparent_1px)] bg-[size:28px_28px] opacity-40" />
          <div ref={mountRef} className="absolute inset-0 w-full h-full" />

          {/* Render Period context */}
          <div className="absolute top-4 left-4 bg-white/90 border border-gray-200 shadow-sm rounded-lg px-3 py-1.5 text-[10px] tracking-widest text-gray-600 font-bold uppercase backdrop-blur-md pointer-events-none">
            <Globe size={12} className="inline mr-1 text-blue-500" />
            {period === "all" ? "All Time" : period === "week" ? "Last 7 Days" : "Last 30 Days"}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div style={{ left: Math.min(tooltip.x + 12, (mountRef.current?.clientWidth ?? 600) - 200), top: Math.max(tooltip.y - 80, 8) }} className="absolute bg-white/95 border border-gray-200 rounded-xl p-3 shadow-lg min-w-[170px] z-10 pointer-events-none backdrop-blur-md">
              <div className="text-gray-900 font-bold text-sm mb-2 flex items-center gap-2"><span>{COUNTRY_META[tooltip.name]?.flag}</span><span>{displayName(tooltip.name)}</span></div>
              <div className="flex justify-between text-xs text-gray-500 pb-1"><span>Identified</span><span className="text-blue-600 font-bold">{tooltip.known.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs text-gray-500 pb-1"><span>Anonymous</span><span className="text-gray-600 font-bold">{tooltip.unknown.toLocaleString()}</span></div>
              <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-xs text-gray-500"><span>Total Users</span><span className="text-gray-900 font-bold">{(tooltip.known + tooltip.unknown).toLocaleString()}</span></div>
            </div>
          )}

          <div className="absolute bottom-4 right-4 flex gap-4 text-[10px] text-gray-600 tracking-wider uppercase font-semibold pointer-events-none">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-blue-500" /> High Volume</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-blue-200" /> Low Volume</div>
          </div>
        </div>

        {/* ── Right Panel ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2 font-semibold text-gray-800"><MapPin size={16} className="text-gray-500" /> Regions Ranked</div>
            <div className="text-[10px] text-gray-500 tracking-widest font-semibold uppercase mt-1">Based on global filter</div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white text-[10px] font-bold uppercase text-gray-600 tracking-wider">
            <div className="w-5 text-right shrink-0">#</div><div className="w-4 shrink-0" /><div className="flex-[0_0_100px]">Country</div><div className="flex-1">Share</div><div className="w-12 text-right shrink-0">Total</div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {countries.map((c, i) => (
              <CountryRow key={c.name} data={c} maxTotal={maxTotal} rank={i + 1} active={highlight === c.name || (tooltip !== null && tooltip.name === c.name)} onHover={setHighlight} />
            ))}
            {countries.length === 0 && <div className="text-center py-10 text-gray-600 text-sm">No geographic data found</div>}
          </div>

          <div className="border-t border-gray-100 p-4 grid grid-cols-2 gap-3 bg-white">
            {[
              { label: "ID Rate",      val: `${totals.total > 0 ? ((totals.known / totals.total)*100).toFixed(1) : 0}%`,      col: "text-green-600" },
              { label: "Top Country",  val: countries[0]?.name.slice(0, 10) ?? "—",                                           col: "text-blue-600" },
              { label: "Top Share",    val: countries[0] ? `${(((countries[0].known + countries[0].unknown) / totals.total)*100).toFixed(1)}%` : "—", col: "text-purple-600" },
              { label: "Avg / Region", val: countries.length > 0 ? Math.round(totals.total / countries.length).toLocaleString() : "—", col: "text-amber-500" },
            ].map(({ label, val, col }) => (
              <div key={label} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-[9px] text-gray-600 tracking-wider uppercase font-bold mb-1">{label}</div>
                <div className={`text-base font-bold ${col} leading-none tracking-tight`}>{val}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}