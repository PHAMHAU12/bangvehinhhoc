import {
  CanvasMathObject,
  PointObj,
  Solid3DObj,
  FunctionObj,
  PieChartObj,
  ProbabilityTreeObj,
  VennObj,
  NumberLineObj,
  MeasurementObj
} from '../types/math';
import {
  P,
  getCssVar,
  resolveColor,
  fmt,
  cf,
  fmtN,
  parseSet,
  freeName,
  freeKeys,
  isFree,
  prm,
  pyrModel,
  pyrProject,
  sphereOf,
  pyrMeasure,
  mkPlane,
  secPts,
  pt3,
  cr3,
  dt3,
  sb3,
  ad3,
  sc3,
  L,
  T,
  dsh,
  arrow,
  vlab,
  esc,
  PAL
} from './mathEngine';

export function drawPyr(o: Solid3DObj, f: string, st: string, hl: boolean): string {
  const m = pyrModel(o);
  const R = m.R;
  const az = (o.az * Math.PI) / 180;
  const cs = Math.cos(az);
  const sn = Math.sin(az);
  const mu = getCssVar('--mut');
  const Mk = m.M;

  const pr = (p: [number, number, number]) => {
    const x = p[0] * cs - p[2] * sn;
    const z = p[0] * sn + p[2] * cs;
    return { X: o.x + x, Y: o.y + z * 0.32 - p[1], z };
  };

  const Q: Record<string, { X: number; Y: number; z: number }> = {};
  for (const k in Mk) Q[k] = pr(Mk[k]);

  const n = m.n;
  const ch = m.ch;
  const kd = m.kind;
  const ip = kd === 'pyr' || kd === 'free';
  const ring = (q: string) => {
    const a: { X: number; Y: number; z: number }[] = [];
    for (let i = 0; i < n; i++) a.push(Q[ch(i) + q]);
    return a;
  };

  let sph = '';
  if (o.sph && !isFree(kd)) {
    const g = sphereOf(m);
    const C = pr([0, g.c, 0]);
    const r = g.r;
    const k = Math.sqrt(1 + 0.32 * 0.32);
    const tc = '#0f766e';
    const top = Q[kd === 'pyr' ? 'S' : "A'"];
    const A0 = Q.A;
    sph =
      `<ellipse cx="${C.X}" cy="${C.Y}" rx="${r}" ry="${r * k}" fill="rgba(15,118,110,.08)" stroke="${tc}" stroke-width="1.8"/>` +
      `<path d="M${C.X - r} ${C.Y}A${r} ${r * 0.32} 0 0 0 ${C.X + r} ${C.Y}" fill="none" stroke="${tc}" stroke-width="1.2"/>` +
      `<path d="M${C.X - r} ${C.Y}A${r} ${r * 0.32} 0 0 1 ${C.X + r} ${C.Y}" fill="none" stroke="${tc}" stroke-width="1.2" stroke-dasharray="6 5"/>` +
      L(C.X, C.Y, top.X, top.Y, tc, 1.2, 'stroke-dasharray="5 4"') +
      L(C.X, C.Y, A0.X, A0.Y, tc, 1.2, 'stroke-dasharray="5 4"') +
      `<circle cx="${C.X}" cy="${C.Y}" r="3.5" fill="${tc}"/>` +
      T(C.X + 7, C.Y + 16, 'I', tc, 15);
  }

  let s =
    sph +
    `<polygon points="${ring(ip ? '' : "'")
      .map(p => p.X + ',' + p.Y)
      .join(' ')}" fill="${f}" stroke="none"/>`;

  const E_draw = (
    p: { X: number; Y: number; z: number },
    q: { X: number; Y: number; z: number },
    h: boolean
  ) => L(p.X, p.Y, q.X, q.Y, st, 1.6, h ? 'stroke-dasharray="6 5" opacity=".75"' : '');

  const vis = (i: number) => {
    const A = Mk[ch(i)];
    const B = Mk[ch((i + 1) % n)];
    const A2 = Mk[ch(i) + "'"];
    const cB = sc3(
      Array.from({ length: n }, (_, j) => Mk[ch(j)]).reduce((p, q) => ad3(p, q), [0, 0, 0]),
      1 / n
    );
    let nn = cr3(sb3(B, A), sb3(A2, A));
    const mid = sc3(ad3(A, B), 0.5);
    if (nn[0] * (mid[0] - cB[0]) + nn[2] * (mid[2] - cB[2]) < 0) nn = sc3(nn, -1);
    return nn[1] * 0.3048 + (nn[0] * sn + nn[2] * cs) * 0.9524 > 1e-9;
  };

  const cz = ip ? ring('').reduce((p, q) => p + q.z, 0) / n : 0;
  for (const [a, b, t, i] of m.E) {
    const h = ip
      ? a === 'S'
        ? Q[b].z < cz - 0.05 * R
        : Q[a].z + Q[b].z < 2 * cz
      : t === 'b'
      ? !vis(i!)
      : t === 'v'
      ? !vis(i!) && !vis((i! + n - 1) % n)
      : false;
    s += E_draw(Q[a], Q[b], h);
  }

  if (ip) {
    const H0 = pr([Mk.S[0], 0, Mk.S[2]]);
    s +=
      E_draw(Q.S, H0, true) +
      `<circle cx="${H0.X}" cy="${H0.Y}" r="3" fill="${st}"/>` +
      T(H0.X + 6, H0.Y + 15, 'H', st) +
      (o.hh ? T((Q.S.X + H0.X) / 2 + 8, (Q.S.Y + H0.Y) / 2, 'SH = ' + (+(Mk.S[1] / 24).toFixed(2)), '#c2410c', 14) : '');
  }

  /* Mặt cắt (Thiết diện) */
  const pl = o.sec && mkPlane(m, o.sec);
  const sc = pl && secPts(m, pl);
  if (sc) {
    const used = new Set(Object.keys(Mk));
    const ks = Object.keys(Mk);
    const lab = sc.pts.map(p => {
      const k = ks.find(k => Math.hypot(...sb3(Mk[k], p)) < 1e-4 * R);
      if (k) return k;
      const nn = freeName(used);
      used.add(nn);
      return nn;
    });
    const sp = sc.pts.map(pr);
    s += `<polygon points="${sp.map(p => p.X + ',' + p.Y).join(' ')}" fill="rgba(37,99,235,.3)" stroke="#2563eb" stroke-width="1.8"/>`;
    sp.forEach((p, i) => {
      if (!Mk[lab[i]]) s += `<circle cx="${p.X}" cy="${p.Y}" r="3" fill="#2563eb"/>` + T(p.X + 6, p.Y - 6, lab[i], '#2563eb', 15);
    });
    const xy = sc.pts.map(p => [dt3(sb3(p, sc.c), sc.u), dt3(sb3(p, sc.c), sc.v)]);
    const k = 60 / (Math.max(...xy.flat().map(Math.abs)) || 1);
    const ox = o.x + R + 110;
    const oy = o.y - R * 0.9;
    s += `<polygon points="${xy.map(q => ox + q[0] * k + ',' + (oy - q[1] * k)).join(' ')}" fill="rgba(245,158,11,.35)" stroke="#d97706" stroke-width="1.8"/>`;
    xy.forEach(
      (q, i) =>
        (s += T(ox + q[0] * k + (q[0] >= 0 ? 6 : -14), oy - q[1] * k + (q[1] >= 0 ? -6 : 14), lab[i], st, 14))
    );
    s += T(ox, oy + 80, 'Thiết diện', mu, 12, 'middle');
  }

  /* Giao tuyến của hai mặt phẳng */
  if (o.gt) {
    const pa = mkPlane(m, o.gt[0]);
    const pb = mkPlane(m, o.gt[1]);
    if (pa && pb) {
      const dir = cr3(pa.n, pb.n);
      const dl = Math.hypot(...dir);
      if (dl > 1e-6) {
        const p0 = sc3(ad3(sc3(cr3(pb.n, dir), pa.d), sc3(cr3(dir, pa.n), pb.d)), 1 / (dl * dl));
        const du = sc3(dir, 1 / dl);
        let t0: number | null = null;
        let t1: number | null = null;
        for (let t = -8 * R; t <= 8 * R; t += R / 20) {
          const p = ad3(p0, du, t);
          if (Math.abs(p[0]) <= 2.2 * R && Math.abs(p[2]) <= 2.2 * R && p[1] >= -0.05 * R && p[1] <= 1.9 * R) {
            if (t0 === null) t0 = t;
            t1 = t;
          }
        }
        if (t0 !== null && t1 !== null) {
          const A = pr(ad3(p0, du, t0));
          const B = pr(ad3(p0, du, t1));
          s +=
            L(A.X, A.Y, B.X, B.Y, '#dc2626', 2.2, 'stroke-dasharray="8 5"') +
            T(B.X + 6, B.Y - 6, 'd', '#dc2626', 15);
        }
      }
    }
  }

  /* Đo trong không gian: độ dài đoạn, khoảng cách từ điểm đến mặt phẳng */
  const used3 = new Set(Object.keys(Mk));
  const orc = '#c2410c';
  for (const q of o.me || []) {
    if (q.k === 'len') {
      const a = pt3(m, q.a);
      const b = pt3(m, q.b);
      if (!a || !b) continue;
      const A = pr(a);
      const B = pr(b);
      s +=
        L(A.X, A.Y, B.X, B.Y, orc, 2.2, 'stroke-dasharray="7 4"') +
        T(
          (A.X + B.X) / 2 + 8,
          (A.Y + B.Y) / 2 - 6,
          q.a + q.b + ' = ' + +(Math.hypot(...sb3(a, b)) / 24).toFixed(2),
          orc,
          14
        );
    } else if (q.k === 'dist') {
      const p = pt3(m, q.p);
      const pl = mkPlane(m, q.pl);
      if (!p || !pl) continue;
      const dd = dt3(pl.n, p) - pl.d;
      const F = sb3(p, sc3(pl.n, dd));
      const A = pr(p);
      const B = pr(F);
      const nn = freeName(used3);
      used3.add(nn);
      s +=
        L(A.X, A.Y, B.X, B.Y, orc, 2.2, 'stroke-dasharray="7 4"') +
        `<circle cx="${B.X}" cy="${B.Y}" r="3" fill="${orc}"/>` +
        T(B.X + 6, B.Y + 14, nn, orc, 14) +
        T(
          (A.X + B.X) / 2 + 8,
          (A.Y + B.Y) / 2 - 6,
          'd(' + q.p + ',(' + q.pl.join('') + ')) = ' + +(Math.abs(dd) / 24).toFixed(2),
          orc,
          14
        );
    }
  }

  /* Nhãn đỉnh và trung điểm */
  const mids = new Set((o.mp || []).map(a => a[2]));
  for (const k in Q) {
    const p = Q[k];
    if (mids.has(k)) {
      s += `<circle cx="${p.X}" cy="${p.Y}" r="3" fill="${st}"/>` + T(p.X + 6, p.Y - 6, k, st, 15);
    } else if (k === 'S') {
      s += T(p.X + 8, p.Y - 6, k, st, 15);
    } else if (k.endsWith("'")) {
      s += T(p.X + (p.X >= o.x ? 7 : -22), p.Y - 8, k, st, 15);
    } else {
      s += T(p.X + (p.X >= o.x ? 7 : -16), p.Y + (p.z >= 0 ? 16 : -7), k, st, 15);
    }
  }

  if (hl && isFree(kd)) {
    for (const k of freeKeys(o)) {
      s += `<circle cx="${Q[k].X}" cy="${Q[k].Y}" r="9" fill="none" stroke="#2563eb" stroke-width="1.6" stroke-dasharray="3 3" pointer-events="none"/>`;
    }
  }

  if (o.vol) {
    const q = pyrMeasure(m);
    const f2 = (v: number) => +v.toFixed(2);
    const x0 = o.x - R;
    const y0 = o.y + R * 0.32 + 38;
    [
      ['h', q.h],
      ['Sđáy', q.Sd],
      ['Sxq', q.Sxq],
      ['Stp', q.Stp],
      ['V', q.V]
    ].forEach(
      ([k, v], i) => (s += T(x0, y0 + i * 19, k + ' = ' + f2(v as number), st, 14))
    );
    s += T(x0, y0 + 5 * 19, '1 ô lưới = 1 đơn vị', getCssVar('--mut'), 11);
  }
  return s;
}

