import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  BedDouble,
  Bath,
  Briefcase,
  Dumbbell,
  Wallet,
  CookingPot,
  PawPrint,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { LuisaAvatar } from "@/components/luisa-avatar";
import { openLuisaChat } from "@/components/luisa-chat";
import dobby from "@/assets/pets/dobby.png";
import paco from "@/assets/pets/paco.png";
import zara from "@/assets/pets/zara.png";

export type Room = { id: string; label: string; lines: string[]; area: string; icon: LucideIcon };
export const ROOMS: Room[] = [
  { id: "quarto", label: "Saúde Mental", lines: ["Saúde Mental"], area: "saude", icon: BedDouble },
  {
    id: "banheiro",
    label: "Autocuidado / skincare",
    lines: ["Autocuidado", "Skincare & Cuidados"],
    area: "autocuidado",
    icon: Bath,
  },
  {
    id: "office",
    label: "Carreira & Estudos",
    lines: ["Carreira & Estudos"],
    area: "carreira",
    icon: Briefcase,
  },
  { id: "academia", label: "Saúde Física", lines: ["Saúde Física"], area: "saude", icon: Dumbbell },
  { id: "escritorio", label: "Finanças", lines: ["Finanças"], area: "financas", icon: Wallet },
  { id: "cozinha", label: "Alimentação", lines: ["Alimentação"], area: "saude", icon: CookingPot },
  {
    id: "sala",
    label: "Liz / Relacionamentos",
    lines: ["Liz", "Relacionamentos"],
    area: "social",
    icon: Heart,
  },
  { id: "jardim", label: "Meus Filhos", lines: ["Meus Filhos"], area: "cachorros", icon: PawPrint },
];

function Furnishing({ id }: { id: string }) {
  const wood = "var(--house-wood)";
  const soft = "var(--house-furnishing)";
  return (
    <g pointerEvents="none" aria-hidden="true">
      {id !== "jardim" && (
        <g fill="var(--house-window)" stroke="var(--house-wall)" strokeWidth="2">
          <rect x="120" y="15" width="37" height="43" rx="2" />
          <path d="M138 15v43M120 36h37" />
        </g>
      )}
      {id === "quarto" && (
        <>
          <rect x="20" y="52" width="95" height="34" rx="5" fill={soft} />
          <rect x="22" y="47" width="26" height="18" rx="4" fill="var(--house-linen)" />
          <path d="M20 47v45m95-9v9" stroke={wood} strokeWidth="4" />
        </>
      )}
      {id === "banheiro" && (
        <>
          <rect
            x="25"
            y="18"
            width="34"
            height="32"
            rx="14"
            fill="var(--house-window)"
            stroke={wood}
            strokeWidth="2"
          />
          <path d="M22 66h90l-9 20H32Z" fill={soft} />
          <path d="M97 66V54q0-8-8-8" fill="none" stroke={wood} strokeWidth="3" />
        </>
      )}
      {id === "office" && (
        <>
          <rect x="25" y="65" width="95" height="7" rx="2" fill={wood} />
          <path d="M32 72v20m81-20v20" stroke={wood} strokeWidth="4" />
          <rect x="50" y="38" width="35" height="25" rx="3" fill={soft} />
          <path d="M67 63v3" stroke={wood} strokeWidth="3" />
        </>
      )}
      {id === "academia" && (
        <>
          <rect x="27" y="78" width="92" height="9" rx="4" fill={soft} />
          <circle cx="49" cy="58" r="20" fill={soft} />
          <path
            d="M84 55h33m-27-9v18m20-18v18"
            stroke={wood}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      )}
      {id === "escritorio" && (
        <>
          <rect x="24" y="65" width="101" height="10" rx="2" fill={wood} />
          <path d="M32 75v18m83-18v18" stroke={wood} strokeWidth="4" />
          <rect x="39" y="42" width="34" height="22" rx="3" fill={soft} />
          <rect x="88" y="48" width="20" height="15" rx="2" fill="var(--house-linen)" />
        </>
      )}
      {id === "cozinha" && (
        <>
          <rect x="20" y="49" width="95" height="40" rx="3" fill={soft} />
          <path d="M20 53h95M53 56v33m30-33v33" stroke={wood} strokeWidth="2" />
          <path d="M30 41h24m-12-8v8" stroke={wood} strokeWidth="3" />
          <rect x="119" y="35" width="35" height="54" rx="4" fill="var(--house-linen)" />
        </>
      )}
      {id === "sala" && (
        <>
          <rect x="24" y="50" width="103" height="35" rx="9" fill={soft} />
          <rect x="19" y="65" width="14" height="23" rx="5" fill={soft} />
          <rect x="117" y="65" width="14" height="23" rx="5" fill={soft} />
          <rect x="43" y="53" width="23" height="19" rx="4" fill="var(--house-linen)" />
          <path
            d="M144 47v43m-14-43h28l-7-20h-14Z"
            fill="var(--house-light)"
            stroke={wood}
            strokeWidth="2"
          />
        </>
      )}
      {id === "jardim" && (
        <>
          <path d="M10 88h160" stroke="var(--house-leaf)" strokeWidth="3" />
          <path
            d="M153 84V55m0 14q-14-2-15-13m15 8q12-2 14-14"
            fill="none"
            stroke="var(--house-leaf)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <image href={dobby} x="12" y="44" width="43" height="43" aria-label="Dobby" />
          <image href={paco} x="55" y="45" width="42" height="42" aria-label="Paco" />
          <image href={zara} x="93" y="24" width="62" height="62" aria-label="Zara" />
        </>
      )}
    </g>
  );
}

