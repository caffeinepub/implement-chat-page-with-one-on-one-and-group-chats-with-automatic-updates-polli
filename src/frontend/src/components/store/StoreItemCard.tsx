import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Coins, Lock } from "lucide-react";
import type { StoreItemData } from "./storeCatalog";

interface StoreItemCardProps {
  item: StoreItemData;
  isOwned: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  isPurchasing: boolean;
}

// Inject rainbow keyframes once into the document
const RAINBOW_STYLE_ID = "neon-bulb-rainbow-style";
function ensureRainbowStyles() {
  if (
    typeof document !== "undefined" &&
    !document.getElementById(RAINBOW_STYLE_ID)
  ) {
    const style = document.createElement("style");
    style.id = RAINBOW_STYLE_ID;
    style.textContent = `
      @keyframes neonBulbRainbow {
        0%   { stop-color: #FF0000; }
        14%  { stop-color: #FF8000; }
        28%  { stop-color: #FFFF00; }
        42%  { stop-color: #00FF00; }
        57%  { stop-color: #0080FF; }
        71%  { stop-color: #8000FF; }
        85%  { stop-color: #FF00FF; }
        100% { stop-color: #FF0000; }
      }
      @keyframes neonBulbRainbow2 {
        0%   { stop-color: #FF8000; }
        14%  { stop-color: #FFFF00; }
        28%  { stop-color: #00FF00; }
        42%  { stop-color: #0080FF; }
        57%  { stop-color: #8000FF; }
        71%  { stop-color: #FF00FF; }
        85%  { stop-color: #FF0000; }
        100% { stop-color: #FF8000; }
      }
      @keyframes neonBulbRainbow3 {
        0%   { stop-color: #FFFF00; }
        14%  { stop-color: #00FF00; }
        28%  { stop-color: #0080FF; }
        42%  { stop-color: #8000FF; }
        57%  { stop-color: #FF00FF; }
        71%  { stop-color: #FF0000; }
        85%  { stop-color: #FF8000; }
        100% { stop-color: #FFFF00; }
      }
      @keyframes neonGlowRainbow {
        0%   { filter: drop-shadow(0 0 18px #FF0000) drop-shadow(0 0 36px #FF000066); }
        14%  { filter: drop-shadow(0 0 18px #FF8000) drop-shadow(0 0 36px #FF800066); }
        28%  { filter: drop-shadow(0 0 18px #FFFF00) drop-shadow(0 0 36px #FFFF0066); }
        42%  { filter: drop-shadow(0 0 18px #00FF00) drop-shadow(0 0 36px #00FF0066); }
        57%  { filter: drop-shadow(0 0 18px #0080FF) drop-shadow(0 0 36px #0080FF66); }
        71%  { filter: drop-shadow(0 0 18px #8000FF) drop-shadow(0 0 36px #8000FF66); }
        85%  { filter: drop-shadow(0 0 18px #FF00FF) drop-shadow(0 0 36px #FF00FF66); }
        100% { filter: drop-shadow(0 0 18px #FF0000) drop-shadow(0 0 36px #FF000066); }
      }
      @keyframes neonGlowRainbowDim {
        0%   { filter: drop-shadow(0 0 8px #FF000099); }
        14%  { filter: drop-shadow(0 0 8px #FF800099); }
        28%  { filter: drop-shadow(0 0 8px #FFFF0099); }
        42%  { filter: drop-shadow(0 0 8px #00FF0099); }
        57%  { filter: drop-shadow(0 0 8px #0080FF99); }
        71%  { filter: drop-shadow(0 0 8px #8000FF99); }
        85%  { filter: drop-shadow(0 0 8px #FF00FF99); }
        100% { filter: drop-shadow(0 0 8px #FF000099); }
      }
    `;
    document.head.appendChild(style);
  }
}

interface NeonBulbProps {
  color: string; // hex like "#FF0000" or "rainbow"
  isOwned: boolean;
}