export function drawPie(o: PieChartObj, st: string): string {
  const tot = o.d.reduce((a, b) => a + b[1], 0) || 1;
  const r = 70;
  let a0 = -Math.PI / 2;
  let s = '';
  let ly = o.y - r;

  o.d.forEach(([n, v], i) => {
    const a1 = a0 + (v / tot) * 2 * Math.PI;
    const m = (a0 + a1) / 2;
    const c = PAL[i % PAL.length];
    s +=
      v / tot > 0.9999
        ? `<circle cx="${o.x}" cy="${o.y}" r="${r}" fill="${c}"/>`
        : `<path d="M${o.x} ${o.y}L${o.x + r * Math.cos(a0)} ${o.y + r * Math.sin(a0)}A${r} ${r} 0 ${
            a1 - a0 > Math.PI ? 1 : 0
          } 1 ${o.x + r * Math.cos(a1)} ${o.y + r * Math.sin(a1)}Z" fill="${c}" stroke="${getCssVar(
            '--panel'
          )}" stroke-width="2"/>`;
    s += T(
      o.x + r * 0.62 * Math.cos(m),
      o.y + r * 0.62 * Math.sin(m) + 4,
      ((v / tot) * 100).toFixed(1) + '%',
      '#fff',
      11,
      'middle'
    );
    s += `<rect x="${o.x + r + 16}" y="${ly}" width="11" height="11" fill="${c}"/>` + T(o.x + r + 32, ly + 10, n, st, 13);
    ly += 20;
    a0 = a1;
  });
  return s;
}

