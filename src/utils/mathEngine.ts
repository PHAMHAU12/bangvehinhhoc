import { CanvasMathObject, PointObj, Solid3DObj, ViewportTransform } from '../types/math';

export const PAL = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
export const COLS = ['ink', '#dc2626', '#2563eb', '#059669'];

export const esc = (s: string | number) =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));

export const getCssVar = (name: string): string => {
  if (typeof document === 'undefined') return '#16262b';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#16262b';
};

export const resolveColor = (c?: string): string => {
  if (!c || c === 'ink') return getCssVar('--ink');
  return c;
};

export const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  'n': 'ⁿ', '-': '⁻'
};

export const fmt = (s: string): string =>
  s
    .replace(/sqrt\(/g, '√(')
    .replace(/\^(-?\d+|n)/g, (_, c) => [...c].map(k => SUP[k] || k).join(''))
    .replace(/_(\d)/g, (_, c) => String.fromCharCode(8320 + +c))
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥')
    .replace(/!=/g, '≠')
    .replace(/->/g, '→')
    .replace(/\+-/g, '±')
    .replace(/\bpi\b/g, 'π')
    .replace(/\bdelta\b/gi, 'Δ');

export const cf = (s: string): ((x: number, m: number) => number) | null => {
  let expr = s
    .replace(/\^/g, '**')
    .replace(/^\s*-/, '0-')
    .replace(/(\d)\s*(x|m)\b/g, '$1*$2')
    .replace(/\bln\b/g, 'Math.log')
    .replace(/\blog\b/g, 'Math.log10')
    .replace(/\b(sin|cos|tan|sqrt|abs|exp)\b/g, 'Math.$1')
    .replace(/\bpi\b/gi, 'Math.PI');
  if (/[^0-9a-zA-Z.+\-*/()%, ]/.test(expr)) return null;
  const ok = ['x', 'm', 'Math', 'sin', 'cos', 'tan', 'sqrt', 'abs', 'exp', 'log', 'log10', 'PI'];
  const matches = expr.match(/[a-zA-Z_]\w*/g) || [];
  if (matches.some(w => !ok.includes(w))) return null;
  try {
    return new Function('x', 'm', 'return ' + expr) as (x: number, m: number) => number;
  } catch {
    return null;
  }
};

export const parseNumber = (t: string): number => {
  if (t.includes('/')) {
    return t.split('/').reduce((p, q) => Number(p) / Number(q), 1);
  }
  return Number(t);
};

export const fmtN = (v: number): string => String(+(+v).toFixed(4));

export const parseNums = (
  q: string,
  n: number,
  lo: number,
  hi: number,
  isInteger?: boolean
): number[] | null => {
  if (!q) return null;
  const a = q.split(/[,;]/).map(t => parseNumber(t.trim()));
  return a.length === n &&
    a.every(v => isFinite(v) && v >= lo && v <= hi && (!isInteger || Number.isInteger(v)))
    ? a
    : null;
};

export interface SetRange {
  lo: number;
  hi: number;
  lc: boolean;
  hc: boolean;
}

export const parseSet = (q: string): SetRange[] | null => {
  const clean = (q || '').replace(/∞/g, 'inf').trim();
  if (!clean) return null;
  const out: SetRange[] = [];
  for (const t of clean.split(/\s*(?:∪|U)\s*/i)) {
    const m = t.trim().match(/^([\[(])\s*([-+]?[\d.]+|[-+]?inf)\s*[;,]\s*([-+]?[\d.]+|[-+]?inf)\s*([\])])$/i);
    if (!m) return null;
    const c = (v: string) => (/inf/i.test(v) ? (v[0] === '-' ? -Infinity : Infinity) : Number(v));
    const lo = c(m[2]);
    const hi = c(m[3]);
    if (isNaN(lo) || isNaN(hi) || lo > hi) return null;
    out.push({ lo, hi, lc: m[1] === '[', hc: m[4] === ']' });
  }
  return out;
};

export const parsePieData = (s: string): [string, number][] | null => {
  if (!s) return null;
  const d = s
    .split(',')
    .map(t => t.split(':'))
    .filter(a => a.length === 2 && Number(a[1]) > 0)
    .map(a => [a[0].trim(), Number(a[1])] as [string, number]);
  return d.length ? d : null;
};

/* ------------------ 3D Vector Math ------------------ */
export const cr3 = (a: number[], b: number[]): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
export const dt3 = (a: number[], b: number[]): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const sb3 = (a: number[], b: number[]): [number, number, number] => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const ad3 = (a: number[], b: number[], t = 1): [number, number, number] => [
  a[0] + t * b[0],
  a[1] + t * b[1],
  a[2] + t * b[2]
];
export const sc3 = (a: number[], k: number): [number, number, number] => [a[0] * k, a[1] * k, a[2] * k];
export const nm3 = (a: number[]): [number, number, number] => sc3(a, 1 / (Math.hypot(...a) || 1));

const POOL = 'MNPQRKLTUVWXYZ';
export const freeName = (u: Set<string>): string => [...POOL].find(c => !u.has(c)) || '?';
export const tok = (t: string): string[] => t.toUpperCase().replace(/[’′]/g, "'").match(/[A-Z]'?/g) || [];

export const isFree = (k?: string) => k === 'free' || k === 'fprism' || k === 'fbox';
export const prm = (o: Solid3DObj) => o.kind && o.kind !== 'pyr' && o.kind !== 'free';

export function freeKeys(o: Solid3DObj): string[] {
  const ch = (i: number) => String.fromCharCode(65 + i);
  if (o.kind === 'free') return ['S', ...(o.fb || []).map((_, i) => ch(i))];
  if (o.kind === 'fbox') return ['A', 'B', 'D', "A'"];
  return [...(o.fb || []).map((_, i) => ch(i)), "A'"];
}

export function pyrModel(o: Solid3DObj) {
  const R = o.s || 90;
  const kind = o.kind || 'pyr';
  const n = kind === 'box' || kind === 'fbox' ? 4 : kind === 'free' || kind === 'fprism' ? o.fb?.length || 4 : o.n;
  const M: Record<string, [number, number, number]> = {};
  const E: Array<[string, string, string?, number?]> = [];
  const ch = (i: number) => String.fromCharCode(65 + i);
  const base: [number, number, number][] = [];

  for (let i = 0; i < n; i++) {
    if (kind === 'box') {
      base.push([[1, -1, -1, 1][i] * R * 0.95, 0, [1, 1, -1, -1][i] * R * 0.6]);
    } else if (kind === 'free' || kind === 'fprism') {
      const fb = o.fb?.[i] || [0, 0];
      base.push([fb[0], 0, fb[1]]);
    } else if (kind === 'fbox') {
      const f0 = o.fb?.[0] || [-70, -45];
      const f1 = o.fb?.[1] || [60, -60];
      const f2 = o.fb?.[2] || [-50, 55];
      const q = [f0, f1, [f1[0] + f2[0] - f0[0], f1[1] + f2[1] - f0[1]], f2];
      base.push([q[i][0], 0, q[i][1]]);
    } else {
      const a = (i * 2 * Math.PI) / n;
      base.push([R * Math.cos(a), 0, R * Math.sin(a)]);
    }
  }

  if (kind === 'pyr') M.S = [0, R * 1.7, 0];
  if (kind === 'free') M.S = [...(o.fa || [10, 150, 0])];

  base.forEach((p, i) => (M[ch(i)] = p));

  if (kind === 'pyr' || kind === 'free') {
    for (let i = 0; i < n; i++) {
      E.push(['S', ch(i)], [ch(i), ch((i + 1) % n)]);
    }
  } else {
    const hh = kind === 'box' ? R * 1.1 : R * 1.5;
    const fv = kind === 'fprism' || kind === 'fbox' ? o.fv || [0, hh, 0] : [0, hh, 0];
    base.forEach((p, i) => (M[ch(i) + "'"] = [p[0] + fv[0], fv[1], p[2] + fv[2]]));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      E.push([ch(i), ch(j), 'b', i], [ch(i) + "'", ch(j) + "'", 't', i], [ch(i), ch(i) + "'", 'v', i]);
    }
  }

  for (const [a, b, nm] of o.mp || []) {
    if (M[a] && M[b]) M[nm] = sc3(ad3(M[a], M[b]), 0.5);
  }
  return { R, n, M, E, kind, ch };
}

export const pt3 = (m: ReturnType<typeof pyrModel>, k: string): [number, number, number] | null =>
  m.M[k] || ((m.kind === 'pyr' || m.kind === 'free') && k === 'H' ? [m.M.S[0], 0, m.M.S[2]] : null);

export function mkPlane(m: ReturnType<typeof pyrModel>, nm: string[]) {
  const p = nm.map(k => pt3(m, k));
  if (p.length < 3 || p.some(x => !x)) return null;
  const p0 = p[0]!;
  const p1 = p[1]!;
  const p2 = p[2]!;
  const c = cr3(sb3(p1, p0), sb3(p2, p0));
  const l = Math.hypot(...c);
  if (l < 1e-6 * m.R * m.R) return null;
  const u = sc3(c, 1 / l);
  return { n: u, d: dt3(u, p0) };
}

export function secPts(m: ReturnType<typeof pyrModel>, pl: { n: [number, number, number]; d: number }) {
  const eps = 1e-6 * m.R;
  const pts: [number, number, number][] = [];
  const add = (p: [number, number, number]) => {
    if (!pts.some(q => Math.hypot(...sb3(p, q)) < eps * 100)) pts.push(p);
  };
  const f = (p: [number, number, number]) => dt3(pl.n, p) - pl.d;

  for (const [a, b] of m.E) {
    const P0 = m.M[a];
    const Q0 = m.M[b];
    if (!P0 || !Q0) continue;
    const fp = f(P0);
    const fq = f(Q0);
    if (Math.abs(fp) < eps) add(P0);
    if (Math.abs(fq) < eps) add(Q0);
    if (fp * fq < 0 && Math.abs(fp) >= eps && Math.abs(fq) >= eps) {
      add(ad3(P0, sb3(Q0, P0), fp / (fp - fq)));
    }
  }

  if (pts.length < 3) return null;
  const c = sc3(pts.reduce((x, y) => ad3(x, y), [0, 0, 0]), 1 / pts.length);
  let u = cr3(pl.n, [0, 1, 0]);
  u = Math.hypot(...u) < 1e-6 ? [1, 0, 0] : nm3(u);
  const v = cr3(pl.n, u);
  const an = (p: [number, number, number]) => Math.atan2(dt3(sb3(p, c), v), dt3(sb3(p, c), u));
  pts.sort((p, q) => an(p) - an(q));
  return { pts, u, v, c };
}

export function sphereOf(m: ReturnType<typeof pyrModel>) {
  const R = m.R;
  const rb = m.kind === 'box' ? Math.hypot(0.95, 0.6) * R : R;
  if (m.kind === 'pyr') {
    const h = 1.7 * R;
    const c = (h * h - rb * rb) / (2 * h);
    return { c, r: h - c };
  }
  const c = ((m.kind === 'box' ? 1.1 : 1.5) * R) / 2;
  return { c, r: Math.hypot(rb, c) };
}

export function pyrMeasure(m: ReturnType<typeof pyrModel>) {
  const ch = m.ch;
  const n = m.n;
  const Mk = m.M;
  const isP = m.kind === 'pyr' || m.kind === 'free';
  const base: [number, number, number][] = [];
  for (let i = 0; i < n; i++) base.push(Mk[ch(i)]);
  let A2 = 0;
  let Sxq = 0;
  let h = 0;
  base.forEach((p, i) => {
    const q = base[(i + 1) % n];
    A2 += p[0] * q[2] - q[0] * p[2];
  });
  const Sd = Math.abs(A2) / 2;
  if (isP) {
    h = Mk.S[1];
    for (let i = 0; i < n; i++) {
      const a = base[i];
      const b = base[(i + 1) % n];
      Sxq += Math.hypot(...cr3(sb3(b, a), sb3(Mk.S, a))) / 2;
    }
  } else {
    h = Mk[ch(0) + "'"][1];
    for (let i = 0; i < n; i++) {
      const a = base[i];
      const b = base[(i + 1) % n];
      const a2 = Mk[ch(i) + "'"];
      Sxq += Math.hypot(...cr3(sb3(b, a), sb3(a2, a)));
    }
  }
  const u = 1 / 24;
  return {
    h: h * u,
    Sd: Sd * u * u,
    Sxq: Sxq * u * u,
    Stp: (Sxq + (isP ? 1 : 2) * Sd) * u * u,
    V: (isP ? (Sd * h) / 3 : Sd * h) * u * u * u
  };
}

export function pyrProject(o: Solid3DObj) {
  const m = pyrModel(o);
  const az = (o.az * Math.PI) / 180;
  const cs = Math.cos(az);
  const sn = Math.sin(az);
  const pr = (p: [number, number, number]) => ({
    X: o.x + p[0] * cs - p[2] * sn,
    Y: o.y + (p[0] * sn + p[2] * cs) * 0.32 - p[1],
    z: p[0] * sn + p[2] * cs
  });
  const Q: Record<string, { X: number; Y: number; z: number }> = {};
  for (const k in m.M) Q[k] = pr(m.M[k]);
  return { m, Q, cs, sn, pr };
}

export function fixFree(o: Solid3DObj) {
  if (!o.fb) o.fb = [];
  while (o.fb.length < o.n) {
    const a = o.fb[o.fb.length - 1] || [50, 50];
    const b = o.fb[0] || [-50, -50];
    o.fb.push([((a[0] + b[0]) / 2) * 1.2, ((a[1] + b[1]) / 2) * 1.2]);
  }
  while (o.fb.length > o.n) o.fb.pop();
}

/* ------------------ 2D Dependent Point Updates ------------------ */
export const P = (O: CanvasMathObject[], i: number): PointObj | undefined =>
  O.find(o => o.id === i && o.t === 'pt') as PointObj | undefined;

export const ptsOf = (o: CanvasMathObject): number[] => {
  if (o.t === 'seg') return [o.a, o.b];
  if (o.t === 'cir') return [o.c, o.r];
  if (o.t === 'pol') return o.ids;
  if (o.t === 'pb') return [o.a, o.b];
  if (o.t === 'ms') return o.q;
  if (o.t === 'pt') {
    if (o.pg) return o.pg;
    if (o.m) return o.m;
    if (o.f) return o.f;
    if (o.g) return o.g;
    if (o.k) return o.k;
    if (o.w) return o.w;
  }
  return [];
};

export function ccen(a: PointObj, b: PointObj, c: PointObj): [number, number] | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-6) return null;
  const A = a.x * a.x + a.y * a.y;
  const B = b.x * b.x + b.y * b.y;
  const C = c.x * c.x + c.y * c.y;
  return [
    (A * (b.y - c.y) + B * (c.y - a.y) + C * (a.y - b.y)) / d,
    (A * (c.x - b.x) + B * (a.x - c.x) + C * (b.x - a.x)) / d
  ];
}