function NeonBulb({ color, isOwned }: NeonBulbProps) {
  const isRainbow = color === "rainbow";

  if (isRainbow) {
    ensureRainbowStyles();
  }

  const glowColor = isRainbow ? "#FF0000" : color;
  const glowStrong = `drop-shadow(0 0 20px ${glowColor}) drop-shadow(0 0 40px ${glowColor}88)`;
  const glowDim = `drop-shadow(0 0 8px ${glowColor}99)`;

  const wrapperStyle: React.CSSProperties = isRainbow
    ? {
        animation: isOwned
          ? "neonGlowRainbow 2s linear infinite"
          : "neonGlowRainbowDim 2s linear infinite",
      }
    : {
        filter: isOwned ? glowStrong : glowDim,
        opacity: isOwned ? 1 : 0.65,
      };

  // Unique gradient ID per color to avoid SVG namespace clashes
  const gradId = `bulb-grad-${isRainbow ? "rainbow" : color.replace("#", "")}`;
  const glassId = `bulb-glass-${isRainbow ? "rainbow" : color.replace("#", "")}`;
  const shineId = `bulb-shine-${isRainbow ? "rainbow" : color.replace("#", "")}`;

  // Filament color — white-ish for all bulbs for realism
  const filamentColor = "#FFFFEE";

  return (
    <div
      data-ocid="store.neon_bulb_preview"
      className="flex items-center justify-center w-full h-48"
      style={wrapperStyle}
    >
      <svg
        width="120"
        height="148"
        viewBox="0 0 120 148"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${isRainbow ? "Multicolor" : color} neon light bulb`}
      >
        <defs>
          {isRainbow ? (
            // Animated conic-like radial gradient for rainbow
            <radialGradient id={gradId} cx="50%" cy="45%" r="55%">
              <stop
                offset="0%"
                style={{ animation: "neonBulbRainbow 2s linear infinite" }}
                stopColor="#FF0000"
              />
              <stop
                offset="40%"
                style={{ animation: "neonBulbRainbow2 2s linear infinite" }}
                stopColor="#FFFF00"
              />
              <stop
                offset="80%"
                style={{ animation: "neonBulbRainbow3 2s linear infinite" }}
                stopColor="#0080FF"
              />
              <stop offset="100%" stopColor="#8000FF" stopOpacity="0.8" />
            </radialGradient>
          ) : (
            // Radial gradient from bright center to color edge
            <radialGradient id={gradId} cx="42%" cy="38%" r="62%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="35%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </radialGradient>
          )}

          {/* Glass sheen overlay */}
          <radialGradient id={glassId} cx="35%" cy="28%" r="45%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          {/* Outer glow halo */}
          <radialGradient id={shineId} cx="50%" cy="40%" r="50%">
            <stop
              offset="0%"
              stopColor={isRainbow ? "#FF8000" : color}
              stopOpacity="0.35"
            />
            <stop
              offset="100%"
              stopColor={isRainbow ? "#8000FF" : color}
              stopOpacity="0"
            />
          </radialGradient>
        </defs>

        {/* ── Outer ambient glow halo ── */}
        <ellipse cx="60" cy="52" rx="46" ry="46" fill={`url(#${shineId})`} />

        {/* ── Bulb globe (rounded teardrop shape) ── */}
        <path
          d="M60 8
             C38 8, 20 26, 20 50
             C20 66, 28 78, 40 88
             C44 92, 46 96, 46 102
             L74 102
             C74 96, 76 92, 80 88
             C92 78, 100 66, 100 50
             C100 26, 82 8, 60 8 Z"
          fill={`url(#${gradId})`}
          stroke={isRainbow ? "#FF8000" : color}
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />

        {/* ── Glass sheen overlay ── */}
        <path
          d="M60 8
             C38 8, 20 26, 20 50
             C20 66, 28 78, 40 88
             C44 92, 46 96, 46 102
             L74 102
             C74 96, 76 92, 80 88
             C92 78, 100 66, 100 50
             C100 26, 82 8, 60 8 Z"
          fill={`url(#${glassId})`}
        />

        {/* ── Collar / neck base (3 rings) ── */}
        <rect
          x="44"
          y="102"
          width="32"
          height="7"
          rx="2"
          fill={isRainbow ? "#555" : color}
          fillOpacity="0.85"
          stroke={isRainbow ? "#888" : color}
          strokeWidth="1"
          strokeOpacity="0.7"
        />
        <rect
          x="44"
          y="109"
          width="32"
          height="7"
          rx="2"
          fill={isRainbow ? "#444" : color}
          fillOpacity="0.7"
          stroke={isRainbow ? "#777" : color}
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        <rect
          x="44"
          y="116"
          width="32"
          height="7"
          rx="2"
          fill={isRainbow ? "#333" : color}
          fillOpacity="0.55"
          stroke={isRainbow ? "#666" : color}
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* ── Screw base (trapezoid) ── */}
        <path
          d="M47 123 L73 123 L70 140 L50 140 Z"
          fill="#888"
          stroke="#aaa"
          strokeWidth="1"
        />
        {/* Screw thread lines */}
        <line
          x1="48"
          y1="127"
          x2="72"
          y2="127"
          stroke="#bbb"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
        <line
          x1="49"
          y1="131"
          x2="71"
          y2="131"
          stroke="#bbb"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
        <line
          x1="50"
          y1="135"
          x2="70"
          y2="135"
          stroke="#bbb"
          strokeWidth="1"
          strokeOpacity="0.6"
        />

        {/* ── Filament inside the bulb ── */}
        <path
          d="M60 90 L60 72 M60 72 C60 72, 52 65, 52 58 C52 51, 56 48, 60 48 C64 48, 68 51, 68 58 C68 65, 60 72, 60 72"
          stroke={filamentColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity={isOwned ? 0.95 : 0.5}
        />
        {/* Filament support wires */}
        <line
          x1="54"
          y1="78"
          x2="54"
          y2="90"
          stroke={filamentColor}
          strokeWidth="1"
          strokeOpacity={isOwned ? 0.7 : 0.35}
        />
        <line
          x1="66"
          y1="78"
          x2="66"
          y2="90"
          stroke={filamentColor}
          strokeWidth="1"
          strokeOpacity={isOwned ? 0.7 : 0.35}
        />
      </svg>
    </div>
  );
}

export default function StoreItemCard({
  item,
  isOwned,
  canAfford,
  onPurchase,
  isPurchasing,
}: StoreItemCardProps) {
  return (
    <Card
      className={`neon-card transition-all ${isOwned ? "border-neon-accent" : ""}`}
    >
      <CardHeader>
        <div className="relative">
          <NeonBulb color={item.color} isOwned={isOwned} />
          {isOwned && (
            <Badge className="absolute top-2 right-2 neon-badge bg-neon-accent/20">
              <Check className="h-3 w-3 mr-1" />
              Owned
            </Badge>
          )}
        </div>
        <CardTitle className="neon-text">{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-neon-accent" />
          <span className="text-xl font-bold neon-text">{item.cost} XP</span>
        </div>
      </CardContent>
      <CardFooter>
        {isOwned ? (
          <Button disabled className="w-full" variant="outline">
            <Check className="mr-2 h-4 w-4" />
            Owned
          </Button>
        ) : (
          <Button
            onClick={onPurchase}
            disabled={!canAfford || isPurchasing}
            className="w-full neon-button"
          >
            {!canAfford ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Not Enough XP
              </>
            ) : isPurchasing ? (
              "Purchasing..."
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Buy Now
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
