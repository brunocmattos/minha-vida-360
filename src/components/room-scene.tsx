import type { ReactNode } from "react";
import dobby from "@/assets/pets/dobby.png";
import paco from "@/assets/pets/paco.png";
import zara from "@/assets/pets/zara.png";

export type RoomId = "quarto" | "banheiro" | "office" | "academia" | "cozinha" | "sala" | "jardim";

const SLUG_ROOM: Record<string, RoomId> = { cachorros: "jardim", autocuidado: "banheiro", carreira: "office", social: "sala", saude: "quarto", diario: "quarto" };
const VALID: RoomId[] = ["quarto", "banheiro", "office", "academia", "cozinha", "sala", "jardim"];

export function roomFor(slug: string, comodo?: string): RoomId | null {
  if (comodo && (VALID as string[]).includes(comodo) && slug !== "financas") return comodo as RoomId;
  return SLUG_ROOM[slug] ?? null;
}

export const ROOM_TITLE: Record<RoomId, string> = {
  quarto: "Quarto", banheiro: "Banheiro", office: "Home office", academia: "Academia",
  cozinha: "Cozinha", sala: "Sala da Liz", jardim: "Jardim dos filhos",
};

const W = 800, H = 220;

function Scene({ room }: { room: RoomId }) {
  const s = "var(--scene-soft)", d = "var(--scene-deep)", l = "var(--scene-light)", w = "var(--scene-wood)";
  const win = <g fill="var(--scene-window)" stroke={w} strokeWidth="4"><rect x="560" y="28" width="110" height="96" rx="6" /><path d="M615 28v96M560 76h110" /></g>;
  switch (room) {
    case "jardim":
      return <>
        <circle cx="690" cy="52" r="26" fill="var(--scene-sun)" />
        <path d="M0 150Q200 120 400 145T800 138V220H0Z" fill={s} />
        <path d="M0 175Q260 155 520 172T800 168V220H0Z" fill={d} />
        <g stroke={w} strokeWidth="5" strokeLinecap="round">{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${20 + i * 22} 168V128`} />)}<path d="M14 138h260M14 156h260" /></g>
        <path d="M720 170V105" stroke={w} strokeWidth="9" /><circle cx="720" cy="88" r="38" fill={d} /><circle cx="700" cy="100" r="24" fill={s} />
        <ellipse cx="455" cy="196" rx="190" ry="12" fill="var(--scene-shadow)" />
        {/* Escala: Paco ~4 kg, Dobby ~5 kg, Zara ~12 kg */}
        <image href={paco} x="300" y="122" width="78" height="78" aria-label="Paco" />
        <image href={dobby} x="378" y="114" width="88" height="88" aria-label="Dobby" />
        <image href={zara} x="470" y="66" width="138" height="138" aria-label="Zara" />
      </>;
    case "quarto":
      return <>{win}<rect x="0" y="176" width={W} height="44" fill={s} />
        <rect x="90" y="110" width="330" height="70" rx="14" fill={d} /><rect x="100" y="96" width="90" height="40" rx="12" fill={l} />
        <rect x="200" y="96" width="90" height="40" rx="12" fill={l} /><path d="M86 70v120M424 140v50" stroke={w} strokeWidth="8" strokeLinecap="round" />
        <rect x="460" y="140" width="50" height="40" rx="6" fill={w} /><path d="M485 140v-34m-16 0h32l-6-22h-20Z" fill="var(--scene-sun)" />
        <circle cx="740" cy="120" r="22" fill={d} /><path d="M740 142v40" stroke={w} strokeWidth="6" /></>;
    case "banheiro":
      return <>{win}<rect x="0" y="176" width={W} height="44" fill={s} />
        <g fill="none" stroke={l} strokeWidth="2" opacity=".8">{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M0 ${20 + i * 18}H520`} />)}</g>
        <path d="M80 120h300l-24 58H104Z" fill={l} stroke={d} strokeWidth="4" /><path d="M340 120V80q0-18-18-18" fill="none" stroke={w} strokeWidth="6" />
        <ellipse cx="450" cy="70" rx="34" ry="44" fill="var(--scene-window)" stroke={w} strokeWidth="4" />
        <rect x="420" y="128" width="60" height="50" rx="6" fill={d} />
        <g fill={d}><rect x="700" y="130" width="14" height="46" rx="5" /><rect x="722" y="120" width="12" height="56" rx="5" /><rect x="742" y="140" width="16" height="36" rx="5" /></g></>;
    case "office":
      return <>{win}<rect x="0" y="176" width={W} height="44" fill={s} />
        <rect x="140" y="120" width="340" height="12" rx="4" fill={w} /><path d="M160 132v50M460 132v50" stroke={w} strokeWidth="7" />
        <rect x="230" y="62" width="120" height="56" rx="6" fill={d} /><rect x="238" y="70" width="104" height="40" rx="3" fill="var(--scene-window)" /><path d="M290 118v6" stroke={w} strokeWidth="5" />
        <g fill={d}><rect x="60" y="40" width="70" height="8" rx="2" /><rect x="60" y="80" width="70" height="8" rx="2" /></g>
        <g fill={l}><rect x="66" y="16" width="10" height="24" /><rect x="80" y="20" width="10" height="20" /><rect x="94" y="14" width="10" height="26" /><rect x="70" y="56" width="10" height="24" /><rect x="86" y="60" width="12" height="20" /></g>
        <circle cx="740" cy="128" r="24" fill={d} /><path d="M740 152v28" stroke={w} strokeWidth="6" /></>;
    case "academia":
      return <>{win}<rect x="0" y="176" width={W} height="44" fill={s} />
        <rect x="90" y="166" width="320" height="16" rx="8" fill={d} />
        <path d="M150 120h160" stroke={w} strokeWidth="8" strokeLinecap="round" /><g fill={d}><rect x="130" y="96" width="20" height="48" rx="5" /><rect x="310" y="96" width="20" height="48" rx="5" /></g>
        <circle cx="470" cy="136" r="40" fill={l} stroke={d} strokeWidth="4" />
        <g fill={w}><rect x="700" y="110" width="40" height="66" rx="6" /></g></>;
    case "cozinha":
      return <>{win}<rect x="0" y="176" width={W} height="44" fill={s} />
        <rect x="60" y="110" width="420" height="70" rx="6" fill={l} stroke={d} strokeWidth="3" /><path d="M60 118h420M200 122v58M340 122v58" stroke={d} strokeWidth="3" />
        <path d="M90 40h360" stroke={w} strokeWidth="6" /><g fill={d}><rect x="110" y="50" width="70" height="40" rx="6" /><rect x="360" y="50" width="70" height="40" rx="6" /></g>
        <path d="M240 98q20-22 40 0" fill={d} /><rect x="690" y="70" width="70" height="110" rx="8" fill={l} stroke={d} strokeWidth="3" /><path d="M690 112h70" stroke={d} strokeWidth="3" /></>;
    case "sala":
      return <>{win}<rect x="0" y="176" width={W} height="44" fill={s} />
        <rect x="100" y="110" width="320" height="64" rx="22" fill={d} /><rect x="84" y="134" width="40" height="46" rx="12" fill={d} /><rect x="396" y="134" width="40" height="46" rx="12" fill={d} />
        <rect x="140" y="104" width="64" height="44" rx="10" fill={l} /><path d="M250 120c-8-12 -26-4 -16 10l16 14 16-14c10-14-8-22-16-10Z" fill="var(--scene-sun)" />
        <path d="M490 180V80m-30 0h60l-14-36h-32Z" fill="var(--scene-sun)" stroke={w} strokeWidth="4" />
        <g fill={l} stroke={w} strokeWidth="3"><rect x="60" y="30" width="70" height="52" rx="4" /><rect x="150" y="40" width="54" height="42" rx="4" /></g></>;
  }
}

export function RoomScene({ room, title, children }: { room: RoomId; title: string; children: ReactNode }) {
  return <div className={`room-theme room-${room}`}>
    <figure className="room-banner" aria-label={`Cenário: ${ROOM_TITLE[room]}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="block h-40 w-full md:h-56" role="img" aria-label={`Ilustração do ambiente ${ROOM_TITLE[room]}`}>
        <rect width={W} height={H} fill="var(--scene-wall)" />
        <Scene room={room} />
      </svg>
      <figcaption className="room-tag">{ROOM_TITLE[room]} · {title}</figcaption>
    </figure>
    <div className="room-body">{children}</div>
  </div>;
}