export function updateDependentPoints(O: CanvasMathObject[]) {
  for (const o of O) {
    if (o.t !== 'pt') continue;
    if (o.m) {
      const a = P(O, o.m[0]);
      const b = P(O, o.m[1]);
      if (a && b) {
        o.x = (a.x + b.x) / 2;
        o.y = (a.y + b.y) / 2;
      }
    } else if (o.g) {
      const v = P(O, o.g[0]);
      const a = P(O, o.g[1]);
      const b = P(O, o.g[2]);
      if (v && a && b) {
        const d1 = Math.hypot(a.x - v.x, a.y - v.y);
        const d2 = Math.hypot(b.x - v.x, b.y - v.y);
        const k = d1 + d2 || 1;
        o.x = (d2 * a.x + d1 * b.x) / k;
        o.y = (d2 * a.y + d1 * b.y) / k;
      }
    } else if (o.k) {
      const a = P(O, o.k[0]);
      const b = P(O, o.k[1]);
      const c = P(O, o.k[2]);
      if (a && b && c) {
        const center = ccen(a, b, c);
        if (center) {
          o.x = center[0];
          o.y = center[1];
        }
      }
    } else if (o.pg) {
      const a = P(O, o.pg[0]);
      const b = P(O, o.pg[1]);
      const c = P(O, o.pg[2]);
      if (a && b && c) {
        o.x = b.x + c.x - a.x;
        o.y = b.y + c.y - a.y;
      }
    } else if (o.w) {
      const a = P(O, o.w[0]);
      const b = P(O, o.w[1]);
      const c = P(O, o.w[2]);
      if (a && b && c) {
        if (o.wk === 'G') {
          o.x = (a.x + b.x + c.x) / 3;
          o.y = (a.y + b.y + c.y) / 3;
        } else if (o.wk === 'I') {
          const la = Math.hypot(b.x - c.x, b.y - c.y);
          const lb = Math.hypot(a.x - c.x, a.y - c.y);
          const lc = Math.hypot(a.x - b.x, a.y - b.y);
          const k = la + lb + lc || 1;
          o.x = (la * a.x + lb * b.x + lc * c.x) / k;
          o.y = (la * a.y + lb * b.y + lc * c.y) / k;
        } else {
          const q = ccen(a, b, c);
          if (q) {
            o.x = a.x + b.x + c.x - 2 * q[0];
            o.y = a.y + b.y + c.y - 2 * q[1];
          }
        }
      }
    } else if (o.f) {
      const v = P(O, o.f[0]);
      const a = P(O, o.f[1]);
      const b = P(O, o.f[2]);
      if (v && a && b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const t = ((v.x - a.x) * dx + (v.y - a.y) * dy) / (dx * dx + dy * dy || 1);
        o.x = a.x + t * dx;
        o.y = a.y + t * dy;
        o.u = t;
      }
    }
  }
}

