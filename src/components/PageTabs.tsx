import React from 'react';
import { Plus, Copy, Trash2, Edit2, Layers } from 'lucide-react';
import { MathPage } from '../types/math';

interface PageTabsProps {
  pages: MathPage[];
  currentPageIndex: number;
  onSelectPage: (idx: number) => void;
  onAddPage: () => void;
  onDuplicatePage: () => void;
  onRenamePage: (idx: number) => void;
  onDeletePage: (idx: number) => void;
}

export const PageTabs: React.FC<PageTabsProps> = ({
  pages,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onRenamePage,
  onDeletePage
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg)] border-b-2 border-[var(--line)] overflow-x-auto select-none text-xs sm:text-sm z-20">
      {/* Icon and label for pages */}
      <div className="flex items-center gap-1.5 text-[var(--mut)] font-bold text-xs uppercase tracking-wider shrink-0 mr-1 hidden sm:flex">
        <Layers size={15} className="text-teal-600" />
        <span>Trang bài:</span>
      </div>

      {/* Tabs list */}
      <div className="flex items-center gap-1.5 shrink-0">
        {pages.map((p, idx) => {
          const isActive = idx === currentPageIndex;
          return (
            <div
              key={idx}
              onClick={() => onSelectPage(idx)}
              onDoubleClick={() => onRenamePage(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer border-2 ${
                isActive
                  ? 'bg-[var(--panel)] border-teal-600 text-teal-700 dark:text-teal-300 font-bold shadow-sm ring-2 ring-teal-500/20'
                  : 'bg-[var(--panel)]/60 border-[var(--line)] text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--panel)] hover:border-slate-400 font-semibold'
              }`}
              title="Bấm để mở trang · Bấm đúp để đổi tên"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                {idx + 1}
              </span>
              <span className="max-w-[140px] truncate">{p.name || `Trang ${idx + 1}`}</span>

              {isActive && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onRenamePage(idx);
                  }}
                  className="p-1 rounded-md text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--grid)] transition-colors cursor-pointer"
                  title="Đổi tên trang này"
                >
                  <Edit2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons: Add, Duplicate, Delete */}
      <div className="flex items-center gap-1.5 pl-2 border-l-2 border-[var(--line)] shrink-0">
        <button
          onClick={onAddPage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer shadow-xs"
          title="Tạo thêm một trang bảng vẽ mới"
        >
          <Plus size={15} className="stroke-[3]" />
          <span>Thêm trang mới</span>
        </button>

        <button
          onClick={onDuplicatePage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--grid)] text-[var(--ink)] font-bold transition-colors cursor-pointer shadow-xs"
          title="Nhân bản trang hiện tại"
        >
          <Copy size={14} className="text-blue-500" />
          <span className="hidden sm:inline">Nhân bản trang</span>
        </button>

        {pages.length > 1 && (
          <button
            onClick={() => onDeletePage(currentPageIndex)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 font-bold transition-colors cursor-pointer shadow-xs"
            title="Xoá trang bài tập hiện tại"
          >
            <Trash2 size={14} />
            <span className="hidden md:inline">Xoá trang này</span>
          </button>
        )}
      </div>

      <div className="ml-auto text-xs font-bold text-[var(--mut)] bg-[var(--panel)] px-2.5 py-1 rounded-lg border border-[var(--line)] hidden md:block">
        Trang {currentPageIndex + 1} / {pages.length}
      </div>
    </div>
  );
};
