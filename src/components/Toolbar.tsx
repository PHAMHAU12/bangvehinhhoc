import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MousePointer,
  Hand,
  PenTool,
  Eraser,
  Type,
  CircleDot,
  ChevronDown,
  Undo2,
  Sun,
  Moon,
  Sparkles,
  FileDown,
  Shapes,
  Compass,
  Ruler,
  Box,
  BarChart3,
  Maximize2,
  Check,
  X
} from 'lucide-react';
import { ActiveTool, LineStyle } from '../types/math';

interface ToolbarProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  currentColor: string;
  onSelectColor: (c: string) => void;
  lineStyle: LineStyle;
  onToggleLineStyle: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onOpenTemplates: () => void;
  onSaveFile: () => void;
  onOpenFile: () => void;
  onOpenPrintPreview: () => void;
  onExportPng: () => void;
  onClearPage: () => void;
  onFitView: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

interface DropdownItem {
  id: string;
  name: string;
  desc?: string;
  isAction?: boolean;
}

interface DropdownGroup {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: DropdownItem[];
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  lineStyle,
  onToggleLineStyle,
  canUndo,
  onUndo,
  onOpenTemplates,
  onSaveFile,
  onOpenFile,
  onOpenPrintPreview,
  onExportPng,
  onClearPage,
  onFitView,
  isDark,
  onToggleTheme
}) => {
  const [openMenu, setOpenMenu] = useState<{
    id: string;
    name: string;
    items: DropdownItem[];
    rect: DOMRect;
  } | null>(null);

  // Close on Escape or Window resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    const handleResize = () => setOpenMenu(null);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const DIRECT_TOOLS: Array<{ id: ActiveTool; name: string; icon: React.ReactNode }> = [
    { id: 'sel', name: 'Chọn', icon: <MousePointer size={16} /> },
    { id: 'pan', name: 'Dời hình', icon: <Hand size={16} /> },
    { id: 'pen', name: 'Bút vẽ', icon: <PenTool size={16} /> },
    { id: 'era', name: 'Tẩy', icon: <Eraser size={16} /> },
    { id: 'txt', name: 'Chữ / Công thức', icon: <Type size={16} /> },
    { id: 'pt', name: 'Điểm', icon: <CircleDot size={16} /> }
  ];

  const GROUPS: DropdownGroup[] = [
    {
      id: '2d',
      name: 'Hình phẳng',
      icon: <Shapes size={16} className="text-blue-500" />,
      items: [
        { id: 'seg', name: 'Đoạn thẳng', desc: 'Nối 2 điểm bất kỳ' },
        { id: 'vec', name: 'Vectơ (mũi tên)', desc: 'Gốc và ngọn có mũi tên hướng' },
        { id: 'vtri', name: 'Tổng vectơ (tam giác)', desc: 'Quy tắc 3 điểm: AB + BC = AC' },
        { id: 'vpg', name: 'Tổng vectơ (hình bình hành)', desc: 'Quy tắc hình bình hành: AB + AC = AD' },
        { id: 'cir', name: 'Đường tròn', desc: 'Chọn tâm và điểm đi qua' },
        { id: 'pol', name: 'Đa giác', desc: 'Bấm các đỉnh, khép kín tại điểm đầu' }
      ]
    },
    {
      id: 'construct',
      name: 'Dựng hình',
      icon: <Compass size={16} className="text-emerald-500" />,
      items: [
        { id: 'mid', name: 'Trung điểm', desc: 'Tự cập nhật khi kéo điểm gốc' },
        { id: 'alt', name: 'Đường cao', desc: 'Hạ vuông góc kèm ký hiệu góc vuông' },
        { id: 'perp', name: 'Đường trung trực', desc: 'Vuông góc tại trung điểm' },
        { id: 'bis', name: 'Đường phân giác', desc: 'Chia đôi góc kèm cung tròn' },
        { id: 'cc', name: 'Tròn ngoại tiếp', desc: 'Đi qua 3 đỉnh tam giác' },
        { id: 'ic', name: 'Tròn nội tiếp', desc: 'Tiếp xúc 3 cạnh tam giác' },
        { id: 'gc', name: 'Trọng tâm tam giác (G)', desc: 'Giao 3 đường trung tuyến' },
        { id: 'oc', name: 'Trực tâm tam giác (H)', desc: 'Giao 3 đường cao' }
      ]
    },
    {
      id: 'measure',
      name: 'Đo đạc',
      icon: <Ruler size={16} className="text-amber-500" />,
      items: [
        { id: 'len', name: 'Độ dài đoạn', desc: 'Tự tính độ dài theo ô lưới' },
        { id: 'ang', name: 'Số đo góc', desc: 'Tính góc theo độ (°)' },
        { id: 'dist', name: 'Khoảng cách điểm-đường', desc: 'Hạ đường vuông góc & đo d(P, AB)' },
        { id: 'area', name: 'Diện tích hình', desc: 'Bấm vào đa giác hoặc hình tròn' },
        { id: 'per', name: 'Chu vi hình', desc: 'Bấm vào đa giác hoặc đường tròn' }
      ]
    },
    {
      id: '3d',
      name: 'Không gian',
      icon: <Box size={16} className="text-indigo-500" />,
      items: [
        { id: 'pyr', name: 'Hình chóp đều', desc: 'Đáy đa giác đều, xoay 360°' },
        { id: 'free', name: 'Chóp tuỳ ý', desc: 'Tự do kéo đỉnh S & các đỉnh đáy' },
        { id: 'prism', name: 'Lăng trụ đều', desc: 'Lăng trụ đứng đáy đều' },
        { id: 'fprism', name: 'Lăng trụ xiên', desc: 'Kéo đỉnh A\' để nghiêng lăng trụ' },
        { id: 'box', name: 'Hình hộp chữ nhật', desc: 'Khối hộp chữ nhật tiêu chuẩn' },
        { id: 'fbox', name: 'Hình hộp xiên', desc: 'Đáy bình hành, nghiêng tự do' }
      ]
    },
    {
      id: 'stats',
      name: 'Thống kê & Xác suất',
      icon: <BarChart3 size={16} className="text-purple-500" />,
      items: [
        { id: 'tree', name: 'Sơ đồ cây (Xác suất)', desc: 'Xác suất có điều kiện, định lý Bayes' },
        { id: 'venn', name: 'Biểu đồ Venn', desc: 'Phần tử giao, hợp, riêng của 2 tập hợp' },
        { id: 'nl', name: 'Trục số (Tập hợp)', desc: 'Khoảng, nửa khoảng, đoạn [-2; 3)' },
        { id: 'pie', name: 'Biểu đồ tròn', desc: 'Tỉ lệ phần trăm các thành phần' }
      ]
    },
    {
      id: 'files',
      name: 'Tệp & Mẫu',
      icon: <FileDown size={16} className="text-teal-500" />,
      items: [
        { id: 'templates', name: 'Mẫu hình có sẵn (Presets)', desc: 'Nạp nhanh các dạng toán mẫu', isAction: true },
        { id: 'save', name: 'Lưu bài vẽ (.json)', desc: 'Lưu toàn bộ bài về máy tính', isAction: true },
        { id: 'open', name: 'Mở file bài vẽ…', desc: 'Mở lại file .json đã lưu', isAction: true },
        { id: 'pv', name: 'Xem trước in A4…', desc: 'Bản in A4 kẻ ô li / trắng', isAction: true },
        { id: 'png', name: 'Xuất ảnh PNG', desc: 'Tải nhanh ảnh chất lượng cao', isAction: true },
        { id: 'clear', name: 'Xoá trang này', desc: 'Xoá tất cả hình trên trang hiện tại', isAction: true }
      ]
    }
  ];

  const handleDropdownItemClick = (item: DropdownItem) => {
    setOpenMenu(null);
    if (item.isAction) {
      if (item.id === 'templates') onOpenTemplates();
      if (item.id === 'save') onSaveFile();
      if (item.id === 'open') onOpenFile();
      if (item.id === 'pv') onOpenPrintPreview();
      if (item.id === 'png') onExportPng();
      if (item.id === 'clear') onClearPage();
    } else {
      onSelectTool(item.id as ActiveTool);
    }
  };

  const lineStyleVisual: Record<LineStyle, { label: string; preview: string }> = {
    solid: { label: 'Liền', preview: '━━━' },
    dash: { label: 'Đứt', preview: '┅ ┅' },
    dot: { label: 'Chấm', preview: '• • •' }
  };

  const COLORS = [
    { id: 'ink', name: 'Mặc định', bg: 'var(--ink)' },
    { id: '#dc2626', name: 'Đỏ', bg: '#dc2626' },
    { id: '#2563eb', name: 'Xanh dương', bg: '#2563eb' },
    { id: '#059669', name: 'Xanh lá', bg: '#059669' }
  ];

  return (
    <>
      <header className="flex items-center gap-2 px-3 py-2 bg-[var(--panel)] border-b-2 border-[var(--line)] shadow-sm select-none overflow-x-auto text-sm z-30 min-h-[52px]">
        {/* Brand logo & app title */}
        <div className="flex items-center gap-2.5 pr-3 border-r-2 border-[var(--line)] mr-1 shrink-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-teal-600 text-white font-extrabold text-lg shadow-sm">
            Σ
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-[var(--ink)] text-sm tracking-tight leading-tight whitespace-nowrap">
              BẢNG VẼ HÌNH HỌC _ PHẠM HẬU
            </span>
            <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 leading-none">
              Phòng vẽ Hình học
            </span>
          </div>
        </div>

        {/* Direct tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {DIRECT_TOOLS.map(t => {
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setOpenMenu(null);
                  onSelectTool(t.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-500/30'
                    : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--grid)] hover:border-slate-400'
                }`}
                title={t.name}
              >
                <span className={isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}>
                  {t.icon}
                </span>
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        <div className="h-6 w-0.5 bg-[var(--line)] mx-1 shrink-0" />

        {/* Group dropdown buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {GROUPS.map(g => {
            const activeItem = g.items.find(i => i.id === activeTool);
            const isGroupActive = Boolean(activeItem);
            const isOpen = openMenu?.id === g.id;

            return (
              <button
                key={g.id}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (openMenu?.id === g.id) {
                    setOpenMenu(null);
                  } else {
                    setOpenMenu({
                      id: g.id,
                      name: g.name,
                      items: g.items,
                      rect
                    });
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer border ${
                  isGroupActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--grid)] hover:border-slate-400'
                }`}
              >
                {g.icon}
                <span>
                  {isGroupActive && activeItem ? `${g.name}: ${activeItem.name}` : g.name}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 text-[var(--mut)] ${
                    isOpen ? 'rotate-180 text-teal-600' : ''
                  }`}
                />
              </button>
            );
          })}

          {/* Function plot button */}
          <button
            onClick={() => {
              setOpenMenu(null);
              onSelectTool('fn');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer border ${
              activeTool === 'fn'
                ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-500/30'
                : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--grid)] hover:border-slate-400'
            }`}
            title="Đồ thị hàm số y = f(x, m)"
          >
            <Sparkles size={16} className={activeTool === 'fn' ? 'text-amber-300' : 'text-amber-500'} />
            <span>Hàm số y=f(x)</span>
          </button>
        </div>

        <div className="flex-1" />

        {/* Right controls: Color swatches, line style, undo, view fit, theme */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Colors Swatches */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] shadow-xs">
            <span className="text-[11px] font-bold text-[var(--mut)] mr-0.5 hidden lg:inline">Màu:</span>
            {COLORS.map(c => {
              const isSelected = currentColor === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectColor(c.id)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'border-teal-600 scale-110 shadow-md ring-2 ring-teal-400/50'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.bg }}
                  title={`Chọn màu: ${c.name}`}
                  aria-label={c.name}
                >
                  {isSelected && (
                    <Check size={12} className={c.id === 'ink' && isDark ? 'text-black' : 'text-white'} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Line style toggle */}
          <button
            onClick={onToggleLineStyle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-xs sm:text-sm font-bold text-[var(--ink)] transition-colors cursor-pointer shadow-xs"
            title="Bấm để đổi kiểu nét: Liền ➔ Đứt ➔ Chấm"
          >
            <span className="font-mono text-xs font-black text-teal-600 dark:text-teal-400">
              {lineStyleVisual[lineStyle].preview}
            </span>
            <span>Nét {lineStyleVisual[lineStyle].label}</span>
          </button>

          {/* Undo button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all ${
              canUndo
                ? 'bg-[var(--bg)] border-[var(--line)] hover:bg-[var(--grid)] hover:border-slate-400 text-[var(--ink)] cursor-pointer shadow-xs active:scale-95'
                : 'bg-transparent border-transparent text-[var(--mut)] opacity-40 cursor-not-allowed'
            }`}
            title="Hoàn tác thao tác trước (Ctrl+Z)"
          >
            <Undo2 size={16} />
            <span className="hidden xl:inline">Hoàn tác</span>
          </button>

          {/* Fit view button */}
          <button
            onClick={onFitView}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] hover:border-slate-400 text-[var(--ink)] font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs hidden sm:flex"
            title="Thu phóng vừa toàn bộ hình vẽ (Phím F)"
          >
            <Maximize2 size={16} className="text-teal-600 dark:text-teal-400" />
            <span className="hidden lg:inline">Vừa khung</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)] transition-colors cursor-pointer shadow-xs"
            title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* FLOATING DROPDOWN MENU OUTSIDE CANVAS & TOOLBAR USING PORTAL */}
      {openMenu &&
        createPortal(
          <>
            {/* Transparent click-away layer */}
            <div
              className="fixed inset-0 z-[90] bg-black/5"
              onClick={() => setOpenMenu(null)}
            />

            {/* Floating Dropdown Card */}
            <div
              className="fixed z-[100] w-72 max-h-[82vh] overflow-y-auto bg-[var(--panel)] border-2 border-teal-600 dark:border-teal-500 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150"
              style={{
                top: `${Math.min(openMenu.rect.bottom + 6, window.innerHeight - 340)}px`,
                left: `${Math.max(10, Math.min(openMenu.rect.left, window.innerWidth - 300))}px`
              }}
            >
              <div className="flex items-center justify-between px-3 py-2 mb-1 border-b-2 border-[var(--line)]">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  {openMenu.name}
                </span>
                <button
                  onClick={() => setOpenMenu(null)}
                  className="p-1 rounded-lg hover:bg-[var(--grid)] text-[var(--mut)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                  title="Đóng menu"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {openMenu.items.map(item => {
                  const isSelected = activeTool === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleDropdownItemClick(item)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white font-bold shadow-md'
                          : 'hover:bg-[var(--grid)] text-[var(--ink)]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{item.name}</span>
                        {item.desc && (
                          <span
                            className={`text-xs mt-0.5 leading-snug ${
                              isSelected ? 'text-teal-100' : 'text-[var(--mut)]'
                            }`}
                          >
                            {item.desc}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check size={18} className="text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
};
