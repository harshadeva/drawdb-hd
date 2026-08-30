/**
 * BoardPreview — a hand-built, brand-styled illustration of a Dbraw board.
 *
 * Pure SVG, no raster assets. Used on the marketing pages in place of an
 * editor screenshot so the front page shares zero pixels with anything else.
 */

const FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const INK = "#161422";
const CORAL = "#ff6a3d";
const VIOLET = "#7a5cff";
const BORDER = "#ece3d6";
const MUTED = "#4b4658";

function Card({ id, x, y, w, title, accent, chipBg, rows }) {
  const headerH = 40;
  const rowH = 30;
  const h = headerH + rows.length * rowH + 10;

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x="0"
        y="6"
        width={w}
        height={h}
        rx="14"
        fill="#161422"
        opacity="0.10"
      />
      <clipPath id={`bp-clip-${id}`}>
        <rect width={w} height={h} rx="13" />
      </clipPath>
      <g clipPath={`url(#bp-clip-${id})`}>
        <rect width={w} height={h} fill="#ffffff" />
        <rect width={w} height="6" fill={accent} />
        <text
          x="16"
          y="27"
          fontSize="13.5"
          fontWeight="700"
          fill={INK}
          letterSpacing="0.2"
        >
          {title}
        </text>
        {rows.map((r, i) => {
          const cy = headerH + i * rowH + rowH / 2;
          return (
            <g key={i}>
              <line
                x1="0"
                x2={w}
                y1={headerH + i * rowH}
                y2={headerH + i * rowH}
                stroke={BORDER}
              />
              <circle cx="18" cy={cy} r="4" fill={r.key ? accent : "#cdc6d6"} />
              <text x="32" y={cy + 4} fontSize="11.5" fill={MUTED}>
                {r.name}
              </text>
              <rect
                x={w - 76}
                y={cy - 9}
                width="60"
                height="18"
                rx="9"
                fill={chipBg}
              />
              <text
                x={w - 46}
                y={cy + 3.5}
                fontSize="9.5"
                fontWeight="600"
                fill={accent}
                textAnchor="middle"
              >
                {r.type}
              </text>
            </g>
          );
        })}
      </g>
      <rect
        width={w}
        height={h}
        rx="13"
        fill="none"
        stroke={BORDER}
        strokeWidth="1.5"
      />
    </g>
  );
}

export default function BoardPreview({ className = "" }) {
  return (
    <svg
      viewBox="0 0 760 470"
      className={className}
      style={{ fontFamily: FONT, width: "100%", height: "auto" }}
      role="img"
      aria-label="A Dbraw board with three linked tables inside a database boundary"
    >
      <defs>
        <pattern
          id="bp-dots"
          x="0"
          y="0"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="13" cy="13" r="1.3" fill={CORAL} fillOpacity="0.16" />
        </pattern>
        <clipPath id="bp-canvas">
          <rect x="6" y="6" width="748" height="458" rx="22" />
        </clipPath>
      </defs>

      {/* canvas */}
      <rect
        x="6"
        y="6"
        width="748"
        height="458"
        rx="22"
        fill="#fffdfb"
        stroke={BORDER}
        strokeWidth="1.5"
      />
      <g clipPath="url(#bp-canvas)">
        <rect x="6" y="6" width="748" height="458" fill="url(#bp-dots)" />
      </g>

      {/* database boundary */}
      <rect
        x="34"
        y="120"
        width="342"
        height="312"
        rx="18"
        fill={CORAL}
        fillOpacity="0.05"
        stroke={CORAL}
        strokeWidth="2"
        strokeDasharray="7 6"
      />
      <rect x="46" y="107" width="132" height="26" rx="8" fill={CORAL} />
      <text
        x="112"
        y="124"
        fontSize="11"
        fontWeight="700"
        fill="#ffffff"
        textAnchor="middle"
        letterSpacing="1"
      >
        AUTH BOUNDARY
      </text>

      {/* connectors */}
      <g fill="none" stroke={INK} strokeWidth="2" strokeOpacity="0.45" strokeLinecap="round" strokeLinejoin="round">
        <path d="M350 205 H398 V262 H440" />
        <path d="M350 360 H414 V230 H440" />
      </g>
      {[
        [356, 205, "1"],
        [434, 262, "n"],
        [356, 360, "n"],
        [434, 230, "1"],
      ].map(([cx, cy, label], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="10" fill="#ffffff" stroke={INK} strokeWidth="1.5" />
          <text x={cx} y={cy + 3.5} fontSize="10" fontWeight="700" fill={INK} textAnchor="middle">
            {label}
          </text>
        </g>
      ))}

      {/* tables */}
      <Card
        id="users"
        x={60}
        y={150}
        w={290}
        title="users"
        accent={VIOLET}
        chipBg="#ece7ff"
        rows={[
          { name: "id", type: "uuid", key: true },
          { name: "email", type: "text" },
          { name: "handle", type: "text" },
        ]}
      />
      <Card
        id="sessions"
        x={60}
        y={318}
        w={290}
        title="sessions"
        accent={CORAL}
        chipBg="#ffe4da"
        rows={[
          { name: "id", type: "uuid", key: true },
          { name: "user_id", type: "uuid", key: true },
        ]}
      />
      <Card
        id="orders"
        x={440}
        y={172}
        w={284}
        title="orders"
        accent={INK}
        chipBg="#eceaf1"
        rows={[
          { name: "id", type: "uuid", key: true },
          { name: "user_id", type: "uuid", key: true },
          { name: "total", type: "numeric" },
          { name: "status", type: "enum" },
        ]}
      />

      {/* export chip + cursor */}
      <g>
        <rect x="470" y="392" width="150" height="30" rx="10" fill={INK} />
        <circle cx="488" cy="407" r="4" fill={CORAL} />
        <text x="502" y="411" fontSize="11.5" fontWeight="600" fill="#ffffff">
          schema.sql
        </text>
      </g>
      <path
        d="M636 360l26 9-10.5 4.6 5.6 12.4-6.4 2.9-5.6-12.4-9.1 6.9z"
        fill="#ffffff"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