export function HouseCasa() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const columns = mobile ? 2 : 4;
  const width = mobile ? 400 : 780;
  const height = mobile ? 635 : 355;
  const onGo = (area: string, comodo: string) =>
    navigate({
      to: "/area/$slug",
      params: { slug: area },
      search: comodo === "escritorio" ? {} : { comodo },
    });
  return (
    <section className="house-home min-w-0 pb-16 md:pb-0">
      <h2 className="mb-2 font-display text-lg font-semibold">Minha Casa</h2>
      <div className="house-viewport" role="region" aria-label="Casa ilustrada interativa">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="house-canvas block w-full"
          role="group"
          aria-label="Casa em corte transversal com cômodos clicáveis"
        >
          <path d={`M10 42L${width / 2} 9L${width - 10} 42Z`} fill="var(--house-roof)" />
          <rect x="13" y="43" width={width - 26} height={height - 66} fill="var(--house-wall)" />
          {ROOMS.map((room, index) => {
            const x = 20 + (index % columns) * 190;
            const y = 47 + Math.floor(index / columns) * 140;
            return (
              <g
                key={room.id}
                transform={`translate(${x} ${y})`}
                role="link"
                tabIndex={0}
                aria-label={`Ir para ${room.label}`}
                className={`house-room house-room-${room.id} cursor-pointer outline-none`}
                onClick={() => onGo(room.area, room.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onGo(room.area, room.id);
                  }
                }}
              >
                <rect width="180" height="132" fill={`var(--house-room-${room.id})`} />
                <path
                  d="M0 96h180"
                  stroke="var(--house-floor)"
                  strokeWidth="2"
                  pointerEvents="none"
                />
                <Furnishing id={room.id} />
                <rect
                  x="10"
                  y="100"
                  width="160"
                  height="28"
                  rx="14"
                  fill="var(--house-linen)"
                  stroke="var(--house-floor)"
                  pointerEvents="none"
                />
                <text
                  x="90"
                  y={room.lines.length > 1 ? 110 : 119}
                  textAnchor="middle"
                  fontSize={room.lines.length > 1 ? 11 : 14}
                  fontWeight="700"
                  fill="var(--house-ink)"
                  pointerEvents="none"
                >
                  {room.lines.map((line, i) => (
                    <tspan key={line} x="90" dy={i === 0 ? 0 : 12}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
          <path
            d={`M8 ${height - 20}h${width - 16}`}
            stroke="var(--house-roof)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={openLuisaChat}
        className="mt-3 h-auto gap-2 px-4 py-2 text-sm font-bold"
      >
        <LuisaAvatar size={30} />
        Falar com a Luísa
      </Button>
      <nav aria-label="Ambientes da casa" className="mt-3">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm md:grid-cols-4">
          {ROOMS.map((room) => (
            <li key={room.id} className="min-w-0">
              <Link
                to="/area/$slug"
                params={{ slug: room.area }}
                search={room.id === "escritorio" ? {} : { comodo: room.id }}
                className="flex min-h-11 items-center gap-2 rounded-md py-1 font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                <room.icon className="size-4 shrink-0" />
                <span className="min-w-0">{room.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
