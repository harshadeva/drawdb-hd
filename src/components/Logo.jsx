import { useId } from "react";

/**
 * Dbraw brand logo.
 *
 * A friendly database cylinder being "drawn" on a warm gradient squircle,
 * paired with the "Db·raw" wordmark. Used across the marketing / content
 * pages (never the editor canvas).
 *
 * Props:
 *  - size:        height of the mark in px (default 40)
 *  - showWordmark: render the "Dbraw" text next to the mark (default true)
 *  - dark:        use light text for placement on dark backgrounds
 *  - markOnly:    alias for showWordmark={false}
 *  - className:   extra classes on the wrapper
 */
export default function Logo({
  size = 40,
  showWordmark = true,
  dark = false,
  markOnly = false,
  className = "",
}) {
  const id = useId().replace(/:/g, "");
  const withWord = showWordmark && !markOnly;

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Dbraw"
        className="shrink-0"
      >
        <defs>
          <linearGradient
            id={`dbraw-grad-${id}`}
            x1="4"
            y1="2"
            x2="44"
            y2="46"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF8A3D" />
            <stop offset="0.52" stopColor="#FF5E3A" />
            <stop offset="1" stopColor="#7A5CFF" />
          </linearGradient>
        </defs>

        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="13"
          fill={`url(#dbraw-grad-${id})`}
        />

        {/* database cylinder – three rounded "rows" */}
        <g
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ellipse cx="20" cy="15" rx="9" ry="3.7" />
          <path d="M11 15v8.4c0 2 4 3.7 9 3.7s9-1.7 9-3.7V15" />
          <path d="M11 23.2c0 2 4 3.7 9 3.7s9-1.7 9-3.7" />
        </g>

        {/* cursor / pen — the "draw" in Dbraw */}
        <path
          d="M30 29.5l10 3.7-4.4 1.9 2.3 4.9-2.8 1.2-2.3-4.9L26 41z"
          fill="#fff"
        />
      </svg>

      {withWord && (
        <span
          className="font-extrabold tracking-tight leading-none"
          style={{ fontSize: size * 0.6 }}
        >
          <span className={dark ? "text-white" : "text-[#161422]"}>Db</span>
          <span className="text-[#ff6a3d]">raw</span>
        </span>
      )}
    </span>
  );
}