export function drawFn(o: FunctionObj, st: string): string {
  const w = 340;
  const h = 260;
  const sc = o.sc || 28;
  const cx = o.x + w / 2;
  const cy = o.y + h / 2;
  const g = cf(o.e);
  const mu = getCssVar('--mut');

  let s = `<rect x="${o.x}" y="${o.y}" width="${w}" height="${h}" rx="8" fill="${getCssVar(
    '--panel'
  )}" stroke="${st}" stroke-opacity=".4"/>`;
  s += L(o.x + 6, cy, o.x + w - 6, cy, mu, 1.2) + L(cx, o.y + 6, cx, o.y + h - 6, mu, 1.2);

  const step = sc < 20 ? 2 : 1;
  for (let k = -12; k <= 12; k += step) {
    if (!k) continue;
    if (Math.abs(k * sc) < w / 2 - 8) {
      s += L(cx + k * sc, cy - 3, cx + k * sc, cy + 3, mu, 1) + T(cx + k * sc, cy + 15, String(k), mu, 10, 'middle');
    }
    if (Math.abs(k * sc) < h / 2 - 8) {
      s += L(cx - 3, cy - k * sc, cx + 3, cy - k * sc, mu, 1) + T(cx + 7, cy - k * sc + 3, String(k), mu, 10);
    }
  }

  let d = '';
  let pen = 0;
  let py: number | null = null;
  if (g) {
    for (let px = o.x + 2; px <= o.x + w - 2; px += 1.5) {
      let Y: number;
      try {
        Y = g((px - cx) / sc, o.m);
      } catch {
        Y = NaN;
      }
      const sy = cy - Y * sc;
      if (!isFinite(sy) || sy < o.y + 2 || sy > o.y + h - 2) {
        pen = 0;
        py = null;
        continue;
      }
      if (py !== null && Math.abs(sy - py) > h * 0.6) pen = 0;
      d += (pen ? 'L' : 'M') + px.toFixed(1) + ' ' + sy.toFixed(1);
      pen = 1;
      py = sy;
    }
  }
  s += `<path d="${d}" fill="none" stroke="#d97706" stroke-width="2.4"/>`;
  s += T(
    o.x + 10,
    o.y + h - 10,
    'y = ' + fmt(o.e) + (/\bm\b/.test(o.e) ? '   (m = ' + o.m + ')' : ''),
    st,
    12
  );
  return s;
}

