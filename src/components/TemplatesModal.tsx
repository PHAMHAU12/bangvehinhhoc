import React from 'react';
import { X, Box, Compass, Sparkles, BarChart3, Shapes } from 'lucide-react';
import { CanvasMathObject } from '../types/math';

interface TemplateItem {
  id: string;
  title: string;
  desc: string;
  category: string;
  icon: React.ReactNode;
  data: CanvasMathObject[];
}

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (objects: CanvasMathObject[], name: string) => void;
}

export const TEMPLATES: TemplateItem[] = [
  {
    id: 'pyr_section',
    title: 'Hình chóp S.ABCD & Mặt cắt thiết diện',
    desc: 'Hình chóp tứ giác đều kèm trung điểm M, N và mặt cắt thiết diện qua 3 điểm (M, N, B)',
    category: 'Hình không gian',
    icon: <Box className="text-amber-500" size={20} />,
    data: [
      {
        t: 'pyr',
        id: 1,
        x: 320,
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
    ]
  },
  {
    id: 'fprism_slant',
    title: 'Lăng trụ xiên ABC.A\'B\'C\'',
    desc: 'Lăng trụ tam giác xiên với đáy tự do và vectơ nghiêng',
    category: 'Hình không gian',
    icon: <Box className="text-teal-500" size={20} />,
    data: [
      {
        t: 'pyr',
        id: 1,
        x: 320,
        y: 280,
        n: 3,
        az: 25,
        s: 100,
        kind: 'fprism',
        fb: [
          [80, 20],
          [-20, 75],
          [-75, -55]
        ],
        fv: [55, 130, -30]
      }
    ]
  },
  {
    id: 'vector_rules',
    title: 'Quy tắc cộng vectơ (Tam giác & Hình bình hành)',
    desc: 'Quy tắc tam giác AB + BC = AC và quy tắc hình bình hành AB + AD = AC',
    category: 'Hình phẳng',
    icon: <Shapes className="text-blue-500" size={20} />,
    data: [
      // Triangle rule: A, B, C
      { t: 'pt', id: 1, x: 140, y: 150, n: 'A', sh: 1 },
      { t: 'pt', id: 2, x: 300, y: 110, n: 'B', sh: 1 },
      { t: 'pt', id: 3, x: 260, y: 270, n: 'C', sh: 1 },
      { t: 'seg', id: 4, a: 1, b: 2, ar: true, vl: true },
      { t: 'seg', id: 5, a: 2, b: 3, ar: true, vl: true },
      { t: 'seg', id: 6, a: 1, b: 3, ar: true, vl: true, cl: '#dc2626' },
      { t: 'txt', id: 7, x: 120, y: 310, s: 'AB -> + BC -> = AC -> (Quy tắc 3 điểm)', c: '#dc2626' },

      // Parallelogram rule: E, F, G, D
      { t: 'pt', id: 10, x: 500, y: 260, n: 'O', sh: 1 },
      { t: 'pt', id: 11, x: 680, y: 260, n: 'P', sh: 1 },
      { t: 'pt', id: 12, x: 570, y: 140, n: 'Q', sh: 1 },
      { t: 'pt', id: 13, x: 750, y: 140, n: 'R', sh: 1, pg: [10, 11, 12] },
      { t: 'seg', id: 14, a: 10, b: 11, ar: true, vl: true },
      { t: 'seg', id: 15, a: 10, b: 12, ar: true, vl: true },
      { t: 'seg', id: 16, a: 11, b: 13, ls: 'dash' },
      { t: 'seg', id: 17, a: 12, b: 13, ls: 'dash' },
      { t: 'seg', id: 18, a: 10, b: 13, ar: true, vl: true, cl: '#dc2626' },
      { t: 'txt', id: 19, x: 480, y: 310, s: 'OP -> + OQ -> = OR -> (Quy tắc hình bình hành)', c: '#dc2626' }
    ]
  },
  {
    id: 'triangle_centers',
    title: 'Tam giác & Trọng tâm G, Trực tâm H, Tròn ngoại tiếp',
    desc: 'Tam giác ABC hoàn chỉnh với trung điểm M, đường cao AH, trọng tâm G và đường tròn ngoại tiếp',
    category: 'Dựng hình',
    icon: <Compass className="text-indigo-500" size={20} />,
    data: [
      { t: 'pt', id: 1, x: 220, y: 120, n: 'A', sh: 1 },
      { t: 'pt', id: 2, x: 120, y: 340, n: 'B', sh: 1 },
      { t: 'pt', id: 3, x: 420, y: 340, n: 'C', sh: 1 },
      { t: 'seg', id: 4, a: 1, b: 2 },
      { t: 'seg', id: 5, a: 2, b: 3 },
      { t: 'seg', id: 6, a: 3, b: 1 },
      // Altitude H
      { t: 'pt', id: 7, x: 220, y: 340, n: 'H', sh: 1, f: [1, 2, 3] },
      { t: 'seg', id: 8, a: 1, b: 7, ls: 'dash' },
      // Centroid G
      { t: 'pt', id: 9, x: 253, y: 266, n: 'G', sh: 1, w: [1, 2, 3], wk: 'G' },
      // Circumcircle O
      { t: 'pt', id: 10, x: 270, y: 247, n: 'O', sh: 1, k: [1, 2, 3] },
      { t: 'cir', id: 11, c: 10, r: 1, ls: 'dash' }
    ]
  },
  {
    id: 'fn_cubic',
    title: 'Đồ thị hàm số bậc 3 y = x³ - 3x + m',
    desc: 'Đồ thị hàm số với trục tọa độ, thước chia và tham số m tương tác bằng thanh trượt',
    category: 'Hàm số',
    icon: <Sparkles className="text-orange-500" size={20} />,
    data: [
      {
        t: 'fn',
        id: 1,
        x: 200,
        y: 100,
        e: 'x^3 - 3*x + m',
        m: 0,
        sc: 34
      },
      {
        t: 'txt',
        id: 2,
        x: 180,
        y: 400,
        s: 'Bấm vào đồ thị để kéo thanh trượt m và quan sát sự tịnh tiến đồ thị',
        c: 'ink'
      }
    ]
  },
  {
    id: 'bayes_tree',
    title: 'Sơ đồ cây xác suất & Định lý Bayes',
    desc: 'Sơ đồ cây tính P(B) và P(A|B) tự động từ P(A), P(B|A), P(B|Ā)',
    category: 'Thống kê & Xác suất',
    icon: <BarChart3 className="text-emerald-500" size={20} />,
    data: [
      {
        t: 'tree',
        id: 1,
        x: 160,
        y: 110,
        p: [0.4, 0.7, 0.2]
      },
      {
        t: 'txt',
        id: 2,
        x: 140,
        y: 420,
        s: 'Công thức xác suất toàn phần & Công thức Bayes',
        c: '#2563eb'
      }
    ]
  },
  {
    id: 'venn_sets',
    title: 'Biểu đồ Venn 2 tập hợp A và B',
    desc: 'Giao, hợp, phần tử riêng của A, B và tập vũ trụ U',
    category: 'Thống kê & Xác suất',
    icon: <BarChart3 className="text-purple-500" size={20} />,
    data: [
      {
        t: 'venn',
        id: 1,
        x: 200,
        y: 120,
        v: [15, 20, 8, 12]
      }
    ]
  },
  {
    id: 'number_line_intervals',
    title: 'Trục số tập hợp S = [-2; 3) ∪ [5; +∞)',
    desc: 'Biểu diễn tập hợp khoảng, nửa khoảng, đoạn trên trục số thực',
    category: 'Thống kê & Xác suất',
    icon: <BarChart3 className="text-rose-500" size={20} />,
    data: [
      {
        t: 'nl',
        id: 1,
        x: 160,
        y: 180,
        e: '[-2; 3) U [5; +inf)'
      },
      {
        t: 'nl',
        id: 2,
        x: 160,
        y: 310,
        e: '(-inf; 1] U [4; +inf)'
      }
    ]
  }
];

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <div>
            <h3 className="font-bold text-lg">Mẫu bài tập & Hình vẽ mẫu</h3>
            <p className="text-xs text-[var(--mut)] mt-0.5">
              Chọn mẫu hình để chèn ngay vào bảng vẽ hoặc xem cách dựng hình chuẩn
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--mut)] hover:bg-[var(--grid)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {TEMPLATES.map(tmpl => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl.data, tmpl.title);
                onClose();
              }}
              className="flex flex-col gap-2 p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--acc)] hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--line)] group-hover:scale-105 transition-transform">
                  {tmpl.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm group-hover:text-[var(--acc)] transition-colors">
                    {tmpl.title}
                  </span>
                  <span className="text-[11px] text-[var(--mut)] font-medium">
                    {tmpl.category}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[var(--mut)] leading-relaxed mt-1">
                {tmpl.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
