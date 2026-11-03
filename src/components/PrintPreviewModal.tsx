import React, { useState } from 'react';
import { X, Printer, Image as ImageIcon, Grid, FileText, Check } from 'lucide-react';
import { esc } from '../utils/mathEngine';

export interface PageCapture {
  name: string;
  html: string;
  bb: [number, number, number, number];
}

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PageCapture[];
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  pages
}) => {
  const [title, setTitle] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const renderSheetSVG = (p: PageCapture, index: number, isPrint = false) => {
    const W = isLandscape ? 297 : 210;
    const H = isLandscape ? 210 : 297;
    const m = 12;
    const multi = pages.length > 1;
    const pageName = multi ? p.name : '';
    const hdr = (title ? 9 : 0) + (pageName ? 8 : 0);
    const top = m + hdr + (hdr ? 3 : 0);
    const bot = m + 6;
    const aw = W - 2 * m;
    const ah = H - top - bot;
    const bw = Math.max(p.bb[2] - p.bb[0], 20);
    const bh = Math.max(p.bb[3] - p.bb[1], 20);
    const k = Math.min(aw / bw, ah / bh, 0.5);
    const tx = m + (aw - bw * k) / 2 - p.bb[0] * k;
    const ty = top + (ah - bh * k) / 2 - p.bb[1] * k;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" style="--w:${W}mm;--h:${H}mm" font-family="Be Vietnam Pro,system-ui,sans-serif">
        <rect width="${W}" height="${H}" fill="#ffffff"/>
        ${
          showGrid
            ? `<defs><pattern id="gp_${index}" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#cbd5e1" stroke-width=".6"/></pattern></defs>`
            : ''
        }
        ${
          title
            ? `<text x="${W / 2}" y="${m + 6}" text-anchor="middle" font-size="6" font-weight="700" fill="#111827">${esc(
                title
              )}</text>`
            : ''
        }
        ${
          pageName
            ? `<text x="${W / 2}" y="${m + (title ? 9 : 0) + 5.5}" text-anchor="middle" font-size="4.4" fill="#4b5563">${esc(
                pageName
              )}</text>`
            : ''
        }
        <g transform="translate(${tx} ${ty}) scale(${k})">
          ${showGrid ? `<rect x="${p.bb[0]}" y="${p.bb[1]}" width="${bw}" height="${bh}" fill="url(#gp_${index})"/>` : ''}
          ${p.html}
        </g>
        <text x="${W - m}" y="${H - m + 2}" text-anchor="end" font-size="3" fill="#6b7280">BẢNG VẼ HÌNH HỌC _ PHẠM HẬU · ${new Date().toLocaleDateString(
      'vi-VN'
    )}</text>
      </svg>
    `;
  };

  const handlePrint = () => {
    // Inject @page CSS for printing
    const styleId = 'a4-print-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 0; }`;
    window.print();
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const W = isLandscape ? 297 : 210;
      const H = isLandscape ? 210 : 297;
      const sc = 5; // high-resolution 5x
      for (let i = 0; i < pages.length; i++) {
        const svgStr = renderSheetSVG(pages[i], i).replace(
          `width="${W}mm" height="${H}mm"`,
          `width="${W * sc}" height="${H * sc}"`
        );
        await new Promise<void>(resolve => {
          const img = new Image();
          img.onerror = () => resolve();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = W * sc;
            canvas.height = H * sc;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, W * sc, H * sc);
              canvas.toBlob(blob => {
                if (blob) {
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = pages.length > 1 ? `bang-toan-A4-${i + 1}.png` : 'bang-toan-A4.png';
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
                }
                resolve();
              });
            } else {
              resolve();
            }
          };
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/85 backdrop-blur-md text-slate-100 animate-in fade-in duration-150">
      {/* Top Options Bar (hidden during browser print) */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-[var(--panel)] text-[var(--ink)] border-b-2 border-[var(--line)] flex-wrap shadow-lg z-30 no-print">
        <div className="flex items-center gap-2.5 mr-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
            <FileText size={17} />
          </span>
          <span className="font-bold text-base">Xem trước in A4</span>
        </div>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Tiêu đề trang in (ví dụ: Bài tập Hình học 12)"
          className="flex-1 min-w-[220px] max-w-sm px-3.5 py-2 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs sm:text-sm font-semibold focus:outline-none focus:border-teal-600 shadow-xs"
        />

        {/* Orientation toggle */}
        <div className="flex items-center gap-1 border-2 border-[var(--line)] rounded-xl p-0.5 bg-[var(--bg)] shadow-xs">
          <button
            onClick={() => setIsLandscape(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              !isLandscape ? 'bg-teal-600 text-white shadow-xs' : 'text-[var(--ink)] hover:bg-[var(--grid)]'
            }`}
          >
            Trang Dọc
          </button>
          <button
            onClick={() => setIsLandscape(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              isLandscape ? 'bg-teal-600 text-white shadow-xs' : 'text-[var(--ink)] hover:bg-[var(--grid)]'
            }`}
          >
            Trang Ngang
          </button>
        </div>

        {/* Grid toggle */}
        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--ink)] cursor-pointer select-none px-3 py-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] transition-colors shadow-xs">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={e => setShowGrid(e.target.checked)}
            className="accent-teal-600 w-4 h-4 cursor-pointer"
          />
          <Grid size={16} className="text-teal-600" />
          <span>Kẻ ô li</span>
        </label>

        {/* Export PNG button */}
        <button
          onClick={handleExportPNG}
          disabled={isExporting}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)] text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <ImageIcon size={16} className="text-blue-500" />
          <span>{isExporting ? 'Đang xuất ảnh...' : 'Tải ảnh A4 (PNG)'}</span>
        </button>

        {/* Print / Save PDF button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md active:scale-95"
        >
          <Printer size={16} />
          <span>In / Lưu PDF</span>
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-[var(--mut)] hover:bg-[var(--grid)] hover:text-[var(--ink)] transition-colors cursor-pointer ml-auto border-2 border-[var(--line)]"
          title="Đóng (Phím Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Pages Preview Scroll Area */}
      <div className="flex-1 overflow-auto p-6 sm:p-10 flex flex-col items-center gap-8 print-only-container">
        {pages.map((p, idx) => (
          <div
            key={idx}
            className={`bg-white text-slate-900 rounded-xs shadow-2xl overflow-hidden transition-all duration-150 ${
              isLandscape ? 'w-[900px] max-w-full' : 'w-[640px] max-w-full'
            }`}
            style={{
              breakAfter: idx < pages.length - 1 ? 'page' : 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: renderSheetSVG(p, idx) }}
          />
        ))}
      </div>
    </div>
  );
};
