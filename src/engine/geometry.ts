import type { Appearance, Body } from './appearance';
export type Point = { x: number; y: number };
export function random(seed: number) {
  let n = seed >>> 0;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}
export function outline(body: Body, t: number): Point {
  const s = Math.sin(t), c = Math.cos(t);
  if (body === 'poof') return { x: c * (90 + 2 * Math.sin(t * 3)), y: s * 86 };
  if (body === 'dumpling') return { x: c * (94 + 16 * s) + 3 * Math.cos(t * 2), y: s * 78 + 3 * Math.sin(t * 2) };
  const r = 1 + .065 * Math.sin(3 * t + .5) + .035 * Math.cos(5 * t);
  return { x: c * 106 * r, y: s * 72 * r };
}
export function bodyPath(body: Body) {
  const points = Array.from({ length: 120 }, (_, i) => outline(body, i / 120 * Math.PI * 2));
  return 'M ' + points.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ') + ' Z';
}
const f = (n: number) => n.toFixed(2);
export function furGeometry(a: Appearance) {
  const rng = random(a.seed), edge = ['', '', ''];
  const length = a.fur === 'short' ? 7 : a.fur === 'soft' ? 16 : 23;
  // Small coherent locks, not independent radial spikes.
  for (let i = 0; i < 1200; i++) {
    const t = (i + rng()) / 1200 * Math.PI * 2, p = outline(a.body, t);
    const flow = Math.sin(t * 9 + .7) * .24;
    const nx = Math.cos(t + flow), ny = Math.sin(t + flow);
    const len = length * (.35 + rng() * .8), bend = (rng() - .5) * 5;
    edge[i % 3] += `M ${f(p.x * .93)} ${f(p.y * .93)} Q ${f(p.x + nx * len * .4 - ny * bend)} ${f(p.y + ny * len * .3 + nx * bend)} ${f(p.x + nx * len * .7)} ${f(p.y + ny * len * .55 + 2)} `;
  }
  // Back-to-front horizontal bands preserve overlap. Each band batches strands
  // into lighting bins so thousands of fibers require only ~80 draw nodes.
  const layers = Array.from({length: 14}, () => Array.from({length: 6}, () => ''));
  const inner = ['', '', ''];
  for (let i = 0; i < 8200; i++) {
    const t = rng() * Math.PI * 2, r = Math.sqrt(rng()) * .99, p = outline(a.body, t);
    const x = p.x * r, y = p.y * r;
    const lock = Math.sin(x * .16 + Math.sin(y * .07) * 1.6);
    const len = length * (.45 + rng() * .7);
    const outward = x / 105;
    const ex = x + outward * len * .42 + lock * 2.6;
    const ey = y + len * (.55 + .15 * Math.cos(x * .04));
    const curl = lock * 3 + (rng() - .5) * 2;
    const d = `M ${f(x)} ${f(y)} Q ${f(x + curl + outward * len * .3)} ${f(y + len * .28)} ${f(ex)} ${f(ey)} `;
    const z = Math.sqrt(Math.max(0, 1 - r * r));
    const light = Math.max(0, Math.min(.999, .25 + z * .48 - x / 650 - y / 500 + (rng() - .5) * .24));
    const bin = Math.floor(light * 6);
    const band = Math.max(0, Math.min(13, Math.floor((y + 95) / 14)));
    layers[band][bin] += d;
    if (i % 5 === 0) inner[i % 3] += d;
  }
  return { edge, inner, layers };
}
export function mixColor(a: string, b: string, t: number) {
  const channels = [1, 3, 5].map(i => Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t));
  return '#' + channels.map(v=>v.toString(16).padStart(2,'0')).join('');
}
