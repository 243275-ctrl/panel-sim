// Pictorial device artwork v2 — our own drawings (no assets from any product).
// Coordinate contract: wire tabs at (±30, 0), art centred at origin (~76×64 box).
// Material system: shared gradients/filters (identical defs, first-wins) give
// brushed metal, glossy plastic, glass lenses, drop shadows and lamp glow.
// Light direction is top-left everywhere for a consistent studio look.
import type { DeviceType } from "../state/store";

const C = {
  dark: "#3d4852",
  darker: "#2d3339",
  black: "#22262a",
  face: "#f4f6f8",
  white: "#ffffff",
  metal: "#c2c9d0",
  metal2: "#aab4bd",
  red: "#d64545",
  redDark: "#b23434",
  green: "#2f9e5f",
  greenDark: "#227a49",
  amber: "#e8a33d",
  blue: "#2b6cb0",
  copper: "#c98a4b",
  lcd: "#b8c9a8",
  lcdDark: "#0f2417",
  lcdGreen: "#57d98a",
  cyan: "#7fd7ff",
};

/** Shared material defs — every DeviceArt instance embeds the same block;
 * url(#…) resolves to the first copy, all identical, so it stays valid. */
function ArtDefs() {
  return (
    <defs>
      <linearGradient id="ps-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#eef1f4" />
        <stop offset="0.4" stopColor="#cdd4da" />
        <stop offset="0.6" stopColor="#b6bec6" />
        <stop offset="1" stopColor="#98a2ab" />
      </linearGradient>
      <linearGradient id="ps-metal-h" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#9aa4ad" />
        <stop offset="0.5" stopColor="#e6eaee" />
        <stop offset="1" stopColor="#9aa4ad" />
      </linearGradient>
      <linearGradient id="ps-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f2f4f6" />
        <stop offset="0.45" stopColor="#dde3e8" />
        <stop offset="1" stopColor="#c2cad1" />
      </linearGradient>
      <linearGradient id="ps-face" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#e3e8ec" />
      </linearGradient>
      <linearGradient id="ps-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#55616d" />
        <stop offset="0.5" stopColor="#3d4852" />
        <stop offset="1" stopColor="#2d3339" />
      </linearGradient>
      <linearGradient id="ps-red" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ef7a7a" />
        <stop offset="0.45" stopColor="#d64545" />
        <stop offset="1" stopColor="#a82f2f" />
      </linearGradient>
      <linearGradient id="ps-green" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5cc98d" />
        <stop offset="0.45" stopColor="#2f9e5f" />
        <stop offset="1" stopColor="#1f7a49" />
      </linearGradient>
      <linearGradient id="ps-amber" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4c26a" />
        <stop offset="0.45" stopColor="#e8a33d" />
        <stop offset="1" stopColor="#c07d1c" />
      </linearGradient>
      <linearGradient id="ps-blue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5796dd" />
        <stop offset="0.45" stopColor="#2b6cb0" />
        <stop offset="1" stopColor="#1c4f86" />
      </linearGradient>
      <linearGradient id="ps-copper" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e8b57a" />
        <stop offset="0.5" stopColor="#c98a4b" />
        <stop offset="1" stopColor="#a06a35" />
      </linearGradient>
      <radialGradient id="ps-gloss" cx="0.35" cy="0.28" r="0.8">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ps-lcd" cx="0.4" cy="0.35" r="0.9">
        <stop offset="0" stopColor="#dfeccd" />
        <stop offset="1" stopColor="#a8bd92" />
      </radialGradient>
      <radialGradient id="ps-lensG" cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stopColor="#8ee8b5" />
        <stop offset="0.55" stopColor="#2f9e5f" />
        <stop offset="1" stopColor="#186b3f" />
      </radialGradient>
      <radialGradient id="ps-lensA" cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stopColor="#ffd98f" />
        <stop offset="0.55" stopColor="#e8a33d" />
        <stop offset="1" stopColor="#b0741a" />
      </radialGradient>
      <radialGradient id="ps-lensR" cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stopColor="#ffb1a8" />
        <stop offset="0.55" stopColor="#d64545" />
        <stop offset="1" stopColor="#9e2b2b" />
      </radialGradient>
      <filter id="ps-sh" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="1.6" floodColor="#141a22" floodOpacity="0.38" />
      </filter>
      <filter id="ps-sh-s" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#141a22" floodOpacity="0.32" />
      </filter>
      <filter id="ps-glow" x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur stdDeviation="3.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** wire tab: brushed bar + screw head */
function Tab({ dir }: { dir: -1 | 1 }) {
  const x = dir * 30;
  const x2 = dir * 20;
  return (
    <g filter="url(#ps-sh-s)">
      <rect x={Math.min(x, x2)} y={-2.5} width={Math.abs(x - x2)} height={5} rx={1.5} fill="url(#ps-metal-h)" stroke={C.dark} strokeWidth="1.2" />
      <circle cx={dir * 25} cy={0} r={4.4} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.4" />
      <line x1={dir * 25 - 2.6} y1={0} x2={dir * 25 + 2.6} y2={0} stroke={C.dark} strokeWidth="1.5" />
    </g>
  );
}

/** cross-slot screw head */
function Screw({ x, y, r = 4 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.1" />
      <line x1={x - r * 0.62} y1={y} x2={x + r * 0.62} y2={y} stroke={C.dark} strokeWidth="1.3" />
      <line x1={x} y1={y - r * 0.62} x2={x} y2={y + r * 0.62} stroke={C.dark} strokeWidth="1.3" />
      <path d={`M ${x - r * 0.5} ${y - r * 0.55} A ${r * 0.75} ${r * 0.75} 0 0 1 ${x + r * 0.35} ${y - r * 0.65}`} stroke={C.white} strokeWidth="1" fill="none" opacity="0.75" />
    </g>
  );
}

/** enclosure body with bevel + gloss + shadow */
function Box({
  w,
  h,
  fill = "url(#ps-body)",
  r = 4,
  y = 0,
  shadow = true,
}: {
  w: number;
  h: number;
  fill?: string;
  r?: number;
  y?: number;
  shadow?: boolean;
}) {
  return (
    <g filter={shadow ? "url(#ps-sh)" : undefined}>
      <rect x={-w / 2} y={y - h / 2} width={w} height={h} rx={r} fill={fill} stroke={C.dark} strokeWidth="1.6" />
      <path d={`M ${-w / 2 + 3} ${y - h / 2 + 3} L ${w / 2 - 3} ${y - h / 2 + 3}`} stroke={C.white} strokeWidth="1.6" opacity="0.75" />
      <path d={`M ${-w / 2 + 3} ${y + h / 2 - 3} L ${w / 2 - 3} ${y + h / 2 - 3}`} stroke={C.dark} strokeWidth="1.2" opacity="0.35" />
    </g>
  );
}

/** round actuator head: collar + metal bezel + glossy dome */
function Head({
  r = 13,
  grad = "url(#ps-red)",
  collar,
  lit = false,
}: {
  r?: number;
  grad?: string;
  collar?: string;
  lit?: boolean;
}) {
  return (
    <g filter="url(#ps-sh-s)">
      {collar && <circle r={r + 4.5} fill={collar} stroke={C.dark} strokeWidth="1.6" />}
      <circle r={r + (collar ? 0.5 : 2)} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.6" />
      <circle r={r - 2} fill={grad} stroke={C.dark} strokeWidth="1.2" filter={lit ? "url(#ps-glow)" : undefined} />
      <ellipse cx={-r * 0.28} cy={-r * 0.42} rx={r * 0.55} ry={r * 0.34} fill="url(#ps-gloss)" />
      {lit && <circle r={r - 6} fill={C.white} opacity="0.5" />}
    </g>
  );
}

/** pilot-light lens: metal ring + glass dome */
function Lens({ grad, lit }: { grad: string; lit?: boolean }) {
  return (
    <g filter="url(#ps-sh-s)">
      <circle r={13.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.6" />
      <circle r={9.5} fill={grad} stroke={C.dark} strokeWidth="1.2" filter={lit ? "url(#ps-glow)" : undefined} />
      <ellipse cx={-2.6} cy={-3.4} rx={4.6} ry={3} fill={C.white} opacity={lit ? 0.75 : 0.5} />
      {lit && <circle r={4} fill={C.white} opacity="0.85" />}
    </g>
  );
}

function DINSnip() {
  return (
    <g>
      <path d="M -7 20 h 14 v 5 a 2 2 0 0 1 -2 2 h -10 a 2 2 0 0 1 -2 -2 z" fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.1" />
      <line x1={-4} y1={22} x2={4} y2={22} stroke={C.dark} strokeWidth="1" opacity="0.6" />
    </g>
  );
}

function HeatSink({ n = 5, w = 44, h = 54 }: { n?: number; w?: number; h?: number }) {
  const step = w / (n + 1);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <rect x={-w / 2 + step * (i + 1) - 1.4} y={-h / 2 + 4} width={2.8} height={h - 8} fill={C.darker} opacity="0.85" />
          <rect x={-w / 2 + step * (i + 1) + 1.4} y={-h / 2 + 4} width={1.2} height={h - 8} fill={C.white} opacity="0.25" />
        </g>
      ))}
    </g>
  );
}

