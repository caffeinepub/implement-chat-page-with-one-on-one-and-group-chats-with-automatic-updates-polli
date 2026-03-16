import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";

interface RaceHUDOverlayProps {
  currentLap: number;
  totalLaps: number;
  speed: number;
  nitroCharges?: number;
  nitroActive?: boolean;
  nitroBurnRemaining?: number;
  nitroUnlocked?: boolean;
}

export function RaceHUDOverlay({
  currentLap,
  totalLaps,
  speed,
  nitroCharges = 0,
  nitroActive = false,
  nitroBurnRemaining = 0,
  nitroUnlocked = false,
}: RaceHUDOverlayProps) {
  const displaySpeed = Math.round(Math.abs(speed));

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Top left - Lap counter */}
      <div className="absolute left-6 top-6">
        <Badge
          variant="default"
          className="bg-black/70 px-4 py-2 text-lg font-bold text-white backdrop-blur-sm"
        >
          Lap {currentLap}/{totalLaps}
        </Badge>
      </div>

      {/* Top right - Speed */}
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <Badge
          variant="default"
          className="bg-black/70 px-4 py-2 text-lg font-bold text-white backdrop-blur-sm"
        >
          <Gauge className="mr-2 inline h-5 w-5" />
          {displaySpeed} km/h
        </Badge>
      </div>

      {/* Bottom center - Controls hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <Badge
          variant="outline"
          className="bg-black/50 px-4 py-2 text-sm text-white/80 backdrop-blur-sm"
        >
          W/S · Drive &nbsp;|&nbsp; F/SPACE · Nitro &nbsp;|&nbsp; C · Camera
        </Badge>
      </div>

      {/* Bottom right - Nitro HUD */}
      {nitroUnlocked && (
        <div
          className="absolute bottom-6 right-6 flex flex-col items-end gap-1"
          style={{ minWidth: 140 }}
        >
          {/* Charge count */}
          <div
            style={{
              background: "rgba(0,0,0,0.75)",
              border: nitroActive
                ? "1px solid rgba(0,180,255,0.8)"
                : "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "4px 12px",
              color: nitroActive ? "#00bfff" : "#fff",
              fontFamily: "monospace",
              fontWeight: "bold",
              fontSize: 18,
              letterSpacing: 2,
              backdropFilter: "blur(6px)",
              transition: "all 0.2s",
              boxShadow: nitroActive ? "0 0 16px rgba(0,150,255,0.6)" : "none",
            }}
          >
            ⚡ x{nitroCharges}
          </div>

          {/* Burn progress bar — only when active */}
          {nitroActive && (
            <div
              style={{
                width: 140,
                height: 8,
                background: "rgba(0,0,0,0.6)",
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(0,180,255,0.4)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(nitroBurnRemaining / 10) * 100}%`,
                  background: "linear-gradient(to right, #ff6a00, #00bfff)",
                  borderRadius: 4,
                  transition: "width 0.1s linear",
                  boxShadow: "0 0 8px rgba(0,180,255,0.8)",
                }}
              />
            </div>
          )}

          {/* Hint */}
          <div
            style={{
              color: "rgba(255,255,255,0.4)",
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: 1,
            }}
          >
            F / SPACE: Nitro
          </div>
        </div>
      )}
    </div>
  );
}
