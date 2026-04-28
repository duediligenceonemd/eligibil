// Geometric thumbnail generator — abstract, brutalist, no AI slop
// All return inline SVGs. Palette pulled from CSS vars for dark mode safety.

function Thumb({ kind = 'grid', seed = 1, fg = 'var(--ink)', bg = 'var(--bg-2)', accent = 'var(--accent)' }) {
  const S = (n) => ((seed * 9301 + 49297 + n * 233) % 233280) / 233280;
  const variants = {
    grid: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const x = (i % 4) * 16, y = Math.floor(i / 4) * 16;
          const on = S(i) > 0.55;
          return <rect key={i} x={x} y={y} width={16} height={16} fill={on ? fg : 'transparent'} />;
        })}
      </svg>
    ),
    circles: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        <circle cx="20" cy="32" r="18" fill={fg} />
        <circle cx="44" cy="32" r="18" fill={accent} style={{ mixBlendMode: 'multiply' }} />
      </svg>
    ),
    stacks: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <rect key={i} x={8 + i * 3} y={16 + i * 4} width={40 - i * 3} height={6} fill={i % 2 ? fg : accent} />
        ))}
      </svg>
    ),
    bars: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        {[14, 28, 22, 40, 18, 34].map((h, i) => (
          <rect key={i} x={4 + i * 10} y={56 - h} width={8} height={h} fill={i === 3 ? accent : fg} />
        ))}
        <line x1="0" y1="56" x2="64" y2="56" stroke={fg} strokeWidth="1" />
      </svg>
    ),
    cross: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        <rect x="0" y="28" width="64" height="8" fill={fg} />
        <rect x="28" y="0" width="8" height="64" fill={fg} />
        <rect x="24" y="24" width="16" height="16" fill={accent} />
      </svg>
    ),
    diag: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={i * 10 - 30} y1={0} x2={i * 10 + 30} y2={64} stroke={i % 2 ? accent : fg} strokeWidth="2" />
        ))}
      </svg>
    ),
    hex: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        <polygon points="32,8 54,20 54,44 32,56 10,44 10,20" fill="none" stroke={fg} strokeWidth="2" />
        <polygon points="32,20 44,26 44,38 32,44 20,38 20,26" fill={accent} />
      </svg>
    ),
    ring: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        <circle cx="32" cy="32" r="26" fill="none" stroke={fg} strokeWidth="2" />
        <circle cx="32" cy="32" r="16" fill="none" stroke={accent} strokeWidth="2" />
        <circle cx="32" cy="32" r="6" fill={fg} />
      </svg>
    ),
    squareNest: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        <rect x="6" y="6" width="52" height="52" fill="none" stroke={fg} strokeWidth="2" />
        <rect x="16" y="16" width="32" height="32" fill={accent} />
        <rect x="24" y="24" width="16" height="16" fill={bg} />
      </svg>
    ),
    triangle: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        <polygon points="32,8 58,56 6,56" fill={fg} />
        <polygon points="32,24 48,52 16,52" fill={accent} />
      </svg>
    ),
    dots: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        {Array.from({ length: 36 }).map((_, i) => {
          const x = 6 + (i % 6) * 10, y = 6 + Math.floor(i / 6) * 10;
          return <circle key={i} cx={x} cy={y} r={S(i) > 0.3 ? 2.5 : 0.5} fill={S(i + 5) > 0.7 ? accent : fg} />;
        })}
      </svg>
    ),
    bisect: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: 'block', background: bg }}>
        <rect x="0" y="0" width="32" height="64" fill={fg} />
        <rect x="32" y="0" width="32" height="64" fill={accent} />
        <circle cx="32" cy="32" r="14" fill={bg} />
      </svg>
    ),
  };
  return variants[kind] || variants.grid;
}

window.Thumb = Thumb;