export function drawTree(o: ProbabilityTreeObj, st: string): string {
  const [pa, p1, p2] = o.p;
  const x = o.x;
  const y = o.y;
  const mu = getCssVar('--mut');
  const B = (t: string) => t + '\u0304';
  const R0 = [x, y + 110];
  const N1: Array<[number, number, string, number]> = [
    [x + 140, y + 55, 'A', pa],
    [x + 140, y + 165, B('A'), 1 - pa]
  ];
  const N2: Array<[number, number, string, number]> = [
    [x + 290, y + 25, 'B', p1],
    [x + 290, y + 85, B('B'), 1 - p1],
    [x + 290, y + 135, 'B', p2],
    [x + 290, y + 195, B('B'), 1 - p2]
  ];

  let s = `<rect x="${x - 14}" y="${y - 8}" width="420" height="270" rx="8" fill="${getCssVar(
    '--panel'
  )}" stroke="${st}" stroke-opacity=".3"/>`;
  const br = (a: any, b: any, pr: number, up: boolean) =>
    L(Number(a[0]), Number(a[1]), Number(b[0]), Number(b[1]), st, 1.5) +
    T((Number(a[0]) + Number(b[0])) / 2, (Number(a[1]) + Number(b[1])) / 2 + (up ? -7 : 16), fmtN(pr), mu, 13, 'middle');

  N1.forEach((q, i) => {
    s += br(R0, q, q[3], i === 0) + `<circle cx="${q[0]}" cy="${q[1]}" r="3.5" fill="${st}"/>` + T(q[0] - 6, q[1] - 8, q[2], st, 15, 'end');
  });
  N2.forEach((q, i) => {
    const par = N1[i >> 1];
    const pp = i >> 1 ? 1 - pa : pa;
    s +=
      br(par, q, q[3], i % 2 === 0) +
      `<circle cx="${q[0]}" cy="${q[1]}" r="3.5" fill="${st}"/>` +
      T(q[0] + 9, q[1] + 5, q[2], st, 15) +
      T(q[0] + 36, q[1] + 5, '= ' + fmtN(pp * q[3]), mu, 13);
  });
  s += `<circle cx="${R0[0]}" cy="${R0[1]}" r="3.5" fill="${st}"/>`;
  const pb = pa * p1 + (1 - pa) * p2;
  s += T(x, y + 240, 'P(B) = ' + fmtN(pb) + (pb > 0 ? '     P(A|B) = ' + fmtN((pa * p1) / pb) : ''), st, 14);
  return s;
}

