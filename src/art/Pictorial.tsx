// Pictorial device artwork — every drawing here is our own (no assets from
// any product). Coordinate contract: wire tabs at (±30, 0), art centred at
// origin, designed for a ~76×64 box. Material palette lives here because
// sprites are illustration, not UI chrome (UI stays on design tokens).
import type { DeviceType } from "../state/store";

const C = {
  face: "#f4f6f8",
  body: "#dfe4e8",
  body2: "#cfd6dc",
  dark: "#3d4852",
  darker: "#2d3339",
  metal: "#c2c9d0",
  metal2: "#aab4bd",
  red: "#d64545",
  redDark: "#b23434",
  green: "#2f9e5f",
  greenDark: "#227a49",
  amber: "#e8a33d",
  blue: "#2b6cb0",
  blueDark: "#1f5691",
  copper: "#c98a4b",
  lcd: "#b8c9a8",
  white: "#ffffff",
  black: "#22262a",
};

/** wire tab into the body */
function Tab({ dir }: { dir: -1 | 1 }) {
  const x = dir * 30;
  const x2 = dir * 22;
  return (
    <g>
      <line x1={x} y1={0} x2={x2} y2={0} stroke={C.metal2} strokeWidth="3" />
      <circle cx={dir * 26} cy={0} r="4" fill={C.metal} stroke={C.dark} strokeWidth="1.5" />
    </g>
  );
}

/** screw head detail */
function Screw({ x, y, r = 4 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.metal} stroke={C.dark} strokeWidth="1.2" />
      <line x1={x - r * 0.6} y1={y} x2={x + r * 0.6} y2={y} stroke={C.dark} strokeWidth="1.4" />
    </g>
  );
}

/** standard enclosure body */
function Box({
  w,
  h,
  fill = C.body,
  r = 4,
  y = 0,
}: {
  w: number;
  h: number;
  fill?: string;
  r?: number;
  y?: number;
}) {
  return (
    <g>
      <rect x={-w / 2} y={y - h / 2} width={w} height={h} rx={r} fill={fill} stroke={C.dark} strokeWidth="1.6" />
      <line x1={-w / 2 + 3} y1={y - h / 2 + 3} x2={w / 2 - 3} y2={y - h / 2 + 3} stroke={C.white} strokeWidth="1.4" opacity="0.7" />
    </g>
  );
}

/** round head: push button / pilot light / e-stop */
function Head({
  r = 13,
  color = C.red,
  collar,
  flat = false,
  lit,
}: {
  r?: number;
  color?: string;
  collar?: string;
  flat?: boolean;
  lit?: boolean;
}) {
  return (
    <g>
      {collar && <circle r={r + 4} fill={collar} stroke={C.dark} strokeWidth="1.6" />}
      <circle r={r + (collar ? 0 : 2)} fill={C.metal} stroke={C.dark} strokeWidth="1.6" />
      <circle r={r - 2} fill={lit ? color : flat ? color : color} stroke={C.dark} strokeWidth="1.2" />
      {!flat && <path d={`M ${-r * 0.5} ${-r * 0.45} A ${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.35} ${-r * 0.6}`} stroke={C.white} strokeWidth="2" fill="none" opacity="0.75" />}
      {lit && <circle r={r - 5} fill={C.white} opacity="0.45" />}
    </g>
  );
}

function Lens({ color, lit }: { color: string; lit?: boolean }) {
  return (
    <g>
      <circle r={13} fill={C.metal} stroke={C.dark} strokeWidth="1.6" />
      <circle r={9} fill={color} stroke={C.dark} strokeWidth="1.2" />
      {lit ? (
        <>
          <circle r={9} fill={C.white} opacity="0.55" />
          <circle r={4.5} fill={C.white} opacity="0.85" />
        </>
      ) : (
        <path d="M -5 -4 A 7 7 0 0 1 2 -6" stroke={C.white} strokeWidth="1.8" fill="none" opacity="0.6" />
      )}
    </g>
  );
}

function DINSnip() {
  return <rect x={-6} y={20} width={12} height={6} fill={C.metal2} stroke={C.dark} strokeWidth="1" />;
}

function HeatSink({ n = 4, w = 40, h = 30 }: { n?: number; w?: number; h?: number }) {
  const step = w / (n + 1);
  return (
    <g stroke={C.dark} strokeWidth="1.4" opacity="0.55">
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={-w / 2 + step * (i + 1)} y1={-h / 2 + 3} x2={-w / 2 + step * (i + 1)} y2={h / 2 - 3} />
      ))}
    </g>
  );
}

