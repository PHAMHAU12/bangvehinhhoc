import React from 'react';
import {
  Trash2,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Box,
  Compass,
  Sparkles,
  Maximize2,
  RotateCw,
  Plus,
  Scissors,
  Check,
  Globe,
  Ruler
} from 'lucide-react';
import { CanvasMathObject, LineStyle, Solid3DObj } from '../types/math';
import { isFree } from '../utils/mathEngine';

interface ContextBarProps {
  selectedObject: CanvasMathObject | null;
  onDelete: () => void;
  onDuplicate: () => void;
  onRenamePoint: () => void;
  onTogglePointLabel: () => void;
  onSetLineStyle: (ls: LineStyle) => void;
  onToggleVectorArrow: () => void;
  onToggleVectorLabel: () => void;
  onEditContent: () => void;
  onUpdateProperty: (key: string, val: number) => void;
  onAdd3DMidpoint: () => void;
  onAdd3DCutPlane: () => void;
  onAdd3DIntersection: () => void;
  onToggle3DSphere: () => void;
  onToggle3DHeight: () => void;
  onToggle3DVolume: () => void;
  onAdd3DMeasureLen: () => void;
  onAdd3DMeasureDist: () => void;
  onClear3DExtras: () => void;
}

export const ContextBar: React.FC<ContextBarProps> = ({
  selectedObject,
  onDelete,
  onDuplicate,
  onRenamePoint,
  onTogglePointLabel,
  onSetLineStyle,
  onToggleVectorArrow,
  onToggleVectorLabel,
  onEditContent,
  onUpdateProperty,
  onAdd3DMidpoint,
  onAdd3DCutPlane,
  onAdd3DIntersection,
  onToggle3DSphere,
  onToggle3DHeight,
  onToggle3DVolume,
  onAdd3DMeasureLen,
  onAdd3DMeasureDist,
  onClear3DExtras
}) => {
  if (!selectedObject) return null;

  const o = selectedObject;

  const getObjectLabel = () => {
    switch (o.t) {
      case 'pt':
        return `📍 Điểm ${o.n}`;
      case 'seg':
        return o.ar ? '🧭 Vectơ' : '📏 Đoạn thẳng';
      case 'cir':
        return '⭕ Đường tròn';
      case 'pol':
        return `🔺 Đa giác (${o.ids.length} đỉnh)`;
      case 'pen':
        return '✏️ Nét vẽ tay';
      case 'txt':
        return '📝 Chữ / Công thức';
      case 'fn':
        return `📈 Đồ thị hàm số y = f(x)`;
      case 'pyr':
        return `🧊 Khối 3D (${o.kind === 'pyr' ? 'Hình chóp đều' : o.kind === 'free' ? 'Chóp tuỳ ý' : o.kind === 'prism' ? 'Lăng trụ' : o.kind === 'fprism' ? 'Lăng trụ xiên' : 'Hình hộp'})`;
      case 'tree':
        return '🌳 Sơ đồ cây xác suất';
      case 'venn':
        return '⭕ Biểu đồ Venn';
      case 'nl':
        return '📐 Trục số tập hợp';
      case 'pie':
        return '📊 Biểu đồ tròn';
      case 'ms':
        return '📏 Số đo hình học';
      default:
        return 'Hình đang chọn';
    }
  };

  const currentLs = 'ls' in o ? (o as any).ls || 'solid' : 'solid';

  return (
    <div className="absolute left-1/2 bottom-16 -translate-x-1/2 flex items-center gap-2.5 max-w-[96vw] px-4 py-2.5 bg-[var(--panel)] border-2 border-teal-600 dark:border-teal-500 rounded-2xl shadow-2xl z-30 flex-wrap justify-center text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-150">
      {/* Object Type Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200 font-bold border border-teal-300 dark:border-teal-700 shadow-xs">
        <span>{getObjectLabel()}</span>
      </div>

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all cursor-pointer shadow-sm active:scale-95"
        title="Xoá đối tượng đang chọn (Phím Delete)"
      >
        <Trash2 size={15} />
        <span>Xoá</span>
      </button>

      {/* Point controls */}
      {o.t === 'pt' && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRenamePoint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)] font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Edit size={14} className="text-teal-600" />
            <span>Đổi tên điểm ({o.n})</span>
          </button>
          <button
            onClick={onTogglePointLabel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)] font-bold transition-colors cursor-pointer shadow-xs"
          >
            {o.sh ? <EyeOff size={14} className="text-amber-500" /> : <Eye size={14} className="text-teal-600" />}
            <span>{o.sh ? 'Ẩn tên chữ' : 'Hiện tên chữ'}</span>
          </button>
        </div>
      )}

      {/* Line Segment controls */}
      {o.t === 'seg' && (
        <div className="flex items-center gap-1.5">
          {/* Line Style Toggles */}
          <div className="flex items-center gap-1 border-2 border-[var(--line)] rounded-xl p-0.5 bg-[var(--bg)] shadow-xs">
            <button
              onClick={() => onSetLineStyle('solid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                currentLs === 'solid' ? 'bg-teal-600 text-white shadow-xs' : 'text-[var(--ink)] hover:bg-[var(--grid)]'
              }`}
            >
              ━━━ Liền
            </button>
            <button
              onClick={() => onSetLineStyle('dash')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                currentLs === 'dash' ? 'bg-teal-600 text-white shadow-xs' : 'text-[var(--ink)] hover:bg-[var(--grid)]'
              }`}
            >
              ┅ ┅ Đứt
            </button>
            <button
              onClick={() => onSetLineStyle('dot')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                currentLs === 'dot' ? 'bg-teal-600 text-white shadow-xs' : 'text-[var(--ink)] hover:bg-[var(--grid)]'
              }`}
            >
              • • • Chấm
            </button>
          </div>

          <button
            onClick={onToggleVectorArrow}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 font-bold transition-colors cursor-pointer shadow-xs ${
              o.ar
                ? 'border-teal-600 bg-teal-600 text-white'
                : 'border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)]'
            }`}
          >
            <span>{o.ar ? '✓ Đang là Vectơ' : 'Chuyển thành Vectơ'}</span>
          </button>

          {o.ar && (
            <button
              onClick={onToggleVectorLabel}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 font-bold transition-colors cursor-pointer shadow-xs ${
                o.vl
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)]'
              }`}
            >
              <span>{o.vl ? '✓ Hiện ký hiệu vectơ' : 'Hiện ký hiệu vectơ'}</span>
            </button>
          )}
        </div>
      )}

      {/* Circle / Polygon / Pen / Bisector line styles */}
      {['cir', 'pol', 'pen', 'pb'].includes(o.t) && (
        <div className="flex items-center gap-1 border-2 border-[var(--line)] rounded-xl p-0.5 bg-[var(--bg)] shadow-xs">
          <button
            onClick={() => onSetLineStyle('solid')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              currentLs === 'solid' ? 'bg-teal-600 text-white shadow-xs' : 'text-[var(--ink)] hover:bg-[var(--grid)]'
            }`}
          >
            ━━━ Nét liền
          </button>
          <button
            onClick={() => onSetLineStyle('dash')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              currentLs === 'dash' ? 'bg-teal-600 text-white shadow-xs' : 'text-[var(--ink)] hover:bg-[var(--grid)]'
            }`}
          >
            ┅ ┅ Nét đứt
          </button>
          <button
            onClick={() => onSetLineStyle('dot')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              currentLs === 'dot' ? 'bg-teal-600 text-white shadow-xs' : 'text-[var(--ink)] hover:bg-[var(--grid)]'
            }`}
          >
            • • • Nét chấm
          </button>
        </div>
      )}

      {/* Editable objects (Text, Function, Tree, Venn, Number Line, Pie) */}
      {['txt', 'fn', 'tree', 'venn', 'nl', 'pie'].includes(o.t) && (
        <button
          onClick={onEditContent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-teal-500 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-800 dark:text-teal-200 font-bold transition-colors cursor-pointer shadow-xs"
        >
          <Edit size={14} />
          <span>Sửa biểu thức / Số liệu</span>
        </button>
      )}

      {/* Function sliders */}
      {o.t === 'fn' && (
        <div className="flex items-center gap-3 bg-[var(--bg)] px-3 py-1 rounded-xl border-2 border-[var(--line)]">
          <label className="flex items-center gap-2 font-bold text-xs text-[var(--ink)]">
            <span className="bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-md text-teal-800 dark:text-teal-300">
              m = {o.m}
            </span>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={o.m}
              onChange={e => onUpdateProperty('m', Number(e.target.value))}
              className="w-24 accent-teal-600 cursor-pointer h-2"
            />
          </label>
          <label className="flex items-center gap-2 font-bold text-xs text-[var(--ink)]">
            <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">
              Tỉ lệ: {o.sc}
            </span>
            <input
              type="range"
              min="12"
              max="60"
              step="1"
              value={o.sc}
              onChange={e => onUpdateProperty('sc', Number(e.target.value))}
              className="w-20 accent-teal-600 cursor-pointer h-2"
            />
          </label>
        </div>
      )}

      {/* 3D Solid Controls */}
      {o.t === 'pyr' && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sliders in a container */}
          <div className="flex items-center gap-2.5 bg-[var(--bg)] px-3 py-1.5 rounded-xl border-2 border-[var(--line)]">
            {o.kind !== 'box' && o.kind !== 'fbox' && (
              <label className="flex items-center gap-1.5 font-bold text-xs text-[var(--ink)]">
                <span className="bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-md text-teal-800 dark:text-teal-300">
                  Đáy: {o.n} cạnh
                </span>
                <input
                  type="range"
                  min="3"
                  max="8"
                  step="1"
                  value={o.n}
                  onChange={e => onUpdateProperty('n', Number(e.target.value))}
                  className="w-16 accent-teal-600 cursor-pointer h-2"
                />
              </label>
            )}

            <label className="flex items-center gap-1.5 font-bold text-xs text-[var(--ink)]">
              <span className="bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                <RotateCw size={11} /> {o.az}°
              </span>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={o.az}
                onChange={e => onUpdateProperty('az', Number(e.target.value))}
                className="w-20 accent-teal-600 cursor-pointer h-2"
              />
            </label>

            <label className="flex items-center gap-1.5 font-bold text-xs text-[var(--ink)]">
              <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                Cỡ: {o.s}
              </span>
              <input
                type="range"
                min="50"
                max="150"
                step="1"
                value={o.s}
                onChange={e => onUpdateProperty('s', Number(e.target.value))}
                className="w-16 accent-teal-600 cursor-pointer h-2"
              />
            </label>
          </div>

          {/* 3D Actions */}
          <button
            onClick={onAdd3DMidpoint}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)] font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} className="text-emerald-600" />
            <span>Trung điểm cạnh</span>
          </button>

          <button
            onClick={onAdd3DCutPlane}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 font-bold transition-colors cursor-pointer shadow-xs ${
              o.sec
                ? 'border-amber-600 bg-amber-500 text-white'
                : 'border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)]'
            }`}
            title="Dựng mặt phẳng cắt khối 3D qua 3 điểm (ví dụ: M N P)"
          >
            <Scissors size={14} />
            <span>{o.sec ? `Thiết diện (${o.sec.join(' ')})` : '✂ Mặt cắt (Thiết diện)'}</span>
          </button>

          <button
            onClick={onAdd3DIntersection}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 font-bold transition-colors cursor-pointer shadow-xs ${
              o.gt
                ? 'border-red-600 bg-red-600 text-white'
                : 'border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)]'
            }`}
            title="Dựng giao tuyến giữa 2 mặt phẳng"
          >
            <span>{o.gt ? '✓ Đang hiện giao tuyến' : 'Giao tuyến 2 mặt'}</span>
          </button>

          {!isFree(o.kind) && (
            <button
              onClick={onToggle3DSphere}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 font-bold transition-colors cursor-pointer shadow-xs ${
                o.sph
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)]'
              }`}
            >
              <Globe size={14} />
              <span>{o.sph ? '✓ Mặt cầu ngoại tiếp' : 'Mặt cầu ngoại tiếp'}</span>
            </button>
          )}

          {((o.kind || 'pyr') === 'pyr' || o.kind === 'free') && (
            <button
              onClick={onToggle3DHeight}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 font-bold transition-colors cursor-pointer shadow-xs ${
                o.hh
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)]'
              }`}
            >
              <span>{o.hh ? '✓ Đường cao SH' : 'Hiện chiều cao SH'}</span>
            </button>
          )}

          <button
            onClick={onToggle3DVolume}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 font-bold transition-colors cursor-pointer shadow-xs ${
              o.vol
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)]'
            }`}
          >
            <span>{o.vol ? '✓ Thể tích & Diện tích' : 'Tính V & Diện tích'}</span>
          </button>

          <button
            onClick={onAdd3DMeasureLen}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)] font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Ruler size={14} className="text-amber-500" />
            <span>Đo độ dài đoạn nối</span>
          </button>

          <button
            onClick={onAdd3DMeasureDist}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--grid)] text-[var(--ink)] font-bold transition-colors cursor-pointer shadow-xs"
          >
            <span>Đo d(Điểm, Mặt)</span>
          </button>

          <button
            onClick={onClear3DExtras}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 transition-colors cursor-pointer shadow-xs"
            title="Xoá các thiết diện, giao tuyến, trung điểm trên hình này"
          >
            <span>Xoá phần thêm 3D</span>
          </button>
        </div>
      )}

      {/* Duplicate button */}
      {['txt', 'fn', 'pyr', 'pie', 'pen', 'tree', 'venn', 'nl'].includes(o.t) && (
        <button
          onClick={onDuplicate}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold transition-colors cursor-pointer shadow-xs"
        >
          <Copy size={14} />
          <span>Nhân bản hình</span>
        </button>
      )}
    </div>
  );
};
