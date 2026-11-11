import type { View } from "@/data/world";

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

/**
 * Камера: двигает и масштабирует «полотно» (wrap) внутри сцены (stage).
 * x, y — точка полотна в процентах, которая окажется в центре экрана; s — масштаб.
 */
export class Camera {
  c: View = { x: 50, y: 50, s: 1 };
  constructor(
    private stage: () => HTMLElement | null,
    private wrap: () => HTMLElement | null,
    public aspect: number,
    private pad = 0.94, // доля экрана, которую занимает полотно при s=1
    private minH = 0.5, // на узких экранах полотно не ниже этой доли высоты
  ) {}

  base() {
    const st = this.stage();
    const W = st?.clientWidth || 1;
    const H = st?.clientHeight || 1;
    let w = Math.min(W * this.pad, H * this.pad * this.aspect);
    w = Math.max(w, Math.min(H * this.minH * this.aspect, W * 1.45));
    return { W, H, w, h: w / this.aspect };
  }

  /** Не даёт увидеть пустоту за краем полотна при приближении */
  clamp(v: View): View {
    const { W, H, w, h } = this.base();
    const hx = (W / (2 * w * v.s)) * 100;
    const hy = (H / (2 * h * v.s)) * 100;
    const c = (val: number, half: number) => (half >= 50 ? 50 : Math.min(100 - half, Math.max(half, val)));
    return { x: c(v.x, hx), y: c(v.y, hy), s: v.s };
  }

  apply(c: View = this.c) {
    const el = this.wrap();
    if (!el) return;
    const { W, H, w, h } = this.base();
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.style.transform = `translate(${W / 2 - (c.x / 100) * w * c.s}px, ${H / 2 - (c.y / 100) * h * c.s}px) scale(${c.s})`;
    el.style.setProperty("--inv", String(1 / c.s));
    this.c = { ...c };
  }

  /** Плавный перелёт: масштаб меняется по экспоненте, центр — так, будто зумим вокруг неподвижной точки */
  to(t: View, dur = 1400): Promise<void> {
    const a = { ...this.c };
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) dur = 1;
    if (Math.abs(a.x - t.x) < 0.01 && Math.abs(a.y - t.y) < 0.01 && Math.abs(a.s - t.s) < 0.001) {
      this.apply(t);
      return Promise.resolve();
    }
    return new Promise((res) => {
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / Math.max(dur, 1));
        const e = ease(k);
        const s = a.s * Math.pow(t.s / a.s, e);
        let w = e;
        if (Math.abs(t.s - a.s) > 0.001) w = (1 / a.s - 1 / s) / (1 / a.s - 1 / t.s);
        this.apply({ x: a.x + (t.x - a.x) * w, y: a.y + (t.y - a.y) * w, s });
        if (k < 1) requestAnimationFrame(step);
        else res();
      };
      requestAnimationFrame(step);
    });
  }
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