export function drawVenn(o: VennObj, st: string): string {
  const [a, b, ab, u] = o.v;
  const x = o.x;
  const y = o.y;
  const mu = getCssVar('--mut');
  let s =
    `<rect x="${x}" y="${y}" width="300" height="190" rx="6" fill="${getCssVar(
      '--panel'
    )}" stroke="${st}" stroke-width="1.6"/>` +
    `<circle cx="${x + 115}" cy="${y + 100}" r="65" fill="#3b82f6" fill-opacity=".25" stroke="#2563eb" stroke-width="1.6"/>` +
    `<circle cx="${x + 185}" cy="${y + 100}" r="65" fill="#f59e0b" fill-opacity=".25" stroke="#d97706" stroke-width="1.6"/>`;
  s +=
    T(x + 80, y + 106, String(a), st, 17, 'middle') +
    T(x + 220, y + 106, String(b), st, 17, 'middle') +
    T(x + 150, y + 106, String(ab), st, 17, 'middle') +
    T(x + 270, y + 176, String(u), st, 17, 'middle');
  s +=
    T(x + 62, y + 38, 'A', '#2563eb', 16, 'middle') +
    T(x + 238, y + 38, 'B', '#d97706', 16, 'middle') +
    T(x + 12, y + 22, 'U', mu, 14);
  s +=
    T(x, y + 214, `n(A) = ${a + ab}   n(B) = ${b + ab}   n(A∩B) = ${ab}   n(A∪B) = ${a + b + ab}`, st, 13) +
    T(x, y + 234, `n(U) = ${a + b + ab + u}`, mu, 13);
  return s;
}

export function drawNL(o: NumberLineObj, st: string): string {
  const S = parseSet(o.e);
  const W = 440;
  const x = o.x;
  const y = o.y;
  if (!S) return T(x, y, 'Tập hợp không hợp lệ', st, 14);
  const fin = S.flatMap(r => [r.lo, r.hi]).filter(isFinite);
  let mn = fin.length ? Math.floor(Math.min(...fin)) - 1 : -3;
  let mx = fin.length ? Math.ceil(Math.max(...fin)) + 1 : 3;
  if (mx - mn < 4) {
    mn--;
    mx++;
  }
  const X = (v: number) => x + ((Math.min(Math.max(v, mn), mx) - mn) / (mx - mn)) * W;
  const dv = Math.max(1, Math.ceil((mx - mn) / 14));
  const mu = getCssVar('--mut');
  const c = '#dc2626';
  const pn = getCssVar('--panel');

  let s =
    `<rect x="${x - 14}" y="${y - 36}" width="${W + 44}" height="76" fill="transparent"/>` +
    L(x - 10, y, x + W + 14, y, st, 1.6) +
    `<path d="M${x + W + 16} ${y}l-9 -5v10z" fill="${st}"/>`;

  for (let v = Math.ceil(mn / dv) * dv; v <= mx; v += dv) {
    s += L(X(v), y - 4, X(v), y + 4, st, 1.2) + T(X(v), y + 20, String(v), mu, 12, 'middle');
  }

  for (const r of S) {
    const a = X(r.lo);
    const b = X(r.hi);
    s += L(a, y, b, y, c, 5);
    if (r.lo === -Infinity) s += `<path d="M${a} ${y}l9 -6v12z" fill="${c}"/>`;
    if (r.hi === Infinity) s += `<path d="M${b} ${y}l-9 -6v12z" fill="${c}"/>`;
    if (isFinite(r.lo)) s += `<circle cx="${a}" cy="${y}" r="5.5" fill="${r.lc ? c : pn}" stroke="${c}" stroke-width="2"/>`;
    if (isFinite(r.hi)) s += `<circle cx="${b}" cy="${y}" r="5.5" fill="${r.hc ? c : pn}" stroke="${c}" stroke-width="2"/>`;
  }
  return s + T(x, y - 18, 'S = ' + o.e.replace(/inf/gi, '∞'), st, 15);
}