/* ------------------ Bounding Box Computation ------------------ */
export function computeBoundingBox(O: CanvasMathObject[]): [number, number, number, number] | null {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, any = false;
  const add = (a: number, b: number, c: number, d: number) => {
    x0 = Math.min(x0, a);
    y0 = Math.min(y0, b);
    x1 = Math.max(x1, c);
    y1 = Math.max(y1, d);
    any = true;
  };

  for (const o of O) {
    switch (o.t) {
      case 'pt':
        add(o.x - 14, o.y - 24, o.x + 28, o.y + 12);
        break;
      case 'seg': {
        const a = P(O, o.a);
        const b = P(O, o.b);
        if (a && b) {
          add(Math.min(a.x, b.x) - 10, Math.min(a.y, b.y) - 10, Math.max(a.x, b.x) + 10, Math.max(a.y, b.y) + 10);
        }
        break;
      }
      case 'cir': {
        const a = P(O, o.c);
        const b = P(O, o.r);
        if (a && b) {
          const r = Math.hypot(a.x - b.x, a.y - b.y);
          add(a.x - r, a.y - r, a.x + r, a.y + r);
        }
        break;
      }
      case 'pol': {
        const pts = o.ids.map(i => P(O, i)).filter(Boolean) as PointObj[];
        if (pts.length) {
          const xs = pts.map(p => p.x);
          const ys = pts.map(p => p.y);
          add(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
        }
        break;
      }
      case 'pen': {
        const nums = (o.d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
        for (let i = 0; i + 1 < nums.length; i += 2) {
          add(nums[i] + o.tx, nums[i + 1] + o.ty, nums[i] + o.tx, nums[i + 1] + o.ty);
        }
        break;
      }
      case 'txt':
        add(o.x, o.y - 24, o.x + 14 * o.s.length, o.y + 8);
        break;
      case 'fn':
        add(o.x, o.y, o.x + 340, o.y + 260);
        break;
      case 'pie':
        add(o.x - 75, o.y - 75, o.x + 215, o.y + Math.max(75, 20 * o.d.length - 55));
        break;
      case 'tree':
        add(o.x - 16, o.y - 10, o.x + 410, o.y + 265);
        break;
      case 'venn':
        add(o.x, o.y, o.x + 300, o.y + 245);
        break;
      case 'nl':
        add(o.x - 16, o.y - 42, o.x + 475, o.y + 42);
        break;
      case 'pyr': {
        const { m, Q } = pyrProject(o);
        for (const k in Q) add(Q[k].X - 25, Q[k].Y - 25, Q[k].X + 25, Q[k].Y + 18);
        if (o.sph && !isFree(o.kind)) {
          const g = sphereOf(m);
          const cy = o.y - g.c;
          const ry = g.r * 1.05;
          add(o.x - g.r, cy - ry, o.x + g.r, cy + ry);
        }
        if (o.sec) add(o.x + m.R + 40, o.y - m.R * 0.9 - 80, o.x + m.R + 185, o.y - m.R * 0.9 + 105);
        if (o.vol) add(o.x - m.R, o.y + m.R * 0.32, o.x + m.R + 125, o.y + m.R * 0.32 + 135);
        break;
      }
    }
  }
  return any ? [x0, y0, x1, y1] : null;
}

/* ------------------ SVG Render Helpers ------------------ */
export const L = (a: number, b: number, c: number, d: number, st: string, w = 1.6, x = '') =>
  `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${st}" stroke-width="${w}" ${x}/>`;

export const T = (x: number, y: number, t: string, c: string, sz = 14, a = 'start') =>
  `<text x="${x}" y="${y}" fill="${c}" font-size="${sz}" text-anchor="${a}">${esc(t)}</text>`;

export const dsh = (ls?: string, round = true) =>
  ls === 'dash'
    ? 'stroke-dasharray="9 7"'
    : ls === 'dot'
    ? 'stroke-dasharray="0.1 7"' + (round ? ' stroke-linecap="round"' : '')
    : '';

export const arrow = (a: PointObj, b: PointObj, c: string) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  const nx = -uy;
  const ny = ux;
  return `<path d="M${b.x} ${b.y}L${b.x - ux * 14 + nx * 6} ${b.y - uy * 14 + ny * 6}L${b.x - ux * 14 - nx * 6} ${b.y - uy * 14 - ny * 6}Z" fill="${c}"/>`;
};

export const vlab = (a: PointObj, b: PointObj, c: string) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  let nx = -dy / l;
  let ny = dx / l;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const mx = (a.x + b.x) / 2 + nx * 22;
  const my = (a.y + b.y) / 2 + ny * 22 + 5;
  const t = a.n + b.n;
  const w = t.length * 10.5 + 4;
  return (
    `<text x="${mx}" y="${my}" fill="${c}" font-size="15" font-weight="600" text-anchor="middle" stroke="${getCssVar(
      '--bg'
    )}" stroke-width="4" paint-order="stroke">${esc(t)}</text>` +
    `<path d="M${mx - w / 2} ${my - 14}H${mx + w / 2}m-4 -3l4 3l-4 3" fill="none" stroke="${c}" stroke-width="1.4"/>`
  );
};
