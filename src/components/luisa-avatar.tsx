// Avatar ilustrado original da Luísa: personagem feminina ruiva, traço suave.
// SVG próprio, leve, sem referência a personagem/atriz real.
export function LuisaAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Luísa, assistente virtual"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#F6E3D4" />
      {/* cabelo ruivo */}
      <path
        d="M14 34c-2-14 6-24 18-24s20 10 18 24c-1 8-4 12-6 14 1-8-1-14-3-17-4 3-12 4-17 0-2 3-4 9-3 17-2-2-6-6-7-14z"
        fill="#C4552D"
      />
      {/* rabinho/coque lateral */}
      <circle cx="49" cy="22" r="6" fill="#C4552D" />
      {/* rosto */}
      <ellipse cx="32" cy="36" rx="13" ry="12" fill="#FBD9BE" />
      {/* franja */}
      <path d="M19 30c2-6 7-9 13-9s11 3 13 9c-4-3-8-4-13-4s-9 1-13 4z" fill="#C4552D" />
      {/* olhos */}
      <circle cx="26.5" cy="36" r="1.8" fill="#3B2A24" />
      <circle cx="37.5" cy="36" r="1.8" fill="#3B2A24" />
      {/* bochechas */}
      <circle cx="24" cy="41" r="2.2" fill="#F2A68C" opacity="0.7" />
      <circle cx="40" cy="41" r="2.2" fill="#F2A68C" opacity="0.7" />
      {/* sorriso */}
      <path d="M28 42.5c1.4 1.6 6.6 1.6 8 0" stroke="#3B2A24" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* sardas */}
      <circle cx="28.5" cy="39.5" r="0.5" fill="#D98E6A" />
      <circle cx="35.5" cy="39.5" r="0.5" fill="#D98E6A" />
      <circle cx="32" cy="40" r="0.5" fill="#D98E6A" />
      {/* blusa */}
      <path d="M20 56c2-6 7-8 12-8s10 2 12 8c-4 2-8 3-12 3s-8-1-12-3z" fill="#7C5CBF" />
    </svg>
  );
}
