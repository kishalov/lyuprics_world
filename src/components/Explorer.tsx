"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WORLD, type WorldNode } from "@/data/world";
import { NPCS } from "@/data/npcs";
import { Camera, nextFrame, sleep } from "@/lib/camera";
import { MAP_ASPECT, focusLayerOf, getNode, getParent, getParentId, idFromSlug, urlFor, viewOf } from "@/lib/world";
import { SCENES } from "@/art/scenes";
import Header from "./Header";
import InfoCard, { type CardData } from "./InfoCard";
import Spots from "./Spots";
import Interior from "./Interior";
import MapLayers, { hitLayer } from "./MapLayers";

type Layer = "map" | "scene" | "interior";
type SpotsState = { layer: "map" | "scene"; id: string; key: number } | null;

const modeOf = (n: WorldNode): Layer => (n.type === "interior" ? "interior" : n.type === "scene" ? "scene" : "map");
const mapViewOf = viewOf;
const idFromPath = (path: string) => idFromSlug(path.split("/").filter(Boolean));

export default function Explorer({ initialId }: { initialId: string }) {
  const stageRef = useRef<HTMLElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const sceneWrapRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  const mapCam = useRef(new Camera(() => stageRef.current, () => mapWrapRef.current, MAP_ASPECT, 0.94, 0.5)).current;
  const sceneCam = useRef(new Camera(() => stageRef.current, () => sceneWrapRef.current, 1.6, 1, 0.46)).current;

  const [cur, setCur] = useState<string>("world");
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ map: true, scene: false, interior: false });
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [interiorId, setInteriorId] = useState<string | null>(null);
  const [spots, setSpots] = useState<SpotsState>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [hot, setHot] = useState<string | null>(null); // id узла, чей рисунок под курсором

  // ссылки на актуальные значения для асинхронных переходов
  const curRef = useRef("world");
  const sceneRef = useRef<string | null>(null);
  const busy = useRef(false);
  const queued = useRef<{ id: string; fromPop?: boolean } | null>(null);
  const spotKey = useRef(0);

  const show = (l: Layer, v: boolean) => setLayers((s) => (s[l] === v ? s : { ...s, [l]: v }));
  const showSpots = (layer: "map" | "scene", id: string) => setSpots({ layer, id, key: ++spotKey.current });
  const showCard = (n: WorldNode) => setCard({ node: n });

  const veil = (to: number, dur: number) => {
    const v = veilRef.current;
    if (v) {
      v.style.transition = `opacity ${dur}ms ease`;
      v.style.opacity = String(to);
      v.style.pointerEvents = to > 0 ? "auto" : "none";
    }
    return sleep(dur);
  };

  const loadScene = async (n: WorldNode) => {
    if (sceneRef.current !== n.id) {
      sceneRef.current = n.id;
      sceneCam.aspect = n.aspect || 1.6;
      setSceneId(n.id);
    }
    show("scene", true);
    await nextFrame();
  };

  /* ---------- основной переход между уровнями ---------- */
  const travel = async (id: string, instant: boolean): Promise<void> => {
    const to = getNode(id)!;
    const from = getNode(curRef.current)!;
    const T = (ms: number) => (instant ? 1 : ms);
    const toMode = modeOf(to);
    setSpots(null);

    // 1) уходим из дома
    if (modeOf(from) === "interior") {
      const host = getParent(from.id)!;
      await veil(1, T(450));
      show("interior", false);
      if (host.type === "scene") {
        await loadScene(host);
        sceneCam.apply({ x: from.at!.x, y: from.at!.y, s: 3 });
      } else {
        show("scene", false);
        sceneRef.current = null;
        mapCam.apply({ x: from.at!.x, y: from.at!.y, s: mapViewOf(host).s * 3.5 });
      }
      if (host.id === id) {
        veil(0, T(700));
        await (host.type === "scene" ? sceneCam.to({ x: 50, y: 50, s: 1 }, T(1200)) : mapCam.to(mapCam.clamp(mapViewOf(host)), T(1200)));
      } else if (host.type === "scene") {
        veil(0, T(500));
        await sceneCam.to({ x: 50, y: 50, s: 1 }, T(700));
      } else {
        veil(0, T(500));
      }
      curRef.current = host.id;
    }

    // 2) уходим из сцены обратно на карту
    const stayInScene = toMode === "scene" || (toMode === "interior" && getParentId(id) === sceneRef.current);
    if (sceneRef.current && !stayInScene) {
      const sc = getNode(sceneRef.current)!;
      const host = getParent(sc.id)!;
      await Promise.all([sceneCam.to({ x: 50, y: 50, s: 0.45 }, T(900)), veil(1, T(800))]);
      show("scene", false);
      sceneRef.current = null;
      show("map", true);
      mapCam.apply({ x: sc.at!.x, y: sc.at!.y, s: mapViewOf(host).s * 4 });
      veil(0, T(700));
      curRef.current = host.id;
    }

    // 3) приходим на новый уровень
    if (toMode === "map") {
      show("map", true);
      const target = mapViewOf(to);
      await mapCam.to(target.s > 1 ? mapCam.clamp(target) : target, T(1500));
      if (to.type !== "leaf") showSpots("map", to.id);
      showCard(to);
    } else if (toMode === "scene") {
      if (sceneRef.current !== id) {
        const host = getParent(id)!;
        show("map", true);
        if (curRef.current !== host.id && !instant) await mapCam.to(mapCam.clamp(mapViewOf(host)), 1200);
        const zoom = mapCam.to({ x: to.at!.x, y: to.at!.y, s: mapViewOf(host).s * 5 }, T(1500));
        await sleep(T(850));
        await veil(1, T(650));
        await zoom;
        show("map", false);
        await loadScene(to);
        sceneCam.apply({ x: 50, y: 50, s: 1.9 });
        veil(0, T(900));
        await sceneCam.to({ x: 50, y: 50, s: 1 }, T(1300));
      }
      showSpots("scene", to.id);
      showCard(to);
    } else {
      const host = getParent(id)!;
      if (host.type === "scene") {
        if (sceneRef.current !== host.id) {
          await travel(host.id, instant);
          curRef.current = host.id;
          setSpots(null);
        }
        const zoom = sceneCam.to({ x: to.at!.x, y: to.at!.y, s: 3.4 }, T(1200));
        await sleep(T(700));
        await veil(1, T(500));
        await zoom;
      } else {
        show("map", true);
        if (curRef.current !== host.id && !instant) await mapCam.to(mapCam.clamp(mapViewOf(host)), 1200);
        const zoom = mapCam.to({ x: to.at!.x, y: to.at!.y, s: mapViewOf(host).s * 4 }, T(1300));
        await sleep(T(750));
        await veil(1, T(550));
        await zoom;
      }
      setCard(null);
      setInteriorId(id);
      show("interior", true);
      await nextFrame();
      await veil(0, T(700));
    }
  };

  const go = useCallback(async (id: string, opts: { instant?: boolean; fromPop?: boolean; replace?: boolean } = {}) => {
    const node = getNode(id);
    if (!node || id === curRef.current) return;
    if (node.type === "locked") {
      setCard({ node, fog: true });
      return;
    }
    if (busy.current) {
      queued.current = { id, fromPop: opts.fromPop };
      return;
    }
    busy.current = true;
    setCard(null);
    setHot(null);
    try {
      await travel(id, !!opts.instant);
    } catch (e) {
      console.error(e);
    }
    busy.current = false;
    curRef.current = id;
    setCur(id);
    const url = urlFor(id);
    if (!opts.fromPop && window.location.pathname !== url) {
      if (opts.replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    }
    document.title = id === "world" ? "Карта земель Ыш" : `${node.name} — Земли Ыш`;
    if (queued.current) {
      const q = queued.current;
      queued.current = null;
      go(q.id, { fromPop: q.fromPop });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const up = useCallback(() => {
    const p = getParentId(curRef.current);
    if (p) go(p);
  }, [go]);

  /* ---------- запуск, кнопка «назад» браузера, Esc, ресайз ---------- */
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    mapCam.apply(WORLD.view!);
    if (initialId === "world") {
      showSpots("map", "world");
      showCard(WORLD);
    } else {
      go(initialId, { instant: true, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPop = () => {
      const id = idFromPath(window.location.pathname);
      if (id) go(id, { fromPop: true });
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === "Escape" && t?.tagName !== "INPUT") up();
    };
    const onResize = () => {
      mapCam.apply();
      sceneCam.apply();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [go, up, mapCam, sceneCam]);

  /* ---------- наведение и нажатие на рисунки слоёв ---------- */
  const layeredKids = (): WorldNode[] =>
    spots?.layer === "map" && !busy.current ? (getNode(spots.id)?.children || []).filter((c) => c.layer) : [];
  const nodeAt = (e: React.PointerEvent | React.MouseEvent): WorldNode | null => {
    const kids = layeredKids();
    const wrap = mapWrapRef.current;
    if (!kids.length || !wrap) return null;
    const r = wrap.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const layer = hitLayer(kids.map((k) => k.layer!), x, y);
    return kids.find((k) => k.layer === layer) || null;
  };
  /* перетаскивание карты (когда она больше экрана) */
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const onMapDown = (e: React.PointerEvent) => {
    if (busy.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { x: e.clientX, y: e.clientY, cx: mapCam.c.x, cy: mapCam.c.y, moved: false };
  };
  const onMapUp = () => {
    dragged.current = !!drag.current?.moved;
    drag.current = null;
  };
  const onMapMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > 6) {
        d.moved = true;
        setHot(null);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
      if (d.moved) {
        const { w, h } = mapCam.base();
        const s = mapCam.c.s;
        mapCam.apply(mapCam.clamp({ x: d.cx - (dx / (w * s)) * 100, y: d.cy - (dy / (h * s)) * 100, s }));
        return;
      }
    }
    if (e.pointerType === "touch") return;
    const n = nodeAt(e);
    setHot(n ? n.id : null);
  };
  const onMapClick = (e: React.MouseEvent) => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    const n = nodeAt(e);
    if (n) {
      setHot(null);
      go(n.id);
    }
  };
  const hotLayer = hot ? getNode(hot)?.layer || null : null;
  const focus = layers.interior ? null : focusLayerOf(cur) || null;

  const sceneNode = sceneId ? getNode(sceneId) : null;
  const interiorNode = interiorId ? getNode(interiorId) : null;
  const sceneArt = sceneNode?.art ? SCENES[sceneNode.art] : undefined;

  return (
    <div className="app">
      <Header currentId={cur} onGo={go} onBack={up} />
      <main id="stage" ref={stageRef}>
        <div
          className={"layer" + (layers.map ? "" : " off") + (hot ? " pointing" : "")}
          id="mapLayer"
          onPointerDown={onMapDown}
          onPointerMove={onMapMove}
          onPointerUp={onMapUp}
          onPointerCancel={onMapUp}
          onPointerLeave={() => setHot(null)}
          onClick={onMapClick}
        >
          <div className="wrap" id="mapWrap" ref={mapWrapRef} role="img" aria-label="Карта земель Ыш">
            <MapLayers hot={hotLayer} focus={focus} />
            {spots?.layer === "map" && <Spots key={spots.key} node={getNode(spots.id)!} hot={hot} setHot={setHot} onOpen={go} />}
          </div>
        </div>

        <div className={"layer" + (layers.scene ? "" : " off")} id="sceneLayer">
          <div className="wrap" id="sceneWrap" ref={sceneWrapRef}>
            {sceneNode?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="scene-img" src={sceneNode.image} alt={sceneNode.name} draggable={false} />
            ) : sceneArt ? (
              <div className="scene-art" dangerouslySetInnerHTML={{ __html: sceneArt() }} />
            ) : null}
            {spots?.layer === "scene" && <Spots key={spots.key} node={getNode(spots.id)!} hot={hot} setHot={setHot} onOpen={go} />}
          </div>
        </div>

        <div className={"layer" + (layers.interior ? "" : " off")} id="interiorLayer">
          {interiorNode?.npc && NPCS[interiorNode.npc] && (
            <Interior key={interiorNode.id} npcId={interiorNode.npc} npc={NPCS[interiorNode.npc]} onLeave={up} />
          )}
        </div>

        <div id="veil" ref={veilRef} />
        <InfoCard data={card} top={cur === "world"} />
      </main>
    </div>
  );
}
