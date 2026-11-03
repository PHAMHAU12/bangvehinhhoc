export type LineStyle = 'solid' | 'dash' | 'dot';

export type MathColor = 'ink' | '#dc2626' | '#2563eb' | '#059669' | string;

export interface PointObj {
  t: 'pt';
  id: number;
  x: number;
  y: number;
  n: string;
  sh: number; // 1 = show label, 0 = hide
  // Dependent point references:
  m?: [number, number]; // midpoint of [A, B]
  f?: [number, number, number]; // foot of altitude from v onto ab [v, a, b]
  u?: number; // ratio along ab for foot
  g?: [number, number, number]; // angle bisector ray foot [v, a, b]
  k?: [number, number, number]; // circumcenter of triangle [a, b, c]
  pg?: [number, number, number]; // parallelogram 4th point D = B + C - A [a, b, c]
  w?: [number, number, number]; // triangle special centers [a, b, c]
  wk?: 'G' | 'H' | 'I'; // G: centroid, H: orthocenter, I: incenter
}

export interface SegmentObj {
  t: 'seg';
  id: number;
  a: number;
  b: number;
  ls?: LineStyle;
  cl?: string;
  ar?: boolean; // arrow (vector)
  vl?: boolean; // vector label (e.g. AB with vector arrow over it)
}

export interface CircleObj {
  t: 'cir';
  id: number;
  c: number; // center point id
  r: number; // radius through point id
  ls?: LineStyle;
}

export interface PerpendicularBisectorObj {
  t: 'pb';
  id: number;
  a: number;
  b: number;
  ls?: LineStyle;
}

export interface PolygonObj {
  t: 'pol';
  id: number;
  ids: number[];
  ls?: LineStyle;
}

export interface PenObj {
  t: 'pen';
  id: number;
  d: string;
  tx: number;
  ty: number;
  ls?: LineStyle;
  c?: string;
}

export interface TextObj {
  t: 'txt';
  id: number;
  x: number;
  y: number;
  s: string;
  c?: string;
}

export interface FunctionObj {
  t: 'fn';
  id: number;
  x: number;
  y: number;
  e: string; // expression in x and m
  m: number; // parameter m
  sc: number; // scale
}

export type SolidKind = 'pyr' | 'free' | 'prism' | 'fprism' | 'box' | 'fbox';

export interface Solid3DObj {
  t: 'pyr';
  id: number;
  x: number;
  y: number;
  n: number; // polygon base vertex count
  az: number; // azimuth rotation angle (degrees)
  s: number; // radius / size scale
  kind?: SolidKind;
  // Free / customizable 3D models:
  fb?: [number, number][]; // 2D base vertex coordinates relative to center
  fa?: [number, number, number]; // apex 3D coordinates for free pyramid [x, y, z]
  fv?: [number, number, number]; // top face offset vector [x, y, z] for oblique prism/box
  // 3D features:
  mp?: [string, string, string][]; // midpoints on edges: [VertexA, VertexB, MidpointName]
  sec?: string[]; // 3 points defining cutting plane (e.g. ['M', 'N', 'P'])
  gt?: [string[], string[]]; // two planes defining intersection line d
  sph?: boolean; // circumscribed sphere toggle
  hh?: boolean; // height label toggle
  vol?: boolean; // volume & surface area toggle
  me?: Array<{ k: 'len'; a: string; b: string } | { k: 'dist'; p: string; pl: string[] }>;
}

export interface PieChartObj {
  t: 'pie';
  id: number;
  x: number;
  y: number;
  d: [string, number][]; // label and value pairs
}

export interface ProbabilityTreeObj {
  t: 'tree';
  id: number;
  x: number;
  y: number;
  p: [number, number, number]; // [P(A), P(B|A), P(B|A_bar)]
}

export interface VennObj {
  t: 'venn';
  id: number;
  x: number;
  y: number;
  v: [number, number, number, number]; // [only A, only B, A intersect B, outside U]
}

export interface NumberLineObj {
  t: 'nl';
  id: number;
  x: number;
  y: number;
  e: string; // interval set expression, e.g. [-2; 3) U [4; +inf)
}

export interface MeasurementObj {
  t: 'ms';
  id: number;
  mk: 'len' | 'ang' | 'area' | 'per' | 'dist';
  q: number[]; // point ids involved
  sh?: 'pol' | 'cir'; // target shape type if area/per
}

export type CanvasMathObject =
  | PointObj
  | SegmentObj
  | CircleObj
  | PerpendicularBisectorObj
  | PolygonObj
  | PenObj
  | TextObj
  | FunctionObj
  | Solid3DObj
  | PieChartObj
  | ProbabilityTreeObj
  | VennObj
  | NumberLineObj
  | MeasurementObj;

export interface ViewportTransform {
  k: number; // zoom factor (1 = 100%)
  x: number; // translation x in px
  y: number; // translation y in px
}

export interface MathPage {
  name: string;
  O: CanvasMathObject[];
  id: number;
  vw: ViewportTransform;
  H: string[]; // history undo stack
}

export interface MathDocument {
  app: string;
  v: number;
  cur: number;
  pages: {
    name: string;
    id: number;
    O: CanvasMathObject[];
  }[];
}

export type ActiveTool =
  | 'sel' // Select & Drag
  | 'pan' // Pan / View
  | 'pen' // Freehand Pen
  | 'era' // Eraser
  | 'txt' // Formula / Text
  | 'pt' // Point
  | 'seg' // Line segment
  | 'vec' // Vector
  | 'vtri' // Vector sum (triangle)
  | 'vpg' // Vector sum (parallelogram)
  | 'cir' // Circle
  | 'pol' // Polygon
  | 'mid' // Midpoint
  | 'alt' // Altitude foot & line
  | 'perp' // Perpendicular bisector
  | 'bis' // Angle bisector
  | 'cc' // Circumscribed circle
  | 'ic' // Inscribed circle
  | 'gc' // Centroid
  | 'oc' // Orthocenter
  | 'pyr' // Regular pyramid 3D
  | 'free' // Arbitrary pyramid 3D
  | 'prism' // Regular prism 3D
  | 'fprism' // Arbitrary prism 3D
  | 'box' // Cuboid 3D
  | 'fbox' // Oblique box 3D
  | 'fn' // Function plot
  | 'pie' // Pie chart
  | 'tree' // Probability tree
  | 'venn' // Venn diagram
  | 'nl' // Number line
  | 'len' // Length measurement
  | 'ang' // Angle measurement
  | 'area' // Area measurement
  | 'per' // Perimeter measurement
  | 'dist'; // Point-to-line distance
