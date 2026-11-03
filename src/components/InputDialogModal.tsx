import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface InputDialogModalProps {
  isOpen: boolean;
  title: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  symbols?: string[];
  onConfirm: (val: string) => void;
  onCancel: () => void;
}

const DEFAULT_SYMBOLS = ['√(', '^2', '^3', 'π', '≤', '≥', '≠', '→', '±', 'Δ', '∪', '∩', '∞', '-inf', '+inf'];

export const InputDialogModal: React.FC<InputDialogModalProps> = ({
  isOpen,
  title,
  defaultValue = '',
  placeholder = '',
  hint,
  symbols = DEFAULT_SYMBOLS,
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onConfirm(value.trim());
  };

  const insertSymbol = (sym: string) => {
    const el = inputRef.current;
    if (!el) {
      setValue(prev => prev + sym);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const next = value.slice(0, start) + sym + value.slice(end);
    setValue(next);
    setTimeout(() => {
      el.focus();
      const pos = start + sym.length;
      el.setSelectionRange(pos, pos);
    }, 10);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] rounded-xl shadow-2xl p-5 overflow-hidden flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base tracking-tight">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-[var(--mut)] hover:bg-[var(--grid)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--acc)] transition-all font-mono"
            autoComplete="off"
            autoFocus
          />

          {symbols && symbols.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-[var(--mut)] uppercase tracking-wider">
                Ký hiệu toán học nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {symbols.map(sym => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => insertSymbol(sym)}
                    className="px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-[var(--bg)] hover:bg-[var(--grid)] hover:border-teal-500 hover:text-teal-600 border-2 border-[var(--line)] text-[var(--ink)] cursor-pointer transition-all shadow-2xs active:scale-95"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hint && (
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl border border-[var(--line)] leading-relaxed">
              💡 {hint}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t-2 border-[var(--line)] mt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[var(--ink)] bg-[var(--bg)] border-2 border-[var(--line)] hover:bg-[var(--grid)] transition-colors cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Check size={16} /> Đồng ý
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
