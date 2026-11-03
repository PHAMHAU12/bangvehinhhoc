import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActiveTool,
  CanvasMathObject,
  LineStyle,
  MathPage,
  MathDocument,
  PointObj,
  SegmentObj,
  Solid3DObj,
  ViewportTransform
} from './types/math';
import {
  P,
  ptsOf,
  updateDependentPoints,
  computeBoundingBox,
  getCssVar,
  tok,
  mkPlane,
  freeName,
  pyrModel,
  pt3,
  fixFree,
  freeKeys,
  isFree,
  pyrProject,
  parseNums,
  parseSet,
  parsePieData,
  cf
} from './utils/mathEngine';
import { renderCanvasSvgContent } from './utils/renderSvg';
import { Toolbar } from './components/Toolbar';
import { PageTabs } from './components/PageTabs';
import { ContextBar } from './components/ContextBar';
import { PrintPreviewModal, PageCapture } from './components/PrintPreviewModal';
import { InputDialogModal } from './components/InputDialogModal';
import { TemplatesModal } from './components/TemplatesModal';
import { Minus, Plus, Maximize2, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'bangtoan:v2';

export default function App() {
  // Pages state
  const [pages, setPages] = useState<MathPage[]>([
    {
      name: 'Trang 1',
      O: [
        {
          t: 'pyr',
          id: 1,
          x: 360,
          y: 280,
          n: 4,
          az: 35,
          s: 110,
          kind: 'pyr',
          hh: true,
          mp: [
            ['S', 'A', 'M'],
            ['S', 'C', 'N']
          ],
          sec: ['M', 'B', 'N']
        }
      ],
      id: 2,
      vw: { k: 1, x: 0, y: 0 },
      H: []
    }
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Active page shortcut state
  const currentPage = pages[currentPageIndex] || pages[0];
  const [objects, setObjects] = useState<CanvasMathObject[]>(currentPage.O);
  const [nextId, setNextId] = useState<number>(currentPage.id || 1);
  const [viewport, setViewport] = useState<ViewportTransform>(currentPage.vw || { k: 1, x: 0, y: 0 });
  const [history, setHistory] = useState<string[]>(currentPage.H || []);

  // Tool & interaction state
  const [tool, setTool] = useState<ActiveTool>('sel');
  const [color, setColor] = useState<string>('ink');
  const [lineStyle, setLineStyle] = useState<LineStyle>('solid');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tempPoints, setTempPoints] = useState<number[]>([]);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [hintMessage, setHintMessage] = useState<string>('');
  const [spaceDown, setSpaceDown] = useState<boolean>(false);

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printCaptures, setPrintCaptures] = useState<PageCapture[]>([]);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [inputModalConfig, setInputModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    defaultValue?: string;
    placeholder?: string;
    hint?: string;
    symbols?: string[];
    onConfirm: (val: string) => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  // DOM Refs
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Gesture & interaction tracking refs
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const panRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const curPenRef = useRef<CanvasMathObject | null>(null);
  const isErasingRef = useRef<boolean>(false);
  const vertexDragRef = useRef<{ o: Solid3DObj; k: string } | null>(null);
  const pointerMapRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ d: number; mx: number; my: number; vw: ViewportTransform } | null>(null);

  // Message toast timeout
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setHintMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setHintMessage('');
    }, 3000);
  }, []);

  // Save history state
  const pushHistory = useCallback(
    (newObjs: CanvasMathObject[]) => {
      const serialized = JSON.stringify(newObjs);
      setHistory(prev => {
        const next = [...prev, serialized];
        if (next.length > 60) next.shift();
        return next;
      });
    },
    []
  );

  // Sync current page data into pages array
  const syncCurrentPage = useCallback(
    (newObjs = objects, newNextId = nextId, newVw = viewport, newHist = history) => {
      setPages(prev => {
        const copy = [...prev];
        if (copy[currentPageIndex]) {
          copy[currentPageIndex] = {
            ...copy[currentPageIndex],
            O: newObjs,
            id: newNextId,
            vw: newVw,
            H: newHist
          };
        }
        return copy;
      });
    },
    [currentPageIndex, objects, nextId, viewport, history]
  );

  // Sync to local storage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const doc: MathDocument = {
          app: 'bang-toan',
          v: 2,
          cur: currentPageIndex,
          pages: pages.map(p => ({
            name: p.name,
            id: p.id,
            O: p.O
          }))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      } catch {
        // Ignore quota
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [pages, currentPageIndex]);

  // Initial load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('bangtoan:v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pages && Array.isArray(parsed.pages) && parsed.pages.length) {
          const loaded: MathPage[] = parsed.pages.map((p: any, idx: number) => ({
            name: p.name || `Trang ${idx + 1}`,
            O: p.O || [],
            id: Math.max(p.id || 1, ...(p.O || []).map((o: any) => (o.id || 0) + 1), 1),
            vw: p.vw || { k: 1, x: 0, y: 0 },
            H: []
          }));
          setPages(loaded);
          const cur = Math.min(Math.max(parsed.cur || 0, 0), loaded.length - 1);
          setCurrentPageIndex(cur);
          setObjects(loaded[cur].O);
          setNextId(loaded[cur].id);
          setViewport(loaded[cur].vw);
        }
      }
    } catch {
      // Keep default
    }

    // Check system color scheme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Update theme attribute
  const handleToggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // Convert client coordinates to canvas world coordinates
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const r = svgRef.current.getBoundingClientRect();
      return {
        x: (clientX - r.left - viewport.x) / viewport.k,
        y: (clientY - r.top - viewport.y) / viewport.k
      };
    },
    [viewport]
  );

  // Zoom around a pivot point
  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number) => {
      setViewport(prev => {
        const nk = Math.min(5, Math.max(0.2, prev.k * factor));
        const q = nk / prev.k;
        const newX = cx - (cx - prev.x) * q;
        const newY = cy - (cy - prev.y) * q;
        const next = { k: nk, x: newX, y: newY };
        syncCurrentPage(objects, nextId, next, history);
        return next;
      });
    },
    [syncCurrentPage, objects, nextId, history]
  );

  // Fit bounding box
  const handleFitView = useCallback(() => {
    if (!svgRef.current) return;
    const bb = computeBoundingBox(objects);
    const r = svgRef.current.getBoundingClientRect();
    if (!bb) {
      const resetVw = { k: 1, x: 0, y: 0 };
      setViewport(resetVw);
      syncCurrentPage(objects, nextId, resetVw, history);
      return;
    }
    const w = Math.max(bb[2] - bb[0], 40);
    const h = Math.max(bb[3] - bb[1], 40);
    const top = 50;
    const bot = 110;
    const side = 40;
    const k = Math.min(2, Math.max(0.2, Math.min((r.width - 2 * side) / w, (r.height - top - bot) / h)));
    const newX = (r.width - w * k) / 2 - bb[0] * k;
    const newY = top + (r.height - top - bot - h * k) / 2 - bb[1] * k;
    const next = { k, x: newX, y: newY };
    setViewport(next);
    syncCurrentPage(objects, nextId, next, history);
  }, [objects, nextId, history, syncCurrentPage]);

  // Generate next automatic point name (A, B, C... Z, A1, B1...)
  const getNextPointName = useCallback(
    (pref = '') => {
      const used = new Set(objects.filter(o => o.t === 'pt').map(o => (o as PointObj).n));
      if (pref && !used.has(pref)) return pref;
      for (let i = 0; i < 26; i++) {
        const ch = String.fromCharCode(65 + i);
        if (!used.has(ch)) return ch;
      }
      return 'P' + nextId;
    },
    [objects, nextId]
  );

  // Get existing point near coordinates or create new
  const pointAt = useCallback(
    (x: number, y: number): PointObj => {
      let p = objects.find(o => o.t === 'pt' && Math.hypot((o as PointObj).x - x, (o as PointObj).y - y) < 12 / viewport.k) as
        | PointObj
        | undefined;
      if (!p) {
        const newPoint: PointObj = {
          t: 'pt',
          id: nextId,
          x,
          y,
          n: getNextPointName(),
          sh: 1
        };
        setNextId(prev => prev + 1);
        setObjects(prev => {
          const next = [...prev, newPoint];
          updateDependentPoints(next);
          return next;
        });
        return newPoint;
      }
      return p;
    },
    [objects, nextId, viewport.k, getNextPointName]
  );

  // Delete object and cascade to any dependent objects
  const handleDeleteObject = useCallback(
    (delId: number) => {
      const toRemove = new Set([delId]);
      let prevSize = 0;
      do {
        prevSize = toRemove.size;
        for (const q of objects) {
          if (ptsOf(q).some(x => toRemove.has(x))) {
            toRemove.add(q.id);
          }
        }
      } while (toRemove.size > prevSize);

      pushHistory(objects);
      const next = objects.filter(q => !toRemove.has(q.id));
      setObjects(next);
      if (toRemove.has(selectedId || -1)) setSelectedId(null);
      syncCurrentPage(next, nextId, viewport, history);
    },
    [objects, selectedId, pushHistory, nextId, viewport, history, syncCurrentPage]
  );

  // Undo function
  const handleUndo = useCallback(() => {
    if (!history.length) return;
    const last = history[history.length - 1];
    const prevHistory = history.slice(0, -1);
    try {
      const restored = JSON.parse(last);
      updateDependentPoints(restored);
      setObjects(restored);
      setHistory(prevHistory);
      setTempPoints([]);
      setSelectedId(null);
      syncCurrentPage(restored, nextId, viewport, prevHistory);
    } catch {
      // Ignore
    }
  }, [history, nextId, viewport, syncCurrentPage]);

  // Geometric construction creators
  const createMidpoint = (a: number, b: number) => {
    const existing = objects.find(
      o => o.t === 'pt' && o.m && ((o.m[0] === a && o.m[1] === b) || (o.m[0] === b && o.m[1] === a))
    );
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    const o: PointObj = {
      t: 'pt',
      id: nextId,
      x: 0,
      y: 0,
      n: getNextPointName('M'),
      sh: 1,
      m: [a, b]
    };
    const nextObjs = [...objects, o];
    updateDependentPoints(nextObjs);
    setObjects(nextObjs);
    setSelectedId(o.id);
    setNextId(prev => prev + 1);
  };

  const createAltitude = (v: number, a: number, b: number) => {
    const o: PointObj = {
      t: 'pt',
      id: nextId,
      x: 0,
      y: 0,
      n: getNextPointName('H'),
      sh: 1,
      f: [v, a, b]
    };
    const seg = {
      t: 'seg' as const,
      id: nextId + 1,
      a: v,
      b: o.id
    };
    const nextObjs = [...objects, o, seg];
    updateDependentPoints(nextObjs);
    setObjects(nextObjs);
    setSelectedId(o.id);
    setNextId(prev => prev + 2);
  };

  const createPerpendicularBisector = (a: number, b: number) => {
    createMidpoint(a, b);
    const pb = {
      t: 'pb' as const,
      id: nextId + 1,
      a,
      b
    };
    const nextObjs = [...objects, pb];
    updateDependentPoints(nextObjs);
    setObjects(nextObjs);
    setSelectedId(pb.id);
    setNextId(prev => prev + 2);
  };

  const createAngleBisector = (v: number, a: number, b: number) => {
    const o: PointObj = {
      t: 'pt',
      id: nextId,
      x: 0,
      y: 0,
      n: getNextPointName('D'),
      sh: 1,
      g: [v, a, b]
    };
    const seg = {
      t: 'seg' as const,
      id: nextId + 1,
      a: v,
      b: o.id
    };
    const nextObjs = [...objects, o, seg];
    updateDependentPoints(nextObjs);
    setObjects(nextObjs);
    setSelectedId(o.id);
    setNextId(prev => prev + 2);
  };

  const createCircumcircle = (a: number, b: number, c: number) => {
    const A = P(objects, a);
    const B = P(objects, b);
    const C = P(objects, c);
    if (!A || !B || !C) return false;
    if (Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) < 1e-6) {
      showToast('Ba điểm thẳng hàng, không có đường tròn ngoại tiếp');
      return false;
    }
    const o: PointObj = {
      t: 'pt',
      id: nextId,
      x: 0,
      y: 0,
      n: getNextPointName('O'),
      sh: 1,
      k: [a, b, c]
    };
    const cir = {
      t: 'cir' as const,
      id: nextId + 1,
      c: o.id,
      r: a
    };
    const nextObjs = [...objects, o, cir];
    updateDependentPoints(nextObjs);
    setObjects(nextObjs);
    setSelectedId(o.id);
    setNextId(prev => prev + 2);
    return true;
  };

  const createSpecialCenter = (kind: 'G' | 'H' | 'I', a: number, b: number, c: number) => {
    const A = P(objects, a);
    const B = P(objects, b);
    const C = P(objects, c);
    if (!A || !B || !C) return false;
    if (Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) < 1e-6) {
      showToast('Ba điểm thẳng hàng');
      return false;
    }
    const o: PointObj = {
      t: 'pt',
      id: nextId,
      x: 0,
      y: 0,
      n: getNextPointName(kind),
      sh: 1,
      w: [a, b, c],
      wk: kind
    };
    let nextObjs = [...objects, o];
    if (kind === 'I') {
      const T_pt: PointObj = {
        t: 'pt',
        id: nextId + 1,
        x: 0,
        y: 0,
        n: 'T',
        sh: 0,
        f: [o.id, b, c]
      };
      const cir = {
        t: 'cir' as const,
        id: nextId + 2,
        c: o.id,
        r: T_pt.id
      };
      nextObjs = [...nextObjs, T_pt, cir];
      setNextId(prev => prev + 3);
    } else {
      setNextId(prev => prev + 1);
    }
    updateDependentPoints(nextObjs);
    setObjects(nextObjs);
    setSelectedId(o.id);
    return true;
  };

  const createVector = (a: number, b: number, cl?: string) => {
    const existing = objects.find(o => o.t === 'seg' && o.a === a && o.b === b && o.ar) as SegmentObj | undefined;
    if (existing) {
      if (cl) existing.cl = cl;
      existing.vl = true;
      return existing;
    }
    const o: SegmentObj = {
      t: 'seg',
      id: nextId,
      ls: 'solid',
      a,
      b,
      ar: true,
      vl: true,
      cl
    };
    setNextId(prev => prev + 1);
    setObjects(prev => [...prev, o]);
    return o;
  };

  const createVectorTriangle = (a: number, b: number, c: number) => {
    createVector(a, b);
    createVector(b, c);
    const sum = createVector(a, c, '#dc2626');
    setSelectedId(sum.id);
  };

  const createVectorParallelogram = (a: number, b: number, c: number) => {
    const d: PointObj = {
      t: 'pt',
      id: nextId,
      x: 0,
      y: 0,
      n: getNextPointName('D'),
      sh: 1,
      pg: [a, b, c]
    };
    setNextId(prev => prev + 1);
    setObjects(prev => [...prev, d]);
    createVector(a, b);
    createVector(a, c);
    const seg1 = { t: 'seg' as const, id: nextId + 1, ls: 'dash' as LineStyle, a: b, b: d.id };
    const seg2 = { t: 'seg' as const, id: nextId + 2, ls: 'dash' as LineStyle, a: c, b: d.id };
    setNextId(prev => prev + 3);
    setObjects(prev => [...prev, seg1, seg2]);
    const sum = createVector(a, d.id, '#dc2626');
    setSelectedId(sum.id);
  };

  const createMeasurement = (mk: 'len' | 'ang' | 'area' | 'per' | 'dist', q: number[], sh?: 'pol' | 'cir') => {
    const existing = objects.find(
      o =>
        o.t === 'ms' &&
        o.mk === mk &&
        (mk === 'len' ? [...o.q].sort().join() === [...q].sort().join() : o.q.join() === q.join())
    );
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    const o = {
      t: 'ms' as const,
      id: nextId,
      mk,
      q,
      sh
    };
    setNextId(prev => prev + 1);
    setObjects(prev => [...prev, o]);
    setSelectedId(o.id);
  };

  const closePolygon = useCallback(() => {
    if (tempPoints.length >= 3) {
      pushHistory(objects);
      const poly = {
        t: 'pol' as const,
        id: nextId,
        ls: lineStyle,
        ids: [...tempPoints]
      };
      setNextId(prev => prev + 1);
      setObjects(prev => [...prev, poly]);
    }
    setTempPoints([]);
  }, [tempPoints, objects, nextId, lineStyle, pushHistory]);

  // Pointer event handlers on SVG
  const handlePointerDown = async (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    svgRef.current.setPointerCapture(e.pointerId);
    pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch handling
    if (pointerMapRef.current.size === 2) {
      const pts = Array.from(pointerMapRef.current.values());
      dragRef.current = null;
      panRef.current = null;
      curPenRef.current = null;
      pinchRef.current = {
        d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
        mx: (pts[0].x + pts[1].x) / 2,
        my: (pts[0].y + pts[1].y) / 2,
        vw: { ...viewport }
      };
      return;
    }
    if (pointerMapRef.current.size > 2) return;

    // Pan mode (tool === 'pan', middle click, or Space held)
    if (tool === 'pan' || e.button === 1 || spaceDown) {
      e.preventDefault();
      panRef.current = {
        sx: e.clientX,
        sy: e.clientY,
        vx: viewport.x,
        vy: viewport.y
      };
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hitEl = (e.target as Element).closest('[data-id]');
    const hitId = hitEl ? Number(hitEl.getAttribute('data-id')) : null;

    // Tool: Select
    if (tool === 'sel') {
      const selObj = objects.find(o => o.id === selectedId);
      if (selObj && selObj.t === 'pyr' && isFree(selObj.kind)) {
        const { Q } = pyrProject(selObj);
        let bestKey: string | null = null;
        let bestDist = 14 / viewport.k;
        for (const k of freeKeys(selObj)) {
          const d = Math.hypot(Q[k].X - x, Q[k].Y - y);
          if (d < bestDist) {
            bestDist = d;
            bestKey = k;
          }
        }
        if (bestKey) {
          pushHistory(objects);
          vertexDragRef.current = { o: selObj, k: bestKey };
          return;
        }
      }

      setSelectedId(hitId);
      if (hitId) {
        pushHistory(objects);
        dragRef.current = { x, y };
      }
      return;
    }

    // Tool: Freehand Pen
    if (tool === 'pen') {
      pushHistory(objects);
      const newPen = {
        t: 'pen' as const,
        id: nextId,
        ls: lineStyle,
        c: color,
        d: `M${x.toFixed(1)} ${y.toFixed(1)}`,
        tx: 0,
        ty: 0
      };
      setNextId(prev => prev + 1);
      curPenRef.current = newPen;
      setObjects(prev => [...prev, newPen]);
      return;
    }

    // Tool: Eraser
    if (tool === 'era') {
      pushHistory(objects);
      isErasingRef.current = true;
      if (hitId) {
        const target = objects.find(o => o.id === hitId);
        if (target && (target.t === 'pen' || target.t === 'txt')) {
          handleDeleteObject(hitId);
        }
      }
      return;
    }

    // Tool: Area / Perimeter
    if (tool === 'area' || tool === 'per') {
      const hitObj = hitId ? objects.find(o => o.id === hitId) : null;
      if (hitObj && (hitObj.t === 'pol' || hitObj.t === 'cir')) {
        pushHistory(objects);
        createMeasurement(tool, hitObj.t === 'pol' ? [...hitObj.ids] : [hitObj.c, hitObj.r], hitObj.t);
      } else {
        showToast('Bấm vào một đa giác hoặc một đường tròn');
      }
      return;
    }

    // Multi-step geometry construction tools
    const NEED_STEPS: Record<string, number> = {
      mid: 2,
      alt: 3,
      perp: 2,
      bis: 3,
      cc: 3,
      gc: 3,
      oc: 3,
      ic: 3,
      len: 2,
      ang: 3,
      vtri: 3,
      vpg: 3,
      dist: 3
    };

    if (NEED_STEPS[tool]) {
      const hitObj = hitId ? objects.find(o => o.id === hitId) : null;
      const nearPt = objects.some(o => o.t === 'pt' && Math.hypot((o as PointObj).x - x, (o as PointObj).y - y) < 12 / viewport.k);
      pushHistory(objects);

      // Fast-click existing segment
      if ((tool === 'mid' || tool === 'perp' || tool === 'len') && !nearPt && tempPoints.length === 0 && hitObj && hitObj.t === 'seg') {
        if (tool === 'mid') createMidpoint(hitObj.a, hitObj.b);
        if (tool === 'perp') createPerpendicularBisector(hitObj.a, hitObj.b);
        if (tool === 'len') createMeasurement('len', [hitObj.a, hitObj.b]);
        return;
      }

      if (tool === 'dist' && tempPoints.length === 1 && !nearPt && hitObj && hitObj.t === 'seg') {
        createAltitude(tempPoints[0], hitObj.a, hitObj.b);
        createMeasurement('dist', [tempPoints[0], hitObj.a, hitObj.b]);
        setTempPoints([]);
        return;
      }

      const p = pointAt(x, y);
      const nextTemp = tempPoints.includes(p.id) ? tempPoints : [...tempPoints, p.id];
      setTempPoints(nextTemp);

      if (tool === 'mid' && nextTemp.length === 2) {
        createMidpoint(nextTemp[0], nextTemp[1]);
        setTempPoints([]);
      } else if (tool === 'alt' && nextTemp.length === 3) {
        createAltitude(nextTemp[0], nextTemp[1], nextTemp[2]);
        setTempPoints([]);
      } else if (tool === 'perp' && nextTemp.length === 2) {
        createPerpendicularBisector(nextTemp[0], nextTemp[1]);
        setTempPoints([]);
      } else if (tool === 'len' && nextTemp.length === 2) {
        createMeasurement('len', [nextTemp[0], nextTemp[1]]);
        setTempPoints([]);
      } else if (tool === 'ang' && nextTemp.length === 3) {
        createMeasurement('ang', [nextTemp[0], nextTemp[1], nextTemp[2]]);
        setTempPoints([]);
      } else if (tool === 'vtri' && nextTemp.length === 3) {
        createVectorTriangle(nextTemp[0], nextTemp[1], nextTemp[2]);
        setTempPoints([]);
      } else if (tool === 'vpg' && nextTemp.length === 3) {
        createVectorParallelogram(nextTemp[0], nextTemp[1], nextTemp[2]);
        setTempPoints([]);
      } else if (tool === 'dist' && nextTemp.length === 3) {
        createAltitude(nextTemp[0], nextTemp[1], nextTemp[2]);
        createMeasurement('dist', [nextTemp[0], nextTemp[1], nextTemp[2]]);
        setTempPoints([]);
      } else if (tool === 'bis' && nextTemp.length === 3) {
        createAngleBisector(nextTemp[0], nextTemp[1], nextTemp[2]);
        setTempPoints([]);
      } else if (['gc', 'oc', 'ic'].includes(tool) && nextTemp.length === 3) {
        const kMap: Record<string, 'G' | 'H' | 'I'> = { gc: 'G', oc: 'H', ic: 'I' };
        createSpecialCenter(kMap[tool], nextTemp[0], nextTemp[1], nextTemp[2]);
        setTempPoints([]);
      } else if (tool === 'cc' && nextTemp.length === 3) {
        createCircumcircle(nextTemp[0], nextTemp[1], nextTemp[2]);
        setTempPoints([]);
      }
      return;
    }

    // Direct shapes: Point, Segment, Circle, Polygon, Vector
    if (['pt', 'seg', 'cir', 'pol', 'vec'].includes(tool)) {
      pushHistory(objects);
      const p = pointAt(x, y);

      if (tool === 'pt') {
        setSelectedId(p.id);
        setTempPoints([]);
      } else if (tool === 'pol') {
        if (tempPoints.length >= 3 && p.id === tempPoints[0]) {
          closePolygon();
          return;
        }
        if (!tempPoints.includes(p.id)) setTempPoints(prev => [...prev, p.id]);
      } else if (p.id !== tempPoints[0]) {
        const nextTemp = [...tempPoints, p.id];
        setTempPoints(nextTemp);
        if (nextTemp.length === 2) {
          const newObj: CanvasMathObject =
            tool === 'vec'
              ? { t: 'seg', id: nextId, ls: lineStyle, a: nextTemp[0], b: nextTemp[1], ar: true, vl: true }
              : tool === 'cir'
              ? { t: 'cir', id: nextId, ls: lineStyle, c: nextTemp[0], r: nextTemp[1] }
              : { t: 'seg', id: nextId, ls: lineStyle, a: nextTemp[0], b: nextTemp[1] };
          setNextId(prev => prev + 1);
          setObjects(prev => [...prev, newObj]);
          setTempPoints([]);
        }
      }
      return;
    }

    // Formula Text
    if (tool === 'txt') {
      setInputModalConfig({
        isOpen: true,
        title: 'Nhập công thức hoặc chữ',
        defaultValue: 'x = (-b +- sqrt(b^2-4ac))/(2a)',
        hint: 'Hỗ trợ: sqrt(x), x^2, pi, <=, >=, !=, ->, +-...',
        onConfirm: val => {
          if (val) {
            pushHistory(objects);
            const textObj = {
              t: 'txt' as const,
              id: nextId,
              x,
              y,
              s: val,
              c: color
            };
            setNextId(prev => prev + 1);
            setObjects(prev => [...prev, textObj]);
            setSelectedId(textObj.id);
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    // Function plot
    if (tool === 'fn') {
      setInputModalConfig({
        isOpen: true,
        title: 'Nhập hàm số theo x (dùng m làm tham số)',
        defaultValue: 'x^3 - 3*x + m',
        hint: 'Ví dụ: x^3 - 3*x + m, sin(x) + m, x^2 - 4, 1/x',
        onConfirm: val => {
          if (!val || !cf(val)) {
            showToast('Biểu thức không hợp lệ');
          } else {
            pushHistory(objects);
            const fnObj = {
              t: 'fn' as const,
              id: nextId,
              x: x - 170,
              y: y - 130,
              e: val,
              m: 0,
              sc: 28
            };
            setNextId(prev => prev + 1);
            setObjects(prev => [...prev, fnObj]);
            setSelectedId(fnObj.id);
            setTool('sel');
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    // 3D Solids
    if (['pyr', 'prism', 'box', 'free', 'fprism', 'fbox'].includes(tool)) {
      pushHistory(objects);
      const isBoxKind = tool === 'box' || tool === 'fbox';
      const solidObj: Solid3DObj = {
        t: 'pyr',
        id: nextId,
        x,
        y: y + (tool === 'pyr' ? 50 : 75),
        n: tool === 'prism' ? 3 : 4,
        az: 20,
        s: 90,
        kind: tool as any,
        ...(tool === 'free'
          ? { n: 4, fb: [[95, 20], [10, 85], [-85, 45], [-60, -65]], fa: [10, 150, 0] }
          : tool === 'fprism'
          ? { n: 4, fb: [[95, 20], [10, 85], [-85, 45], [-60, -65]], fv: [45, 120, -25] }
          : tool === 'fbox'
          ? { n: 4, fb: [[-70, -45], [60, -60], [-50, 55]], fv: [45, 110, -25] }
          : {})
      };
      setNextId(prev => prev + 1);
      setObjects(prev => [...prev, solidObj]);
      setSelectedId(solidObj.id);
      setTool('sel');
      return;
    }

    // Probability Tree
    if (tool === 'tree') {
      setInputModalConfig({
        isOpen: true,
        title: 'Nhập P(A), P(B|A), P(B|Ā)',
        defaultValue: '0.4, 0.5, 0.3',
        hint: 'Nhập 3 xác suất từ 0 đến 1, cách nhau dấu phẩy',
        onConfirm: val => {
          const v = parseNums(val, 3, 0, 1);
          if (!v) {
            showToast('Cần 3 số từ 0 đến 1, cách nhau dấu phẩy');
          } else {
            pushHistory(objects);
            const treeObj = {
              t: 'tree' as const,
              id: nextId,
              x: x - 140,
              y: y - 110,
              p: [v[0], v[1], v[2]] as [number, number, number]
            };
            setNextId(prev => prev + 1);
            setObjects(prev => [...prev, treeObj]);
            setSelectedId(treeObj.id);
            setTool('sel');
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    // Venn Diagram
    if (tool === 'venn') {
      setInputModalConfig({
        isOpen: true,
        title: 'Nhập số phần tử: chỉ A, chỉ B, A∩B, ngoài',
        defaultValue: '5, 7, 3, 5',
        hint: 'Nhập 4 số nguyên không âm cách nhau bởi dấu phẩy',
        onConfirm: val => {
          const v = parseNums(val, 4, 0, 1e6, true);
          if (!v) {
            showToast('Cần 4 số nguyên không âm');
          } else {
            pushHistory(objects);
            const vennObj = {
              t: 'venn' as const,
              id: nextId,
              x: x - 150,
              y: y - 95,
              v: [v[0], v[1], v[2], v[3]] as [number, number, number, number]
            };
            setNextId(prev => prev + 1);
            setObjects(prev => [...prev, vennObj]);
            setSelectedId(vennObj.id);
            setTool('sel');
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    // Number line
    if (tool === 'nl') {
      setInputModalConfig({
        isOpen: true,
        title: 'Nhập tập hợp khoảng, nửa khoảng, đoạn',
        defaultValue: '[-2; 3)',
        hint: 'Ví dụ: [-2; 3) hoặc (-inf; 1] U [4; +inf)',
        onConfirm: val => {
          if (!val || !parseSet(val)) {
            showToast('Tập hợp không hợp lệ');
          } else {
            pushHistory(objects);
            const nlObj = {
              t: 'nl' as const,
              id: nextId,
              x: x - 220,
              y,
              e: val
            };
            setNextId(prev => prev + 1);
            setObjects(prev => [...prev, nlObj]);
            setSelectedId(nlObj.id);
            setTool('sel');
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    // Pie chart
    if (tool === 'pie') {
      setInputModalConfig({
        isOpen: true,
        title: 'Nhập số liệu (tên:giá trị, cách nhau dấu phẩy)',
        defaultValue: 'A:30, B:45, C:25',
        onConfirm: val => {
          const d = parsePieData(val);
          if (!d) {
            showToast('Dữ liệu không hợp lệ');
          } else {
            pushHistory(objects);
            const pieObj = {
              t: 'pie' as const,
              id: nextId,
              x,
              y,
              d
            };
            setNextId(prev => prev + 1);
            setObjects(prev => [...prev, pieObj]);
            setSelectedId(pieObj.id);
            setTool('sel');
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pointerMapRef.current.has(e.pointerId)) {
      pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Pinch zoom handling
    if (pinchRef.current && pointerMapRef.current.size === 2) {
      const pts = Array.from(pointerMapRef.current.values());
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const mx = (pts[0].x + pts[1].x) / 2;
      const my = (pts[0].y + pts[1].y) / 2;
      const r = svgRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const p = pinchRef.current;
      const nk = Math.min(5, Math.max(0.2, (p.vw.k * d) / p.d));
      const wx = (p.mx - r.left - p.vw.x) / p.vw.k;
      const wy = (p.my - r.top - p.vw.y) / p.vw.k;
      setViewport({
        k: nk,
        x: mx - r.left - wx * nk,
        y: my - r.top - wy * nk
      });
      return;
    }

    // Pan canvas
    const activePan = panRef.current;
    if (activePan) {
      const nextX = activePan.vx + e.clientX - activePan.sx;
      const nextY = activePan.vy + e.clientY - activePan.sy;
      setViewport(prev => ({
        ...prev,
        x: nextX,
        y: nextY
      }));
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // 3D vertex dragging in free/custom models
    if (vertexDragRef.current) {
      const po = vertexDragRef.current.o;
      const { cs, sn } = pyrProject(po);
      const dx = x - po.x;
      const L3 = 3 * po.s;
      if (vertexDragRef.current.k === 'S' && po.fa) {
        const zp = po.fa[0] * sn + po.fa[2] * cs;
        po.fa = [dx * cs + zp * sn, Math.max(10, po.y + zp * 0.32 - y), -dx * sn + zp * cs];
      } else if (vertexDragRef.current.k.endsWith("'") && po.fv && po.fb) {
        const b0 = po.fb[0];
        const zp = (b0[0] + po.fv[0]) * sn + (b0[1] + po.fv[2]) * cs;
        const wx = dx * cs + zp * sn;
        const wz = -dx * sn + zp * cs;
        po.fv = [wx - b0[0], Math.max(10, po.y + zp * 0.32 - y), wz - b0[1]];
      } else if (po.fb) {
        const i =
          po.kind === 'fbox'
            ? { A: 0, B: 1, D: 2 }[vertexDragRef.current.k] || 0
            : vertexDragRef.current.k.charCodeAt(0) - 65;
        const zp = Math.max(-L3, Math.min(L3, (y - po.y) / 0.32));
        const xp = Math.max(-L3, Math.min(L3, dx));
        po.fb[i] = [xp * cs + zp * sn, -xp * sn + zp * cs];
      }
      setObjects([...objects]);
      return;
    }

    // Move selected object
    if (dragRef.current && selectedId) {
      const dx = x - dragRef.current.x;
      const dy = y - dragRef.current.y;
      dragRef.current = { x, y };

      const target = objects.find(o => o.id === selectedId);
      if (target && target.t !== 'ms') {
        if (target.t === 'pt' || ['txt', 'fn', 'pyr', 'pie', 'tree', 'venn', 'nl'].includes(target.t)) {
          (target as any).x += dx;
          (target as any).y += dy;
        } else if (target.t === 'pen') {
          target.tx += dx;
          target.ty += dy;
        } else {
          ptsOf(target).forEach(i => {
            const p = P(objects, i);
            if (p) {
              p.x += dx;
              p.y += dy;
            }
          });
        }
        updateDependentPoints(objects);
        setObjects([...objects]);
      }
      return;
    }

    // Draw active pen path
    if (curPenRef.current && curPenRef.current.t === 'pen') {
      curPenRef.current.d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      setObjects([...objects]);
      return;
    }

    // Eraser dragging
    if (isErasingRef.current) {
      const hitEl = (e.target as Element).closest('[data-id]');
      const hitId = hitEl ? Number(hitEl.getAttribute('data-id')) : null;
      if (hitId) {
        const target = objects.find(o => o.id === hitId);
        if (target && (target.t === 'pen' || target.t === 'txt')) {
          handleDeleteObject(hitId);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointerMapRef.current.delete(e.pointerId);
    if (pointerMapRef.current.size < 2) {
      pinchRef.current = null;
    }
    panRef.current = null;
    dragRef.current = null;
    curPenRef.current = null;
    isErasingRef.current = false;
    vertexDragRef.current = null;
    syncCurrentPage();
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    const factor = Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015));
    zoomAt(factor, e.clientX - r.left, e.clientY - r.top);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inputModalConfig.isOpen || isPrintModalOpen || isTemplatesModalOpen) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSpaceDown(true);
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!svgRef.current) return;
        const r = svgRef.current.getBoundingClientRect();
        if (e.key === '+' || e.key === '=') {
          zoomAt(1.25, r.width / 2, r.height / 2);
          return;
        }
        if (e.key === '-') {
          zoomAt(0.8, r.width / 2, r.height / 2);
          return;
        }
        if (e.key === '0') {
          setViewport({ k: 1, x: 0, y: 0 });
          return;
        }
        if (e.key === 'f' || e.key === 'F') {
          handleFitView();
          return;
        }
        if (e.key === 'PageDown') {
          handleSelectPage(Math.min(currentPageIndex + 1, pages.length - 1));
          return;
        }
        if (e.key === 'PageUp') {
          handleSelectPage(Math.max(currentPageIndex - 1, 0));
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        handleDeleteObject(selectedId);
      } else if (e.key === 'Enter' && tool === 'pol') {
        closePolygon();
      } else if (e.key === 'Escape') {
        setTempPoints([]);
        setSelectedId(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpaceDown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    inputModalConfig.isOpen,
    isPrintModalOpen,
    isTemplatesModalOpen,
    selectedId,
    tool,
    currentPageIndex,
    pages.length,
    zoomAt,
    handleFitView,
    handleUndo,
    handleDeleteObject,
    closePolygon
  ]);

  // Page switching & management
  const handleSelectPage = (idx: number) => {
    if (idx < 0 || idx >= pages.length || idx === currentPageIndex) return;
    syncCurrentPage();
    setCurrentPageIndex(idx);
    const targetPage = pages[idx];
    setObjects(targetPage.O);
    setNextId(targetPage.id);
    setViewport(targetPage.vw);
    setHistory(targetPage.H || []);
    setSelectedId(null);
    setTempPoints([]);
  };

  const handleAddPage = () => {
    if (pages.length >= 30) {
      showToast('Tối đa 30 trang');
      return;
    }
    syncCurrentPage();
    const newIdx = pages.length;
    const newPage: MathPage = {
      name: `Trang ${newIdx + 1}`,
      O: [],
      id: 1,
      vw: { k: 1, x: 0, y: 0 },
      H: []
    };
    const nextPages = [...pages, newPage];
    setPages(nextPages);
    setCurrentPageIndex(newIdx);
    setObjects([]);
    setNextId(1);
    setViewport({ k: 1, x: 0, y: 0 });
    setHistory([]);
    setSelectedId(null);
    setTempPoints([]);
    showToast(`Đã tạo ${newPage.name}`);
  };

  const handleDuplicatePage = () => {
    if (pages.length >= 30) {
      showToast('Tối đa 30 trang');
      return;
    }
    syncCurrentPage();
    const current = pages[currentPageIndex];
    const newIdx = currentPageIndex + 1;
    const newPage: MathPage = {
      name: `${current.name} (bản sao)`.slice(0, 40),
      O: JSON.parse(JSON.stringify(current.O)),
      id: current.id,
      vw: { ...current.vw },
      H: []
    };
    const nextPages = [...pages];
    nextPages.splice(newIdx, 0, newPage);
    setPages(nextPages);
    setCurrentPageIndex(newIdx);
    setObjects(newPage.O);
    setNextId(newPage.id);
    setViewport(newPage.vw);
    setHistory([]);
    setSelectedId(null);
    setTempPoints([]);
    showToast(`Đã nhân bản thành ${newPage.name}`);
  };

  const handleRenamePage = (idx: number) => {
    const page = pages[idx];
    setInputModalConfig({
      isOpen: true,
      title: 'Đổi tên trang bài tập',
      defaultValue: page.name,
      placeholder: 'Ví dụ: Câu 1, Bài hình học...',
      onConfirm: val => {
        if (val) {
          const nextPages = [...pages];
          nextPages[idx] = { ...nextPages[idx], name: val.slice(0, 40) };
          setPages(nextPages);
        }
        setInputModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeletePage = (idx: number) => {
    if (pages.length <= 1) {
      showToast('Cần giữ lại ít nhất một trang');
      return;
    }
    const pageName = pages[idx].name;
    const nextPages = pages.filter((_, i) => i !== idx);
    const newIdx = Math.min(idx, nextPages.length - 1);
    setPages(nextPages);
    setCurrentPageIndex(newIdx);
    setObjects(nextPages[newIdx].O);
    setNextId(nextPages[newIdx].id);
    setViewport(nextPages[newIdx].vw);
    setHistory(nextPages[newIdx].H || []);
    setSelectedId(null);
    setTempPoints([]);
    showToast(`Đã xoá ${pageName}`);
  };

  // Open A4 Print preview modal
  const handleOpenPrintPreview = () => {
    syncCurrentPage();
    const captures: PageCapture[] = [];
    pages.forEach(p => {
      const bb = computeBoundingBox(p.O);
      if (bb) {
        updateDependentPoints(p.O);
        const svgContent = renderCanvasSvgContent(p.O, null, []);
        captures.push({
          name: p.name,
          html: svgContent,
          bb
        });
      }
    });

    if (!captures.length) {
      showToast('Bảng đang trống, hãy vẽ gì đó trước');
      return;
    }
    setPrintCaptures(captures);
    setIsPrintModalOpen(true);
  };

  // Export current canvas view to PNG
  const handleExportPng = () => {
    if (!svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const cloned = svgRef.current.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('width', String(r.width));
    cloned.setAttribute('height', String(r.height));
    cloned.removeAttribute('style');
    cloned.insertAdjacentHTML('afterbegin', `<rect width="100%" height="100%" fill="${getCssVar('--bg')}"/>`);

    const svgStr = new XMLSerializer().serializeToString(cloned);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = r.width * 2;
      canvas.height = r.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (blob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'bang-toan.png';
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          }
        });
      }
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  };

  // File save/open
  const handleSaveFile = () => {
    syncCurrentPage();
    const doc: MathDocument = {
      app: 'bang-toan',
      v: 2,
      cur: currentPageIndex,
      pages: pages.map(p => ({
        name: p.name,
        id: p.id,
        O: p.O
      }))
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bai-ve.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    showToast('Đã tải bài vẽ xuống (bai-ve.json)');
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      let loadedPages: MathPage[] = [];
      let cur = 0;
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length) {
        loadedPages = parsed.pages.map((p: any, idx: number) => ({
          name: p.name || `Trang ${idx + 1}`,
          O: p.O || [],
          id: Math.max(p.id || 1, ...(p.O || []).map((o: any) => (o.id || 0) + 1), 1),
          vw: { k: 1, x: 0, y: 0 },
          H: []
        }));
        cur = parsed.cur || 0;
      } else if (parsed && Array.isArray(parsed.O)) {
        loadedPages = [
          {
            name: 'Trang 1',
            O: parsed.O,
            id: Math.max(parsed.id || 1, ...(parsed.O || []).map((o: any) => (o.id || 0) + 1), 1),
            vw: { k: 1, x: 0, y: 0 },
            H: []
          }
        ];
      }
      if (!loadedPages.length) throw new Error();
      setPages(loadedPages);
      const safeCur = Math.min(Math.max(cur, 0), loadedPages.length - 1);
      setCurrentPageIndex(safeCur);
      setObjects(loadedPages[safeCur].O);
      setNextId(loadedPages[safeCur].id);
      setViewport(loadedPages[safeCur].vw);
      setHistory([]);
      setSelectedId(null);
      setTempPoints([]);
      showToast(`Đã mở bài vẽ (${loadedPages.length} trang)`);
    } catch {
      showToast('File không đúng định dạng bài vẽ (.json)');
    }
  };

  // Load a preset template
  const handleSelectTemplate = (templateData: CanvasMathObject[], title: string) => {
    pushHistory(objects);
    const maxExistingId = Math.max(0, ...templateData.map(o => o.id));
    setObjects(templateData);
    setNextId(maxExistingId + 1);
    setSelectedId(null);
    setTempPoints([]);
    showToast(`Đã nạp mẫu: ${title}`);
    setTimeout(() => handleFitView(), 100);
  };

  // ContextBar actions
  const selectedObj = objects.find(o => o.id === selectedId) || null;

  const handleDuplicateSelected = () => {
    if (!selectedObj) return;
    pushHistory(objects);
    const cloned = JSON.parse(JSON.stringify(selectedObj));
    cloned.id = nextId;
    setNextId(prev => prev + 1);
    if (cloned.t === 'pen') {
      cloned.tx += 30;
      cloned.ty += 30;
    } else if (cloned.x !== undefined && cloned.y !== undefined) {
      cloned.x += 30;
      cloned.y += 30;
    }
    setObjects(prev => [...prev, cloned]);
    setSelectedId(cloned.id);
  };

  const handleEditContent = () => {
    if (!selectedObj) return;
    if (selectedObj.t === 'txt') {
      setInputModalConfig({
        isOpen: true,
        title: 'Sửa nội dung công thức / chữ',
        defaultValue: selectedObj.s,
        onConfirm: val => {
          if (val) {
            pushHistory(objects);
            selectedObj.s = val;
            setObjects([...objects]);
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else if (selectedObj.t === 'fn') {
      setInputModalConfig({
        isOpen: true,
        title: 'Sửa hàm số',
        defaultValue: selectedObj.e,
        onConfirm: val => {
          if (val && cf(val)) {
            pushHistory(objects);
            selectedObj.e = val;
            setObjects([...objects]);
          } else {
            showToast('Biểu thức không hợp lệ');
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else if (selectedObj.t === 'tree') {
      setInputModalConfig({
        isOpen: true,
        title: 'Sửa P(A), P(B|A), P(B|Ā)',
        defaultValue: selectedObj.p.join(', '),
        onConfirm: val => {
          const v = parseNums(val, 3, 0, 1);
          if (v) {
            pushHistory(objects);
            selectedObj.p = [v[0], v[1], v[2]];
            setObjects([...objects]);
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else if (selectedObj.t === 'venn') {
      setInputModalConfig({
        isOpen: true,
        title: 'Sửa số phần tử: chỉ A, chỉ B, A∩B, ngoài',
        defaultValue: selectedObj.v.join(', '),
        onConfirm: val => {
          const v = parseNums(val, 4, 0, 1e6, true);
          if (v) {
            pushHistory(objects);
            selectedObj.v = [v[0], v[1], v[2], v[3]];
            setObjects([...objects]);
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else if (selectedObj.t === 'nl') {
      setInputModalConfig({
        isOpen: true,
        title: 'Sửa tập hợp trên trục số',
        defaultValue: selectedObj.e,
        onConfirm: val => {
          if (val && parseSet(val)) {
            pushHistory(objects);
            selectedObj.e = val;
            setObjects([...objects]);
          } else {
            showToast('Tập hợp không hợp lệ');
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else if (selectedObj.t === 'pie') {
      setInputModalConfig({
        isOpen: true,
        title: 'Sửa số liệu biểu đồ tròn',
        defaultValue: selectedObj.d.map(a => a.join(':')).join(', '),
        onConfirm: val => {
          const d = parsePieData(val);
          if (d) {
            pushHistory(objects);
            selectedObj.d = d;
            setObjects([...objects]);
          }
          setInputModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    }
  };

  const handleRenamePoint = () => {
    if (!selectedObj || selectedObj.t !== 'pt') return;
    setInputModalConfig({
      isOpen: true,
      title: 'Đổi tên điểm',
      defaultValue: selectedObj.n,
      onConfirm: val => {
        if (val) {
          pushHistory(objects);
          selectedObj.n = val;
          setObjects([...objects]);
        }
        setInputModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 3D Geometry extras
  const handleAdd3DMidpoint = () => {
    if (!selectedObj || selectedObj.t !== 'pyr') return;
    const isP = selectedObj.kind && selectedObj.kind !== 'pyr' && selectedObj.kind !== 'free';
    setInputModalConfig({
      isOpen: true,
      title: 'Lấy trung điểm cạnh nào?',
      defaultValue: isP ? "AA'" : 'SA',
      placeholder: 'Ví dụ: SA, AB, CD, AA\'...',
      onConfirm: val => {
        const q = tok(val || '');
        const m = pyrModel(selectedObj);
        if (q.length === 2 && q[0] !== q[1] && m.M[q[0]] && m.M[q[1]]) {
          pushHistory(objects);
          const newName = freeName(new Set(Object.keys(m.M)));
          selectedObj.mp = [...(selectedObj.mp || []), [q[0], q[1], newName]];
          setObjects([...objects]);
        } else {
          showToast('Cạnh không hợp lệ');
        }
        setInputModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAdd3DCutPlane = () => {
    if (!selectedObj || selectedObj.t !== 'pyr') return;
    const isP = selectedObj.kind && selectedObj.kind !== 'pyr' && selectedObj.kind !== 'free';
    setInputModalConfig({
      isOpen: true,
      title: 'Mặt cắt thiết diện đi qua 3 điểm',
      defaultValue: isP ? "A C B'" : 'M N P',
      placeholder: 'Ví dụ: M N P hoặc A C B\'',
      onConfirm: val => {
        const q = tok(val || '').slice(0, 3);
        if (q.length === 3 && mkPlane(pyrModel(selectedObj), q)) {
          pushHistory(objects);
          selectedObj.sec = q;
          setObjects([...objects]);
        } else {
          showToast('Ba điểm không hợp lệ hoặc thẳng hàng');
        }
        setInputModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAdd3DIntersection = () => {
    if (!selectedObj || selectedObj.t !== 'pyr') return;
    const isP = selectedObj.kind && selectedObj.kind !== 'pyr' && selectedObj.kind !== 'free';
    setInputModalConfig({
      isOpen: true,
      title: 'Giao tuyến của hai mặt phẳng',
      defaultValue: isP ? "ABB', ACC'" : 'SAB, SCD',
      placeholder: "Ví dụ: SAB, SCD hoặc ABB', ACC'",
      onConfirm: val => {
        const m = pyrModel(selectedObj);
        const q = (val || '').split(/[,;]/).map(t => tok(t).slice(0, 3));
        if (q.length === 2 && mkPlane(m, q[0]) && mkPlane(m, q[1])) {
          pushHistory(objects);
          selectedObj.gt = [q[0], q[1]];
          setObjects([...objects]);
        } else {
          showToast('Cần 2 mặt phẳng, mỗi mặt phẳng gồm 3 điểm');
        }
        setInputModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAdd3DMeasureLen = () => {
    if (!selectedObj || selectedObj.t !== 'pyr') return;
    const isP = selectedObj.kind && selectedObj.kind !== 'pyr' && selectedObj.kind !== 'free';
    setInputModalConfig({
      isOpen: true,
      title: 'Đo độ dài đoạn nối hai điểm',
      defaultValue: isP ? "AC'" : 'SA',
      placeholder: "Ví dụ: SA, AC', HM...",
      onConfirm: val => {
        const m = pyrModel(selectedObj);
        const q = tok(val || '');
        if (q.length === 2 && q[0] !== q[1] && pt3(m, q[0]) && pt3(m, q[1])) {
          pushHistory(objects);
          selectedObj.me = [...(selectedObj.me || []), { k: 'len', a: q[0], b: q[1] }];
          setObjects([...objects]);
        } else {
          showToast('Điểm không hợp lệ');
        }
        setInputModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAdd3DMeasureDist = () => {
    if (!selectedObj || selectedObj.t !== 'pyr') return;
    const isP = selectedObj.kind && selectedObj.kind !== 'pyr' && selectedObj.kind !== 'free';
    setInputModalConfig({
      isOpen: true,
      title: 'Khoảng cách từ 1 điểm đến 1 mặt phẳng',
      defaultValue: isP ? "A' ABC" : 'H SAB',
      placeholder: "Nhập điểm rồi 3 điểm của mặt phẳng (ví dụ: H SAB hoặc A' ABC)",
      onConfirm: val => {
        const m = pyrModel(selectedObj);
        const q = tok(val || '');
        if (q.length === 4 && pt3(m, q[0]) && mkPlane(m, q.slice(1))) {
          pushHistory(objects);
          selectedObj.me = [...(selectedObj.me || []), { k: 'dist', p: q[0], pl: q.slice(1) }];
          setObjects([...objects]);
        } else {
          showToast('Cần 1 điểm và 3 điểm không thẳng hàng của mặt phẳng');
        }
        setInputModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Helper descriptions for active tool
  const getToolHint = () => {
    if (hintMessage) return hintMessage;
    const n = tempPoints.length;
    switch (tool) {
      case 'sel':
        return 'Chọn — bấm để chọn hình, kéo để di chuyển (kéo điểm gốc để hình phụ thuộc tự dịch chuyển), Delete để xoá';
      case 'pan':
        return 'Dời hình — kéo chuột để di chuyển bảng; lăn chuột hoặc chụm 2 ngón để phóng to / thu nhỏ';
      case 'pen':
        return 'Bút — vẽ tay tự do trên bảng';
      case 'era':
        return 'Tẩy — kéo qua nét vẽ tay hoặc chữ để xoá';
      case 'txt':
        return 'Công thức — bấm vào bảng để nhập công thức toán học hoặc văn bản';
      case 'pt':
        return 'Điểm — bấm để đặt điểm (kéo ở chế độ Chọn để di chuyển)';
      case 'seg':
        return `Đoạn thẳng — bước ${n + 1}/2: chọn điểm ${n ? 'thứ hai' : 'đầu'}`;
      case 'vec':
        return `Vectơ — bước ${n + 1}/2: chọn điểm ${n ? 'ngọn (đầu mũi tên)' : 'gốc'}`;
      case 'vtri':
        return `Tổng vectơ (tam giác) — bước ${n + 1}/3: chọn điểm ${['A', 'B', 'C'][n]} để có AB + BC = AC (kết quả màu đỏ)`;
      case 'vpg':
        return `Tổng vectơ (hình bình hành) — bước ${n + 1}/3: chọn ${['A (gốc chung)', 'B', 'C'][n]} để có AB + AC = AD`;
      case 'cir':
        return `Đường tròn — bước ${n + 1}/2: ${n ? 'chọn điểm trên đường tròn' : 'chọn tâm'}`;
      case 'pol':
        return `Đa giác — bấm các đỉnh (${n}), bấm lại đỉnh đầu hoặc Enter để khép kín`;
      case 'mid':
        return `Trung điểm — bước ${n + 1}/2: chọn điểm ${n ? 'thứ hai' : 'đầu'} (hoặc bấm thẳng vào một đoạn)`;
      case 'alt':
        return `Đường cao — bước ${n + 1}/3: ${['chọn đỉnh xuất phát', 'chọn đầu thứ nhất của cạnh đối', 'chọn đầu thứ hai của cạnh đối'][n]}`;
      case 'perp':
        return `Trung trực — bước ${n + 1}/2: chọn điểm ${n ? 'thứ hai' : 'đầu'} (hoặc bấm thẳng vào một đoạn)`;
      case 'bis':
        return `Phân giác — bước ${n + 1}/3: ${['chọn đỉnh của góc', 'chọn điểm trên cạnh 1', 'chọn điểm trên cạnh 2'][n]}`;
      case 'cc':
        return `Đường tròn ngoại tiếp — bước ${n + 1}/3: chọn đỉnh thứ ${n + 1} của tam giác`;
      case 'ic':
        return `Đường tròn nội tiếp — bước ${n + 1}/3: chọn đỉnh thứ ${n + 1} của tam giác`;
      case 'gc':
        return `Trọng tâm tam giác (G) — bước ${n + 1}/3: chọn đỉnh thứ ${n + 1}`;
      case 'oc':
        return `Trực tâm tam giác (H) — bước ${n + 1}/3: chọn đỉnh thứ ${n + 1}`;
      case 'len':
        return `Đo độ dài — bước ${n + 1}/2: chọn điểm ${n ? 'thứ hai' : 'đầu'} (hoặc bấm thẳng vào một đoạn)`;
      case 'ang':
        return `Số đo góc — bước ${n + 1}/3: ${['chọn đỉnh của góc', 'chọn điểm trên tia 1', 'chọn điểm trên tia 2'][n]}`;
      case 'dist':
        return `Khoảng cách điểm–đường — bước ${n + 1}/3: ${['chọn điểm cần đo', 'chọn điểm 1 của đường thẳng (hoặc bấm vào đoạn)', 'chọn điểm 2 của đường thẳng'][n]}`;
      case 'area':
        return 'Diện tích — bấm vào một đa giác hoặc hình tròn (1 đơn vị = 1 ô lưới)';
      case 'per':
        return 'Chu vi — bấm vào một đa giác hoặc đường tròn';
      case 'fn':
        return 'Hàm số — bấm vào bảng để vẽ đồ thị hàm số y = f(x, m)';
      case 'pyr':
        return 'Hình chóp đều — bấm để đặt; chọn hình để xoay, thêm mặt cắt thiết diện, giao tuyến';
      case 'free':
        return 'Chóp tuỳ ý — bấm để đặt; chọn hình rồi kéo đỉnh S hoặc đỉnh đáy để uốn hình tự do';
      case 'prism':
        return 'Lăng trụ đều — bấm để đặt; chọn hình để chỉnh số cạnh, mặt cắt, giao tuyến';
      case 'fprism':
        return 'Lăng trụ xiên — bấm để đặt; kéo đỉnh A\' để nghiêng lăng trụ';
      case 'box':
        return 'Hình hộp chữ nhật — bấm để đặt; chọn hình để thêm trung điểm, thiết diện';
      case 'fbox':
        return 'Hình hộp xiên — bấm để đặt; kéo A, B, D và A\' để nghiêng hộp';
      case 'tree':
        return 'Sơ đồ cây — bấm để đặt sơ đồ xác suất có điều kiện và công thức Bayes';
      case 'venn':
        return 'Biểu đồ Venn — bấm để đặt biểu đồ 2 tập hợp';
      case 'nl':
        return 'Trục số — bấm để đặt biểu diễn tập hợp khoảng/đoạn';
      case 'pie':
        return 'Biểu đồ tròn — bấm để đặt biểu đồ thống kê phần trăm';
      default:
        return '';
    }
  };

  // Cursor style
  const getCursorClass = () => {
    if (panRef.current) return 'cursor-grabbing';
    if (tool === 'pan' || spaceDown) return 'cursor-grab';
    if (tool === 'pen') return 'cursor-crosshair';
    if (tool === 'era') return 'cursor-cell';
    return 'cursor-default';
  };

  // Render SVG string
  const renderedSvgHtml = renderCanvasSvgContent(objects, selectedId, tempPoints);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg)] text-[var(--ink)] overflow-hidden font-sans select-none relative">
      {/* Top Application Toolbar */}
      <Toolbar
        activeTool={tool}
        onSelectTool={t => {
          setTool(t);
          setTempPoints([]);
          if (t !== 'sel' && t !== 'pt') setSelectedId(null);
        }}
        currentColor={color}
        onSelectColor={c => {
          setColor(c);
          if (selectedObj && (selectedObj.t === 'pen' || selectedObj.t === 'txt')) {
            pushHistory(objects);
            selectedObj.c = c;
            setObjects([...objects]);
          }
        }}
        lineStyle={lineStyle}
        onToggleLineStyle={() => {
          const nextLs = lineStyle === 'solid' ? 'dash' : lineStyle === 'dash' ? 'dot' : 'solid';
          setLineStyle(nextLs);
          if (selectedObj && ['seg', 'cir', 'pol', 'pen', 'pb'].includes(selectedObj.t)) {
            pushHistory(objects);
            (selectedObj as any).ls = nextLs;
            setObjects([...objects]);
          }
          showToast(`Nét vẽ: ${nextLs === 'solid' ? 'Nét liền' : nextLs === 'dash' ? 'Nét đứt' : 'Nét chấm'}`);
        }}
        canUndo={history.length > 0}
        onUndo={handleUndo}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onSaveFile={handleSaveFile}
        onOpenFile={handleOpenFile}
        onOpenPrintPreview={handleOpenPrintPreview}
        onExportPng={handleExportPng}
        onClearPage={() => {
          if (objects.length > 0) {
            pushHistory(objects);
            setObjects([]);
            setSelectedId(null);
            setTempPoints([]);
            showToast('Đã xoá hết hình trên trang này');
          }
        }}
        onFitView={handleFitView}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      {/* Multi-page Worksheet Tab Bar */}
      <PageTabs
        pages={pages}
        currentPageIndex={currentPageIndex}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onDuplicatePage={handleDuplicatePage}
        onRenamePage={handleRenamePage}
        onDeletePage={handleDeletePage}
      />

      {/* Main Interactive Canvas Area */}
      <main className="relative flex-1 min-h-0 w-full overflow-hidden">
        <svg
          ref={svgRef}
          className={`absolute inset-0 w-full h-full touch-none canvas-grid ${getCursorClass()}`}
          style={{
            backgroundSize: `${24 * viewport.k}px ${24 * viewport.k}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <g
            id="vg"
            transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.k})`}
            dangerouslySetInnerHTML={{ __html: renderedSvgHtml }}
          />
        </svg>

        {/* Floating Context Toolbar */}
        <ContextBar
          selectedObject={selectedObj}
          onDelete={() => selectedId && handleDeleteObject(selectedId)}
          onDuplicate={handleDuplicateSelected}
          onRenamePoint={handleRenamePoint}
          onTogglePointLabel={() => {
            if (selectedObj && selectedObj.t === 'pt') {
              pushHistory(objects);
              selectedObj.sh = selectedObj.sh ? 0 : 1;
              setObjects([...objects]);
            }
          }}
          onSetLineStyle={ls => {
            if (selectedObj && ['seg', 'cir', 'pol', 'pen', 'pb'].includes(selectedObj.t)) {
              pushHistory(objects);
              (selectedObj as any).ls = ls;
              setObjects([...objects]);
            }
          }}
          onToggleVectorArrow={() => {
            if (selectedObj && selectedObj.t === 'seg') {
              pushHistory(objects);
              selectedObj.ar = !selectedObj.ar;
              if (!selectedObj.ar) selectedObj.vl = false;
              setObjects([...objects]);
            }
          }}
          onToggleVectorLabel={() => {
            if (selectedObj && selectedObj.t === 'seg') {
              pushHistory(objects);
              selectedObj.vl = !selectedObj.vl;
              setObjects([...objects]);
            }
          }}
          onEditContent={handleEditContent}
          onUpdateProperty={(key, val) => {
            if (selectedObj) {
              pushHistory(objects);
              (selectedObj as any)[key] = val;
              if (
                selectedObj.t === 'pyr' &&
                (selectedObj.kind === 'free' || selectedObj.kind === 'fprism') &&
                key === 'n'
              ) {
                fixFree(selectedObj);
              }
              setObjects([...objects]);
            }
          }}
          onAdd3DMidpoint={handleAdd3DMidpoint}
          onAdd3DCutPlane={handleAdd3DCutPlane}
          onAdd3DIntersection={handleAdd3DIntersection}
          onToggle3DSphere={() => {
            if (selectedObj && selectedObj.t === 'pyr') {
              pushHistory(objects);
              selectedObj.sph = !selectedObj.sph;
              setObjects([...objects]);
            }
          }}
          onToggle3DHeight={() => {
            if (selectedObj && selectedObj.t === 'pyr') {
              pushHistory(objects);
              selectedObj.hh = !selectedObj.hh;
              setObjects([...objects]);
            }
          }}
          onToggle3DVolume={() => {
            if (selectedObj && selectedObj.t === 'pyr') {
              pushHistory(objects);
              selectedObj.vol = !selectedObj.vol;
              setObjects([...objects]);
            }
          }}
          onAdd3DMeasureLen={handleAdd3DMeasureLen}
          onAdd3DMeasureDist={handleAdd3DMeasureDist}
          onClear3DExtras={() => {
            if (selectedObj && selectedObj.t === 'pyr') {
              pushHistory(objects);
              selectedObj.sec = undefined;
              selectedObj.gt = undefined;
              selectedObj.mp = [];
              selectedObj.sph = false;
              selectedObj.vol = false;
              selectedObj.hh = false;
              selectedObj.me = [];
              setObjects([...objects]);
            }
          }}
        />

        {/* Bottom Hint / Instruction Banner */}
        <div className="absolute bottom-3 left-3 max-w-[min(640px,86vw)] px-3.5 py-2 rounded-xl bg-[var(--panel)]/95 backdrop-blur-md border-2 border-[var(--line)] text-[var(--ink)] text-xs sm:text-sm shadow-xl flex items-center gap-2.5 z-20 pointer-events-none transition-all">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 shrink-0 font-bold">
            💡
          </span>
          <span className="font-semibold leading-snug">
            {getToolHint()}
          </span>
        </div>

        {/* Zoom & View Controls Widget */}
        <div className="absolute right-3 bottom-3 flex items-center bg-[var(--panel)] border-2 border-[var(--line)] rounded-2xl shadow-xl overflow-hidden z-20 text-xs sm:text-sm">
          <button
            onClick={() => {
              if (svgRef.current) {
                const r = svgRef.current.getBoundingClientRect();
                zoomAt(0.8, r.width / 2, r.height / 2);
              }
            }}
            className="p-2.5 hover:bg-[var(--grid)] text-[var(--ink)] transition-colors cursor-pointer"
            title="Thu nhỏ (−)"
          >
            <Minus size={16} />
          </button>

          <button
            onClick={() => setViewport({ k: 1, x: 0, y: 0 })}
            className="px-3 py-2 hover:bg-[var(--grid)] text-[var(--ink)] font-mono font-bold transition-colors cursor-pointer border-x-2 border-[var(--line)] min-w-[56px] text-center"
            title="Về tỉ lệ chuẩn 100% (Phím 0)"
          >
            {Math.round(viewport.k * 100)}%
          </button>

          <button
            onClick={() => {
              if (svgRef.current) {
                const r = svgRef.current.getBoundingClientRect();
                zoomAt(1.25, r.width / 2, r.height / 2);
              }
            }}
            className="p-2.5 hover:bg-[var(--grid)] text-[var(--ink)] transition-colors cursor-pointer"
            title="Phóng to (+)"
          >
            <Plus size={16} />
          </button>

          <button
            onClick={handleFitView}
            className="px-3 py-2 hover:bg-[var(--grid)] text-teal-700 dark:text-teal-300 font-bold transition-colors cursor-pointer border-l-2 border-[var(--line)] flex items-center gap-1.5"
            title="Thu phóng vừa toàn bộ các hình (Phím F)"
          >
            <Maximize2 size={15} />
            <span className="hidden sm:inline">Vừa khung</span>
          </button>
        </div>

        {/* Hidden file input for opening JSON projects */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </main>

      {/* Modals */}
      <InputDialogModal
        isOpen={inputModalConfig.isOpen}
        title={inputModalConfig.title}
        defaultValue={inputModalConfig.defaultValue}
        placeholder={inputModalConfig.placeholder}
        hint={inputModalConfig.hint}
        symbols={inputModalConfig.symbols}
        onConfirm={inputModalConfig.onConfirm}
        onCancel={() => setInputModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        pages={printCaptures}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