export function drawObject(
  o: CanvasMathObject,
  O: CanvasMathObject[],
  f: string,
  hl: boolean
): string {
  const st = hl ? getCssVar('--acc') : getCssVar('--ink');
  const w = hl ? 2.6 : 1.6;
  const c = resolveColor(o.t === 'pen' || o.t === 'txt' ? o.c : undefined);

  switch (o.t) {
    case 'seg': {
      const a = P(O, o.a);
      const b = P(O, o.b);
      if (!a || !b) return '';
      const sc = !hl && o.cl ? o.cl : st;
      return `<g data-id="${o.id}">${L(a.x, a.y, b.x, b.y, 'transparent', 16)}${L(
        a.x,
        a.y,
        b.x,
        b.y,
        sc,
        w,
        dsh(o.ls)
      )}${o.ar ? arrow(a, b, sc) : ''}${o.vl ? vlab(a, b, sc) : ''}</g>`;
    }
    case 'cir': {
      const a = P(O, o.c);
      const b = P(O, o.r);
      if (!a || !b) return '';
      const r = Math.hypot(a.x - b.x, a.y - b.y);
      return `<g data-id="${o.id}"><circle cx="${a.x}" cy="${a.y}" r="${r}" fill="none" stroke="${st}" stroke-width="${w}" ${dsh(
        o.ls
      )}/><circle cx="${a.x}" cy="${a.y}" r="${r}" fill="none" stroke="transparent" stroke-width="14"/></g>`;
    }
    case 'pb': {
      const a = P(O, o.a);
      const b = P(O, o.b);
      if (!a || !b) return '';
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const ux = (b.x - a.x) / l;
      const uy = (b.y - a.y) / l;
      const nx = -uy;
      const ny = ux;
      const K = 3000;
      const c2 = hl ? st : '#7c3aed';
      return (
        `<g data-id="${o.id}">${L(mx - nx * K, my - ny * K, mx + nx * K, my + ny * K, 'transparent', 16)}${L(
          mx - nx * K,
          my - ny * K,
          mx + nx * K,
          my + ny * K,
          c2,
          w,
          dsh(o.ls)
        )}` +
        `<path d="M${mx + ux * 10} ${my + uy * 10}L${mx + ux * 10 + nx * 10} ${my + uy * 10 + ny * 10}L${mx + nx * 10} ${
          my + ny * 10
        }" fill="none" stroke="${c2}" stroke-width="1.2"/></g>`
      );
    }
    case 'pol': {
      const pts = o.ids.map(i => P(O, i)).filter(Boolean) as PointObj[];
      if (pts.length < 3) return '';
      return `<polygon data-id="${o.id}" points="${pts
        .map(p => p.x + ',' + p.y)
        .join(' ')}" fill="${f}" stroke="${st}" stroke-width="${w}" ${dsh(o.ls)}/>`;
    }
    case 'pen': {
      return `<g data-id="${o.id}" transform="translate(${o.tx} ${o.ty})"><path d="${o.d}" fill="none" stroke="${
        hl ? getCssVar('--acc') : c
      }" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" ${dsh(o.ls, false)}/><path d="${
        o.d
      }" fill="none" stroke="transparent" stroke-width="14"/></g>`;
    }
    case 'txt': {
      return `<g data-id="${o.id}">${T(o.x, o.y, fmt(o.s), hl ? getCssVar('--acc') : c, 22)}</g>`;
    }
    case 'fn': {
      return `<g data-id="${o.id}">${drawFn(o, st)}</g>`;
    }
    case 'pyr': {
      return `<g data-id="${o.id}">${drawPyr(o, f, st, hl)}</g>`;
    }
    case 'pie': {
      return `<g data-id="${o.id}">${drawPie(o, st)}</g>`;
    }
    case 'tree': {
      return `<g data-id="${o.id}">${drawTree(o, st)}</g>`;
    }
    case 'venn': {
      return `<g data-id="${o.id}">${drawVenn(o, st)}</g>`;
    }
    case 'nl': {
      return `<g data-id="${o.id}">${drawNL(o, st)}</g>`;
    }
    case 'ms': {
      const col = hl ? getCssVar('--acc') : '#c2410c';
      const bg = getCssVar('--bg');
      const lab = (x: number, y: number, t: string) =>
        `<text x="${x}" y="${y}" fill="${col}" font-size="15" font-weight="600" text-anchor="middle" stroke="${bg}" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${esc(
          t
        )}</text>`;
      if (o.mk === 'len') {
        const a = P(O, o.q[0]);
        const b = P(O, o.q[1]);
        if (!a || !b) return '';
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const l = Math.hypot(dx, dy) || 1;
        const sg = dx / l > 0 ? -1 : 1;
        const nx = (-dy / l) * sg;
        const ny = (dx / l) * sg;
        const s2 = ny > 0 ? -1 : 1;
        return `<g data-id="${o.id}">${lab(
          (a.x + b.x) / 2 + nx * s2 * 18,
          (a.y + b.y) / 2 + ny * s2 * 18 + 5,
          a.n + b.n + ' = ' + +(l / 24).toFixed(2)
        )}</g>`;
      }
      if (o.mk === 'dist') {
        const p = P(O, o.q[0]);
        const a = P(O, o.q[1]);
        const b = P(O, o.q[2]);
        if (!p || !a || !b) return '';
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1);
        const hx = a.x + t * dx;
        const hy = a.y + t * dy;
        const d = Math.hypot(p.x - hx, p.y - hy);
        let nx = dx;
        let ny = dy;
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl;
        ny /= nl;
        if (nx < 0) {
          nx = -nx;
          ny = -ny;
        }
        return `<g data-id="${o.id}">${lab(
          (p.x + hx) / 2 + nx * 10,
          (p.y + hy) / 2 + ny * 10 - 8,
          'd(' + p.n + ',' + a.n + b.n + ') = ' + +(d / 24).toFixed(2)
        )}</g>`;
      }
      if (o.mk === 'area' || o.mk === 'per') {
        const pts = o.q.map(i => P(O, i)).filter(Boolean) as PointObj[];
        if (!pts.length) return '';
        const nm = o.sh === 'pol' ? pts.map(p => p.n).join('') : pts[0].n;
        let val = 0;
        let cx = 0;
        let cy = 0;
        if (o.sh === 'pol') {
          let A2 = 0;
          let pm = 0;
          pts.forEach((p, i) => {
            const q = pts[(i + 1) % pts.length];
            A2 += p.x * q.y - q.x * p.y;
            pm += Math.hypot(q.x - p.x, q.y - p.y);
          });
          val = o.mk === 'area' ? Math.abs(A2) / 2 / 576 : pm / 24;
          cx = pts.reduce((t, p) => t + p.x, 0) / pts.length;
          cy = pts.reduce((t, p) => t + p.y, 0) / pts.length;
        } else {
          const r = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) / 24;
          val = o.mk === 'area' ? Math.PI * r * r : 2 * Math.PI * r;
          cx = pts[0].x;
          cy = pts[0].y;
        }
        return `<g data-id="${o.id}">${lab(
          cx,
          cy + (o.mk === 'area' ? 5 : 27),
          (o.mk === 'area' ? 'S' : o.sh === 'pol' ? 'P' : 'C') + '(' + nm + ') = ' + +val.toFixed(2)
        )}</g>`;
      }
      // Angle measurement
      const v = P(O, o.q[0]);
      const a = P(O, o.q[1]);
      const b = P(O, o.q[2]);
      if (!v || !a || !b) return '';
      const ux = a.x - v.x;
      const uy = a.y - v.y;
      const wx = b.x - v.x;
      const wy = b.y - v.y;
      const lu = Math.hypot(ux, uy) || 1;
      const lw = Math.hypot(wx, wy) || 1;
      const deg =
        (Math.acos(Math.max(-1, Math.min(1, (ux * wx + uy * wy) / (lu * lw)))) * 180) / Math.PI;
      const au = [ux / lu, uy / lu];
      const aw = [wx / lw, wy / lw];
      let mk = '';
      if (Math.abs(deg - 90) < 0.05) {
        mk = `<path d="M${v.x + au[0] * 16} ${v.y + au[1] * 16}L${v.x + (au[0] + aw[0]) * 16} ${
          v.y + (au[1] + aw[1]) * 16
        }L${v.x + aw[0] * 16} ${v.y + aw[1] * 16}" fill="none" stroke="${col}" stroke-width="1.6"/>`;
      } else {
        const r = 24;
        const t1 = Math.atan2(uy, ux);
        const t2 = Math.atan2(wy, wx);
        const cr = ux * wy - uy * wx;
        mk = `<path d="M${v.x + r * Math.cos(t1)} ${v.y + r * Math.sin(t1)}A${r} ${r} 0 0 ${
          cr > 0 ? 1 : 0
        } ${v.x + r * Math.cos(t2)} ${v.y + r * Math.sin(t2)}" fill="none" stroke="${col}" stroke-width="1.8"/>`;
      }
      let bx = au[0] + aw[0];
      let by = au[1] + aw[1];
      const bl = Math.hypot(bx, by);
      if (bl < 1e-6) {
        bx = -au[1];
        by = au[0];
      } else {
        bx /= bl;
        by /= bl;
      }
      return `<g data-id="${o.id}">${mk}${lab(
        v.x + bx * 50,
        v.y + by * 50 + 5,
        '∠' + a.n + v.n + b.n + ' = ' + +deg.toFixed(1) + '°'
      )}</g>`;
    }
  }
  return '';
}