/** small printed nameplate */
function Nameplate({ x, y, w, text, color = C.dark }: { x: number; y: number; w: number; text: string; color?: string }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 5} width={w} height={10} rx={1.5} fill={C.white} stroke={C.dark} strokeWidth="0.9" />
      <text x={x} y={y + 3} fontSize="6.5" fontWeight="bold" textAnchor="middle" fill={color} fontFamily="monospace">
        {text}
      </text>
    </g>
  );
}

/** vent slots */
function Vents({ x, y, n = 3, w = 10 }: { x: number; y: number; n?: number; w?: number }) {
  return (
    <g stroke={C.dark} strokeWidth="1.2" opacity="0.45">
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={x} y1={y + i * 4} x2={x + w} y2={y + i * 4} />
      ))}
    </g>
  );
}

export interface Readout {
  text: string;
  /** normalized 0..1 deflection for analog faces */
  frac?: number;
}

export function DeviceArt({
  type,
  lit,
  readout,
}: {
  type: DeviceType;
  lit?: boolean;
  readout?: Readout;
}) {
  return (
    <g>
      <ArtDefs />
      <Body type={type} lit={lit} readout={readout} />
    </g>
  );
}

function Body({ type, lit, readout }: { type: DeviceType; lit?: boolean; readout?: Readout }) {
  switch (type) {
    case "source":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-19} y={-17} width={38} height={34} rx={4} fill="url(#ps-dark)" stroke={C.black} strokeWidth="1.5" />
            <rect x={-13} y={-11} width={26} height={13} rx={2} fill="url(#ps-lcd)" stroke={C.black} strokeWidth="1.2" />
            <path d="M -12 -10 L 12 -10 L 8 -4 L -12 -4 Z" fill={C.white} opacity="0.35" />
            <text x={0} y={-1.5} fontSize="8.5" textAnchor="middle" fill={C.darker} fontFamily="monospace" fontWeight="bold">
              24V
            </text>
            <circle cx={-9} cy={11} r={3.2} fill={C.green} stroke={C.black} strokeWidth="1" />
            <circle cx={1} cy={11} r={3.2} fill="url(#ps-metal)" stroke={C.black} strokeWidth="1" />
            <line x1={-1.4} y1={11} x2={3.4} y2={11} stroke={C.dark} strokeWidth="1.2" />
            <text x={11} y={13.5} fontSize="6.5" fill={C.face} fontWeight="bold">DC</text>
            <Vents x={-17} y={-14} n={2} w={6} />
          </g>
        </g>
      );
    case "ac-source":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-19} y={-17} width={38} height={34} rx={4} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.5" />
            <circle r={10} fill={C.white} stroke={C.dark} strokeWidth="1.3" />
            <path d="M -6 0 Q -3 -7 0 0 Q 3 7 6 0" stroke={C.red} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M -9 -9 A 12 12 0 0 1 2 -11" stroke={C.white} strokeWidth="1.6" fill="none" opacity="0.8" />
            <text x={0} y={14.5} fontSize="8" textAnchor="middle" fill={C.dark} fontWeight="bold">~</text>
            <Screw x={-13} y={12} r={2.6} />
            <Screw x={13} y={12} r={2.6} />
          </g>
        </g>
      );
    case "ground":
      return (
        <g>
          <line x1={-30} y1={0} x2={-13} y2={-4} stroke="url(#ps-metal-h)" strokeWidth="3.2" strokeLinecap="round" />
          <line x1={30} y1={0} x2={13} y2={-4} stroke="url(#ps-metal-h)" strokeWidth="3.2" strokeLinecap="round" />
          <line x1={0} y1={-26} x2={0} y2={-5} stroke="url(#ps-metal-h)" strokeWidth="3.4" />
          <circle cx={0} cy={-26} r={4} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.3" />
          <line x1={-16} y1={-5} x2={16} y2={-5} stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
          <line x1={-10} y1={4} x2={10} y2={4} stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
          <line x1={-4} y1={13} x2={4} y2={13} stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
          <path d="M -16 -7.5 L 16 -7.5" stroke={C.white} strokeWidth="1" opacity="0.35" />
        </g>
      );
    case "transformer-1p":
    case "transformer-3p": {
      const three = type === "transformer-3p";
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-21} y={-21} width={17} height={42} rx={2.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.6" />
            <rect x={4} y={-21} width={17} height={42} rx={2.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.6" />
            <rect x={-21} y={-7} width={42} height={14} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.4" />
            {[-15, -9, 9, 15].map((x) => (
              <path key={x} d={`M ${x} -19 q 5.5 4.5 0 9 q -5.5 4.5 0 9`} stroke="url(#ps-copper)" strokeWidth="2.4" fill="none" />
            ))}
            {[-15, -9, 9, 15].map((x) => (
              <path key={`h${x}`} d={`M ${x} -19 q 5.5 4.5 0 9`} stroke={C.white} strokeWidth="0.8" fill="none" opacity="0.4" />
            ))}
            <Nameplate x={0} y={15} w={26} text={three ? "3φ TX" : "TX"} />
          </g>
        </g>
      );
    }
    case "battery":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-21} y={-15} width={42} height={30} rx={3.5} fill="url(#ps-dark)" stroke={C.black} strokeWidth="1.5" />
            <rect x={-15} y={-19} width={9} height={5.5} rx={1.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1" />
            <rect x={6} y={-19} width={9} height={5.5} rx={1.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1" />
            <rect x={-16} y={-9} width={32} height={7} rx={1.5} fill="#1c3d2a" stroke={C.black} strokeWidth="1" />
            <rect x={-15} y={-8} width={14} height={5} rx={1} fill={C.green} opacity="0.85" />
            <text x={-9} y={9} fontSize="11" fontWeight="bold" fill={C.green} textAnchor="middle">+</text>
            <text x={9} y={10.5} fontSize="13" fill={C.face} textAnchor="middle">−</text>
            <path d="M -20 -12 L 20 -12" stroke={C.white} strokeWidth="1.2" opacity="0.28" />
          </g>
        </g>
      );
    case "generator":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-25} y={-15} width={35} height={28} rx={3} fill="url(#ps-blue)" stroke={C.darker} strokeWidth="1.5" />
            <circle cx={15} cy={0} r={11.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.5" />
            <circle cx={15} cy={0} r={6} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.2" />
            <path d="M 15 -9 L 15 9 M 7 -5 L 23 5 M 7 5 L 23 -5" stroke={C.dark} strokeWidth="1.4" />
            <rect x={-21} y={-11} width={14} height={8} rx={1.5} fill={C.face} stroke={C.dark} strokeWidth="1" />
            <text x={-14} y={-4.5} fontSize="5.5" textAnchor="middle" fill={C.dark} fontWeight="bold">GEN</text>
            <Vents x={-22} y={0} n={3} w={9} />
          </g>
        </g>
      );

    case "button":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-15} y={-6} width={30} height={26} rx={3.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.6" />
            <path d="M -12 -3 L 12 -3" stroke={C.white} strokeWidth="1.4" opacity="0.7" />
          </g>
          <g transform="translate(0,-6)">
            <Head r={13.5} grad="url(#ps-green)" />
          </g>
          <DINSnip />
        </g>
      );
    case "button-nc":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-15} y={-6} width={30} height={26} rx={3.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.6" />
            <path d="M -12 -3 L 12 -3" stroke={C.white} strokeWidth="1.4" opacity="0.7" />
          </g>
          <g transform="translate(0,-6)">
            <Head r={13.5} grad="url(#ps-red)" />
          </g>
          <DINSnip />
        </g>
      );
    case "estop":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-16} y={-4} width={32} height={24} rx={3.5} fill="url(#ps-amber)" stroke={C.dark} strokeWidth="1.6" />
            <path d="M -13 -1 L 13 -1" stroke={C.white} strokeWidth="1.5" opacity="0.55" />
            <rect x={-13} y={8} width={26} height={10} rx={2} fill={C.white} stroke={C.dark} strokeWidth="1.1" />
            <text x={0} y={15.5} fontSize="7" fontWeight="bold" textAnchor="middle" fill={C.redDark}>STOP</text>
          </g>
          <g transform="translate(0,-8)">
            <Head r={15} grad="url(#ps-red)" collar="url(#ps-amber)" />
          </g>
        </g>
      );
    case "selector":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-15} y={-6} width={30} height={26} rx={3.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.6" />
          </g>
          <g transform="translate(0,-6)">
            <circle r={13.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.6" />
            <circle r={10.5} fill={C.face} stroke={C.dark} strokeWidth="1" />
            {[-50, 0, 50].map((a) => (
              <circle key={a} cx={Math.sin((a * Math.PI) / 180) * 8} cy={-Math.cos((a * Math.PI) / 180) * 8} r={1.4} fill={C.dark} />
            ))}
            <rect x={-3.2} y={-11} width={6.4} height={15} rx={3} fill="url(#ps-dark)" transform="rotate(-32)" filter="url(#ps-sh-s)" />
            <ellipse cx={-1.5} cy={-7} rx={2} ry={3.5} fill={C.white} opacity="0.35" transform="rotate(-32)" />
            <circle r={3} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1" />
          </g>
          <DINSnip />
        </g>
      );
    case "switch-2way":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={27} h={36} />
          <rect x={-6} y={-14} width={12} height={18} rx={2.5} fill={C.darker} stroke={C.black} strokeWidth="1.1" />
          <rect x={-6} y={-14} width={12} height={7} rx={2.5} fill="url(#ps-dark)" />
          <rect x={-2.5} y={-12} width={5} height={11} rx={2} fill="url(#ps-metal-h)" />
          <Screw x={-7.5} y={13} r={3} />
          <Screw x={7.5} y={13} r={3} />
        </g>
      );
    case "keyswitch":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-14} y={-6} width={28} height={26} rx={3.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.6" />
          </g>
          <g transform="translate(0,-5)">
            <circle r={12.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.6" />
            <circle r={8} fill={C.darker} stroke={C.black} strokeWidth="1.2" />
            <rect x={-1.6} y={-9.5} width={3.2} height={11} rx={1.5} fill="url(#ps-metal-h)" stroke={C.dark} strokeWidth="0.8" />
            <circle r={3.4} fill={C.black} />
            <rect x={-1} y={-8.5} width={2} height={6} fill={C.white} opacity="0.5" />
          </g>
          <DINSnip />
        </g>
      );

    case "lamp":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g transform="translate(0,-5)">
            <Lens grad="url(#ps-lensG)" lit={lit} />
          </g>
          <g filter="url(#ps-sh)">
            <rect x={-10} y={7} width={20} height={15} rx={2.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.4" />
            <path d="M -7 9.5 L 7 9.5" stroke={C.white} strokeWidth="1.3" opacity="0.75" />
            <rect x={-7} y={13} width={14} height={6.5} rx={1.5} fill={C.white} stroke={C.dark} strokeWidth="0.9" />
            <text x={0} y={18} fontSize="5.5" textAnchor="middle" fill={C.dark} fontWeight="bold">24V</text>
          </g>
        </g>
      );
    case "lamp-amber":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g transform="translate(0,-5)">
            <Lens grad="url(#ps-lensA)" lit={lit} />
          </g>
          <g filter="url(#ps-sh)">
            <rect x={-10} y={7} width={20} height={15} rx={2.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.4" />
            <path d="M -7 9.5 L 7 9.5" stroke={C.white} strokeWidth="1.3" opacity="0.75" />
            <rect x={-7} y={13} width={14} height={6.5} rx={1.5} fill={C.white} stroke={C.dark} strokeWidth="0.9" />
            <text x={0} y={18} fontSize="5.5" textAnchor="middle" fill={C.dark} fontWeight="bold">24V</text>
          </g>
        </g>
      );
    case "buzzer":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <circle r={14.5} fill="url(#ps-dark)" stroke={C.black} strokeWidth="1.6" />
            <circle r={14.5} fill="url(#ps-gloss)" opacity="0.5" />
            {[0, 1, 2, 3, 4].map((i) => {
              const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
              return <circle key={i} cx={Math.cos(a) * 8} cy={Math.sin(a) * 8} r={2.2} fill={C.black} stroke={C.metal2} strokeWidth="0.7" />;
            })}
            <circle r={3.2} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1" />
          </g>
          {lit && (
            <g stroke={C.amber} strokeWidth="1.8" fill="none" opacity="0.95">
              <path d="M 17 -7 q 6 7 0 14" />
              <path d="M 22 -11 q 9 11 0 22" opacity="0.6" />
            </g>
          )}
        </g>
      );
    case "beacon":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-4.5} y={4} width={9} height={15} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.2" />
            <rect x={-13} y={17} width={26} height={7} rx={2.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.4" />
            <path d="M -10 19.5 L 10 19.5" stroke={C.white} strokeWidth="1.2" opacity="0.75" />
            <rect x={-9.5} y={-24} width={19} height={10.5} rx={4} fill="url(#ps-lensR)" stroke={C.dark} strokeWidth="1.3" filter={lit ? "url(#ps-glow)" : undefined} />
            <rect x={-9.5} y={-12.5} width={19} height={10.5} rx={4} fill="url(#ps-lensA)" stroke={C.dark} strokeWidth="1.3" />
            <rect x={-9.5} y={-1} width={19} height={8} rx={3} fill="url(#ps-lensG)" stroke={C.dark} strokeWidth="1.3" />
            <ellipse cx={-4} cy={-21} rx={3.5} ry={2} fill={C.white} opacity="0.6" />
          </g>
        </g>
      );

    case "contactor":
    case "contactor-rev": {
      const rev = type === "contactor-rev";
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-21} y={-25} width={42} height={50} rx={4} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.7" />
            <path d="M -18 -22 L 18 -22" stroke={C.white} strokeWidth="1.6" opacity="0.8" />
            {/* top terminal bank */}
            <rect x={-17} y={-23} width={34} height={13} rx={2} fill="url(#ps-face)" stroke={C.dark} strokeWidth="1.2" />
            {[-11.5, 0, 11.5].map((x) => (
              <Screw key={x} x={x} y={-16.5} r={3.4} />
            ))}
            {/* coil window */}
            <rect x={-12} y={-6} width={24} height={11} rx={2} fill={C.darker} stroke={C.black} strokeWidth="1.2" />
            <rect x={-12} y={-6} width={24} height={4.5} rx={2} fill="url(#ps-dark)" />
            <rect x={-9} y={-3} width={18} height={5.5} rx={1} fill={rev ? C.red : "#e8eef2"} stroke={C.dark} strokeWidth="0.9" />
            <text x={0} y={1.2} fontSize="5.5" fontWeight="bold" textAnchor="middle" fill={C.darker}>
              {rev ? "REV" : "KM"}
            </text>
            {/* bottom terminal bank */}
            <rect x={-17} y={9} width={34} height={13} rx={2} fill="url(#ps-face)" stroke={C.dark} strokeWidth="1.2" />
            {[-11.5, 0, 11.5].map((x) => (
              <Screw key={x} x={x} y={15.5} r={3.4} />
            ))}
            <Vents x={-19} y={-2} n={3} w={4} />
            <Vents x={15} y={-2} n={3} w={4} />
          </g>
          <DINSnip />
        </g>
      );
    }
    case "relay":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-17} y={-21} width={34} height={42} rx={3.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.6" />
            {/* glass cover */}
            <rect x={-12} y={-16} width={24} height={22} rx={2.5} fill="#dcebf5" opacity="0.75" stroke={C.dark} strokeWidth="1.2" />
            <path d="M -10 -14 L 6 -14 L 2 -8 L -10 -8 Z" fill={C.white} opacity="0.55" />
            {/* coil + contacts inside */}
            <rect x={-8} y={-9} width={8} height={13} rx={1.5} fill="url(#ps-copper)" stroke={C.dark} strokeWidth="0.9" />
            {[0, 1, 2].map((i) => (
              <line key={i} x1={-8} y1={-7 + i * 4} x2={0} y2={-7 + i * 4} stroke={C.darker} strokeWidth="0.8" opacity="0.7" />
            ))}
            <line x1={4} y1={-4} x2={10} y2={-10} stroke={C.dark} strokeWidth="1.6" />
            <circle cx={4} cy={-4} r={1.6} fill={C.darker} />
            <circle cx={10} cy={-10} r={1.6} fill={C.darker} />
            <rect x={-12} y={9} width={24} height={7} rx={1.5} fill={C.white} stroke={C.dark} strokeWidth="1" />
            <text x={0} y={14.5} fontSize="6" textAnchor="middle" fill={C.dark} fontWeight="bold" fontFamily="monospace">24VDC</text>
            <circle cx={11} cy={-13} r={2} fill={lit ? C.green : C.metal2} stroke={C.dark} strokeWidth="0.8" />
          </g>
        </g>
      );
    case "aux-no":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={36} h={32} />
          <circle cx={-10} cy={5} r={2.8} fill={C.darker} />
          <circle cx={10} cy={5} r={2.8} fill={C.darker} />
          <line x1={-10} y1={5} x2={11} y2={-6} stroke="url(#ps-metal-h)" strokeWidth="3" strokeLinecap="round" />
          <line x1={-10} y1={5} x2={11} y2={-6} stroke={C.dark} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <Nameplate x={0} y={-9} w={20} text="NO" />
        </g>
      );
    case "aux-nc":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={36} h={32} />
          <circle cx={-10} cy={1} r={2.8} fill={C.darker} />
          <circle cx={10} cy={1} r={2.8} fill={C.darker} />
          <line x1={-10} y1={1} x2={10} y2={1} stroke="url(#ps-metal-h)" strokeWidth="3" strokeLinecap="round" />
          <line x1={-10} y1={1} x2={10} y2={1} stroke={C.dark} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <line x1={-10} y1={-8} x2={10} y2={-8} stroke={C.dark} strokeWidth="1.6" opacity="0.55" />
          <Nameplate x={0} y={-12} w={20} text="NC" />
        </g>
      );
    case "changeover":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={38} h={34} />
          <circle cx={-11} cy={6} r={2.8} fill={C.darker} />
          <circle cx={11} cy={-5} r={2.8} fill={C.darker} />
          <circle cx={11} cy={8} r={2.8} fill={C.darker} />
          <line x1={-11} y1={6} x2={10} y2={-4} stroke="url(#ps-metal-h)" strokeWidth="2.6" strokeLinecap="round" />
          <Nameplate x={0} y={-11} w={26} text="SPDT" />
        </g>
      );
    case "fuse":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh-s)">
            <rect x={-19} y={-8.5} width={38} height={17} rx={8.5} fill="#e9f1f5" stroke={C.dark} strokeWidth="1.5" />
            <rect x={-19} y={-8.5} width={8} height={17} rx={4} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.3" />
            <rect x={11} y={-8.5} width={8} height={17} rx={4} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.3" />
            <path d="M -11 0 h 6 l 2 -4 l 4 8 l 2 -4 h 6" stroke={C.red} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M -8 -6 L 14 -6" stroke={C.white} strokeWidth="1.6" opacity="0.8" />
          </g>
          <text x={0} y={17} fontSize="6.5" textAnchor="middle" fill={C.dark} fontWeight="bold">FUSE</text>
        </g>
      );
    case "breaker-1p":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-12} y={-23} width={24} height={46} rx={2.5} fill="url(#ps-face)" stroke={C.dark} strokeWidth="1.6" />
            <rect x={-12} y={-23} width={24} height={4} rx={2} fill={C.white} opacity="0.8" />
            {/* recessed toggle */}
            <rect x={-7} y={-17} width={14} height={16} rx={2.5} fill={C.darker} stroke={C.black} strokeWidth="1.2" />
            <rect x={-5} y={-14} width={10} height={9} rx={2} fill="url(#ps-red)" stroke={C.black} strokeWidth="1" />
            <path d="M -4 -13 L 4 -13" stroke={C.white} strokeWidth="1.2" opacity="0.6" />
            <Screw x={0} y={6} r={3.8} />
            <Nameplate x={0} y={17} w={16} text="C16" />
            <rect x={-12} y={-27} width={24} height={5} rx={1.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.2" />
          </g>
          <DINSnip />
        </g>
      );
    case "breaker-3p":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-25} y={-21} width={50} height={42} rx={3} fill="url(#ps-face)" stroke={C.dark} strokeWidth="1.7" />
            <path d="M -22 -18 L 22 -18" stroke={C.white} strokeWidth="1.5" opacity="0.8" />
            {[-16, 0, 16].map((x) => (
              <g key={x}>
                <rect x={x - 6.5} y={-15} width={13} height={14} rx={2.5} fill={C.darker} stroke={C.black} strokeWidth="1.1" />
                <rect x={x - 4.5} y={-12} width={9} height={8} rx={1.5} fill="url(#ps-red)" stroke={C.black} strokeWidth="0.9" />
                <Screw x={x} y={8} r={3.2} />
              </g>
            ))}
            <rect x={-25} y={-25} width={50} height={5} rx={1.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.2" />
            <Nameplate x={0} y={16.5} w={30} text="C63 · 3P" />
          </g>
          <DINSnip />
        </g>
      );
    case "mccb":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={46} h={48} fill="url(#ps-face)" />
          <rect x={-11} y={-19} width={22} height={17} rx={2.5} fill={C.darker} stroke={C.black} strokeWidth="1.2" />
          <rect x={-8} y={-16} width={16} height={10} rx={2} fill="url(#ps-red)" stroke={C.black} strokeWidth="1" />
          <path d="M -6 -14.5 L 6 -14.5" stroke={C.white} strokeWidth="1.2" opacity="0.6" />
          <g transform="translate(-12,9)">
            <circle r={6} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.3" />
            <line x1={0} y1={0} x2={0} y2={-4.5} stroke={C.redDark} strokeWidth="2" />
            <circle r={1.6} fill={C.darker} />
          </g>
          <text x={9} y={13} fontSize="8" fontWeight="bold" fill={C.dark}>In</text>
          <Screw x={17} y={17} r={3.4} />
          <Screw x={-17} y={17} r={3.4} />
          <Vents x={-21} y={-4} n={4} w={5} />
        </g>
      );
    case "overload":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={38} h={44} fill="url(#ps-face)" />
          <g transform="translate(0,-9)">
            <circle r={10} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.4" />
            <circle r={10} fill="url(#ps-gloss)" opacity="0.55" />
            <line x1={0} y1={0} x2={5.5} y2={-5.5} stroke={C.red} strokeWidth="2.2" strokeLinecap="round" />
            <circle r={2} fill={C.darker} />
          </g>
          <Nameplate x={0} y={4.5} w={30} text="FR · 0.4–0.63A" />
          <g transform="translate(0,14)">
            <rect x={-9} y={-4.5} width={18} height={9} rx={4.5} fill="url(#ps-red)" stroke={C.dark} strokeWidth="1.2" />
            <ellipse cx={-3} cy={-2} rx={3.5} ry={1.6} fill={C.white} opacity="0.55" />
            <text x={0} y={12} fontSize="5.5" textAnchor="middle" fill={C.dark} fontWeight="bold">RESET</text>
          </g>
        </g>
      );
    case "surge":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={26} h={42} fill="url(#ps-face)" />
          <rect x={-8} y={-15} width={16} height={20} rx={2.5} fill="url(#ps-dark)" stroke={C.black} strokeWidth="1.2" />
          <path d="M 1.5 -11 l -5.5 8 h 5.5 l -5.5 8" stroke={C.amber} strokeWidth="2" fill="none" strokeLinejoin="round" />
          <circle cx={0} cy={-18.5} r={2.4} fill={C.green} stroke={C.dark} strokeWidth="0.9" />
          <Nameplate x={0} y={14} w={20} text="SPD" />
          <DINSnip />
        </g>
      );
    case "rccb":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={46} h={44} fill="url(#ps-face)" />
          <rect x={-17} y={-15} width={19} height={17} rx={2.5} fill={C.darker} stroke={C.black} strokeWidth="1.2" />
          <rect x={-14} y={-12} width={13} height={10} rx={1.5} fill="url(#ps-green)" stroke={C.black} strokeWidth="0.9" />
          <path d="M -13 -10.5 L -2 -10.5" stroke={C.white} strokeWidth="1.1" opacity="0.6" />
          <g transform="translate(14,-6.5)">
            <rect x={-6.5} y={-8.5} width={13} height={17} rx={7} fill="url(#ps-amber)" stroke={C.dark} strokeWidth="1.3" />
            <ellipse cx={-2} cy={-4} rx={3} ry={4} fill={C.white} opacity="0.5" />
            <text x={0} y={3} fontSize="5.5" fontWeight="bold" textAnchor="middle" fill={C.darker}>T</text>
          </g>
          <Nameplate x={0} y={12} w={26} text="30mA" />
          <Screw x={-13} y={18} r={3.2} />
          <Screw x={13} y={18} r={3.2} />
          <DINSnip />
        </g>
      );

    case "resistor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh-s)">
            <rect x={-17} y={-7.5} width={34} height={15} rx={7.5} fill="#efe3cd" stroke={C.dark} strokeWidth="1.5" />
            <path d="M -13 -5 L 13 -5" stroke={C.white} strokeWidth="1.6" opacity="0.85" />
            {[["#b23434", -9.5], ["#c98a4b", -3.5], ["#3d4852", 3], ["#e8a33d", 9]].map(([col, x]) => (
              <rect key={x as number} x={x as number} y={-7.5} width={3.4} height={15} fill={col as string} opacity={0.95} />
            ))}
            <rect x={-20} y={-6} width={5} height={12} rx={2} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.2" />
            <rect x={15} y={-6} width={5} height={12} rx={2} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.2" />
          </g>
        </g>
      );
    case "capacitor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <line x1={-23} y1={0} x2={-6} y2={0} stroke="url(#ps-metal-h)" strokeWidth="2.8" />
          <line x1={6} y1={0} x2={23} y2={0} stroke="url(#ps-metal-h)" strokeWidth="2.8" />
          <g filter="url(#ps-sh-s)">
            <rect x={-6.5} y={-17} width={6} height={34} rx={2} fill="url(#ps-blue)" stroke={C.dark} strokeWidth="1.3" />
            <rect x={0.5} y={-17} width={6} height={34} rx={2} fill="url(#ps-blue)" stroke={C.dark} strokeWidth="1.3" />
            <path d="M -5 -14 L -1 -14" stroke={C.white} strokeWidth="1.2" opacity="0.55" />
            <path d="M 1.5 -14 L 5.5 -14" stroke={C.white} strokeWidth="1.2" opacity="0.55" />
          </g>
          <text x={0} y={-21} fontSize="7.5" textAnchor="middle" fill={C.dark} fontWeight="bold">µF</text>
        </g>
      );
    case "inductor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <line x1={-23} y1={0} x2={-15} y2={0} stroke="url(#ps-metal-h)" strokeWidth="2.8" />
          <line x1={15} y1={0} x2={23} y2={0} stroke="url(#ps-metal-h)" strokeWidth="2.8" />
          <rect x={-16} y={5} width={32} height={8} rx={1.5} fill="url(#ps-dark)" stroke={C.dark} strokeWidth="1.2" />
          <path d="M -15 0 a 5 5 0 0 1 10 0 a 5 5 0 0 1 10 0 a 5 5 0 0 1 10 0" stroke="url(#ps-copper)" strokeWidth="3.6" fill="none" strokeLinecap="round" />
          <path d="M -15 -1 a 5 5 0 0 1 10 0" stroke={C.white} strokeWidth="1" fill="none" opacity="0.45" />
        </g>
      );
    case "potentiometer":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh-s)">
            <rect x={-17} y={-5} width={34} height={21} rx={3} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.5" />
            <path d="M -14 -2 L 14 -2" stroke={C.white} strokeWidth="1.4" opacity="0.7" />
            <line x1={-13} y1={6} x2={13} y2={6} stroke={C.dark} strokeWidth="1.2" opacity="0.5" />
          </g>
          <g transform="translate(0,-12)">
            <circle r={12} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.6" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI * 2) / 12;
              return <line key={i} x1={Math.cos(a) * 9.5} y1={Math.sin(a) * 9.5} x2={Math.cos(a) * 11.5} y2={Math.sin(a) * 11.5} stroke={C.dark} strokeWidth="1.1" opacity="0.65" />;
            })}
            <circle r={7} fill={C.face} stroke={C.dark} strokeWidth="1.1" />
            <line x1={0} y1={-1} x2={5.5} y2={-7} stroke={C.red} strokeWidth="2.4" strokeLinecap="round" />
            <circle r={1.8} fill={C.darker} />
          </g>
        </g>
      );
    case "thermistor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <path d="M -21 0 h 8 l 3.5 -9 l 6.5 18 l 6.5 -18 l 3.5 9 h 8" stroke={C.dark} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <g transform="translate(0,-15)" filter="url(#ps-sh-s)">
            <circle r={6} fill="url(#ps-lensR)" stroke={C.dark} strokeWidth="1.3" />
            <ellipse cx={-1.8} cy={-2} rx={2.4} ry={1.6} fill={C.white} opacity="0.65" />
          </g>
          <Nameplate x={0} y={16} w={22} text="NTC" />
        </g>
      );

    case "motor":
    case "motor-1ph":
    case "motor-dc": {
      const dc = type === "motor-dc";
      const one = type === "motor-1ph";
      const shell = dc ? "url(#ps-dark)" : "url(#ps-blue)";
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          {/* terminal box */}
          <g filter="url(#ps-sh-s)">
            <rect x={-15} y={-31} width={17} height={13} rx={2.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.5" />
            <path d="M -12.5 -29 L -1 -29" stroke={C.white} strokeWidth="1.3" opacity="0.8" />
            <Screw x={-11} y={-25} r={2.6} />
            <Screw x={-3} y={-25} r={2.6} />
            {one && (
              <g>
                <rect x={-6} y={-40} width={12} height={10} rx={5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.3" />
                <path d="M -4 -37 L 4 -37" stroke={C.white} strokeWidth="1.1" opacity="0.7" />
              </g>
            )}
          </g>
          {/* body */}
          <g filter="url(#ps-sh)">
            <path d="M -21 -14 a 21 21 0 0 1 42 0 v 17 h -42 z" fill={shell} stroke={C.darker} strokeWidth="1.7" />
            <path d="M -21 -14 a 21 21 0 0 1 42 0" fill="none" stroke={C.white} strokeWidth="1.8" opacity="0.4" />
            {[0, 1, 2, 3, 4].map((i) => {
              const x = -14 + i * 7;
              return (
                <g key={i}>
                  <line x1={x} y1={-11} x2={x} y2={1} stroke={C.darker} strokeWidth="1.6" opacity="0.75" />
                  <line x1={x + 1.6} y1={-11} x2={x + 1.6} y2={1} stroke={C.white} strokeWidth="0.8" opacity="0.3" />
                </g>
              );
            })}
            <rect x={-25} y={3} width={50} height={7} rx={2} fill={shell} stroke={C.darker} strokeWidth="1.5" />
            <path d="M -23 4.5 L 23 4.5" stroke={C.white} strokeWidth="1.1" opacity="0.35" />
          </g>
          {/* feet */}
          <rect x={-23} y={10} width={10} height={8} fill="url(#ps-dark)" stroke={C.darker} strokeWidth="1.3" />
          <rect x={13} y={10} width={10} height={8} fill="url(#ps-dark)" stroke={C.darker} strokeWidth="1.3" />
          {/* shaft + fan cover */}
          <rect x={21} y={-7} width={11} height={5} rx={2.5} fill="url(#ps-metal-h)" stroke={C.dark} strokeWidth="1.2" />
          <path d="M 21 -6.2 L 31 -6.2" stroke={C.white} strokeWidth="1" opacity="0.8" />
          <circle cx={-27} cy={-3} r={9} fill="url(#ps-body)" stroke={C.darker} strokeWidth="1.5" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={-33} y1={-7 + i * 2.7} x2={-21} y2={-7 + i * 2.7} stroke={C.dark} strokeWidth="1.1" opacity="0.55" />
          ))}
          {/* label */}
          <rect x={-9} y={-13} width={19} height={9} rx={1.5} fill={C.white} stroke={C.dark} strokeWidth="1" />
          <text x={0.5} y={-6} fontSize="6.5" fontWeight="bold" textAnchor="middle" fill={C.darker}>
            {dc ? "DC" : one ? "1φ" : "3~"}
          </text>
        </g>
      );
    }

    case "vfd":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-23} y={-28} width={46} height={56} rx={4} fill="url(#ps-dark)" stroke={C.black} strokeWidth="1.7" />
            <path d="M -20 -25 L 20 -25" stroke={C.white} strokeWidth="1.5" opacity="0.3" />
            {/* LCD */}
            <rect x={-17} y={-22} width={34} height={15} rx={2.5} fill={C.lcdDark} stroke={C.black} strokeWidth="1.3" />
            <rect x={-17} y={-22} width={34} height={6} rx={2.5} fill={C.white} opacity="0.12" />
            <text x={0} y={-11.5} fontSize="9" textAnchor="middle" fill={C.lcdGreen} fontFamily="monospace" fontWeight="bold">50.0</text>
            {/* keypad */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const x = -16 + (i % 4) * 9.5;
              const y = -3 + Math.floor(i / 4) * 9;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={7.5} height={6.5} rx={1.8} fill="url(#ps-body)" stroke={C.black} strokeWidth="0.9" />
                  <path d={`M ${x + 1.2} ${y + 1.4} L ${x + 6.3} ${y + 1.4}`} stroke={C.white} strokeWidth="1" opacity="0.8" />
                </g>
              );
            })}
            {/* run/stop */}
            <rect x={-17} y={17} width={15} height={8} rx={2.5} fill="url(#ps-green)" stroke={C.black} strokeWidth="1.1" />
            <ellipse cx={-11} cy={19.5} rx={4} ry={1.8} fill={C.white} opacity="0.5" />
            <rect x={2} y={17} width={15} height={8} rx={2.5} fill="url(#ps-red)" stroke={C.black} strokeWidth="1.1" />
            <ellipse cx={8} cy={19.5} rx={4} ry={1.8} fill={C.white} opacity="0.5" />
            <Vents x={-21} y={-6} n={4} w={4} />
            <Vents x={17} y={-6} n={4} w={4} />
          </g>
          <HeatSink n={5} w={46} h={56} />
        </g>
      );
    case "servo-drive":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-22} y={-28} width={44} height={56} rx={4} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.7" />
            <path d="M -19 -25 L 19 -25" stroke={C.white} strokeWidth="1.6" opacity="0.85" />
            <rect x={-15} y={-22} width={30} height={13} rx={2.5} fill="#101c26" stroke={C.black} strokeWidth="1.3" />
            <text x={0} y={-12.5} fontSize="7.5" textAnchor="middle" fill={C.cyan} fontFamily="monospace" fontWeight="bold"> axis</text>
            <g transform="translate(0,2)">
              <circle r={8} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.4" />
              {Array.from({ length: 10 }, (_, i) => {
                const a = (i * Math.PI * 2) / 10;
                return <line key={i} x1={Math.cos(a) * 6} y1={Math.sin(a) * 6} x2={Math.cos(a) * 7.6} y2={Math.sin(a) * 7.6} stroke={C.dark} strokeWidth="1" opacity="0.6" />;
              })}
              <circle r={4.5} fill={C.face} stroke={C.dark} strokeWidth="1" />
              <rect x={-1.4} y={-5.5} width={2.8} height={7} rx={1.2} fill={C.darker} />
            </g>
            <circle cx={-11} cy={18} r={3.6} fill={C.green} stroke={C.dark} strokeWidth="1" />
            <circle cx={0} cy={18} r={3.6} fill="url(#ps-amber)" stroke={C.dark} strokeWidth="1" />
            <circle cx={11} cy={18} r={3.6} fill="url(#ps-red)" stroke={C.dark} strokeWidth="1" />
            <ellipse cx={-12} cy={16.8} rx={1.6} ry={1} fill={C.white} opacity="0.6" />
          </g>
        </g>
      );

    case "multimeter":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-21} y={-28} width={42} height={56} rx={6} fill="url(#ps-dark)" stroke={C.black} strokeWidth="1.7" />
            <path d="M -18 -25 L 18 -25" stroke={C.white} strokeWidth="1.5" opacity="0.28" />
            <rect x={-15} y={-22} width={30} height={15} rx={2.5} fill="url(#ps-lcd)" stroke={C.black} strokeWidth="1.3" />
            <path d="M -14 -21 L 14 -21 L 10 -15 L -14 -15 Z" fill={C.white} opacity="0.4" />
            <text x={0} y={-11} fontSize="9" textAnchor="middle" fill={C.darker} fontFamily="monospace" fontWeight="bold">
              {readout ? readout.text : "000.0"}
            </text>
            <g transform="translate(0,4)">
              <circle r={11} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.5" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * Math.PI * 2) / 12;
                return <line key={i} x1={Math.cos(a) * 8.5} y1={Math.sin(a) * 8.5} x2={Math.cos(a) * 10.5} y2={Math.sin(a) * 10.5} stroke={C.dark} strokeWidth="1.1" opacity="0.7" />;
              })}
              <circle r={6.5} fill={C.face} stroke={C.dark} strokeWidth="1.1" />
              <line x1={0} y1={0} x2={6} y2={-6.5} stroke={C.red} strokeWidth="2.4" strokeLinecap="round" />
              <circle r={2} fill={C.darker} />
            </g>
            <g>
              <circle cx={-10} cy={21} r={4} fill={C.black} stroke={C.metal2} strokeWidth="1.4" />
              <circle cx={10} cy={21} r={4} fill="url(#ps-red)" stroke={C.metal2} strokeWidth="1.4" />
              <circle cx={-10} cy={21} r={1.6} fill={C.darker} />
            </g>
          </g>
        </g>
      );
    case "clamp":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            {/* jaw */}
            <path d="M -11 -8 a 13 13 0 1 1 22 9" stroke="url(#ps-metal)" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M -11 -8 a 13 13 0 1 1 22 9" stroke={C.dark} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />
            <path d="M -8 -10 a 10 10 0 0 1 14 4" stroke={C.white} strokeWidth="1.6" fill="none" opacity="0.6" />
            {/* body */}
            <rect x={-15} y={-4} width={30} height={36} rx={5} fill="url(#ps-dark)" stroke={C.black} strokeWidth="1.6" />
            <rect x={-10} y={2} width={20} height={11} rx={2} fill="url(#ps-lcd)" stroke={C.black} strokeWidth="1.2" />
            <text x={0} y={10.5} fontSize="7.5" textAnchor="middle" fill={C.darker} fontFamily="monospace" fontWeight="bold">
              {readout ? readout.text : "12.4A"}
            </text>
            <circle cx={-7} cy={23} r={3.6} fill="url(#ps-body)" stroke={C.black} strokeWidth="1" />
            <circle cx={6} cy={23} r={3.6} fill="url(#ps-body)" stroke={C.black} strokeWidth="1" />
            <path d="M -12 -1 L 12 -1" stroke={C.white} strokeWidth="1.2" opacity="0.25" />
          </g>
        </g>
      );
    case "voltmeter":
    case "ammeter": {
      const isV = type === "voltmeter";
      const t = Math.min(1, Math.max(0, readout?.frac ?? 0));
      const a = ((-140 + t * 280) * Math.PI) / 180;
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
          <circle r={19.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="2" />
          <circle r={16} fill="#f7f9fa" stroke={C.darker} strokeWidth="1.2" />
          <circle r={16} fill="url(#ps-gloss)" opacity="0.45" />
          {Array.from({ length: 9 }, (_, i) => {
            const ang = (-140 + i * 35) * (Math.PI / 180);
            const major = i % 4 === 0;
            return (
              <line
                key={i}
                x1={Math.cos(ang) * (major ? 10.5 : 12)}
                y1={Math.sin(ang) * (major ? 10.5 : 12)}
                x2={Math.cos(ang) * 14}
                y2={Math.sin(ang) * 14}
                stroke={C.dark}
                strokeWidth={major ? 1.8 : 1.1}
              />
            );
          })}
          <line
            x1={Math.cos(a) * 3.5}
            y1={Math.sin(a) * 3.5}
            x2={Math.cos(a) * 14.5}
            y2={Math.sin(a) * 14.5}
            stroke={C.red}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <circle r={2.6} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.1" />
          <circle r={1} fill={C.darker} />
          <text x={0} y={11.5} fontSize="7" fontWeight="bold" textAnchor="middle" fill={C.dark}>
            {readout ? readout.text : isV ? "V" : "A"}
          </text>
          {/* glass reflection streak */}
          <path d="M -12 -9 A 15 15 0 0 1 4 -14 L -2 -8 A 9 9 0 0 0 -10 -5 Z" fill={C.white} opacity="0.55" />
          </g>
        </g>
      );
    }

    case "pt100":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh-s)">
            <rect x={-21} y={-9} width={27} height={18} rx={3} fill="url(#ps-face)" stroke={C.dark} strokeWidth="1.4" />
            <path d="M -18 -6 L 3 -6" stroke={C.white} strokeWidth="1.4" opacity="0.85" />
            <text x={-7.5} y={4} fontSize="7.5" textAnchor="middle" fill={C.dark} fontWeight="bold" fontFamily="monospace">Pt100</text>
          </g>
          <path d="M 6 0 h 8 q 7 0 7 9 v 8" stroke="url(#ps-metal-h)" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <rect x={17} y={15} width={8} height={15} rx={4} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.3" />
          <path d="M 19 17 L 19 27" stroke={C.white} strokeWidth="1.2" opacity="0.7" />
          <Nameplate x={-7.5} y={-14} w={26} text="4–20mA" color={C.greenDark} />
        </g>
      );
    case "pressure-sensor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={28} h={28} />
          <g transform="translate(0,-4)">
            <circle r={8.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.4" />
            <circle r={6.5} fill={C.white} stroke={C.dark} strokeWidth="1" />
            {Array.from({ length: 8 }, (_, i) => {
              const ang = (-120 + i * 34) * (Math.PI / 180);
              return <line key={i} x1={Math.cos(ang) * 5} y1={Math.sin(ang) * 5} x2={Math.cos(ang) * 6.2} y2={Math.sin(ang) * 6.2} stroke={C.dark} strokeWidth="1" />;
            })}
            <line x1={0} y1={1} x2={3.5} y2={-4} stroke={C.red} strokeWidth="1.6" strokeLinecap="round" />
            <circle r={1.2} fill={C.darker} />
            <text x={0} y={-10.5} fontSize="5.5" textAnchor="middle" fill={C.redDark} fontWeight="bold">bar</text>
          </g>
          <path d="M -7 11 h 14 v 7 h -14 z" fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.3" />
          <rect x={-2.5} y={17} width={5} height={8} rx={1} fill="url(#ps-metal-h)" stroke={C.dark} strokeWidth="1.1" />
        </g>
      );
    case "proximity-sensor":
    case "photo-sensor": {
      const photo = type === "photo-sensor";
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh-s)">
            <rect x={-23} y={-7.5} width={35} height={15} rx={7.5} fill={photo ? "url(#ps-body)" : "url(#ps-dark)"} stroke={C.dark} strokeWidth="1.5" />
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={-19 + i * 5} y1={-6} x2={-19 + i * 5} y2={6} stroke={photo ? C.dark : C.black} strokeWidth="1" opacity="0.45" />
            ))}
            <rect x={12} y={-9.5} width={11} height={19} rx={2.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.4" />
            <path d="M 14 -7 L 14 7" stroke={C.white} strokeWidth="1.2" opacity="0.7" />
            {photo ? (
              <>
                <circle cx={17.5} cy={0} r={3.4} fill="url(#ps-lensR)" stroke={C.dark} strokeWidth="1" />
                <path d="M 22.5 -4.5 q 5 4.5 0 9" stroke={C.red} strokeWidth="1.4" fill="none" opacity="0.85" />
              </>
            ) : (
              <circle cx={17.5} cy={0} r={4} fill="#7d5fff" stroke={C.dark} strokeWidth="1.2" filter="url(#ps-glow)" />
            )}
            <circle cx={-15} cy={0} r={2.8} fill={C.green} stroke={C.dark} strokeWidth="0.9" />
            <text x={-5} y={2.5} fontSize="6" textAnchor="middle" fill={photo ? C.dark : C.face} fontWeight="bold">
              {photo ? "PE" : "NPN"}
            </text>
          </g>
        </g>
      );
    }
    case "level-sensor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh-s)">
            <rect x={-19} y={-17} width={23} height={15} rx={2.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.4" />
            <path d="M -16 -14 L 2 -14" stroke={C.white} strokeWidth="1.3" opacity="0.8" />
            <text x={-7.5} y={-6} fontSize="6" textAnchor="middle" fill={C.dark} fontWeight="bold">LVL</text>
          </g>
          <path d="M 4 -9.5 q 13 0 13 11 v 4" stroke="url(#ps-metal-h)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <g filter="url(#ps-sh-s)">
            <circle cx={17} cy={12} r={7.5} fill="url(#ps-amber)" stroke={C.dark} strokeWidth="1.4" />
            <ellipse cx={14.5} cy={9.5} rx={3} ry={2} fill={C.white} opacity="0.6" />
          </g>
          <line x1={-19} y1={6} x2={-5} y2={6} stroke={C.dark} strokeWidth="1.3" opacity="0.55" />
        </g>
      );

    case "plc":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-28} y={-26} width={56} height={52} rx={3.5} fill="url(#ps-face)" stroke={C.dark} strokeWidth="1.7" />
            <path d="M -25 -23 L 25 -23" stroke={C.white} strokeWidth="1.6" opacity="0.9" />
            {/* display */}
            <rect x={-23} y={-20} width={27} height={16} rx={2.5} fill="#123a2a" stroke={C.black} strokeWidth="1.3" />
            <rect x={-23} y={-20} width={27} height={5.5} rx={2.5} fill={C.white} opacity="0.1" />
            <text x={-9.5} y={-9} fontSize="7.5" textAnchor="middle" fill={C.lcdGreen} fontFamily="monospace" fontWeight="bold">RUN</text>
            {/* LEDs */}
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <circle cx={9 + i * 6} cy={-14} r={2.4} fill={i < 2 ? C.green : C.metal2} stroke={C.dark} strokeWidth="0.9" filter={i < 2 ? "url(#ps-glow)" : undefined} />
              </g>
            ))}
            {/* terminal rows */}
            {[0, 1].map((row) => (
              <g key={row}>
                <rect x={-23} y={2 + row * 11} width={46} height={9} rx={1.5} fill={C.darker} stroke={C.black} strokeWidth="1" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <g key={i}>
                    <rect x={-21 + i * 7.6} y={3.5 + row * 11} width={5.5} height={6} rx={1} fill="url(#ps-metal)" stroke={C.black} strokeWidth="0.8" />
                    <line x1={-19.5 + i * 7.6} y1={6.5 + row * 11} x2={-16.5 + i * 7.6} y2={6.5 + row * 11} stroke={C.dark} strokeWidth="1" />
                  </g>
                ))}
              </g>
            ))}
            <Nameplate x={17} y={-16} w={16} text="PLC" />
          </g>
          <DINSnip />
        </g>
      );
    case "plc-expansion":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-21} y={-26} width={42} height={52} rx={3.5} fill="url(#ps-face)" stroke={C.dark} strokeWidth="1.7" />
            <path d="M -18 -23 L 18 -23" stroke={C.white} strokeWidth="1.5" opacity="0.9" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={-15} y={-19 + i * 11} width={30} height={8.5} rx={1.5} fill={C.darker} stroke={C.black} strokeWidth="1" />
                <rect x={-13} y={-17.5 + i * 11} width={11} height={5.5} rx={1} fill="url(#ps-metal)" stroke={C.black} strokeWidth="0.8" />
                <circle cx={11} cy={-14.7 + i * 11} r={2} fill={i % 2 === 0 ? C.green : C.metal2} stroke={C.dark} strokeWidth="0.8" />
              </g>
            ))}
            <Nameplate x={0} y={21} w={20} text="I/O" />
          </g>
          <DINSnip />
        </g>
      );
    case "analog-module":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-21} y={-26} width={42} height={52} rx={3.5} fill="url(#ps-face)" stroke={C.dark} strokeWidth="1.7" />
            <path d="M -18 -23 L 18 -23" stroke={C.white} strokeWidth="1.5" opacity="0.9" />
            <rect x={-14} y={-19} width={28} height={13} rx={2.5} fill="#101c26" stroke={C.black} strokeWidth="1.3" />
            <text x={0} y={-9.5} fontSize="7.5" textAnchor="middle" fill={C.cyan} fontFamily="monospace" fontWeight="bold">20.0mA</text>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={-14} y={-1 + i * 10} width={17} height={7.5} rx={1.5} fill={C.darker} stroke={C.black} strokeWidth="1" />
                <rect x={-12} y={0.5 + i * 10} width={8} height={4.5} rx={1} fill="url(#ps-metal)" stroke={C.black} strokeWidth="0.8" />
                <circle cx={9} cy={2.7 + i * 10} r={2.6} fill="url(#ps-copper)" stroke={C.dark} strokeWidth="1" />
              </g>
            ))}
          </g>
          <DINSnip />
        </g>
      );

    case "terminal-block":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-27} y={-10} width={54} height={20} rx={2.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.6" />
            <path d="M -24 -7 L 24 -7" stroke={C.white} strokeWidth="1.4" opacity="0.8" />
            {[-19, -6.5, 6.5, 19].map((x) => (
              <g key={x}>
                <rect x={x - 5} y={-7} width={10} height={14} rx={1.5} fill={C.face} stroke={C.dark} strokeWidth="1.1" />
                <Screw x={x} y={0} r={3.2} />
                <rect x={x - 3.5} y={6} width={7} height={5} rx={1} fill={C.darker} stroke={C.black} strokeWidth="0.9" />
              </g>
            ))}
            <rect x={-27} y={9} width={54} height={5} rx={1.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.2" />
          </g>
        </g>
      );
    case "junction-box":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <rect x={-23} y={-17} width={46} height={34} rx={4} fill="url(#ps-face)" stroke={C.dark} strokeWidth="1.7" />
            <rect x={-17} y={-11} width={34} height={22} rx={2.5} fill="url(#ps-body)" stroke={C.dark} strokeWidth="1.2" />
            <path d="M -15 -9 L 15 -9" stroke={C.white} strokeWidth="1.4" opacity="0.85" />
            {[[-9, 0], [9, 0], [0, -5.5], [0, 5.5]].map(([x, y]) => (
              <Screw key={`${x},${y}`} x={x} y={y} r={3.2} />
            ))}
            <path d="M -23 -13.5 L 23 -13.5" stroke={C.dark} strokeWidth="1" strokeDasharray="3 2.5" opacity="0.5" />
          </g>
          <text x={0} y={25} fontSize="7" textAnchor="middle" fill={C.dark} fontWeight="bold">JB</text>
        </g>
      );
    case "connector":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g filter="url(#ps-sh)">
            <circle r={15.5} fill="url(#ps-metal)" stroke={C.dark} strokeWidth="1.9" />
            <circle r={11} fill="url(#ps-dark)" stroke={C.dark} strokeWidth="1.3" />
            <circle r={11} fill="url(#ps-gloss)" opacity="0.35" />
            <circle cx={-4} cy={-3} r={2.6} fill="url(#ps-copper)" stroke={C.black} strokeWidth="0.9" />
            <circle cx={4} cy={-3} r={2.6} fill="url(#ps-copper)" stroke={C.black} strokeWidth="0.9" />
            <rect x={-3.5} y={4} width={7} height={4.5} rx={1.2} fill={C.copper} stroke={C.black} strokeWidth="0.9" />
            <path d="M 15.5 -7 a 17 17 0 0 1 0 14" stroke="url(#ps-metal-h)" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 16.5 -5 a 14 14 0 0 1 0 10" stroke={C.white} strokeWidth="1.2" fill="none" opacity="0.6" />
          </g>
          <Nameplate x={0} y={-21} w={30} text="16A 230V" />
        </g>
      );
  }
}