export function DeviceArt({ type, lit }: { type: DeviceType; lit?: boolean }) {
  switch (type) {
    case "source":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-18} y={-16} width={36} height={32} rx={4} fill={C.dark} stroke={C.darker} strokeWidth="1.5" />
          <rect x={-12} y={-10} width={24} height={12} rx={2} fill={C.lcd} />
          <text x={0} y={-1} fontSize="8" textAnchor="middle" fill={C.darker} fontFamily="monospace">24V</text>
          <circle cx={-8} cy={10} r={3} fill={C.green} />
          <circle cx={2} cy={10} r={3} fill={C.metal} stroke={C.dark} strokeWidth="1" />
          <text x={9} y={13} fontSize="7" fill={C.face}>DC</text>
        </g>
      );
    case "ac-source":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-18} y={-16} width={36} height={32} rx={4} fill={C.body} stroke={C.dark} strokeWidth="1.5" />
          <circle r={9} fill={C.face} stroke={C.dark} strokeWidth="1.3" />
          <path d="M -5 0 Q -2.5 -6 0 0 Q 2.5 6 5 0" stroke={C.red} strokeWidth="1.8" fill="none" />
          <text x={0} y={13} fontSize="7" textAnchor="middle" fill={C.dark}>~</text>
        </g>
      );
    case "ground":
      return (
        <g>
          <line x1={0} y1={-26} x2={0} y2={-4} stroke={C.metal2} strokeWidth="3" />
          <line x1={-16} y1={-4} x2={16} y2={-4} stroke={C.dark} strokeWidth="3.5" />
          <line x1={-10} y1={4} x2={10} y2={4} stroke={C.dark} strokeWidth="3.5" />
          <line x1={-4} y1={12} x2={4} y2={12} stroke={C.dark} strokeWidth="3.5" />
          <circle cx={0} cy={-26} r={3.5} fill={C.green} stroke={C.dark} strokeWidth="1.2" />
        </g>
      );
    case "transformer-1p":
    case "transformer-3p": {
      const three = type === "transformer-3p";
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-20} y={-20} width={16} height={40} rx={2} fill={C.body2} stroke={C.dark} strokeWidth="1.6" />
          <rect x={4} y={-20} width={16} height={40} rx={2} fill={C.body2} stroke={C.dark} strokeWidth="1.6" />
          <rect x={-20} y={-6} width={40} height={12} fill={C.metal} stroke={C.dark} strokeWidth="1.4" />
          {[ -14, -8, 8, 14 ].map((x) => (
            <path key={x} d={`M ${x} -18 q 5 4 0 8 q -5 4 0 8`} stroke={C.copper} strokeWidth="2" fill="none" />
          ))}
          {three && <text x={0} y={17} fontSize="7" textAnchor="middle" fill={C.dark}>3φ</text>}
        </g>
      );
    }
    case "battery":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-20} y={-14} width={40} height={28} rx={3} fill={C.darker} stroke={C.black} strokeWidth="1.5" />
          <rect x={-14} y={-18} width={8} height={5} fill={C.metal} stroke={C.dark} strokeWidth="1" />
          <rect x={6} y={-18} width={8} height={5} fill={C.metal} stroke={C.dark} strokeWidth="1" />
          <text x={-7} y={5} fontSize="10" fontWeight="bold" fill={C.green} textAnchor="middle">+</text>
          <text x={8} y={6} fontSize="12" fill={C.face} textAnchor="middle">−</text>
        </g>
      );
    case "generator":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-24} y={-14} width={34} height={26} rx={3} fill={C.blue} stroke={C.darker} strokeWidth="1.5" />
          <circle cx={14} cy={0} r={11} fill={C.body} stroke={C.dark} strokeWidth="1.5" />
          <path d="M 14 -7 L 14 7 M 8 -4 L 20 4 M 8 4 L 20 -4" stroke={C.dark} strokeWidth="1.3" />
          <rect x={-20} y={-10} width={12} height={7} rx={1} fill={C.face} />
        </g>
      );

    case "button":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-14} y={-8} width={28} height={26} rx={3} fill={C.body} stroke={C.dark} strokeWidth="1.5" />
          <g transform="translate(0,-6)">
            <Head r={13} color={C.green} />
          </g>
          <DINSnip />
        </g>
      );
    case "button-nc":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-14} y={-8} width={28} height={26} rx={3} fill={C.body} stroke={C.dark} strokeWidth="1.5" />
          <g transform="translate(0,-6)">
            <Head r={13} color={C.red} />
          </g>
          <DINSnip />
        </g>
      );
    case "estop":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-15} y={-6} width={30} height={24} rx={3} fill={C.amber} stroke={C.dark} strokeWidth="1.5" />
          <g transform="translate(0,-8)">
            <Head r={15} color={C.red} collar={C.amber} />
          </g>
          <text x={0} y={14} fontSize="6.5" fontWeight="bold" textAnchor="middle" fill={C.darker}>STOP</text>
        </g>
      );
    case "selector":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-14} y={-8} width={28} height={26} rx={3} fill={C.body} stroke={C.dark} strokeWidth="1.5" />
          <g transform="translate(0,-6)">
            <circle r={13} fill={C.metal} stroke={C.dark} strokeWidth="1.6" />
            <rect x={-3.5} y={-11} width={7} height={16} rx={3} fill={C.darker} transform="rotate(-30)" />
            <circle r={3} fill={C.metal2} stroke={C.dark} strokeWidth="1" />
          </g>
          <DINSnip />
        </g>
      );
    case "switch-2way":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={26} h={34} />
          <rect x={-5} y={-13} width={10} height={16} rx={2} fill={C.darker} />
          <line x1={0} y1={-11} x2={0} y2={0} stroke={C.face} strokeWidth="2" />
          <circle cx={-7} cy={12} r={2.5} fill={C.metal} stroke={C.dark} strokeWidth="1" />
          <circle cx={7} cy={12} r={2.5} fill={C.metal} stroke={C.dark} strokeWidth="1" />
        </g>
      );
    case "keyswitch":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-13} y={-8} width={26} height={26} rx={3} fill={C.body} stroke={C.dark} strokeWidth="1.5" />
          <g transform="translate(0,-5)">
            <circle r={12} fill={C.metal} stroke={C.dark} strokeWidth="1.6" />
            <rect x={-2} y={-9} width={4} height={12} rx={1.5} fill={C.darker} />
            <circle r={4.5} fill={C.darker} />
            <rect x={-1.2} y={-8} width={2.4} height={7} fill={C.metal} />
          </g>
          <DINSnip />
        </g>
      );

    case "lamp":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g transform="translate(0,-4)">
            <Lens color={C.green} lit={lit} />
          </g>
          <rect x={-9} y={8} width={18} height={14} rx={2} fill={C.body} stroke={C.dark} strokeWidth="1.4" />
          <text x={0} y={18} fontSize="7" textAnchor="middle" fill={C.dark}>24V</text>
        </g>
      );
    case "lamp-amber":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <g transform="translate(0,-4)">
            <Lens color={C.amber} lit={lit} />
          </g>
          <rect x={-9} y={8} width={18} height={14} rx={2} fill={C.body} stroke={C.dark} strokeWidth="1.4" />
          <text x={0} y={18} fontSize="7" textAnchor="middle" fill={C.dark}>24V</text>
        </g>
      );
    case "buzzer":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <circle r={14} fill={C.darker} stroke={C.black} strokeWidth="1.5" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={Math.cos((i * Math.PI * 2) / 5) * 8} cy={Math.sin((i * Math.PI * 2) / 5) * 8} r={2} fill={C.black} stroke={C.metal2} strokeWidth="0.6" />
          ))}
          <circle r={3} fill={C.metal2} />
          {lit && <path d="M 16 -8 q 6 8 0 16" stroke={C.amber} strokeWidth="2" fill="none" />}
        </g>
      );
    case "beacon":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-4} y={4} width={8} height={16} fill={C.metal2} stroke={C.dark} strokeWidth="1.2" />
          <rect x={-12} y={18} width={24} height={6} rx={2} fill={C.body} stroke={C.dark} strokeWidth="1.3" />
          <rect x={-9} y={-24} width={18} height={10} rx={3} fill={C.red} stroke={C.dark} strokeWidth="1.3" opacity={lit ? 1 : 0.75} />
          <rect x={-9} y={-13} width={18} height={10} rx={3} fill={C.amber} stroke={C.dark} strokeWidth="1.3" />
          <rect x={-9} y={-2} width={18} height={7} rx={2} fill={C.green} stroke={C.dark} strokeWidth="1.3" />
        </g>
      );

    case "contactor":
    case "contactor-rev": {
      const rev = type === "contactor-rev";
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={40} h={46} y={-2} />
          <rect x={-16} y={-22} width={32} height={12} rx={2} fill={C.body2} stroke={C.dark} strokeWidth="1.2" />
          {[ -12, 0, 12 ].map((x) => (
            <Screw key={x} x={x} y={-17} r={3.2} />
          ))}
          {[ -12, 0, 12 ].map((x) => (
            <Screw key={x} x={x} y={16} r={3.2} />
          ))}
          <rect x={-10} y={-4} width={20} height={9} rx={1.5} fill={rev ? C.red : C.face} stroke={C.dark} strokeWidth="1" />
          <text x={0} y={3.5} fontSize="6.5" fontWeight="bold" textAnchor="middle" fill={C.darker}>
            {rev ? "REV" : "KM"}
          </text>
          <DINSnip />
        </g>
      );
    }
    case "relay":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-16} y={-20} width={32} height={40} rx={3} fill="#e8eef2ee" stroke={C.dark} strokeWidth="1.5" />
          <rect x={-11} y={-15} width={22} height={16} rx={2} fill="#cfe0ea" stroke={C.dark} strokeWidth="1" opacity="0.9" />
          <path d="M -7 -12 h 14 M -7 -8 h 14 M -7 -4 h 10" stroke={C.copper} strokeWidth="1.6" />
          <rect x={-11} y={5} width={22} height={6} rx={1} fill={C.body2} stroke={C.dark} strokeWidth="1" />
          <text x={0} y={17} fontSize="6.5" textAnchor="middle" fill={C.dark}>24VDC</text>
          <Screw x={-7} y={-17} r={2.6} />
          <Screw x={7} y={-17} r={2.6} />
        </g>
      );
    case "aux-no":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={34} h={30} />
          <line x1={-9} y1={4} x2={9} y2={-6} stroke={C.dark} strokeWidth="2.2" />
          <circle cx={-9} cy={4} r={2.6} fill={C.darker} />
          <circle cx={9} cy={4} r={2.6} fill={C.darker} />
          <text x={0} y={-8} fontSize="7" fontWeight="bold" textAnchor="middle" fill={C.dark}>NO</text>
        </g>
      );
    case "aux-nc":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={34} h={30} />
          <line x1={-9} y1={0} x2={9} y2={0} stroke={C.dark} strokeWidth="2.2" />
          <circle cx={-9} cy={0} r={2.6} fill={C.darker} />
          <circle cx={9} cy={0} r={2.6} fill={C.darker} />
          <text x={0} y={-8} fontSize="7" fontWeight="bold" textAnchor="middle" fill={C.dark}>NC</text>
        </g>
      );
    case "changeover":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={36} h={32} />
          <circle cx={-10} cy={5} r={2.6} fill={C.darker} />
          <circle cx={10} cy={-4} r={2.6} fill={C.darker} />
          <circle cx={10} cy={7} r={2.6} fill={C.darker} />
          <line x1={-10} y1={5} x2={9} y2={-3} stroke={C.dark} strokeWidth="2" />
          <text x={0} y={-9} fontSize="6.5" textAnchor="middle" fill={C.dark}>SPDT</text>
        </g>
      );

    case "fuse":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-18} y={-8} width={36} height={16} rx={8} fill="#d9e4ea" stroke={C.dark} strokeWidth="1.5" />
          <rect x={-18} y={-8} width={7} height={16} rx={3} fill={C.metal} stroke={C.dark} strokeWidth="1.2" />
          <rect x={11} y={-8} width={7} height={16} rx={3} fill={C.metal} stroke={C.dark} strokeWidth="1.2" />
          <line x1={-11} y1={0} x2={11} y2={0} stroke={C.red} strokeWidth="1.8" />
          <text x={0} y={16} fontSize="6.5" textAnchor="middle" fill={C.dark}>FUSE</text>
        </g>
      );
    case "breaker-1p":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-11} y={-22} width={22} height={44} rx={2} fill={C.face} stroke={C.dark} strokeWidth="1.5" />
          <rect x={-6} y={-16} width={12} height={14} rx={2} fill={C.darker} />
          <rect x={-4} y={-13} width={8} height={7} rx={1} fill={C.red} />
          <Screw x={0} y={6} r={3.4} />
          <text x={0} y={18} fontSize="6" textAnchor="middle" fill={C.dark}>C16</text>
          <DINSnip />
        </g>
      );
    case "breaker-3p":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-24} y={-20} width={48} height={40} rx={2} fill={C.face} stroke={C.dark} strokeWidth="1.5" />
          {[-15, 0, 15].map((x) => (
            <g key={x}>
              <rect x={x - 6} y={-14} width={12} height={13} rx={2} fill={C.darker} />
              <rect x={x - 4} y={-11} width={8} height={7} rx={1} fill={C.red} />
              <Screw x={x} y={8} r={3} />
            </g>
          ))}
          <DINSnip />
        </g>
      );
    case "mccb":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={44} h={46} fill={C.face} />
          <rect x={-10} y={-18} width={20} height={16} rx={2} fill={C.darker} />
          <rect x={-7} y={-15} width={14} height={9} rx={1.5} fill={C.red} />
          <circle cx={-11} cy={8} r={5} fill={C.body2} stroke={C.dark} strokeWidth="1.2" />
          <line x1={-11} y1={8} x2={-11} y2={4} stroke={C.dark} strokeWidth="1.4" />
          <text x={7} y={11} fontSize="7" fontWeight="bold" fill={C.dark}>In</text>
          {[ -16, 16 ].map((x) => (
            <Screw key={x} x={x} y={16} r={3.2} />
          ))}
        </g>
      );
    case "overload":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={36} h={42} fill={C.face} />
          <circle cx={0} cy={-8} r={9} fill={C.body2} stroke={C.dark} strokeWidth="1.3" />
          <line x1={0} y1={-8} x2={5} y2={-13} stroke={C.red} strokeWidth="2" />
          {[ -10, 0, 10 ].map((x) => (
            <circle key={x} cx={x} cy={6} r={3} fill={x === 0 ? C.red : C.metal} stroke={C.dark} strokeWidth="1" />
          ))}
          <rect x={-8} y={13} width={16} height={6} rx={1} fill={C.body2} stroke={C.dark} strokeWidth="1" />
          <text x={0} y={18} fontSize="5.5" textAnchor="middle" fill={C.dark}>RESET</text>
        </g>
      );
    case "surge":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={24} h={40} fill={C.face} />
          <rect x={-7} y={-14} width={14} height={18} rx={2} fill={C.darker} />
          <path d="M 1 -10 l -5 7 h 5 l -5 7" stroke={C.amber} strokeWidth="1.8" fill="none" />
          <text x={0} y={16} fontSize="6" textAnchor="middle" fill={C.dark}>SPD</text>
          <circle cx={0} cy={-17} r={2} fill={C.green} />
          <DINSnip />
        </g>
      );
    case "rccb":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={44} h={42} fill={C.face} />
          <rect x={-16} y={-14} width={18} height={16} rx={2} fill={C.darker} />
          <rect x={-13} y={-11} width={12} height={9} rx={1} fill={C.green} />
          <rect x={8} y={-14} width={12} height={16} rx={6} fill={C.amber} stroke={C.dark} strokeWidth="1.2" />
          <text x={0} y={14} fontSize="6.5" textAnchor="middle" fill={C.dark}>30mA</text>
          <Screw x={-12} y={16} r={3} />
          <Screw x={12} y={16} r={3} />
          <DINSnip />
        </g>
      );

    case "resistor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-16} y={-7} width={32} height={14} rx={7} fill="#e6d9c3" stroke={C.dark} strokeWidth="1.4" />
          {[["#b23434", -9], ["#c98a4b", -3], ["#3d4852", 3], ["#e8a33d", 9]].map(([col, x]) => (
            <rect key={x as number} x={x as number} y={-7} width={3} height={14} fill={col as string} />
          ))}
        </g>
      );
    case "capacitor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <line x1={-22} y1={0} x2={-5} y2={0} stroke={C.metal2} strokeWidth="2.5" />
          <line x1={5} y1={0} x2={22} y2={0} stroke={C.metal2} strokeWidth="2.5" />
          <rect x={-6} y={-16} width={5} height={32} rx={1.5} fill={C.blue} stroke={C.dark} strokeWidth="1.3" />
          <rect x={1} y={-16} width={5} height={32} rx={1.5} fill={C.blue} stroke={C.dark} strokeWidth="1.3" />
          <text x={0} y={-20} fontSize="7" textAnchor="middle" fill={C.dark}>µF</text>
        </g>
      );
    case "inductor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <line x1={-22} y1={0} x2={-14} y2={0} stroke={C.metal2} strokeWidth="2.5" />
          <line x1={14} y1={0} x2={22} y2={0} stroke={C.metal2} strokeWidth="2.5" />
          <path d="M -14 0 a 4.7 4.7 0 0 1 9.4 0 a 4.7 4.7 0 0 1 9.4 0 a 4.7 4.7 0 0 1 9.4 0" stroke={C.copper} strokeWidth="3" fill="none" />
          <rect x={-16} y={5} width={32} height={7} rx={1} fill={C.body2} stroke={C.dark} strokeWidth="1" />
        </g>
      );
    case "potentiometer":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-16} y={-6} width={32} height={20} rx={3} fill={C.body} stroke={C.dark} strokeWidth="1.4" />
          <circle cx={0} cy={-12} r={11} fill={C.face} stroke={C.dark} strokeWidth="1.5" />
          <line x1={0} y1={-12} x2={6} y2={-19} stroke={C.red} strokeWidth="2.2" />
          <line x1={-12} y1={4} x2={12} y2={4} stroke={C.dark} strokeWidth="1.2" />
        </g>
      );
    case "thermistor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <path d="M -20 0 h 8 l 3 -8 l 6 16 l 6 -16 l 3 8 h 8" stroke={C.dark} strokeWidth="2" fill="none" />
          <circle cx={0} cy={-14} r={5} fill={C.red} stroke={C.dark} strokeWidth="1.2" />
          <text x={0} y={16} fontSize="6.5" textAnchor="middle" fill={C.dark}>NTC</text>
        </g>
      );

    case "motor":
    case "motor-1ph":
    case "motor-dc": {
      const dc = type === "motor-dc";
      const one = type === "motor-1ph";
      const shell = dc ? C.darker : C.blue;
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-14} y={-30} width={16} height={12} rx={2} fill={C.body} stroke={C.dark} strokeWidth="1.4" />
          <Screw x={-10} y={-24} r={2.4} />
          <Screw x={-2} y={-24} r={2.4} />
          <path d="M -20 -14 a 20 20 0 0 1 40 0 v 18 h -40 z" fill={shell} stroke={C.darker} strokeWidth="1.6" />
          <path d="M -20 -14 a 20 20 0 0 1 40 0" fill="none" stroke={C.white} strokeWidth="1.5" opacity="0.4" />
          {[ -12, -6, 0, 6, 12 ].map((x) => (
            <line key={x} x1={x} y1={-10} x2={x} y2={2} stroke={C.darker} strokeWidth="1.2" opacity="0.6" />
          ))}
          <rect x={-24} y={4} width={48} height={6} fill={shell} stroke={C.darker} strokeWidth="1.4" />
          <rect x={-22} y={10} width={9} height={8} fill={C.darker} />
          <rect x={13} y={10} width={9} height={8} fill={C.darker} />
          <rect x={20} y={-6} width={10} height={4} rx={2} fill={C.metal} stroke={C.dark} strokeWidth="1" />
          <text x={0} y={-16} fontSize="8" fontWeight="bold" textAnchor="middle" fill={C.white}>
            {dc ? "DC" : one ? "1φ" : "M"}
          </text>
          {!dc && !one && (
            <text x={0} y={0} fontSize="5.5" textAnchor="middle" fill={C.white} opacity="0.9">3~</text>
          )}
        </g>
      );
    }

    case "vfd":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={44} h={54} fill={C.dark} r={3} />
          <rect x={-16} y={-20} width={32} height={14} rx={2} fill="#0f2417" stroke={C.black} strokeWidth="1.2" />
          <text x={0} y={-10} fontSize="8" textAnchor="middle" fill="#57d98a" fontFamily="monospace">50.0</text>
          {[[-14, -2], [-5, -2], [4, -2], [13, -2], [-14, 7], [-5, 7], [4, 7], [13, 7]].map(([x, y]) => (
            <rect key={`${x},${y}`} x={x} y={y} width={7} height={6} rx={1.5} fill={C.body2} stroke={C.black} strokeWidth="0.8" />
          ))}
          <rect x={-16} y={17} width={14} height={7} rx={2} fill={C.green} stroke={C.black} strokeWidth="1" />
          <rect x={2} y={17} width={14} height={7} rx={2} fill={C.red} stroke={C.black} strokeWidth="1" />
          <HeatSink n={5} w={44} h={54} />
        </g>
      );
    case "servo-drive":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={42} h={54} fill={C.body} r={3} />
          <rect x={-14} y={-20} width={28} height={12} rx={2} fill="#123" stroke={C.black} strokeWidth="1.2" />
          <text x={0} y={-11} fontSize="7" textAnchor="middle" fill="#7fd7ff" fontFamily="monospace"> axis</text>
          <circle cx={0} cy={2} r={7} fill={C.face} stroke={C.dark} strokeWidth="1.3" />
          <rect x={-2} y={-4} width={4} height={7} rx={1} fill={C.darker} />
          <circle cx={-11} cy={17} r={3.5} fill={C.green} stroke={C.dark} strokeWidth="1" />
          <circle cx={0} cy={17} r={3.5} fill={C.amber} stroke={C.dark} strokeWidth="1" />
          <circle cx={11} cy={17} r={3.5} fill={C.red} stroke={C.dark} strokeWidth="1" />
        </g>
      );

    case "multimeter":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={40} h={54} fill={C.darker} r={5} />
          <rect x={-14} y={-20} width={28} height={14} rx={2} fill={C.lcd} stroke={C.black} strokeWidth="1.2" />
          <text x={0} y={-10} fontSize="8" textAnchor="middle" fill={C.darker} fontFamily="monospace">000.0</text>
          <circle cx={0} cy={4} r={10} fill={C.body} stroke={C.black} strokeWidth="1.4" />
          <line x1={0} y1={4} x2={6} y2={-3} stroke={C.red} strokeWidth="2" />
          <circle cx={-9} cy={19} r={3.5} fill={C.black} stroke={C.metal} strokeWidth="1.2" />
          <circle cx={9} cy={19} r={3.5} fill={C.red} stroke={C.metal} strokeWidth="1.2" />
        </g>
      );
    case "clamp":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <path d="M -10 -6 a 12 12 0 1 1 20 8" stroke={C.darker} strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x={-14} y={-4} width={28} height={34} rx={4} fill={C.darker} stroke={C.black} strokeWidth="1.5" />
          <rect x={-9} y={2} width={18} height={10} rx={1.5} fill={C.lcd} />
          <text x={0} y={10} fontSize="7" textAnchor="middle" fill={C.darker} fontFamily="monospace">12.4A</text>
          <circle cx={-6} cy={22} r={3} fill={C.body2} />
          <circle cx={6} cy={22} r={3} fill={C.body2} />
        </g>
      );
    case "voltmeter":
    case "ammeter": {
      const isV = type === "voltmeter";
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <circle r={18} fill={C.face} stroke={C.dark} strokeWidth="2" />
          <circle r={14} fill={C.white} stroke={C.body2} strokeWidth="1" />
          {Array.from({ length: 9 }, (_, i) => {
            const a = (-140 + i * 35) * (Math.PI / 180);
            return (
              <line key={i} x1={Math.cos(a) * 11} y1={Math.sin(a) * 11} x2={Math.cos(a) * 13.5} y2={Math.sin(a) * 13.5} stroke={C.dark} strokeWidth="1.2" />
            );
          })}
          <line x1={0} y1={2} x2={isV ? 8 : -7} y2={isV ? -8 : -7} stroke={C.red} strokeWidth="1.8" />
          <circle r={2} fill={C.darker} />
          <text x={0} y={11} fontSize="8" fontWeight="bold" textAnchor="middle" fill={C.dark}>
            {isV ? "V" : "A"}
          </text>
        </g>
      );
    }

    case "pt100":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-20} y={-8} width={26} height={16} rx={3} fill={C.face} stroke={C.dark} strokeWidth="1.4" />
          <text x={-7} y={4} fontSize="7" textAnchor="middle" fill={C.dark}>Pt100</text>
          <path d="M 6 0 h 8 q 6 0 6 8 v 10" stroke={C.metal2} strokeWidth="3" fill="none" />
          <rect x={17} y={16} width={7} height={14} rx={3} fill={C.metal} stroke={C.dark} strokeWidth="1.3" />
          <text x={-7} y={-12} fontSize="6" textAnchor="middle" fill={C.green}>4–20mA</text>
        </g>
      );
    case "pressure-sensor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={26} h={26} fill={C.body} />
          <circle cx={0} cy={-4} r={7} fill={C.face} stroke={C.dark} strokeWidth="1.3" />
          <text x={0} y={-1} fontSize="6" textAnchor="middle" fill={C.red} fontWeight="bold">bar</text>
          <path d="M -6 10 h 12 v 8 h -12 z" fill={C.metal} stroke={C.dark} strokeWidth="1.3" />
          <rect x={-2} y={18} width={4} height={7} fill={C.metal2} stroke={C.dark} strokeWidth="1" />
          <text x={0} y={-16} fontSize="6" textAnchor="middle" fill={C.dark}>PT</text>
        </g>
      );
    case "proximity-sensor":
    case "photo-sensor": {
      const photo = type === "photo-sensor";
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-22} y={-7} width={34} height={14} rx={7} fill={photo ? C.face : C.darker} stroke={C.dark} strokeWidth="1.5" />
          <rect x={12} y={-9} width={10} height={18} rx={2} fill={C.metal} stroke={C.dark} strokeWidth="1.3" />
          {photo ? (
            <>
              <circle cx={17} cy={0} r={3} fill={C.red} />
              <path d="M 22 -4 q 5 4 0 8" stroke={C.red} strokeWidth="1.3" fill="none" />
            </>
          ) : (
            <circle cx={17} cy={0} r={4} fill="#7d5fff" stroke={C.dark} strokeWidth="1.2" />
          )}
          <circle cx={-14} cy={0} r={2.5} fill={C.green} />
          <text x={-4} y={3} fontSize="6" textAnchor="middle" fill={photo ? C.dark : C.face}>
            {photo ? "PE" : "NPN"}
          </text>
        </g>
      );
    }
    case "level-sensor":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-18} y={-16} width={22} height={14} rx={2} fill={C.body} stroke={C.dark} strokeWidth="1.4" />
          <path d="M 4 -9 q 12 0 12 10 v 6" stroke={C.metal2} strokeWidth="2.5" fill="none" />
          <circle cx={16} cy={12} r={7} fill={C.amber} stroke={C.dark} strokeWidth="1.4" />
          <line x1={-18} y1={6} x2={-4} y2={6} stroke={C.dark} strokeWidth="1.2" />
          <text x={-7} y={-6} fontSize="6" textAnchor="middle" fill={C.dark}>LVL</text>
        </g>
      );

    case "plc":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={54} h={50} fill={C.face} r={3} />
          <rect x={-22} y={-20} width={26} height={16} rx={2} fill="#123a2a" stroke={C.black} strokeWidth="1.2" />
          <text x={-9} y={-9} fontSize="7" textAnchor="middle" fill="#57d98a" fontFamily="monospace">RUN</text>
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={9 + i * 6} cy={-14} r={2.2} fill={i < 2 ? C.green : C.metal2} stroke={C.dark} strokeWidth="0.8" />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={-22 + i * 8} y={2} width={6} height={7} rx={1} fill={C.body2} stroke={C.dark} strokeWidth="0.9" />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={-22 + i * 8} y={12} width={6} height={7} rx={1} fill={C.body2} stroke={C.dark} strokeWidth="0.9" />
          ))}
          <text x={18} y={17} fontSize={7} fontWeight="bold" fill={C.dark}>PLC</text>
          <DINSnip />
        </g>
      );
    case "plc-expansion":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={40} h={50} fill={C.face} r={3} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-14} y={-18 + i * 10} width={28} height={7} rx={1} fill={C.body2} stroke={C.dark} strokeWidth="0.9" />
          ))}
          <circle cx={12} cy={-15} r={2.2} fill={C.green} />
          <text x={0} y={21} fontSize={6.5} textAnchor="middle" fill={C.dark}>I/O</text>
          <DINSnip />
        </g>
      );
    case "analog-module":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <Box w={40} h={50} fill={C.face} r={3} />
          <rect x={-13} y={-18} width={26} height={12} rx={2} fill="#123" />
          <text x={0} y={-9} fontSize={7} textAnchor="middle" fill="#7fd7ff" fontFamily="monospace">20.0mA</text>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={-13} y={-1 + i * 9} width={16} height={6} rx={1} fill={C.body2} stroke={C.dark} strokeWidth="0.9" />
              <circle cx={9} cy={2 + i * 9} r={2.4} fill={C.copper} stroke={C.dark} strokeWidth="0.9" />
            </g>
          ))}
          <DINSnip />
        </g>
      );

    case "terminal-block":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-26} y={-9} width={52} height={18} rx={2} fill={C.body} stroke={C.dark} strokeWidth="1.5" />
          {[-18, -6, 6, 18].map((x) => (
            <g key={x}>
              <rect x={x - 4} y={-6} width={8} height={12} rx={1} fill={C.face} stroke={C.dark} strokeWidth="0.9" />
              <Screw x={x} y={0} r={3} />
            </g>
          ))}
          <rect x={-26} y={9} width={52} height={5} fill={C.metal2} stroke={C.dark} strokeWidth="1" />
        </g>
      );
    case "junction-box":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <rect x={-22} y={-16} width={44} height={32} rx={3} fill={C.face} stroke={C.dark} strokeWidth="1.6" />
          <rect x={-16} y={-10} width={32} height={20} rx={2} fill={C.body} stroke={C.dark} strokeWidth="1.1" />
          {[[-8, 0], [8, 0], [0, -5], [0, 5]].map(([x, y]) => (
            <Screw key={`${x},${y}`} x={x} y={y} r={3} />
          ))}
          <text x={0} y={24} fontSize={6.5} textAnchor="middle" fill={C.dark}>JB</text>
        </g>
      );
    case "connector":
      return (
        <g>
          <Tab dir={-1} />
          <Tab dir={1} />
          <circle r={15} fill={C.face} stroke={C.dark} strokeWidth="1.8" />
          <circle r={10} fill={C.body2} stroke={C.dark} strokeWidth="1.2" />
          <circle cx={-4} cy={-3} r={2.4} fill={C.darker} />
          <circle cx={4} cy={-3} r={2.4} fill={C.darker} />
          <rect x={-3} y={4} width={6} height={4} rx={1} fill={C.darker} />
          <path d="M 15 -6 a 16 16 0 0 1 0 12" stroke={C.metal2} strokeWidth="3" fill="none" />
          <text x={0} y={-19} fontSize={6.5} textAnchor="middle" fill={C.dark}>16A 230V</text>
        </g>
      );
  }
}