export function renderCanvasSvgContent(
  O: CanvasMathObject[],
  sel: number | null,
  tmp: number[]
): string {
  const f = getCssVar('--fill');
  const pt = getCssVar('--pt');
  const ac = getCssVar('--acc');
  const ink = getCssVar('--ink');
  let s = '';

  // 1. Draw all objects other than points
  for (const o of O) {
    if (o.t !== 'pt') {
      s += drawObject(o, O, f, o.id === sel);
    }
  }

  // 2. Temporary polyline preview during multi-step tools
  if (tmp.length > 1) {
    const pts = tmp.map(i => P(O, i)).filter(Boolean) as PointObj[];
    if (pts.length > 1) {
      s += `<polyline points="${pts
        .map(p => p.x + ',' + p.y)
        .join(' ')}" fill="none" stroke="${ac}" stroke-dasharray="5 4"/>`;
    }
  }

  // 3. Dependent annotations: equal ticks for midpoints, angle bisectors, altitude foot perpendiculars
  for (const o of O) {
    if (o.t !== 'pt') continue;
    if (o.m) {
      // Dấu gạch hai nửa bằng nhau
      const a = P(O, o.m[0]);
      const b = P(O, o.m[1]);
      if (a && b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const l = Math.hypot(dx, dy) || 1;
        const nx = (-dy / l) * 5;
        const ny = (dx / l) * 5;
        for (const k of [0.25, 0.75]) {
          const cx = a.x + dx * k;
          const cy = a.y + dy * k;
          s += L(cx - nx, cy - ny, cx + nx, cy + ny, ink, 1.6);
        }
      }
    }
    if (o.g) {
      // Hai cung góc bằng nhau
      const v = P(O, o.g[0]);
      const a = P(O, o.g[1]);
      const b = P(O, o.g[2]);
      if (v && a && b) {
        const r = 26;
        const arc = (p: PointObj, q: PointObj) => {
          const t1 = Math.atan2(p.y - v.y, p.x - v.x);
          const t2 = Math.atan2(q.y - v.y, q.x - v.x);
          const cr = (p.x - v.x) * (q.y - v.y) - (p.y - v.y) * (q.x - v.x);
          return `<path d="M${v.x + r * Math.cos(t1)} ${v.y + r * Math.sin(t1)}A${r} ${r} 0 0 ${
            cr > 0 ? 1 : 0
          } ${v.x + r * Math.cos(t2)} ${v.y + r * Math.sin(t2)}" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
        };
        s += arc(a, o) + arc(o, b);
      }
    }
    if (o.w) {
      // Đường nối đỉnh: trung tuyến (G) hoặc phân giác (I)
      const a = P(O, o.w[0]);
      const b = P(O, o.w[1]);
      const c = P(O, o.w[2]);
      if (a && b && c) {
        const dsh_style = 'stroke-dasharray="5 4" opacity=".6"';
        if (o.wk === 'G') {
          for (const [v, p, q] of [
            [a, b, c],
            [b, a, c],
            [c, a, b]
          ]) {
            s += L(v.x, v.y, (p.x + q.x) / 2, (p.y + q.y) / 2, ink, 1.2, dsh_style);
          }
        }
        if (o.wk === 'I') {
          for (const v of [a, b, c]) {
            s += L(v.x, v.y, o.x, o.y, ink, 1.2, dsh_style);
          }
        }
      }
    }
    if (o.f) {
      // Ký hiệu góc vuông và phần kéo dài cạnh
      const v = P(O, o.f[0]);
      const a = P(O, o.f[1]);
      const b = P(O, o.f[2]);
      if (v && a && b) {
        const uVal = o.u ?? 0;
        const e = uVal < 0 ? a : uVal > 1 ? b : null;
        if (e) s += L(e.x, e.y, o.x, o.y, ink, 1.2, 'stroke-dasharray="5 4" opacity=".7"');
        const far = Math.hypot(a.x - o.x, a.y - o.y) > Math.hypot(b.x - o.x, b.y - o.y) ? a : b;
        const u = (q: PointObj) => {
          const d = Math.hypot(q.x - o.x, q.y - o.y) || 1;
          return [((q.x - o.x) / d) * 10, ((q.y - o.y) / d) * 10];
        };
        const [ux, uy] = u(v);
        const [wx, wy] = u(far);
        s += `<path d="M${o.x + ux} ${o.y + uy}L${o.x + ux + wx} ${o.y + uy + wy}L${o.x + wx} ${
          o.y + wy
        }" fill="none" stroke="${ink}" stroke-width="1.2"/>`;
      }
    }
  }

  // 4. Draw points
  for (const o of O) {
    if (o.t === 'pt') {
      const isSelected = o.id === sel || tmp.includes(o.id);
      s +=
        `<g data-id="${o.id}"><circle cx="${o.x}" cy="${o.y}" r="14" fill="transparent"/>` +
        (isSelected ? `<circle cx="${o.x}" cy="${o.y}" r="9" fill="none" stroke="${ac}" stroke-width="2"/>` : '') +
        `<circle cx="${o.x}" cy="${o.y}" r="4.5" fill="${pt}"/>${
          o.sh ? T(o.x + 8, o.y - 8, o.n, ink, 16) : ''
        }</g>`;
    }
  }
  return s;
}
