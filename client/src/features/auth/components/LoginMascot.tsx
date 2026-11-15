import "./LoginMascot.css";

export type MascotState = "idle" | "email" | "password" | "error" | "loading" | "success";

type Props = {
  state?: MascotState;
  look?: number;
  className?: string;
};

/** Converts typed text length into a 0 → 1 "look" value for the pupils. */
export const lookFromText = (text: string, max = 28) => Math.min(1, text.length / max);

const LABELS: Record<MascotState, string> = {
  idle: "Panda waiting",
  email: "Panda watching you type your email",
  password: "Panda covering its eyes",
  error: "Panda looks worried",
  loading: "Panda is dizzy while loading",
  success: "Panda is happy",
};

export default function LoginMascot({ state = "idle", look = 0.5, className }: Props) {
  const x = (Math.max(0, Math.min(1, look)) - 0.5) * 9; // -4.5px → +4.5px
  const y = state === "email" ? 3 : state === "error" ? 3.5 : 0;

  return (
    <div className={`lm-root ${className ?? ""}`}>
      <svg
        className="lm-svg"
        data-state={state}
        viewBox="0 0 200 180"
        role="img"
        aria-label={LABELS[state]}
        style={{ "--lm-px": `${x}px`, "--lm-py": `${y}px` } as React.CSSProperties}
      >
        {/* ---------- soft ground glow ---------- */}
        <ellipse className="lm-shadow" cx="100" cy="176" rx="64" ry="6" fill="rgba(16,185,129,.18)" />

        <g className="lm-bob">
          {/* ---------- body ---------- */}
          <ellipse cx="100" cy="190" rx="76" ry="52" fill="#f4f7f6" />
          <ellipse cx="100" cy="196" rx="44" ry="34" fill="#e4ebe8" />
          <path d="M48 160 q-6 18 -2 40" stroke="#0b0f14" strokeWidth="26" strokeLinecap="round" fill="none" opacity=".92" />
          <path d="M152 160 q6 18 2 40" stroke="#0b0f14" strokeWidth="26" strokeLinecap="round" fill="none" opacity=".92" />

          {/* ---------- head ---------- */}
          <g className="lm-head">
            {/* ears */}
            <circle cx="46" cy="52" r="20" fill="#0b0f14" />
            <circle cx="154" cy="52" r="20" fill="#0b0f14" />
            <circle cx="46" cy="52" r="9" fill="#1f2937" />
            <circle cx="154" cy="52" r="9" fill="#1f2937" />

            {/* face */}
            <ellipse cx="100" cy="100" rx="62" ry="56" fill="#fbfdfc" />
            <ellipse cx="100" cy="108" rx="62" ry="48" fill="url(#lm-face)" />

            {/* eye patches */}
            <ellipse cx="76" cy="94" rx="17" ry="21" fill="#0b0f14" transform="rotate(16 76 94)" />
            <ellipse cx="124" cy="94" rx="17" ry="21" fill="#0b0f14" transform="rotate(-16 124 94)" />

            {/* eyes */}
            <g className="lm-eye lm-eye-l">
              <circle cx="76" cy="92" r="8.6" fill="#fff" />
              <g className="lm-orbit">
                <g className="lm-pupil">
                  <circle cx="76" cy="92" r="4.4" fill="#0b0f14" />
                  <circle cx="77.5" cy="90.4" r="1.5" fill="#fff" />
                </g>
              </g>
            </g>
            <g className="lm-eye lm-eye-r">
              <circle cx="124" cy="92" r="8.6" fill="#fff" />
              <g className="lm-orbit">
                <g className="lm-pupil">
                  <circle cx="124" cy="92" r="4.4" fill="#0b0f14" />
                  <circle cx="125.5" cy="90.4" r="1.5" fill="#fff" />
                </g>
              </g>
            </g>

            {/* happy eyes (success) */}
            <g className="lm-arcs" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round">
              <path d="M67 95 q9 -12 18 0" />
              <path d="M115 95 q9 -12 18 0" />
            </g>

            {/* worried brows (error) */}
            <g className="lm-brows" fill="none" stroke="#0b0f14" strokeWidth="3.2" strokeLinecap="round">
              <path d="M62 70 L86 61" />
              <path d="M138 70 L114 61" />
            </g>

            {/* cheeks */}
            <ellipse className="lm-cheek" cx="56" cy="114" rx="9" ry="5.5" fill="#fda4af" />
            <ellipse className="lm-cheek" cx="144" cy="114" rx="9" ry="5.5" fill="#fda4af" />

            {/* nose */}
            <path d="M92 108 q8 -5 16 0 q-1 8 -8 9 q-7 -1 -8 -9z" fill="#0b0f14" />

            {/* mouths */}
            <path className="lm-mouth lm-mouth-idle" d="M89 124 q11 9 22 0" fill="none" stroke="#0b0f14" strokeWidth="3" strokeLinecap="round" />
            <path className="lm-mouth lm-mouth-happy" d="M86 121 q14 20 28 0 z" fill="#fb7185" stroke="#0b0f14" strokeWidth="3" strokeLinejoin="round" />
            <path className="lm-mouth lm-mouth-sad" d="M90 130 q10 -9 20 0" fill="none" stroke="#0b0f14" strokeWidth="3" strokeLinecap="round" />
            <ellipse className="lm-mouth lm-mouth-o" cx="100" cy="127" rx="5" ry="6" fill="#0b0f14" />

            {/* sweat drop (error) */}
            <path className="lm-sweat" d="M152 66 q-7 10 0 15 q7 -5 0 -15z" fill="#7dd3fc" />
          </g>

          {/* ---------- paws (rise to cover the eyes) ---------- */}
          <g className="lm-paw lm-paw-l">
            <rect x="62" y="96" width="28" height="140" rx="14" fill="#1f2937" />
            <circle cx="76" cy="96" r="17" fill="#1f2937" />
            <circle cx="76" cy="99" r="8" fill="#374151" />
            <circle cx="68" cy="88" r="3" fill="#374151" />
            <circle cx="76" cy="85" r="3" fill="#374151" />
            <circle cx="84" cy="88" r="3" fill="#374151" />
          </g>
          <g className="lm-paw lm-paw-r">
            <rect x="110" y="96" width="28" height="140" rx="14" fill="#1f2937" />
            <circle cx="124" cy="96" r="17" fill="#1f2937" />
            <circle cx="124" cy="99" r="8" fill="#374151" />
            <circle cx="116" cy="88" r="3" fill="#374151" />
            <circle cx="124" cy="85" r="3" fill="#374151" />
            <circle cx="132" cy="88" r="3" fill="#374151" />
          </g>
        </g>

        {/* ---------- sparkles (success) ---------- */}
        <g className="lm-sparkles">
          <circle className="lm-sp lm-sp-1" cx="34" cy="70" r="3" fill="#6ee7b7" />
          <circle className="lm-sp lm-sp-2" cx="170" cy="62" r="2.6" fill="#fcd34d" />
          <circle className="lm-sp lm-sp-3" cx="160" cy="104" r="2.2" fill="#67e8f9" />
          <circle className="lm-sp lm-sp-4" cx="40" cy="108" r="2.2" fill="#fda4af" />
        </g>

        <defs>
          <linearGradient id="lm-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#dfe8e4" stopOpacity=".9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}